from datetime import datetime, timezone

from sqlalchemy import (Boolean, Column, DateTime, Float, ForeignKey, Integer, String,
                        Table)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

# 📌 Verknüpfungstabelle für Market <-> Product (Many-to-Many)
market_products = Table(
    "market_products",
    Base.metadata,
    Column("market_id", Integer, ForeignKey("markets.id")),
    Column("asin", String, ForeignKey("products.asin")),
)

# 📌 Verknüpfungstabelle für MarketChange <-> Products (Many-to-Many)
market_change_products = Table(
    "market_change_products",
    Base.metadata,
    Column("market_change_id", Integer, ForeignKey("market_changes.id")),
    Column("asin", String, ForeignKey("products.asin")),
)

# 📌 Verknüpfungstabelle für MarketCluster <-> Markets (Many-to-Many)
market_cluster_markets = Table(
    "market_cluster_markets",
    Base.metadata,
    Column("market_cluster_id", Integer, ForeignKey("market_clusters.id")),
    Column("market_id", Integer, ForeignKey("markets.id")),
)

# 1️⃣ Users Table
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    is_verified = Column(Boolean, default=False)
    verification_token = Column(String(64), unique=True, nullable=True)
    verification_token_expires = Column(DateTime, nullable=True)

    # ✅ Beziehung zu MarketCluster fehlt eventuell!
    market_clusters = relationship(
        "MarketCluster",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True
    )

# 2️⃣ Products Table
class Product(Base):
    __tablename__ = "products"

    asin = Column(String, primary_key=True)
    last_time_scraped = Column(DateTime, nullable=True)

    markets = relationship(
        "Market",
        secondary=market_products,
        back_populates="products",
        passive_deletes=True
    )

    product_changes = relationship(
        "ProductChange", back_populates="product", passive_deletes=True)
    market_changes = relationship(
        "MarketChange",
        secondary=market_change_products,
        back_populates="products",
        passive_deletes=True
    )



# ✅ Neue Tabelle für die Verknüpfung zwischen User und Product
class UserProduct(Base):
    __tablename__ = "user_products"

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    asin = Column(String, ForeignKey("products.asin", ondelete="CASCADE"), primary_key=True)
    added_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="user_products")
    product = relationship("Product", back_populates="user_products")
# ✅ Beziehung in User und Product definieren
User.user_products = relationship("UserProduct", back_populates="user", cascade="all, delete-orphan")
Product.user_products = relationship("UserProduct", back_populates="product", cascade="all, delete-orphan")



# 3️⃣ ProductChanges Table


class ProductChange(Base):
    __tablename__ = "product_changes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    asin = Column(String, ForeignKey("products.asin"), nullable=False)
    title = Column(String, nullable=True)
    price = Column(Float, nullable=True)
    main_category = Column(String, nullable=True)
    second_category = Column(String, nullable=True)
    main_category_rank = Column(Integer, nullable=True)
    second_category_rank = Column(Integer, nullable=True)
    change_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    changes = Column(String, nullable=False)
    blm = Column(Integer, nullable=True)
    total = Column(Float, nullable=True)
    img_path = Column(String, nullable=True)

    product = relationship("Product", back_populates="product_changes")

# 4️⃣ Markets Table


class Market(Base):
    __tablename__ = "markets"

    id = Column(Integer, primary_key=True, autoincrement=True)
    keyword = Column(String, unique=True, nullable=False)

    products = relationship(
        "Product",
        secondary=market_products,
        back_populates="markets",
        passive_deletes=True
    )

    market_changes = relationship(
        "MarketChange", back_populates="market", passive_deletes=True)

    market_clusters = relationship(
        "MarketCluster",
        secondary=market_cluster_markets,
        back_populates="markets",
        passive_deletes=True
    )

# 5️⃣ MarketChanges Table


class MarketChange(Base):
    __tablename__ = "market_changes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    market_id = Column(Integer, ForeignKey("markets.id"), nullable=False)
    total_revenue = Column(Float, nullable=True)
    change_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Verknüpfte Produkte
    products = relationship(
        "Product", secondary=market_change_products, back_populates="market_changes")

    # Neue und entfernte Produkte als Listen
    new_products = Column(String, nullable=True)  # Kommagetrennte ASINs
    removed_products = Column(String, nullable=True)  # Kommagetrennte ASINs
    changes = Column(String, nullable=True)

    # 📌 NEUE SPALTE: Top-Suggestions als kommagetrennter String
    top_suggestions = Column(String, nullable=True, default="")

    market = relationship("Market", back_populates="market_changes")

    def get_top_suggestions(self):
        """ Gibt die Liste der Top-Suggestions zurück """
        return self.top_suggestions.split(",") if self.top_suggestions else []

    def set_top_suggestions(self, suggestions: list):
        """ Speichert eine Liste von Top-Suggestions als kommagetrennten String """
        self.top_suggestions = ",".join(suggestions)


# 6️⃣ MarketCluster Table (Verknüpft User mit bis zu 5 Märkten)
class MarketCluster(Base):
    __tablename__ = "market_clusters"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    total_revenue = Column(Float, nullable=True, default=0.0)

    # ✅ Stelle sicher, dass diese Beziehung existiert!
    user = relationship("User", back_populates="market_clusters", passive_deletes=True)

    # ✅ Cascade-Fix: Löscht `market_cluster_markets`, wenn MarketCluster gelöscht wird
    markets = relationship(
        "Market",
        secondary=market_cluster_markets,
        back_populates="market_clusters",
        cascade="all, delete",  # 🔥 Löscht automatisch Verknüpfungen in `market_cluster_markets`
        passive_deletes=True
    )
