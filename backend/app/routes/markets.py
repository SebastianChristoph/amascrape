import asyncio
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.auth import get_current_user
from app.models import Market, MarketChange, ProductChange
from pydantic import BaseModel
from typing import List

router = APIRouter()

# 📌 Market Response Schema
class MarketResponse(BaseModel):
    id: int
    keyword: str
    revenue_total: float | None = None
    top_suggestions: str | None = None
    products: List[dict] = []

# 📌 Asynchrones Abrufen eines einzelnen Markets mit dem neuesten MarketChange
@router.get("/{market_id}", response_model=MarketResponse)
async def get_market(
    market_id: int, 
    db: Session = Depends(get_db), 
    current_user=Depends(get_current_user)
):
    await asyncio.sleep(0.5)  # ⏳ Simulierte Verzögerung

    # ✅ Market abrufen
    market = db.query(Market).filter(Market.id == market_id).first()

    if not market:
        raise HTTPException(status_code=404, detail="Market not found")

    # ✅ Neuester MarketChange für diesen Market abrufen
    latest_market_change = db.query(MarketChange).filter(
        MarketChange.market_id == market.id
    ).order_by(MarketChange.change_date.desc()).first()

    # ✅ Falls es keinen MarketChange gibt, leeres Market-Objekt zurückgeben
    if not latest_market_change:
        return MarketResponse(id=market.id, keyword=market.keyword, products=[])

    # ✅ Parallel Abrufen aller `ProductChange`-Daten (bessere Performance!)
    product_changes = await asyncio.gather(*[
        _get_latest_product_change(db, product.asin)
        for product in latest_market_change.products
    ])

    # ✅ Market-Daten erstellen
    market_data = MarketResponse(
        id=market.id,
        keyword=market.keyword,
        revenue_total=latest_market_change.total_revenue,
        top_suggestions=latest_market_change.top_suggestions,
        products=product_changes
    )

    return market_data

# 📌 Asynchrone Helferfunktion: Neueste `ProductChange` abrufen
async def _get_latest_product_change(db: Session, asin: str) -> dict:
    latest_product_change = db.query(ProductChange).filter(
        ProductChange.asin == asin
    ).order_by(ProductChange.change_date.desc()).first()

    return {
        "asin": asin,
        "title": latest_product_change.title if latest_product_change else None,
        "price": latest_product_change.price if latest_product_change else None,
        "main_category": latest_product_change.main_category if latest_product_change else None,
        "main_category_rank": latest_product_change.main_category_rank if latest_product_change else None,
        "second_category": latest_product_change.second_category if latest_product_change else None,
        "second_category_rank": latest_product_change.second_category_rank if latest_product_change else None,
        "blm": latest_product_change.blm if latest_product_change else None,
        "total": latest_product_change.total if latest_product_change else None,
    }
