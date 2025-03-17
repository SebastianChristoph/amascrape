from selenium import webdriver
from selenium.webdriver.chrome.options import Options
import scraper.selenium_config as selenium_config
from scraper.first_page_amazon_scraper import AmazonFirstPageScraper
import logging
import json

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(message)s')

def test_first_page_scraper(keyword):
    """Testet den FirstPageAmazonScraper mit einem Suchbegriff."""
    logging.info(f"🚀 Starte Test für Keyword: {keyword}")
    
    # Chrome WebDriver mit Optionen starten
    chrome_options = Options()
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--window-size=1920,1080")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-software-rasterizer")
    chrome_options.add_argument("--disable-gpu-rasterization")
    chrome_options.add_argument("--enable-unsafe-webgl")
    chrome_options.add_argument("--enable-unsafe-swiftshader")
    chrome_options.add_argument("--mute-audio")
    chrome_options.add_argument("--ignore-certificate-errors")
    chrome_options.add_argument("--allow-running-insecure-content")
    chrome_options.add_argument("--disable-web-security")
    chrome_options.add_argument("--log-level=3")
    chrome_options.add_argument(f"user-agent={selenium_config.user_agent}")

    try:
        # Scraper initialisieren
        scraper = AmazonFirstPageScraper(headless=True, show_details=True)
        
        # Daten scrapen
        results = scraper.get_first_page_data(keyword)
        
        if results and results['first_page_products']:
            logging.info(f"\n✅ Erfolgreich {len(results['first_page_products'])} Produkte gefunden!")
            
            # Übersichtliche Ausgabe der Produkte
            logging.info("\nGefundene Produkte:")
            logging.info("=" * 80)
            
            for i, product in enumerate(results['first_page_products'], 1):
                logging.info(f"\nProdukt {i}:")
                logging.info(f"ASIN: {product['asin']}")
                logging.info(f"Titel: {product['title'][:100]}{'...' if len(product['title']) > 100 else ''}")
                logging.info(f"Preis: ${product['price'] if product['price'] else 'N/A'}")
                logging.info("-" * 80)
            
            # Optional: Speichere die Ergebnisse in einer JSON-Datei
            with open(f'first_page_results_{keyword.replace(" ", "_")}.json', 'w', encoding='utf-8') as f:
                json.dump(results, f, indent=2, ensure_ascii=False)
            logging.info(f"\n✅ Ergebnisse wurden in 'first_page_results_{keyword.replace(' ', '_')}.json' gespeichert.")
        else:
            logging.error("❌ Keine Produkte gefunden!")
            
    except Exception as e:
        logging.error(f"❌ Fehler: {e}")
    finally:
        scraper.close_driver()
        logging.info("\n✅ WebDriver geschlossen.")

if __name__ == "__main__":
    # Hier das zu testende Keyword eingeben
    test_first_page_scraper("creatine")  # Beispiel-Keyword 