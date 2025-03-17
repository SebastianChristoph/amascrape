import logging
import time
from datetime import datetime, timezone

from app.database import SessionLocal
from app.models import Market, MarketChange, MarketCluster, Product, ProductChange
from scraper.first_page_amazon_scraper import AmazonFirstPageScraper
from sqlalchemy.orm import Session

# Logging einrichten
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")


class MarketOrchestrator:
    def __init__(self):
        self.start_time = None
        self.market_times = []

    def get_latest_market_change(self, db: Session, market_id: int):
        logging.info(f"🔍 Suche letzten MarketChange für Market ID {market_id}...")
        return (
            db.query(MarketChange)
            .filter(MarketChange.market_id == market_id)
            .order_by(MarketChange.change_date.desc())
            .first()
        )

    def fetch_current_market_data(self, keyword: str):
        print(f"Scraping market: {keyword}")
        start_time = time.time()
        
        scraper = AmazonFirstPageScraper(headless=True, show_details=False)
        result = scraper.get_first_page_data(keyword)
        
        if result:
            self.market_times.append(time.time() - start_time)
        
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
            .first())

              # Fallback: Falls keine alten Einträge vorhanden sind, den neuesten nehmen
            if not last_valid_product_change:
                last_valid_product_change = (
                    db.query(ProductChange)
                    .filter(ProductChange.asin == product.asin)
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

    def update_markets(self):
        db = SessionLocal()
        self.start_time = time.time()
        self.market_times = []
        updated_markets = 0
        failed_markets = 0

        try:
            markets = db.query(Market).all()
            total_markets = len(markets)
            
            print(f"\nStarting market update for {total_markets} markets")
            
            for index, market in enumerate(markets, 1):
                print(f"\n[{index}/{total_markets}] Processing market: {market.keyword}")
                
                try:
                    market_data = self.fetch_current_market_data(market.keyword)
                    
                    if market_data:
                        # Update market data
                        self.update_market_in_db(db, market, market_data)
                        updated_markets += 1
                    else:
                        print(f"Failed to scrape market: {market.keyword}")
                        failed_markets += 1
                        
                except Exception as e:
                    print(f"Error processing market {market.keyword}: {e}")
                    failed_markets += 1

            # Print timing statistics
            total_time = time.time() - self.start_time
            avg_time = sum(self.market_times) / len(self.market_times) if self.market_times else 0
            
            print(f"\nMarket update completed:")
            print(f"Total time: {total_time:.2f}s")
            print(f"Average time per market: {avg_time:.2f}s")
            print(f"Successfully updated: {updated_markets}/{total_markets}")
            print(f"Failed markets: {failed_markets}")

        except Exception as e:
            print(f"Error in update_markets: {e}")
        finally:
            db.close()

    def update_market_in_db(self, db, market, market_data):
        try:
            # Create market change record
            change = MarketChange(
                market_id=market.id,
                change_date=datetime.now(timezone.utc),
                top_suggestions=",".join(market_data["top_search_suggestions"]),
                products_count=len(market_data["first_page_products"])
            )
            db.add(change)
            
            # Update market
            market.top_suggestions = ",".join(market_data["top_search_suggestions"])
            market.last_time_scraped = datetime.now(timezone.utc)
            
            db.commit()
            
        except Exception as e:
            print(f"Error updating market in database: {e}")
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
