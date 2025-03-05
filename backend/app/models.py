from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Float, Table
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime, timezone

Base = declarative_base()

# 1️⃣ Users Table
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)

    # Beziehung zu MarketClusters
    market_clusters = relationship("MarketCluster", back_populates="user")

# 2️⃣ Products Table
class Product(Base):
    __tablename__ = "products"

    asin = Column(String, primary_key=True)  # Amazon Standard Identification Number (ASIN)
    product_changes = relationship("ProductChange", back_populates="product")

# 3️⃣ ProductChanges Table
class ProductChange(Base):
    __tablename__ = "product_changes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    asin = Column(String, ForeignKey("products.asin"), nullable=False)
    title = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    main_category = Column(String, nullable=True)
    second_category = Column(String, nullable=True)
    main_category_rank = Column(Integer, nullable=True)
    second_category_rank = Column(Integer, nullable=True)
    change_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))  # ✅ Fix für UTC-Zeitstempel
    changes = Column(String, nullable=False)
    blm = Column(Integer, nullable=True)
    total = Column(Float, nullable=True)

    product = relationship("Product", back_populates="product_changes")

# 4️⃣ Markets Table
class Market(Base):
    __tablename__ = "markets"

    id = Column(Integer, primary_key=True, autoincrement=True)
    keyword = Column(String, unique=True, nullable=False)

    # Beziehung zu Produkten (Many-to-Many)
    products = relationship("Product", secondary="market_products", back_populates="markets")
    market_changes = relationship("MarketChange", back_populates="market")

# 5️⃣ MarketChanges Table
class MarketChange(Base):
    __tablename__ = "market_changes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    market_id = Column(Integer, ForeignKey("markets.id"), nullable=False)
    change_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))  # ✅ Fix für UTC-Zeitstempel

    market = relationship("Market", back_populates="market_changes")

# 6️⃣ MarketCluster Table (Verknüpft User mit bis zu 5 Märkten)
class MarketCluster(Base):
    __tablename__ = "market_clusters"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Beziehung zu User und Märkten
    user = relationship("User", back_populates="market_clusters")
    markets = relationship("Market", secondary="market_cluster_markets", back_populates="market_clusters")

# Verknüpfungstabelle für Market <-> Product (Many-to-Many)
market_products = Table(
    "market_products",
    Base.metadata,
    Column("market_id", Integer, ForeignKey("markets.id")),
    Column("asin", String, ForeignKey("products.asin")),
)

# Verknüpfungstabelle für MarketCluster <-> Markets (Many-to-Many)
market_cluster_markets = Table(
    "market_cluster_markets",
    Base.metadata,
    Column("market_cluster_id", Integer, ForeignKey("market_clusters.id")),
    Column("market_id", Integer, ForeignKey("markets.id")),
)
