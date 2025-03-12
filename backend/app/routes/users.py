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
