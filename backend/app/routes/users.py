from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import authenticate_user, create_access_token, get_password_hash, get_current_user
from app.models import User, MarketCluster, Market, MarketChange, ProductChange
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import joinedload

router = APIRouter()

# 📌 User-Registrierung Schema
class UserCreate(BaseModel):
    username: str
    password: str

# 📌 MarketCluster Response Schema
class MarketClusterResponse(BaseModel):
    id: int
    title: str
    markets: List[str]

# 📌 Market Response Schema
class MarketResponse(BaseModel):
    id: int
    keyword: str
    products: List[dict]

# 📌 User-Registrierung mit SQLAlchemy
@router.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.username == user.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")

    new_user = User(username=user.username, hashed_password=get_password_hash(user.password))
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"message": "User created successfully"}

# 📌 Token-Generierung (Login)
@router.post("/token")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token({"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

# 📌 GET: MarketClusters des eingeloggten Users abrufen
@router.get("/market-clusters", response_model=List[MarketClusterResponse])
def get_user_market_clusters(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    market_clusters = db.query(MarketCluster).filter(
        MarketCluster.user_id == current_user.id
    ).options(joinedload(MarketCluster.markets)).all()  # 🔥 Fix: Märkte werden jetzt mitgeladen!

    if not market_clusters:
        return []

    return [
        MarketClusterResponse(
            id=cluster.id,
            title=cluster.title,
            markets=[market.keyword for market in cluster.markets]  # 🔥 Jetzt sollten Märkte korrekt erscheinen
        )
        for cluster in market_clusters
    ]

# 📌 GET: Detaillierte Market-Cluster-Informationen mit MarketChanges
@router.get("/market-clusters/{cluster_id}")
def get_market_cluster_details(cluster_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    market_cluster = db.query(MarketCluster).filter(
        MarketCluster.id == cluster_id,
        MarketCluster.user_id == current_user.id
    ).options(joinedload(MarketCluster.markets)).first()

    if not market_cluster:
        raise HTTPException(status_code=404, detail="MarketCluster not found")

    response_data = {
        "id": market_cluster.id,
        "title": market_cluster.title,
        "markets": []
    }

    for market in market_cluster.markets:
        # Das **neueste** MarketChange für den Market abrufen
        latest_market_change = db.query(MarketChange).filter(
            MarketChange.market_id == market.id
        ).order_by(MarketChange.change_date.desc()).first()

        market_data = {
            "id": market.id,
            "keyword": market.keyword,
            "products": []
        }

        if latest_market_change:
            for product in latest_market_change.products:
                latest_product_change = db.query(ProductChange).filter(
                    ProductChange.asin == product.asin
                ).order_by(ProductChange.change_date.desc()).first()

                product_data = {
                    "asin": product.asin,
                    "title": latest_product_change.title if latest_product_change else "Unknown",
                    "price": latest_product_change.price if latest_product_change else None,
                    "main_category": latest_product_change.main_category if latest_product_change else "N/A"
                }
                market_data["products"].append(product_data)

        response_data["markets"].append(market_data)

    return response_data

# 📌 GET: Einzelnen Market mit dem neuesten MarketChange abrufen
@router.get("/markets/{market_id}", response_model=MarketResponse)
def get_market(market_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
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
        "products": []
    }

    if latest_market_change:
        for product in latest_market_change.products:
            latest_product_change = db.query(ProductChange).filter(
                ProductChange.asin == product.asin
            ).order_by(ProductChange.change_date.desc()).first()

            product_data = {
                "asin": product.asin,
                "title": latest_product_change.title if latest_product_change else "Unknown",
                "price": latest_product_change.price if latest_product_change else None,
                "main_category": latest_product_change.main_category if latest_product_change else "N/A"
            }
            market_data["products"].append(product_data)

    return market_data
