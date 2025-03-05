from fastapi import APIRouter, Depends
from app.auth import get_current_user

router = APIRouter()

@router.get("/", dependencies=[Depends(get_current_user)])
def get_cities():
    return [{"city": "New York"}, {"city": "Mumbai"}]