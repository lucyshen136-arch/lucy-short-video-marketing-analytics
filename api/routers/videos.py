from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from api.database import get_db
from api.models.video import Video
from api.schemas.video import VideoCreate, VideoListResponse, VideoRead, VideoUpdate

router = APIRouter(prefix="/videos", tags=["videos"])


@router.get("", response_model=VideoListResponse)
def list_videos(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    platform: str | None = None,
    content_type: str | None = None,
    db: Session = Depends(get_db),
):
    stmt = select(Video)
    count_stmt = select(func.count()).select_from(Video)
    if platform:
        stmt = stmt.where(Video.meta_platform == platform)
        count_stmt = count_stmt.where(Video.meta_platform == platform)
    if content_type:
        stmt = stmt.where(Video.content_type == content_type)
        count_stmt = count_stmt.where(Video.content_type == content_type)

    total = db.scalar(count_stmt) or 0
    rows = (
        db.scalars(
            stmt.order_by(Video.meta_publish_date.desc(), Video.video_id.asc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        ).all()
    )
    return VideoListResponse(
        items=[VideoRead.model_validate(row) for row in rows],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{video_id}", response_model=VideoRead)
def get_video(video_id: str, db: Session = Depends(get_db)):
    row = db.get(Video, video_id)
    if not row:
        raise HTTPException(status_code=404, detail="Video not found")
    return VideoRead.model_validate(row)


@router.post("", response_model=VideoRead, status_code=201)
def create_video(payload: VideoCreate, db: Session = Depends(get_db)):
    try:
        payload.validate_enums()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if db.get(Video, payload.video_id):
        raise HTTPException(status_code=409, detail="video_id already exists")
    row = Video(**payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return VideoRead.model_validate(row)


@router.put("/{video_id}", response_model=VideoRead)
def update_video(video_id: str, payload: VideoUpdate, db: Session = Depends(get_db)):
    row = db.get(Video, video_id)
    if not row:
        raise HTTPException(status_code=404, detail="Video not found")
    try:
        payload.validate_enums()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    for key, value in payload.model_dump().items():
        setattr(row, key, value)
    db.commit()
    db.refresh(row)
    return VideoRead.model_validate(row)


@router.delete("/{video_id}", status_code=204)
def delete_video(video_id: str, db: Session = Depends(get_db)):
    row = db.get(Video, video_id)
    if not row:
        raise HTTPException(status_code=404, detail="Video not found")
    db.delete(row)
    db.commit()
