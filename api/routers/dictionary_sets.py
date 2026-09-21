from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from api.database import get_db
from api.models.dictionary import DictionaryField, DictionaryItem, DictionarySet
from api.scripts.import_dictionaries import SOURCES, import_file
from api.schemas.dictionary import (
    DictionaryFieldCreate,
    DictionaryFieldRead,
    DictionaryFieldUpdate,
    DictionaryItemCreate,
    DictionaryItemRead,
    DictionaryItemUpdate,
    DictionarySetCreate,
    DictionarySetRead,
    DictionarySetSummary,
    DictionarySetUpdate,
)

router = APIRouter(prefix="/dictionary-sets", tags=["dictionary-sets"])


def _get_set(db: Session, slug: str) -> DictionarySet:
    row = db.scalar(
        select(DictionarySet)
        .options(selectinload(DictionarySet.fields).selectinload(DictionaryField.items))
        .where(DictionarySet.slug == slug)
    )
    if not row:
        raise HTTPException(status_code=404, detail="Dictionary set not found")
    return row


@router.get("", response_model=list[DictionarySetSummary])
def list_sets(db: Session = Depends(get_db)):
    field_count = (
        select(func.count(DictionaryField.id))
        .where(DictionaryField.set_id == DictionarySet.id)
        .correlate(DictionarySet)
        .scalar_subquery()
    )
    item_count = (
        select(func.count(DictionaryItem.id))
        .join(DictionaryField, DictionaryItem.field_id == DictionaryField.id)
        .where(DictionaryField.set_id == DictionarySet.id)
        .correlate(DictionarySet)
        .scalar_subquery()
    )
    rows = db.execute(
        select(DictionarySet, field_count, item_count).order_by(DictionarySet.id.asc())
    ).all()
    return [
        DictionarySetSummary.model_validate(row).model_copy(
            update={"field_count": fields or 0, "item_count": items or 0}
        )
        for row, fields, items in rows
    ]


@router.post("/import-from-files", response_model=list[DictionarySetSummary])
def import_from_project_files(db: Session = Depends(get_db)):
    for source in SOURCES:
        import_file(db, source["slug"], source["name"], source["path"])
    db.commit()
    return list_sets(db)


@router.post("", response_model=DictionarySetRead, status_code=201)
def create_set(payload: DictionarySetCreate, db: Session = Depends(get_db)):
    if db.scalar(select(DictionarySet).where(DictionarySet.slug == payload.slug)):
        raise HTTPException(status_code=409, detail="slug already exists")
    row = DictionarySet(**payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return DictionarySetRead.model_validate(_get_set(db, row.slug))


@router.get("/{slug}", response_model=DictionarySetRead)
def get_set(slug: str, db: Session = Depends(get_db)):
    return DictionarySetRead.model_validate(_get_set(db, slug))


@router.put("/{slug}", response_model=DictionarySetRead)
def update_set(slug: str, payload: DictionarySetUpdate, db: Session = Depends(get_db)):
    row = _get_set(db, slug)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(row, key, value)
    db.commit()
    return DictionarySetRead.model_validate(_get_set(db, slug))


@router.delete("/{slug}", status_code=204)
def delete_set(slug: str, db: Session = Depends(get_db)):
    row = _get_set(db, slug)
    db.delete(row)
    db.commit()


@router.post("/{slug}/fields", response_model=DictionaryFieldRead, status_code=201)
def create_field(slug: str, payload: DictionaryFieldCreate, db: Session = Depends(get_db)):
    dictionary_set = _get_set(db, slug)
    existing = next((f for f in dictionary_set.fields if f.field_key == payload.field_key), None)
    if existing:
        raise HTTPException(status_code=409, detail="field_key already exists")
    field = DictionaryField(set_id=dictionary_set.id, **payload.model_dump())
    db.add(field)
    db.commit()
    db.refresh(field)
    return DictionaryFieldRead.model_validate(field)


@router.put("/{slug}/fields/{field_key}", response_model=DictionaryFieldRead)
def update_field(slug: str, field_key: str, payload: DictionaryFieldUpdate, db: Session = Depends(get_db)):
    dictionary_set = _get_set(db, slug)
    field = next((f for f in dictionary_set.fields if f.field_key == field_key), None)
    if not field:
        raise HTTPException(status_code=404, detail="field not found in this set")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(field, key, value)
    db.commit()
    db.refresh(field)
    return DictionaryFieldRead.model_validate(field)


@router.delete("/{slug}/fields/{field_key}", status_code=204)
def delete_field(slug: str, field_key: str, db: Session = Depends(get_db)):
    dictionary_set = _get_set(db, slug)
    field = next((f for f in dictionary_set.fields if f.field_key == field_key), None)
    if not field:
        raise HTTPException(status_code=404, detail="field not found in this set")
    db.delete(field)
    db.commit()


@router.post("/{slug}/items", response_model=DictionaryItemRead, status_code=201)
def create_item(slug: str, payload: DictionaryItemCreate, db: Session = Depends(get_db)):
    dictionary_set = _get_set(db, slug)
    field = next((f for f in dictionary_set.fields if f.field_key == payload.field_key), None)
    if not field:
        raise HTTPException(status_code=404, detail="field not found in this set")
    if any(item.code == payload.code for item in field.items):
        raise HTTPException(status_code=409, detail="code already exists in this field")
    data = payload.model_dump(exclude={"field_key"})
    if data["sort_order"] == 0:
        data["sort_order"] = (max((i.sort_order for i in field.items), default=0) + 1)
    item = DictionaryItem(field_id=field.id, **data)
    db.add(item)
    db.commit()
    db.refresh(item)
    return DictionaryItemRead.model_validate(item)


@router.put("/items/{item_id}", response_model=DictionaryItemRead)
def update_item(item_id: int, payload: DictionaryItemUpdate, db: Session = Depends(get_db)):
    item = db.get(DictionaryItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return DictionaryItemRead.model_validate(item)


@router.delete("/items/{item_id}", status_code=204)
def delete_item(item_id: int, db: Session = Depends(get_db)):
    item = db.get(DictionaryItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()
