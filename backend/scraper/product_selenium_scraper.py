import random
import re
import time
import logging
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.common.by import By
from scraper import selenium_config


class OutOfStockException(Exception):
    pass

class NoSuchPageException(Exception):
    pass


class AmazonProductScraper:
    def __init__(self, driver, show_details=True):
        self.driver = driver
        self.show_details = show_details
        self.web_elements = selenium_config.web_elements_product_page
        self.asin = ""
        self.url = ""
        self.product_info_box_content = {}
        self.technical_details_box_content = {}
        self.bs_and_rank_data = {}

         # Entferne DEBUG-Logs von Selenium & Co.
        logging.getLogger("selenium.webdriver.remote.remote_connection").setLevel(logging.WARNING)
        logging.getLogger("urllib3").setLevel(logging.WARNING)
        logging.getLogger("seleniumwire").setLevel(logging.WARNING)
        logging.getLogger("httpcore").setLevel(logging.WARNING)
        logging.getLogger("httpx").setLevel(logging.WARNING)



    def log(self, message):
        if self.show_details:
            logging.debug(message)

    def is_out_of_stock(self) -> bool:
        self.log("🛑 Prüfe Verfügbarkeit (Out of Stock)")
        try:
            self.driver.find_element(By.XPATH, '//*[@id="add-to-cart-button"]')
        except:
            self.log("🚫 Kein 'Add to Cart'-Button gefunden.")
            return True

        try:
            page_text = self.driver.page_source.lower()
            if "we couldn't find the" in page_text or "temporarily out of stock" in page_text or "no featured offers available" in page_text:
                return True
            return False
        except Exception as e:
            self.log(f"⚠️ Fehler beim Prüfen auf Lagerbestand: {e}")
            return False

    def does_product_has_page(self) -> bool:
        self.log("🔍 Prüfe, ob Produktseite existiert")
        try:
            return "couldn't find the page" not in self.driver.page_source.lower()
        except Exception as e:
            self.log(f"⚠️ Fehler beim Prüfen auf Seitenexistenz: {e}")
            return True

    def scroll_down(self, duration=5):
        self.log("📜 Scrolle nach unten für dynamische Inhalte...")
        start = time.time()
        while time.time() - start < duration:
            self.driver.execute_script(
                f"window.scrollBy(0, {random.randint(900, 1400)});")
            time.sleep(random.uniform(0.5, 1.5))

    def open_page(self):
        self.log(f"🌐 Öffne Produktseite: {self.asin} ({self.url})")
        self.driver.get(self.url)
        self.scroll_down()
        self.product_info_box_content = self.get_product_infos_box_content()
        self.technical_details_box_content = self.get_technical_details_box_content()

    def getting_bs_and_rank_data(self) -> dict:
        self.log("📈 Extrahiere Bestseller-Rangdaten...")
        if not self.product_info_box_content.get("Best Sellers Rank"):
            self.log("⚠️ Keine Rank-Informationen vorhanden.")
            return None
        try:
            rank_text = self.product_info_box_content["Best Sellers Rank"]
            rank_items = rank_text.split("#")[1:]

            main_rank_text, main_category = rank_items[0].split(" in ", 1)
            main_rank = int(main_rank_text.replace(",", "").strip())

            second_rank, second_category = (None, None)
            if len(rank_items) > 1:
                second_rank_text, second_category = rank_items[1].split(" in ", 1)
                second_rank = int(second_rank_text.replace(",", "").strip())
                second_category = second_category.strip()

            main_category = self.remove_parentheses(main_category).strip()

            return {
                "rank_main_category": main_rank,
                "main_category": main_category,
                "rank_second_category": second_rank,
                "second_category": second_category
            }
        except Exception as e:
            self.log(f"❌ Fehler beim Extrahieren von Rangdaten: {e}")
            return None

    def get_rating(self) -> float | None:
        self.log("⭐️ Extrahiere Bewertung...")
        try:
            if "Customer Reviews" in self.product_info_box_content:
                match = re.search(r"(\d+\.\d+)\s+([\d,]+) ratings", self.product_info_box_content["Customer Reviews"])
                if match:
                    return float(match.group(1).replace(',', ''))

            rating_element = self.driver.find_element(By.XPATH, self.web_elements["rating"])
            if rating_element:
                return float(rating_element.text.strip()[:3])
        except NoSuchElementException:
            pass
        except Exception as e:
            self.log(f"⚠️ Fehler bei Bewertung: {e}")
        return None

    def get_review_count(self) -> int:
        self.log("🗣️ Extrahiere Review-Anzahl...")
        try:
            if "Customer Reviews" in self.product_info_box_content:
                match = re.search(r"(\d+\.\d+)\s+([\d,]+) ratings", self.product_info_box_content["Customer Reviews"])
                if match:
                    return int(match.group(2).replace(',', ''))

            review_count_element = self.driver.find_element(By.XPATH, self.web_elements["review_count"])
            match = re.search(r"(\d[\d,]*)", review_count_element.text.strip())
            if match:
                return int(match.group(1).replace(",", ""))
        except Exception as e:
            self.log(f"⚠️ Fehler bei Reviews: {e}")
        return None

    def get_blm(self) -> int:
        self.log("📊 Extrahiere BLM (bought last month)...")
        try:
            paths = [
                '//*[@id="socialProofingAsinFaceout_feature_div"]',
                '//*[@id="centerCol"]//div[contains(text(), "bought in past month")]',
                '//*[@id="centerCol"]//div[contains(@class, "socialProofingAsinFaceout")]'
            ]
            for xpath in paths:
                try:
                    element = self.driver.find_element(By.XPATH, xpath)
                    text = element.text.replace("bought", "").replace("K", "000").replace("+", "").replace("in past month", "").strip()
                    return int(text)
                except NoSuchElementException:
                    continue
        except Exception as e:
            self.log(f"⚠️ Fehler bei BLM: {e}")
        return None

    def get_store(self) -> str:
        try:
            store_element = self.driver.find_element(By.XPATH, self.web_elements["store"])
            return store_element.text.replace("Visit the ", "").replace("Store", "").strip()
        except Exception:
            return None

    def get_variants(self) -> list:
        self.log("🎨 Extrahiere Varianten...")
        variants = []
        try:
            div = self.driver.find_element(By.XPATH, self.web_elements["variants_div"])
            lis = div.find_elements(By.XPATH, self.web_elements["variants_lis"])
            variants = [li.get_attribute("data-csa-c-item-id") for li in lis if li.get_attribute("data-csa-c-item-id")]
            variants.pop(0)
        except:
            self.log("🟡 Keine Varianten gefunden.")
        return variants

    def get_title(self):
        try:
            return self.driver.find_element(By.XPATH, self.web_elements["title"]).text
        except Exception as e:
            self.log(f"❌ Fehler beim Titel: {e}")
            return None

    def get_image_path(self):
        try:
            img = self.driver.find_element(By.XPATH, '//*[@id="imgTagWrapperId"]//img')
            return img.get_attribute("src")
        except Exception as e:
            self.log(f"❌ Fehler beim Bildpfad: {e}")
            return None

    def extract_price_from_string(self, price_str: str) -> float | None:
        try:
            price_str = re.sub(r"\([^)]*\)", "", price_str)
            cleaned = re.sub(r"[^\d\$\n\.]", "", price_str)
            match_multiline = re.search(r"\$(\d+)\n(\d{2})", cleaned)
            if match_multiline:
                return float(f"{match_multiline.group(1)}.{match_multiline.group(2)}")
            match_single = re.search(r"\$(\d+)\.(\d{2})", cleaned)
            if match_single:
                return float(f"{match_single.group(1)}.{match_single.group(2)}")
            match_whole = re.search(r"\$(\d+)", cleaned)
            if match_whole:
                return float(match_whole.group(1))
        except Exception as e:
            self.log(f"⚠️ Fehler beim Preis-Parsen: {e}")
        return None

    def get_price(self):
        self.log("💰 Extrahiere Preis...")
        xpaths = [
            '//*[@id="apex_offerDisplay_desktop"]',
            '//*[@id="corePriceDisplay_desktop_feature_div"]/div[1]/span[1]',
            '//*[@id="corePrice_feature_div"]/div/div/span[1]/span[2]',
            '//*[@id="corePrice_desktop"]/div/table/tbody/tr/td[2]/span[1]'
        ]
        for xpath in xpaths:
            try:
                element = self.driver.find_element(By.XPATH, xpath)
                price = self.extract_price_from_string(element.text)
                if price:
                    return price
            except NoSuchElementException:
                continue
        self.log("❌ Kein Preis gefunden.")
        return None

    def get_technical_details_box_content(self):
        self.log("🧾 Extrahiere technische Details...")
        info = {}
        try:
            tech_sections = self.driver.find_elements(By.XPATH, "//*[contains(text(), 'Technical Details')]")
            for section in tech_sections:
                try:
                    table = section.find_element(By.XPATH, "./ancestor::div[contains(@class, 'a-section')]//table")
                    rows = table.find_elements(By.TAG_NAME, "tr")
                    for row in rows:
                        key = row.find_element(By.TAG_NAME, 'th').text.strip()
                        value = row.find_element(By.TAG_NAME, 'td').text.strip()
                        if key and value:
                            info[key] = value
                except:
                    continue
        except Exception as e:
            self.log(f"⚠️ Fehler bei technischen Details: {e}")
        return info

    def get_product_infos_box_content(self):
        self.log("📦 Extrahiere Produktinformationen...")
        info = {}
        try:
            items = self.driver.find_elements(By.XPATH, self.web_elements["product_infos_ul"] + "//li")
            info.update({item.text.split(":")[0].strip(): item.text.split(":")[1].strip() for item in items if ":" in item.text})
        except:
            pass
        try:
            rows = self.driver.find_elements(By.XPATH, self.web_elements["product_infos_table"] + "//tr")
            info.update({row.find_element(By.TAG_NAME, 'th').text.strip(): row.find_element(By.TAG_NAME, 'td').text.strip() for row in rows})
        except:
            pass
        return info

    def remove_parentheses(self, text: str) -> str:
        return re.sub(r"\s*\([^)]*\)", "", text).strip()

    def get_location(self) -> str:
        self.log("📍 Extrahiere Standort...")
        try:
            location = self.driver.find_element(By.XPATH, '//*[@id="nav-global-location-popover-link"]').text
            return location.replace("Update location", "").replace("Delivering to", "").replace("\n", "").strip()
        except:
            self.log("⚠️ Kein Standort gefunden.")
            return None

    def get_breadcrumb_categories(self) -> tuple:
        self.log("🧭 Extrahiere Breadcrumb-Kategorien...")
        xpaths = [
            '//div[@id="wayfinding-breadcrumbs_container"]',
            '//div[@id="wayfinding-breadcrumbs-container"]',
            '//div[contains(@class, "a-breadcrumb")]',
            '//ul[@class="a-unordered-list a-horizontal a-size-small"]',
            '//div[@class="a-section a-spacing-none a-padding-none"]//a[@class="a-link-normal a-color-tertiary"]'
        ]
        for xpath in xpaths:
            try:
                elements = self.driver.find_elements(By.XPATH, xpath)
                categories = []
                for el in elements:
                    text = el.text.strip()
                    if text and not text.startswith('Back to'):
                        categories.extend(text.split('\n'))
                if categories:
                    categories = list(dict.fromkeys(categories))
                    return categories[0], categories[-1]
            except:
                continue
        return None, None

    def get_product_infos(self, asin):
        self.asin = asin
        self.url = f"https://www.amazon.com/dp/{asin}?language=en_US"

        self.open_page()

        if self.is_out_of_stock():
            raise OutOfStockException(f"{asin} is out of stock.")

        if not self.does_product_has_page():
            raise NoSuchPageException(f"{asin} has no product page.")

        blm = self.get_blm()
        price = self.get_price()
        total = round(blm * price, 2) if blm and price else None

        self.bs_and_rank_data = self.getting_bs_and_rank_data() or {}
        main_category = self.bs_and_rank_data.get("main_category")
        second_category = self.bs_and_rank_data.get("second_category")

        if not main_category or not second_category:
            bc_main, bc_second = self.get_breadcrumb_categories()
            main_category = main_category or bc_main
            second_category = second_category or bc_second

        title = self.get_title()
        reviews = self.get_review_count()
        rating = self.get_rating()
        variants = self.get_variants()
        manufacturer = self.product_info_box_content.get("Manufacturer") or \
                       self.technical_details_box_content.get("Manufacturer")
        store = self.get_store() or self.technical_details_box_content.get("Brand")
        image_path = self.get_image_path()
        location = self.get_location()

        if not title or price is None:
            self.log("⚠️ Produkt hat keinen Titel oder Preis – abbrechen.")
            return None

        return {
            "browser_location": location,
            "asin": self.asin,
            "title": title,
            "price": price,
            "manufacturer": manufacturer,
            "rank_main_category": self.bs_and_rank_data.get("rank_main_category"),
            "rank_second_category": self.bs_and_rank_data.get("rank_second_category"),
            "review_count": reviews,
            "rating": rating,
            "main_category": main_category,
            "second_category": second_category,
            "blm": blm,
            "total": total,
            "variants": variants,
            "variants_count": len(variants) if variants else 0,
            "store": store,
            "image_url": image_path,
        }
