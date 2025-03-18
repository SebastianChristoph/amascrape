import logging
import time
from datetime import datetime, timezone

from app.database import SessionLocal
from app.models import Market, MarketChange, MarketCluster, Product, ProductChange
from scraper.first_page_amazon_scraper import AmazonFirstPageScraper
from sqlalchemy.orm import Session

# Logging einrichten
logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")

class MarketOrchestrator:
    def __init__(self):
        self.start_time = None
        self.market_times = []

    def format_time(self, seconds):
        minutes, seconds = divmod(seconds, 60)
        return f"{int(minutes)}m {int(seconds)}s"

    def get_latest_market_change(self, db: Session, market_id: int):
        logging.info(f"🔍 Suche letzten MarketChange für Market ID {market_id}...")
        return (
            db.query(MarketChange)
            .filter(MarketChange.market_id == market_id)
            .order_by(MarketChange.change_date.desc())
            .first()
        )

    def fetch_current_market_data(self, keyword: str):
        logging.info(f"🔍 Scraping market: {keyword}")
        start_time = time.time()
        
        scraper = AmazonFirstPageScraper(headless=True, show_details=False)
        result = scraper.get_first_page_data(keyword)
        
        elapsed_time = time.time() - start_time
        
        if result:
            self.market_times.append(elapsed_time)
            logging.info(f"✅ Scraping abgeschlossen für {keyword} in {elapsed_time:.2f} Sekunden")
        else:
            logging.warning(f"❌ Scraping fehlgeschlagen für {keyword}")
        
        return result

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

            if not last_valid_product_change:
                last_valid_product_change = (
                    db.query(ProductChange)
                    .filter(ProductChange.asin == product.asin)
                    .order_by(ProductChange.change_date.desc())
                    .first()
                )

            if last_valid_product_change and last_valid_product_change.total is not None:
                # logging.info(f"✅ Produkt {product.asin} trägt {last_valid_product_change.total:.2f}€ bei")
                total_revenue += last_valid_product_change.total
                has_valid_products = True

        if not has_valid_products:
            logging.warning("⚠️ Kein Produkt mit validem Umsatz gefunden! Setze total_revenue auf None")
            return None

        logging.info(f"🏆 Gesamtumsatz für {market.keyword}: {total_revenue:.2f}€")
        return total_revenue

    def detect_changes(self, last_market_change, new_data):
            """ 🔄 Vergleicht alte und neue Marktdaten und ermittelt Änderungen """
            logging.info(
                f"🔎 Vergleiche alte und neue Daten für MarketChange ID {last_market_change.id}")

            added_asins = []
            removed_asins = []
            new_suggestions = []

            old_asins = set(last_market_change.new_products.split(
                ",")) if last_market_change.new_products else set()
            new_asins = set(p["asin"] for p in new_data["first_page_products"])

            added_asins = list(new_asins - old_asins)
            removed_asins = list(old_asins - new_asins)

            old_suggestions = set(last_market_change.top_suggestions.split(
                ",")) if last_market_change.top_suggestions else set()
            new_suggestions = set(new_data["top_search_suggestions"])

            changes = []
            if added_asins:
                logging.info(f"✅ Neue Produkte gefunden!")
                changes.append(f"Neue Produkte: {', '.join(added_asins)}")
            if removed_asins:
                logging.info(f"⚠️ Entfernte Produkte: {', '.join(removed_asins)}")
                changes.append(f"Entfernte Produkte: {', '.join(removed_asins)}")
            if old_suggestions != new_suggestions:
                logging.info(f"⚠️ Änderungen in den Top-Suchvorschlägen erkannt!")
                changes.append("Änderungen in den Top-Suchvorschlägen")

            return changes, added_asins, removed_asins, list(new_suggestions)
    
    def update_market_changes(self, db: Session, market: Market, new_market_change: MarketChange, new_data, added_asins, removed_asins):
        """ 🔄 Aktualisiert MarketChange mit neuen Produkten und Änderungen """
        logging.info(f"📢 Aktualisiere MarketChange für {market.keyword}...")

        new_market_change.new_products = ",".join(added_asins)
        new_market_change.removed_products = ",".join(removed_asins)
        new_market_change.top_suggestions = ",".join(
            new_data["top_search_suggestions"])

        # Neue Produkte hinzufügen
        for product_data in new_data["first_page_products"]:
            product = db.query(Product).filter(
                Product.asin == product_data["asin"]).first()
            if not product:
                logging.info(
                    f"🆕 Neues Produkt {product_data['asin']} wird erstellt.")
                product = Product(
                    asin=product_data["asin"], last_time_scraped=None)
                db.add(product)
                db.commit()
                db.refresh(product)

            if product not in market.products:
                market.products.append(product)
            if product not in new_market_change.products:
                new_market_change.products.append(product)

        # Entfernte Produkte aus Market entfernen
        if removed_asins:
            removed_products = db.query(Product).filter(
                Product.asin.in_(removed_asins)).all()
            for product in removed_products:
                if product in market.products:
                    market.products.remove(product)
                if product in new_market_change.products:
                    new_market_change.products.remove(product)

        db.commit()
        logging.info(f"✅ MarketChange für {market.keyword} aktualisiert.")

    def update_markets(self):
        db = SessionLocal()
        self.start_time = time.time()
        self.market_times = []
        updated_markets = 0
        failed_markets = 0
        skipped_markets = 0

        try:
            markets = db.query(Market).all()
            total_markets = len(markets)
            
            logging.info(f"🚀 Starte Markt-Update für {total_markets} Märkte...")
            
            for index, market in enumerate(markets, 1):
                logging.info(f" ------------------------------------------------------------ ")
                logging.info(f"[{index}/{total_markets}] Verarbeite Markt: {market.keyword}")
                
                try:
                    last_market_change = self.get_latest_market_change(
                    db, market.id)

                    scraped_products = [
                    p for p in market.products if p.last_time_scraped is not None]
                    if not scraped_products:
                        skipped_markets += 1
                        logging.info(
                        f"⚠️ Noch keine Scraping-Daten für {market.keyword}. Warte auf Product Orchestrator.")
                        continue

                    new_total_revenue = self.calculate_total_revenue(db=db, market=market)

                    new_data = self.fetch_current_market_data(market.keyword)
                    changes, added_asins, removed_asins, new_suggestions = self.detect_changes(
                    last_market_change, new_data)

                    if new_total_revenue != last_market_change.total_revenue or changes:
                        logging.info(
                            f"⚡ Erstelle neuen MarketChange für {market.keyword}")

                        new_market_change = MarketChange(
                            market_id=market.id,
                            change_date=datetime.now(timezone.utc),
                            total_revenue=new_total_revenue,
                            new_products=",".join(added_asins),
                            removed_products=",".join(removed_asins),
                            top_suggestions=",".join(new_suggestions),
                            changes=" | ".join(
                                changes) if changes else "Kein Total Revenue Change, aber andere Änderungen"
                        )
                        db.add(new_market_change)
                        db.commit()
                        db.refresh(new_market_change)
                        updated_markets += 1

                        self.update_market_changes(
                            db, market, new_market_change, new_data, added_asins, removed_asins)
                    else:
                        logging.info(
                            f"✅ Keine Änderungen für {market.keyword}, MarketChange bleibt unverändert.")

                    # if market_data:
                    #     self.update_market_in_db(db, market, market_data)
                    #     updated_markets += 1
                    # else:
                    #     logging.warning(f"❌ Scraping fehlgeschlagen für Markt: {market.keyword}")
                    #     failed_markets += 1
                        
                except Exception as e:
                    logging.error(f"❌ Fehler beim Verarbeiten von Markt {market.keyword}: {e}")
                    failed_markets += 1

            self.update_market_cluster_total_revenue(db=db)
           # Gesamtzeit berechnen
            total_time = time.time() - self.start_time
            avg_time = sum(self.market_times) / len(self.market_times) if self.market_times else 0
            
            logging.info("-----------------------------------------------------------------")
            logging.info("-----------------------------------------------------------------")
            logging.info("📊 Scraping Performance Metrics:")
            logging.info(f"🕒 Gesamtzeit: {self.format_time(total_time)}")
            logging.info(f"⚡ Durchschnittliche Zeit pro Markt: {avg_time:.2f} Sekunden")
            logging.info(f"📦 Erfolgreich aktualisiert: {updated_markets}/{total_markets}")
            logging.info(f"❌ Fehlgeschlagene Märkte: {failed_markets}")
            logging.info(f"📦 Skipped Märkte: {skipped_markets}")

        except Exception as e:
            logging.critical(f"❌ Schwerwiegender Fehler im Markt-Update: {e}")
        finally:
            db.close()

    def update_market_in_db(self, db, market, market_data):
        try:
            change = MarketChange(
                market_id=market.id,
                change_date=datetime.now(timezone.utc),
                top_suggestions=",".join(market_data["top_search_suggestions"]),
                products_count=len(market_data["first_page_products"])
            )
            db.add(change)
            
            market.top_suggestions = ",".join(market_data["top_search_suggestions"])
            market.last_time_scraped = datetime.now(timezone.utc)
            
            db.commit()
            logging.info(f"✅ Markt {market.keyword} erfolgreich in der Datenbank aktualisiert.")
        except Exception as e:
            logging.error(f"❌ Fehler beim Aktualisieren des Markts in der Datenbank: {e}")
            db.rollback()

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
    orchestrator.update_markets()

