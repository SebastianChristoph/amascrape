from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Base, User, Product, Market, MarketCluster, ProductChange, MarketChange
import os
import random
import string
from datetime import datetime, timedelta

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///marketdata.db")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Funktion für Dependency Injection in FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Funktion zur Initialisierung der Datenbank
def init_db():
    Base.metadata.create_all(bind=engine)
    init_test_users()  # 🔥 Wieder hinzugefügt
    init_products_and_markets()

# 📌 Test-User erstellen
def init_test_users():
    from app.auth import get_password_hash

    db = SessionLocal()
    test_users = [
        {"username": "Tester1", "password": "test123"},
        {"username": "Tester2", "password": "test123"},
    ]

    for user in test_users:
        existing_user = db.query(User).filter(User.username == user["username"]).first()
        if not existing_user:
            hashed_password = get_password_hash(user["password"])
            new_user = User(username=user["username"], hashed_password=hashed_password)
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            print(f"✅ {user['username']}-Benutzer wurde erstellt!")

    db.close()

# 📌 Märkte und MarketChanges erstellen
def init_products_and_markets():
    db = SessionLocal()

    # Zufällige ASINs generieren
    def generate_asin():
        return "".join(random.choices(string.ascii_uppercase + string.digits, k=10))

    # Falls bereits Produkte existieren, überspringen
    if not db.query(Product).first():
        products = [Product(asin=generate_asin()) for _ in range(10)]
        db.add_all(products)
        db.commit()

    # Produkte abrufen
    all_products = db.query(Product).all()

    # Falls schon Märkte existieren, abbrechen
    if not db.query(Market).first():
        market1 = Market(keyword="creatine")
        market2 = Market(keyword="turf grass")
        db.add_all([market1, market2])
        db.commit()

    # Märkte abrufen
    markets = db.query(Market).all()

   # Falls Market-Cluster schon existieren, abbrechen
    if not db.query(MarketCluster).first():
        tester1 = db.query(User).filter(User.username == "Tester1").first()
        tester2 = db.query(User).filter(User.username == "Tester2").first()
        market_creatine = db.query(Market).filter(Market.keyword == "creatine").first()

        if tester1 and markets:
            cluster1 = MarketCluster(user_id=tester1.id, title="Fitness Products", markets=markets)
            db.add(cluster1)

        if tester2 and market_creatine:
            cluster2 = MarketCluster(user_id=tester2.id, title="Health Markets", markets=[market_creatine])  # ✅ Hier sicherstellen, dass Märkte verknüpft sind!
            db.add(cluster2)

        db.commit()

    # MarketChanges für jeden Markt erstellen (3-4 pro Markt)
    for market in markets:
        existing_changes = db.query(MarketChange).filter(MarketChange.market_id == market.id).count()
        if existing_changes == 0:
            num_changes = random.randint(3, 4)
            changes = []
            for _ in range(num_changes):
                change_date = datetime.now() - timedelta(days=random.randint(1, 30))

                # Zufällige neue und entfernte Produkte
                new_products = random.sample(all_products, k=random.randint(1, 3))
                removed_products = random.sample(all_products, k=random.randint(1, 2))

                changes.append(MarketChange(
                    market_id=market.id,
                    change_date=change_date,
                    products=new_products,
                    new_products=",".join([p.asin for p in new_products]),
                    removed_products=",".join([p.asin for p in removed_products])
                ))

            db.add_all(changes)
            db.commit()

    db.close()
