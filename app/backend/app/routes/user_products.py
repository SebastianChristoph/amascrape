import datetime
from typing import List
from app.auth import get_current_user
from app.database import get_db
from app.models import Market, MarketCluster, Product, ProductChange, User, UserProduct, market_cluster_markets
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

router = APIRouter()

@router.get("/insights/{cluster_id}")
async def get_user_products_insights(
    cluster_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns insights for UserProducts within a cluster."""

    # ✅ Fetch MarketCluster
    cluster = db.query(MarketCluster).filter(MarketCluster.id == cluster_id).first()
    if not cluster:
        raise HTTPException(status_code=404, detail="MarketCluster not found")

    # ✅ Get all markets in the cluster
    markets = (
        db.query(Market)
        .join(market_cluster_markets, market_cluster_markets.c.market_id == Market.id)
        .filter(market_cluster_markets.c.market_cluster_id == cluster_id)
        .all()
    )

    # ✅ Get all UserProducts for this user
    user_products = db.query(UserProduct).filter(UserProduct.user_id == current_user.id).all()
    user_asins = {up.asin for up in user_products}

    # 📦 Alle ASINs im Cluster sammeln
    cluster_asins = {
        product.asin
        for market in markets
        for product in market.products
    }

    # ✂️ Nur ASINs, die auch in den UserProducts sind
    user_products_in_cluster_asins = cluster_asins.intersection(user_asins)
    user_products_in_cluster_count = len(user_products_in_cluster_asins)

    # 📊 Insights pro Market
    market_insights = []
    for market in markets:
        user_products_in_market = sum(
            1 for product in market.products if product.asin in user_asins
        )

        market_insights.append({
            "market_id": market.id,
            "market_name": market.keyword,
            "user_products_in_market_count": user_products_in_market,
            "total_revenue_user_products": -1,  # DDM4 placeholder
            "marketshare": -1                   # DDM5 placeholder
        })

    # 📈 Gesamtergebnis zurückgeben
    return {
        "user_products_in_cluster_count": user_products_in_cluster_count,
        "markets": market_insights,
        "total_revenue_user_products": -1,  # CD1 placeholder
        "marketshare": -1                   # CDD5 placeholder
    }



## ADD PRODUCT TO USERPRODUCTS
@router.post("/{asin}")
async def add_my_product(asin: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing_product = db.query(Product).filter(Product.asin == asin).first()
    if not existing_product:
        raise HTTPException(status_code=404, detail="Product not found")

    existing_entry = db.query(UserProduct).filter(UserProduct.user_id == current_user.id, UserProduct.asin == asin).first()
    if existing_entry:
        raise HTTPException(status_code=400, detail="Product already added")

    new_entry = UserProduct(user_id=current_user.id, asin=asin)
    db.add(new_entry)
    db.commit()
    return {"message": "Product added to My Products"}


## REMOVE PRODUCT FROM USERPRODUCTS
@router.delete("/{asin}")
async def remove_my_product(asin: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    entry = db.query(UserProduct).filter(UserProduct.user_id == current_user.id, UserProduct.asin == asin).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Product not in My Products")

    db.delete(entry)
    db.commit()
    return {"message": "Product removed from My Products"}


## GET ALL USER PRODUCTS
@router.get("/")
async def get_my_products(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    products = db.query(UserProduct).filter(UserProduct.user_id == current_user.id).all()
    return [entry.asin for entry in products]
