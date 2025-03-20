import datetime
from typing import List
from app.auth import get_current_user
from app.database import get_db
from app.models import Market, MarketCluster, Product, ProductChange, User, UserProduct, market_cluster_markets
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session



router = APIRouter()


def get_sparkline_for_user_products(db: Session, user_asins: List[str], field: str) -> List[int]:
    """Generates sparkline data for all UserProducts within a cluster."""
    
    today = datetime.datetime.now(datetime.timezone.utc).date()  # ✅ Fix hier!
    cutoff_date = today - datetime.timedelta(days=30)

    if not user_asins:
        return [0] * 30 
    
    product_changes = (
        db.query(ProductChange)
        .filter(ProductChange.asin.in_(user_asins))
        .order_by(ProductChange.change_date.asc())
        .all()
    )

    if not product_changes:
        return [0] * 30  

    valid_changes = [change for change in product_changes if getattr(change, field, None) is not None]

    if not valid_changes:
        return [0] * 30  

    first_valid_change = valid_changes[0]
    first_valid_date = first_valid_change.change_date.date()
    first_valid_value = getattr(first_valid_change, field)

    start_date = max(first_valid_date, cutoff_date)

    date_list = [(start_date + datetime.timedelta(days=i)).strftime("%Y-%m-%d") for i in range((today - start_date).days + 1)]
    changes_dict = {change.change_date.strftime("%Y-%m-%d"): getattr(change, field) for change in valid_changes}

    filled_data = []
    last_value = first_valid_value

    for date in date_list:
        if date in changes_dict:
            last_value = changes_dict[date]
        filled_data.append(int(last_value) if last_value is not None else 0)

    if len(filled_data) == 1:
        filled_data.append(filled_data[0])

    return filled_data

@router.get("/insights/{cluster_id}")
async def get_user_products_insights(cluster_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
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

    # 📊 **Cluster-Level Insight**
    user_products_in_cluster = 0  # Gesamtanzahl der UserProducts im Cluster

    market_insights = []

    for market in markets:
        user_products_in_market = sum(1 for product in market.products if product.asin in user_asins)
        
        # Falls UserProducts im Market existieren, zähle sie zum Cluster
        user_products_in_cluster += user_products_in_market

        # Füge Market-Statistik hinzu
        market_insights.append({
            "market_id": market.id,
            "market_name": market.keyword,
            "user_products_in_market_count": user_products_in_market,
            "total_revenue_user_products" : user_products_in_market * 10
        })

    return {
        "user_products_in_cluster_count": user_products_in_cluster,
        "markets": market_insights,
        "total_revenue_user_products" : user_products_in_cluster * 10
    }




#     # ✅ Fetch MarketCluster
#     cluster = db.query(MarketCluster).filter(MarketCluster.id == cluster_id).first()
#     if not cluster:
#         raise HTTPException(status_code=404, detail="MarketCluster not found")

#     # ✅ Get all markets in the cluster
#     markets = (
#     db.query(Market)
#     .join(market_cluster_markets, market_cluster_markets.c.market_id == Market.id)
#     .filter(market_cluster_markets.c.market_cluster_id == cluster_id)
#     .all()
# )

#     # ✅ Get all UserProducts for this user
#     user_products = db.query(UserProduct).filter(UserProduct.user_id == current_user.id).all()
#     user_asins = {up.asin for up in user_products}
#     print("user_asins:", user_asins)

#     # 📊 **Insights Cluster-Level**
#     total_revenue_user_products = 0
#     user_product_cluster_count = 0

#     product_totals = {}

#     # Cluster Data
#     for user_asin in user_asins:
#         print("HANDLING", user_asin)
#         latest_change = db.query(ProductChange).filter(ProductChange.asin == user_asin).order_by(ProductChange.change_date.desc()).first()
#         if latest_change and latest_change.total is not None:
#             total_revenue_user_products += latest_change.total
#             user_product_cluster_count += 1
#             product_totals[user_asin] = latest_change.total
#         else:
#             print("im else")
#             print(latest_change)
#             print(latest_change.total)


#     print("product_totals_dict:", product_totals)
#     market_insights = []
#     for market in markets:
#         total_revenue_market = 0
#         user_products_in_market = 0
#         for product in market.products:
#             if product.asin in product_totals:
#                 user_products_in_market += 1
#                 total_revenue_market += product_totals[product.asin]
#                 print(f"found my product {product.asin} in market {market.keyword}, add {product_totals[product.asin]} to market total")
        
#         market_insights.append({
#             "market_id": market.id,
#             "market_name": market.keyword,
#             "total_revenue_user_products": total_revenue_market,
#             "user_product_count": user_products_in_market,
#         })


#     return {
#         "total_revenue_user_products": total_revenue_user_products,
#         "user_product_count": user_product_cluster_count,
#         "markets": market_insights
#     }


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

@router.delete("/{asin}")
async def remove_my_product(asin: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    entry = db.query(UserProduct).filter(UserProduct.user_id == current_user.id, UserProduct.asin == asin).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Product not in My Products")

    db.delete(entry)
    db.commit()
    return {"message": "Product removed from My Products"}


@router.get("/")
async def get_my_products(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    products = db.query(UserProduct).filter(UserProduct.user_id == current_user.id).all()
    return [entry.asin for entry in products]
