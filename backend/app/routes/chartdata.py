import random
import asyncio  # ⚡ Asynchrone Verarbeitung
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.auth import get_current_user
from random import randint

router = APIRouter()

class LineChartDataResponse(BaseModel):
    x_axis: List[int]
    series: List[Dict[str, Any]]

@router.get("/get-line-chart-data", response_model=LineChartDataResponse)
async def get_line_chart_data(current_user=Depends(get_current_user)):
    await asyncio.sleep(1)  # ⏳ Simuliert eine asynchrone Verzögerung (z. B. langsame DB-Abfrage)
    return {
        "x_axis": [8, 9, 10],
        "series": [
            {"name": "Last 30 days", "data": [4, 2, 8]}
        ]
    }

class SparkLineDataResponse(BaseModel):
    data: List[int]

@router.get("/get-spark-line-data", response_model=SparkLineDataResponse)
async def get_spark_line_data(current_user=Depends(get_current_user)):
    await asyncio.sleep(1)  # ⏳ Simuliert Verzögerung
    return {"data": [random.randint(1, 10) for _ in range(9)]}

@router.get("/get-stacked-chart-data")
async def get_stacked_chart_data():
    await asyncio.sleep(1)  # ⏳ Simuliert Verzögerung
    years = ["2019", "2020", "2021", "2022", "2023"]
    data = [
        {
            "year": year,
            "currAss": randint(50, 200),
            "nCurrAss": randint(50, 200),
            "curLia": randint(50, 200),
            "nCurLia": randint(50, 200),
            "capStock": randint(50, 200),
            "retEarn": randint(50, 200),
            "treas": randint(50, 200),
        }
        for year in years
    ]
    return {"balanceSheet": data}

@router.get("/get-bar-chart-data")
async def get_bar_chart_data():
    await asyncio.sleep(1)  # ⏳ Simuliert Verzögerung
    quarters = ["Q1", "Q2", "Q3", "Q4"]
    data = [
        {
            "quarter": quarter,
            "series1": randint(10, 60),
            "series2": randint(10, 60),
            "series3": randint(10, 60),
            "series4": randint(10, 60),
        }
        for quarter in quarters
    ]
    return {"barChart": data}
