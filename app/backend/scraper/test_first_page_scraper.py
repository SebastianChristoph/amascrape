import logging
import shutil
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
import scraper.selenium_config as selenium_config
from scraper.first_page_amazon_scraper import AmazonFirstPageScraper
import platform
import shutil
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

logging.basicConfig(level=logging.INFO, format='%(message)s')

def test_first_page(search_query):
    """Testet das Scraping der ersten Seite mit dem AmazonFirstPageScraper."""
    logging.info(f"Starte Test für die Suche: {search_query}")
    
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
        if platform.system() == "Windows":
            service = Service(ChromeDriverManager().install())
        else:
            chromedriver_path = shutil.which("chromedriver")
            if chromedriver_path:
                service = Service(executable_path=chromedriver_path)
            else:
                raise FileNotFoundError("❌ Kein chromedriver gefunden – und kein ChromeType verwendet.")


        driver = webdriver.Chrome(service=service, options=chrome_options)

        scraper = AmazonFirstPageScraper(driver, show_details=True)
        print(f"🔍 WebDriver gestartet mit: {driver.capabilities.get('browserName')}")
        start_time = time.time()
        search_results = scraper.get_first_page_data(search_query)
        end_time = time.time()
        
        if search_results:
            logging.info("\n✅ Erste Seite erfolgreich gescraped!")
            logging.info("\nErgebnisse:")
            logging.info("\nTop Suggestions:", search_results["top_search_suggestions"])
            
            for index, result in enumerate(search_results["first_page_products"], start=1):
                logging.info(f"{index}. {result}")
            logging.info(f"⏳ Dauer des Scraping: {end_time - start_time:.2f} Sekunden")
        else:
            logging.error("❌ Keine Ergebnisse gefunden!")
            
    except Exception as e:
        logging.error(f"❌ Fehler: {e}")
    finally:
        driver.quit()
        logging.info("\n✅ WebDriver geschlossen.")

if __name__ == "__main__":
    while True:
        search_query = input("Bitte geben Sie eine Suchanfrage ein [default ist creatine]: ").strip()
        if search_query == "":
            search_query = "creatine"
        test_first_page(search_query)
        repeat = input("Möchten Sie eine weitere Suche testen? (ja/nein): ").strip().lower()
        if repeat != "ja":
            logging.info("Beende das Programm.")
            break
