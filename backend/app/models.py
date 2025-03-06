from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Float, Table
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime, timezone

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
    username = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)

    # Beziehung zu MarketClusters
    market_clusters = relationship("MarketCluster", back_populates="user")

# 2️⃣ Products Table
class Product(Base):
    __tablename__ = "products"

    asin = Column(String, primary_key=True)  # Amazon Standard Identification Number (ASIN)
    
    # Many-to-Many Beziehung mit Markets
    markets = relationship("Market", secondary=market_products, back_populates="products")
    
    # Beziehung zu ProductChange
    product_changes = relationship("ProductChange", back_populates="product")

    # Beziehung zu MarketChange
    market_changes = relationship("MarketChange", secondary=market_change_products, back_populates="products")

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
    change_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    changes = Column(String, nullable=False)
    blm = Column(Integer, nullable=True)
    total = Column(Float, nullable=True)

    product = relationship("Product", back_populates="product_changes")

# 4️⃣ Markets Table
class Market(Base):
    __tablename__ = "markets"

    id = Column(Integer, primary_key=True, autoincrement=True)
    keyword = Column(String, unique=True, nullable=False)

    # Many-to-Many Beziehung mit Products
    products = relationship("Product", secondary=market_products, back_populates="markets")
    
    # Beziehung zu MarketChange
    market_changes = relationship("MarketChange", back_populates="market")

    # Beziehung zu MarketCluster
    market_clusters = relationship("MarketCluster", secondary=market_cluster_markets, back_populates="markets")

# 5️⃣ MarketChanges Table
class MarketChange(Base):
    __tablename__ = "market_changes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    market_id = Column(Integer, ForeignKey("markets.id"), nullable=False)
    total_revenue = Column(Float, nullable=True)
    change_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Verknüpfte Produkte
    products = relationship("Product", secondary=market_change_products, back_populates="market_changes")

    # Neue und entfernte Produkte als Listen
    new_products = Column(String, nullable=True)  # Kommagetrennte ASINs
    removed_products = Column(String, nullable=True)  # Kommagetrennte ASINs

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
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)

    # Beziehung zu User und Märkten
    user = relationship("User", back_populates="market_clusters")
    markets = relationship("Market", secondary=market_cluster_markets, back_populates="market_clusters")
