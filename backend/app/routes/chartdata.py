import random
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.auth import get_current_user

router = APIRouter()

class LineChartDataResponse(BaseModel):
    x_axis: List[int]
    series: List[Dict[str, Any]]

@router.get("/get-line-chart-data", response_model=LineChartDataResponse)
def get_line_chart_data(current_user=Depends(get_current_user)):
    return {
        "x_axis": [8, 9, 10],
        "series": [
            {"name": "Serie 1", "data": [4, 2, 8]}
        ]
    }

class SparkLineDataResponse(BaseModel):
    data: List[int]

@router.get("/get-spark-line-data", response_model=SparkLineDataResponse)
def get_spark_line_data(current_user=Depends(get_current_user)):
    return {"data": [random.randint(1, 10) for _ in range(9)]}
