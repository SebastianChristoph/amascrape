from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
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
    products: List[dict]

# 📌 GET: Einzelnen Market mit dem neuesten MarketChange abrufen
@router.get("/{market_id}", response_model=MarketResponse)
def get_market(market_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    market = db.query(Market).filter(Market.id == market_id).first()

    if not market:
        raise HTTPException(status_code=404, detail="Market not found")

    # Neuester MarketChange für diesen Market
    latest_market_change = db.query(MarketChange).filter(
        MarketChange.market_id == market.id
    ).order_by(MarketChange.change_date.desc()).first()

    market_data = {
        "id": market.id,
        "keyword": market.keyword,
        "products": [],
    }

    if latest_market_change:
        market_data["revenue_total"] = latest_market_change.total_revenue
        market_data["top_suggestions"] = latest_market_change.top_suggestions

        for product in latest_market_change.products:
            latest_product_change = db.query(ProductChange).filter(
                ProductChange.asin == product.asin
            ).order_by(ProductChange.change_date.desc()).first()

            product_data = {
                "asin": product.asin,
                "title": latest_product_change.title if latest_product_change else None,
                "price": latest_product_change.price if latest_product_change else None,
                "main_category": latest_product_change.main_category if latest_product_change else None,
                "main_category_rank": latest_product_change.main_category_rank if latest_product_change else None,
                "second_category": latest_product_change.second_category if latest_product_change else None,
                "second_category_rank": latest_product_change.second_category_rank if latest_product_change else None,
                "blm": latest_product_change.blm if latest_product_change else None,
                "total": latest_product_change.total if latest_product_change else None,
            }
            market_data["products"].append(product_data)

    return market_data
