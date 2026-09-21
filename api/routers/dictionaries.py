from fastapi import APIRouter

from api.dictionaries import load_content_dictionary, load_viewer_dictionary

router = APIRouter(prefix="/dictionaries", tags=["dictionaries"])


@router.get("/content")
def get_content_dictionary():
    return load_content_dictionary()


@router.get("/viewer")
def get_viewer_dictionary():
    return load_viewer_dictionary()
