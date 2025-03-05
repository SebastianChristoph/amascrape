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


# 📌 Märkte, MarketChanges & ProductChanges erstellen
# 📌 Märkte, MarketChanges & ProductChanges erstellen
def init_products_and_markets():
    db = SessionLocal()

    # Zufällige ASINs generieren
    def generate_asin():
        return "".join(random.choices(string.ascii_uppercase + string.digits, k=10))

    # Falls bereits Produkte existieren, überspringen
    if not db.query(Product).first():
        products = [Product(asin=generate_asin()) for _ in range(50)]  # 🔥 Mehr Produkte hinzufügen
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

    # 📌 **Mehr Produkte zu den Märkten hinzufügen**
    for market in markets:
        market.products = random.sample(all_products, k=random.randint(10, 15))  # 🔥 10-15 Produkte pro Markt
    db.commit()
    print(f"✅ Jeder Markt hat nun mindestens 10 Produkte!")

    # Falls Market-Cluster schon existieren, abbrechen
    if not db.query(MarketCluster).first():
        tester1 = db.query(User).filter(User.username == "Tester1").first()
        tester2 = db.query(User).filter(User.username == "Tester2").first()
        market_creatine = db.query(Market).filter(Market.keyword == "creatine").first()
        market_turf_grass = db.query(Market).filter(Market.keyword == "turf grass").first()

        if tester1 and market_creatine and market_turf_grass:
            cluster1 = MarketCluster(user_id=tester1.id, title="Fitness Products", markets=[market_creatine, market_turf_grass])
            db.add(cluster1)

        if tester2 and market_creatine:
            cluster2 = MarketCluster(user_id=tester2.id, title="Health Markets", markets=[market_creatine])
            db.add(cluster2)

        db.commit()

    # 📌 **ProductChanges für jedes Produkt erstellen (3-4 Einträge pro Produkt)**
    for product in all_products:
        existing_changes = db.query(ProductChange).filter(ProductChange.asin == product.asin).count()
        if existing_changes == 0:  # Verhindert doppelte Einträge
            num_changes = random.randint(3, 4)  # 3 bis 4 Änderungen pro Produkt
            changes = []
            for _ in range(num_changes):
                change_date = datetime.now() - timedelta(days=random.randint(1, 30))  # Zufällig 1-30 Tage zurück
                changes.append(ProductChange(
                    asin=product.asin,
                    title=f"Product {product.asin}",
                    price=round(random.uniform(10.0, 100.0), 2),
                    main_category="Electronics" if random.random() > 0.5 else None,
                    second_category="Gadgets" if random.random() > 0.5 else None,
                    main_category_rank=random.randint(1, 100) if random.random() > 0.5 else None,
                    second_category_rank=random.randint(1, 200) if random.random() > 0.5 else None,
                    change_date=change_date,
                    changes="Price updated",
                    blm=random.randint(1, 5) if random.random() > 0.5 else None,
                    total=round(random.uniform(500.0, 2000.0), 2) if random.random() > 0.5 else None,
                ))

            db.add_all(changes)
            db.commit()
            print(f"✅ {num_changes} ProductChanges für Produkt {product.asin} erstellt!")

    # MarketChanges für jeden Markt erstellen (3-4 pro Markt)
    for market in markets:
        existing_changes = db.query(MarketChange).filter(MarketChange.market_id == market.id).count()
        if existing_changes == 0:
            num_changes = random.randint(3, 4)
            changes = []
            for _ in range(num_changes):
                change_date = datetime.now() - timedelta(days=random.randint(1, 30))

                # 🔥 Mehr Produkte für MarketChange (jetzt 5-10 neue Produkte)
                new_products = random.sample(all_products, k=random.randint(5, 10))
                removed_products = random.sample(all_products, k=random.randint(1, 4))

                changes.append(MarketChange(
                    market_id=market.id,
                    change_date=change_date,
                    products=new_products,
                    new_products=",".join([p.asin for p in new_products]),
                    removed_products=",".join([p.asin for p in removed_products])
                ))

            db.add_all(changes)
            db.commit()
            print(f"✅ {num_changes} MarketChanges für Markt {market.keyword} erstellt!")

    db.close()


