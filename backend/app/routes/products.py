from app.database import get_db
from app.models import ProductChange
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

router = APIRouter()

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
        }
        for change in product_changes
    ]

