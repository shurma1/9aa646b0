from fastapi import APIRouter, Query
from controllers.add_controller import add_controller

router = APIRouter()

@router.get("/add")
def add(a: int = Query(...), b: int = Query(...)):
    return {"result": add_controller(a, b)}
