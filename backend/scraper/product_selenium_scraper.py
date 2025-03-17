import random
import re
import time

from scraper import selenium_config
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.common.by import By


class AmazonProductScraper:
    def __init__(self, driver, show_details=True):
        """Nimmt einen existierenden WebDriver und nutzt ihn für das Scraping."""
        self.driver = driver
        self.show_details = show_details
        self.web_elements = selenium_config.web_elements_product_page
        self.asin = ""
        self.url = ""
        self.product_info_box_content = {}
        self.bs_and_rank_data = {}

    def scroll_down(self, duration=5):
        """Simuliert das Scrollen auf der Seite, um Inhalte zu laden."""
        start = time.time()
        while time.time() - start < duration:
            self.driver.execute_script(
                f"window.scrollBy(0, {random.randint(900, 1400)});")
            time.sleep(random.uniform(0.5, 1.5))

    def open_page(self):
        if self.show_details:
            print("🔍 Starte Scraping:", self.asin, self.url)

        # Amazon Startseite aufrufen, um Cookies zu setzen
        # self.driver.get("https://www.amazon.com")

        # Jetzt die Produktseite aufrufen
        self.driver.get(self.url)

        # Scrollen, um Inhalte zu laden
        self.scroll_down()

        # Produkt-Infos extrahieren
        self.product_info_box_content = self.get_product_infos_box_content()

        # Debug-Ausgabe für Product Info Box Content
        if self.show_details and self.product_info_box_content:
            max_key_length = max(len(key)
                                 for key in self.product_info_box_content.keys())
            for key, value in self.product_info_box_content.items():
                print(
                    f"\t{key.ljust(max_key_length)} : {value.replace('\n', '')}")

    def getting_bs_and_rank_data(self) -> dict:

        if self.show_details:
            print("📝 Extracting best seller rank and category data...")

        if not self.product_info_box_content or "Best Sellers Rank" not in self.product_info_box_content:
            if self.show_details:
                print(
                    "   ⚠️  No product info available or missing Best Sellers Rank in data. Return None")
            return None

        try:
            rank_text = self.product_info_box_content["Best Sellers Rank"]
            rank_items = rank_text.split("#")[1:]

            if not rank_items:
                if self.show_details:
                    print("   ⚠️ No rank data found. Returning None")
                return None

            main_rank_text, main_category = rank_items[0].split(" in ", 1)
            main_rank = int(main_rank_text.replace(",", "").strip())

            second_rank, second_category = (None, None)
            if len(rank_items) > 1:
                second_rank_text, second_category = rank_items[1].split(
                    " in ", 1)
                second_rank = int(second_rank_text.replace(",", "").strip())
                second_category = second_category.strip()

            data = {
                "rank_main_category": main_rank,
                "main_category": main_category.strip(),
                "rank_second_category": second_rank,
                "second_category": second_category
            }

            if self.show_details:
                if self.show_details:
                    print("   ✅ Successfully extracted rank data.")
            return data

        except Exception as e:
            print(f"   ❌ Error extracting best seller rank data: {e}")

        return None

    def get_rating(self) -> float | None:
        if self.show_details:
            print("📝 Getting rating")

        # Try multiple ways to get the rating
        try:
            # Method 1: From product info box
            if self.product_info_box_content and "Customer Reviews" in self.product_info_box_content:
                match = re.search(r"(\d+\.\d+)\s+([\d,]+) ratings", self.product_info_box_content["Customer Reviews"])
                if match:
                    return float(match.group(1).replace(',', ''))

            # Method 2: From the rating histogram
            try:
                rating_element = self.driver.find_element(By.XPATH, self.web_elements["rating"])
                if rating_element:
                    rating_text = rating_element.text.strip()[:3]
                    return float(rating_text)
            except NoSuchElementException:
                pass

            # Method 3: From the star rating in the product title area
            try:
                star_rating = self.driver.find_element(By.XPATH, "//div[@id='averageCustomerReviews']//span[@class='a-icon-alt']")
                rating_text = star_rating.text.split()[0]  # Usually format is "4.5 out of 5"
                return float(rating_text)
            except NoSuchElementException:
                pass

            # Method 4: From the review count element (sometimes contains rating)
            try:
                review_element = self.driver.find_element(By.XPATH, self.web_elements["review_count"])
                rating_text = review_element.text.split()[0]  # Sometimes rating is first part
                return float(rating_text)
            except (NoSuchElementException, ValueError):
                pass

        except Exception as e:
            print(f"   ⚠️  Error getting rating: {e}")

        return None

    def get_review_count(self) -> int:
        if self.show_details:
            print("📝 Getting reviews count")

        # Try multiple ways to get the review count
        try:
            # Method 1: From product info box
            if self.product_info_box_content and "Customer Reviews" in self.product_info_box_content:
                match = re.search(r"(\d+\.\d+)\s+([\d,]+) ratings", self.product_info_box_content["Customer Reviews"])
                if match:
                    return int(match.group(2).replace(',', ''))

            # Method 2: From the review count element
            try:
                review_count_element = self.driver.find_element(By.XPATH, self.web_elements["review_count"])
                review_count_text = review_count_element.text.strip()
                match = re.search(r"(\d[\d,]*)", review_count_text)
                if match:
                    return int(match.group(1).replace(",", ""))
            except NoSuchElementException:
                pass

            # Method 3: From the rating histogram
            try:
                rating_histogram = self.driver.find_element(By.XPATH, "//div[@id='cm_cr_dp_d_rating_histogram']")
                total_reviews = rating_histogram.find_element(By.XPATH, ".//div[contains(@class, 'a-histogram-row')]//a")
                review_text = total_reviews.text
                match = re.search(r"(\d[\d,]*)", review_text)
                if match:
                    return int(match.group(1).replace(",", ""))
            except NoSuchElementException:
                pass

            # Method 4: From the product title area
            try:
                review_count = self.driver.find_element(By.XPATH, "//div[@id='averageCustomerReviews']//span[contains(@class, 'a-size-base')]")
                review_text = review_count.text
                match = re.search(r"(\d[\d,]*)", review_text)
                if match:
                    return int(match.group(1).replace(",", ""))
            except NoSuchElementException:
                pass

        except Exception as e:
            print(f"   ⚠️  Error getting review count: {e}")

        return None

    def get_blm(self) -> int:
        if self.show_details:
            print("📝 Getting bought last month")
            
        # Try multiple ways to get the BLM
        try:
            # Method 1: Original method
            try:
                blm_element = self.driver.find_element(By.XPATH, self.web_elements["bought_last_month"])
                blm_str = blm_element.text
                blm_str = blm_str.replace("bought", "").replace("K", "000").replace(
                    "k", "000").replace("+", "").replace(" ", "").replace("inpastmonth", "")
                return int(blm_str)
            except NoSuchElementException:
                pass

            # Method 2: Look for alternative BLM text
            try:
                blm_element = self.driver.find_element(By.XPATH, "//div[contains(text(), 'bought in past month')]")
                blm_str = blm_element.text
                blm_str = blm_str.replace("bought", "").replace("K", "000").replace(
                    "k", "000").replace("+", "").replace(" ", "").replace("inpastmonth", "")
                return int(blm_str)
            except NoSuchElementException:
                pass

            # Method 3: Look for social proof section
            try:
                social_proof = self.driver.find_element(By.XPATH, "//div[contains(@class, 'socialProofingAsinFaceout')]")
                blm_text = social_proof.text
                match = re.search(r"(\d+)\s*bought", blm_text)
                if match:
                    return int(match.group(1))
            except NoSuchElementException:
                pass

            # Method 4: Look for purchase frequency
            try:
                purchase_freq = self.driver.find_element(By.XPATH, "//div[contains(text(), 'purchased')]")
                freq_text = purchase_freq.text
                match = re.search(r"(\d+)\s*purchased", freq_text)
                if match:
                    return int(match.group(1))
            except NoSuchElementException:
                pass

        except Exception as e:
            print(f"   ⚠️  Error finding BLM: {e}")

        return None

    def get_store(self) -> str:
        try:
            store_element = self.driver.find_element(
                By.XPATH, self.web_elements["store"])
            store = store_element.text if store_element.text else None
            return store.replace("Visit the ", "").replace("Store", "")
        except Exception as e:
            print("   ⚠️  Error getting store, returning None")
            return None

    def get_variants(self) -> list:
        variants = []
        if self.show_details:
            print("📝 Getting variants")

        try:
            div_element = self.driver.find_element(
                By.XPATH, self.web_elements["variants_div"])
            li_elements = div_element.find_elements(
                By.XPATH, self.web_elements["variants_lis"])

            variants = [li.get_attribute(
                "data-csa-c-item-id") for li in li_elements if li.get_attribute("data-csa-c-item-id")]

            variants.pop(0)
        except Exception as e:
            if self.show_details:
                print("  🔹 No variants")

        return variants

    def get_title(self):
        """Extrahiert den Produkttitel."""
        try:
            title_element = self.driver.find_element(
                By.XPATH, self.web_elements["title"])
            return title_element.text
        except Exception as e:
            print(f"   ❌ Error finding title: {e}")
            return None

    def get_image_path(self):
        """Extrahiert den Bildpfad des Produkts."""
        try:
            img_element = self.driver.find_element(
                By.XPATH, '//*[@id="imgTagWrapperId"]//img')
            return img_element.get_attribute("src")
        except Exception as e:
            print(f"   ❌ Error finding image path: {e}")
            return None

    def get_price(self):
        """Extrahiert den Preis des Produkts."""
        try:
            price_element = self.driver.find_element(
                By.XPATH, selenium_config.price_categories["default"])
            price_str = price_element.text.replace(",", "")
            match = re.search(r'\$(\d+)[\s\n]*(\d+)', price_str)
            if match:
                dollars, cents = match.groups()
                return float(f"{dollars}.{cents}")
        except Exception as e:
            print(f"   ❌ Error finding price: {e}")
            return None

    def get_product_infos_box_content(self):
        """Extrahiert Produktinformationen aus der Tabelle oder Liste."""
        product_info = {}
        
        # Try to get info from the product info box
        try:
            items = self.driver.find_elements(
                By.XPATH, self.web_elements["product_infos_ul"] + "//li")
            product_info = {item.text.split(":")[0].strip(): item.text.split(":")[1].strip() for item in items if ":" in item.text}
        except NoSuchElementException:
            pass

        # Try to get info from the product details table
        try:
            rows = self.driver.find_elements(
                By.XPATH, self.web_elements["product_infos_table"] + "//tr")
            table_info = {row.find_element(By.TAG_NAME, 'th').text.strip(): row.find_element(By.TAG_NAME, 'td').text.strip() for row in rows}
            product_info.update(table_info)
        except NoSuchElementException:
            pass

        # Try to get info from the Item details section
        try:
            # First try to find and click the "Item details" button if it exists
            item_details_button = self.driver.find_element(By.XPATH, "//button[contains(text(), 'Item details')]")
            item_details_button.click()
            time.sleep(1)  # Wait for content to load
        except NoSuchElementException:
            pass

        try:
            # Look for the Item details content
            item_details_rows = self.driver.find_elements(By.XPATH, "//div[contains(@class, 'item-details')]//tr")
            item_details_info = {row.find_element(By.TAG_NAME, 'th').text.strip(): row.find_element(By.TAG_NAME, 'td').text.strip() 
                               for row in item_details_rows}
            product_info.update(item_details_info)
        except NoSuchElementException:
            pass

        return product_info

    def get_product_infos(self, asin):
        """Scraped Produktdaten für eine gegebene ASIN."""
        self.asin = asin
        self.url = f"https://www.amazon.com/dp/{self.asin}?language=en_US"

        try:
            self.open_page()  # Hier wieder hinzufügen!

            bought_last_month = self.get_blm()
            price = self.get_price()

            if bought_last_month is None:
                total = None
            else:
                total = round(bought_last_month * price,
                              2) if price is not None else None

            self.bs_and_rank_data = self.getting_bs_and_rank_data() or {}

            if self.show_details and self.bs_and_rank_data:
                max_key_length = max(
                    len(key) for key in self.bs_and_rank_data.keys()) if self.bs_and_rank_data else 0
                for key, value in self.bs_and_rank_data.items():
                    print(f"\t{key.ljust(max_key_length)} : {value}")

            title = self.get_title()
            reviews = self.get_review_count()
            rating = self.get_rating()
            variants = self.get_variants()
            manufacturer = self.product_info_box_content.get(
                "Manufacturer", None) if self.product_info_box_content else None
            store = self.get_store()
            image_path = self.get_image_path()

            if title is None or price is None:
                print("⚠️  Warning: Missing essential product data, returning None")
                return None

            product_dict = {
                "asin": self.asin,
                "title": title,
                "price": price,
                "manufacturer": manufacturer,
                "rank_main_category": self.bs_and_rank_data.get("rank_main_category", None),
                "rank_second_category": self.bs_and_rank_data.get("rank_second_category", None),
                "review_count": reviews,
                "rating": rating,
                "main_category": self.bs_and_rank_data.get("main_category", None),
                "second_category": self.bs_and_rank_data.get("second_category", None),
                "blm": bought_last_month,
                "total": total,
                "variants": variants,
                "variants_count": len(variants) if variants else 0,
                "store": store,
                "image_url": image_path,
            }

            max_key_length = max(len(key) for key in product_dict.keys())
            for key, value in product_dict.items():
                if isinstance(value, str):
                    value = value[:60] + "..." if len(value) > 60 else value
                print(f"\t{key.ljust(max_key_length)} : {value}")

            return product_dict
        except Exception as e:
            print(f"❌ Fehler beim Scrapen von {asin}: {e}")
            return None


#  max_key_length = max(len(key) for key in product_dict.keys())
#             for key, value in product_dict.items():
#                 if isinstance(value, str):
#                     value = value[:60] + "..." if len(value) > 60 else value
#                 print(f"\t{key.ljust(max_key_length)} : {value}")
