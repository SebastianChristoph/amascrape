import logging
from datetime import datetime, timezone

from app.database import SessionLocal
from app.models import Market, MarketChange, MarketCluster, Product, ProductChange
from scraper.first_page_amazon_scraper import AmazonFirstPageScraper
from sqlalchemy.orm import Session

# Logging einrichten
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")


class MarketOrchestrator:
    def __init__(self):
        pass

    def get_latest_market_change(self, db: Session, market_id: int):
        logging.info(f"🔍 Suche letzten MarketChange für Market ID {market_id}...")
        return (
            db.query(MarketChange)
            .filter(MarketChange.market_id == market_id)
            .order_by(MarketChange.change_date.desc())
            .first()
        )

    def fetch_current_market_data(self, keyword: str):
        logging.info(f"🌐 Scraping Market-Daten für: {keyword}")
        scraper = AmazonFirstPageScraper(headless=True, show_details=True)
        return scraper.get_first_page_data(keyword)

    def calculate_total_revenue(self, db: Session, market: Market):
        logging.info(f"💰 Berechne total_revenue für Market: {market.keyword}")
        total_revenue = 0
        today = datetime.now(timezone.utc).date()
        has_valid_products = False

        for product in market.products:
            last_valid_product_change = (
                db.query(ProductChange)
                .filter(ProductChange.asin == product.asin, ProductChange.change_date < today)
                .order_by(ProductChange.change_date.desc())
                .first()
            )

            if last_valid_product_change and last_valid_product_change.total is not None:
                logging.info(f"✅ Produkt {product.asin} trägt {last_valid_product_change.total:.2f}€ bei")
                total_revenue += last_valid_product_change.total
                has_valid_products = True

        if not has_valid_products:
            logging.warning("⚠️ Kein Produkt mit validem Umsatz gefunden! Setze total_revenue auf None")
            return None

        logging.info(f"🏆 Gesamtumsatz für {market.keyword}: {total_revenue:.2f}€")
        return total_revenue

    def update_market_revenue_and_changes(self):
        logging.info("🚀 Starte Market Revenue Updates...")
        db = SessionLocal()
        try:
            markets = db.query(Market).all()
            for market in markets:
                logging.info(f"🔎 Verarbeite Market: {market.keyword}")
                last_market_change = self.get_latest_market_change(db, market.id)
                if not last_market_change:
                    logging.warning(f"⚠️ Kein MarketChange für {market.keyword} gefunden. Überspringe...")
                    continue

                all_products_scraped = all(p.last_time_scraped is not None for p in market.products)
                some_products_scraped = any(p.last_time_scraped is not None for p in market.products)

                if last_market_change.total_revenue is None:
                    if not some_products_scraped:
                        logging.info(f"🚫 Market {market.keyword} wird ignoriert (keine gescrapten Produkte)")
                        continue
                    elif all_products_scraped:
                        logging.info(f"🆕 Market {market.keyword} wird gescrapet")
                        new_data = self.fetch_current_market_data(market.keyword)
                        new_total_revenue = self.calculate_total_revenue(db, market)
                    else:
                        logging.info(f"⏩ Market {market.keyword} wird übersprungen (teilweise gescrapet)")
                        continue
                else:
                    logging.info(f"🔄 Prüfe Änderungen für Market {market.keyword}")
                    new_data = self.fetch_current_market_data(market.keyword)
                    new_total_revenue = self.calculate_total_revenue(db, market)

                changes = []
                new_products_asins = set(p["asin"] for p in new_data["first_page_products"])
                old_products_asins = set(last_market_change.new_products.split(",")) if last_market_change.new_products else set()
                removed_products_asins = old_products_asins - new_products_asins

                if new_total_revenue != last_market_change.total_revenue:
                    changes.append("new total revenue")
                if new_data["top_search_suggestions"] != last_market_change.top_suggestions.split(","):
                    changes.append("new top suggestions")
                if new_products_asins != old_products_asins:
                    changes.append("new or removed products")

                changes_detected = bool(changes)
                
                if changes_detected:
                    logging.info(f"⚡ Änderungen erkannt! Erstelle neuen MarketChange für {market.keyword}")
                    new_market_change = MarketChange(
                        market_id=market.id,
                        change_date=datetime.now(timezone.utc),
                        total_revenue=new_total_revenue,
                        new_products=",".join(new_products_asins),
                        removed_products=",".join(removed_products_asins),
                        top_suggestions=",".join(new_data["top_search_suggestions"]),
                        changes=", ".join(changes)
                    )
                    db.add(new_market_change)
                    db.commit()
                    db.refresh(new_market_change)

                    # 🆕 Neue Produkte mit MarketChange verknüpfen
                    logging.info("🔗 Verknüpfe neue Produkte mit MarketChange...")
                    new_products = db.query(Product).filter(Product.asin.in_(new_products_asins)).all()
                    for product in new_products:
                        if product not in new_market_change.products:
                            new_market_change.products.append(product)

                    # ❌ Entfernte Produkte aus dem MarketChange entfernen
                    logging.info("❌ Entferne nicht mehr gefundene Produkte aus dem MarketChange...")
                    removed_products = db.query(Product).filter(Product.asin.in_(removed_products_asins)).all()
                    for product in removed_products:
                        if product in new_market_change.products:
                            new_market_change.products.remove(product)

                    db.commit()
                    logging.info(f"✅ Neuer MarketChange für {market.keyword} mit Änderungen: {', '.join(changes)}")
                else:
                    logging.info(f"✅ Keine Änderungen für Market {market.keyword}")
                
            self.update_market_cluster_total_revenue(db)
        except Exception as e:
            db.rollback()
            logging.error(f"❌ Fehler in Market Orchestrator: {e}")
        finally:
            db.close()

    def update_market_cluster_total_revenue(self, db: Session):
        logging.info("🔄 Aktualisiere total_revenue für alle MarketCluster...")
        clusters = db.query(MarketCluster).all()
        for cluster in clusters:
            total_revenue = sum(
                (self.get_latest_market_change(db, market.id).total_revenue or 0)
                for market in cluster.markets if self.get_latest_market_change(db, market.id)
            )
            cluster.total_revenue = total_revenue
            logging.info(f"🏆 MarketCluster '{cluster.title}' aktualisiert: {total_revenue:.2f}€")
        db.commit()


if __name__ == "__main__":
    orchestrator = MarketOrchestrator()
    orchestrator.update_market_revenue_and_changes()
