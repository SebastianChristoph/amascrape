from datetime import datetime, timedelta
from typing import Dict, List, Union

from app.auth import get_current_user
from app.database import get_db
from app.models import ProductChange
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

router = APIRouter()


class ChartSeries(BaseModel):
    name: str
    data: List[Union[int, float]]

class LineChartDataResponse(BaseModel):
    x_axis: List[str]
    series: List[ChartSeries]

## GET ALL PRODUCT CHANGES BY ASIN
@router.get("/product-changes/{asin}")
async def get_product_changes(asin: str, db: Session = Depends(get_db)):
    product_changes = (
        db.query(ProductChange)
        .filter(ProductChange.asin == asin)
        .order_by(ProductChange.change_date.desc())
        .all()
    )

    if not product_changes:
        raise HTTPException(status_code=404, detail="Keine Änderungen gefunden.")

    return [
        {
            "id": change.id,
            "asin": change.asin,
            "change_date": change.change_date.strftime("%Y-%m-%d %H:%M:%S"),
            "title": change.title,
            "price": change.price,
            "main_category": change.main_category,
            "second_category": change.second_category,
            "main_category_rank": change.main_category_rank,
            "second_category_rank": change.second_category_rank,
            "blm": change.blm,
            "total": change.total,
            "changes": change.changes,
            "img_path": change.img_path,
            "store": change.store,
            "manufacturer": change.manufacturer,
            "review_count": change.review_count,
            "rating": change.rating
        }
        for change in product_changes
    ]



@router.get("/get-product-chart-data/{asin}", response_model=LineChartDataResponse)
async def get_product_chart_data(
    asin: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    # 1. ProductChanges holen
    product_changes = db.query(ProductChange).filter(
        ProductChange.asin == asin
    ).order_by(ProductChange.change_date.asc()).all()

    if not product_changes:
        raise HTTPException(status_code=404, detail="Keine ProductChanges gefunden.")

    # 2. Zeitraum bestimmen
    start_date = product_changes[0].change_date.date()
    end_date = product_changes[-1].change_date.date()

    date_range = []
    current = start_date
    while current <= end_date:
        date_range.append(current.strftime("%Y-%m-%d"))
        current += timedelta(days=1)

    # 3. Felder vorbereiten
    fields = ["price", "blm", "main_category_rank", "second_category_rank"]
    field_values = {field: {} for field in fields}

    for change in product_changes:
        date_str = change.change_date.date().strftime("%Y-%m-%d")
        for field in fields:
            value = getattr(change, field)
            if value is not None:
                field_values[field][date_str] = value

    # 4. Interpolation pro Feld
    series = []
    for field in fields:
        data = []
        last_valid = None
        for day in date_range:
            if day in field_values[field]:
                last_valid = field_values[field][day]
            # Nur hinzufügen, wenn wir einen gültigen Wert kennen
            if last_valid is not None:
                data.append(last_valid)
            else:
                # Tag wird ignoriert, falls noch kein gültiger Wert bekannt
                data.append(None)

        # Alle None entfernen aus Anfang der Liste, damit die Chart sauber ist
        # (optional: du kannst auch entscheiden, sie komplett rauszulassen)
        cleaned_data = []
        cleaned_x_axis = []
        for i, val in enumerate(data):
            if val is not None:
                cleaned_data.append(val)
                cleaned_x_axis.append(date_range[i])

        series.append(ChartSeries(name=field, data=cleaned_data))

        # Set x_axis nur einmal, da alle Felder dieselbe haben
        if field == fields[0]:
            final_x_axis = cleaned_x_axis

    return LineChartDataResponse(
        x_axis=final_x_axis,
        series=series
    )
