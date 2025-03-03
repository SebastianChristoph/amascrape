from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import random
import time
import timeit
import re
import selenium_config

class AmazonProductScraper:
    def __init__(self, headless = True, show_details = True):
        self.user_agent = selenium_config.user_agent
        self.cookies = selenium_config.cookies
        options = Options()
        options.set_preference("general.useragent.override",selenium_config.user_agent)
        self.web_elements = selenium_config.web_elements_product_page
        self.show_details = show_details
        self.asin = ""
        self.url = ""
        self.product_info_box_content = {}
        self.bs_and_rank_data = {}

        self.start_time = 0
        self.end_time = 0
        
        if headless:
            options.add_argument("--headless")
            if self.show_details: print("🚀 Starting browserless")


        self.driver = webdriver.Firefox(options=options)

    def retry_request(self, url, retries=3, wait=10) -> None:
            if self.show_details: print(f"🌍 Requesting {url}",  end = " ")
            # attempt = 0
            # while attempt < max_retries:
            #     try:
            #         self.driver.get(url)
            #         if self.show_details: print("✅")
            #         return 
            #     except Exception as e:
            #         if self.show_details: print(f"⚠️  Error loadig {url}")
            #         attempt += 1
            #         if attempt < max_retries:
            #             if self.show_details: print(f"🔄 Retry {attempt}/{max_retries} in {wait_time} seconds...", end = " ")
            #             time.sleep(wait_time)
            #         else:
            #             print("❌ Maximale Anzahl an Versuchen erreicht. Abbruch.")
            #             raise

            for attempt in range(retries):
                try:
                    self.driver.get(url)
                    if self.show_details: print("✅ Page loaded successfully")
                    return
                except Exception as e:
                    self.log(f"⚠️ Error loading {url} (Attempt {attempt + 1}/{retries}): {e}")
                    time.sleep(wait)
            raise Exception(f"❌ Failed to load {url} after {retries} attempts")

    def scroll_down(self, duration=5) -> None:
        if self.show_details: print("📜 Scrolling down")
        start = time.time()
        while time.time() - start < duration:
            self.driver.execute_script(f"window.scrollBy(0, {random.randint(900, 1400)});")
            time.sleep(random.uniform(0.5, 1.5))
    
    def get_title(self) -> str: 
        if self.show_details: print("📝 Getting title")
        try:
            title_element = self.driver.find_element(By.XPATH, self.web_elements["title"])
            title = title_element.text
            return title
        except Exception as e:
            print("   ❌ Error finding title!", e)

    def get_price(self) -> float:
        if self.show_details: print("📝 Getting price", end = " ")

        xpath = selenium_config.price_categories["default"]
    
        try:
            price_element = self.driver.find_element(By.XPATH, xpath)
            price_str = price_element.text
            print("\t", price_str.replace("\n", " "))
            price_str = price_str.replace(",", "")
           
            match = re.search(r'\$(\d+)[\s\n]*(\d+)', price_str)
            if match:
                dollars, cents = match.groups()
                print((f"\t{dollars}.{cents}"))
                return float(f"{dollars}.{cents}")
        except Exception as e:
            print("   ❌ Error finding price!", e)

       
 

    def get_product_infos_box_content(self) -> dict:
        if self.show_details: print("📝 Getting product info box content", end = " ")
        try:
            product_info_list = self.driver.find_element(By.XPATH, self.web_elements["product_infos_ul"])

            if product_info_list:
                if self.show_details: print("✅")
                items = product_info_list.find_elements(By.TAG_NAME, 'li')
    
                data_dict = {}
                for item in items:
                    text = item.text.strip()
                    match = re.match(r"(.*?):\s*(.*)", text, re.DOTALL)
                    if match:
                        key = match.group(1).strip()
                        value = match.group(2).strip()
                        data_dict[key] = value
                
                return data_dict
        except:
            if self.show_details: print(" ⚠️  Can't find product info box (ul), try another one", end = " ")
            try:
                product_info_table = self.driver.find_element(By.XPATH, self.web_elements["product_infos_table"])

                if product_info_table:
                    if self.show_details: print("✅")
                    rows = product_info_table.find_elements(By.TAG_NAME, 'tr')
                    data_dict = {}
                    for row in rows:
                        try:
                            th = row.find_element(By.TAG_NAME, 'th').text.strip()
                            td = row.find_element(By.TAG_NAME, 'td').text.strip()
                            data_dict[th] = td
                        except:
                            continue  # Falls eine Zeile kein <th> oder <td> enthält, überspringen

                    return data_dict
            except Exception as e:
                print("   ❌ Error finding product infos!")
                            
    def getting_bs_and_rank_data(self) -> dict:
        if self.show_details:
                print("📝 Getting best seller ranks and ranking data")
        try:
            match = re.search(r"#(\d+)[^#]+in ([^(]+) \(See Top 100 in [^)]+\)(?:\s+#(\d+) in (.+))?", self.product_info_box_content["Best Sellers Rank"])
            
            if match:
                return {
                    "rank_main_category": int(match.group(1)),
                    "main_category": match.group(2).strip(),
                    "rank_second_category": int(match.group(3)) if match.group(3) else "n/A",
                    "second_category": match.group(4).strip() if match.group(4) else "n/A"
                }
        
        except Exception as e:
            print("   ❌ Error finding best seller rank and ranking data!", e)
        
        if self.show_details: print("   ℹ️  No second category")
        return {"rank_main_category": "n/A", "main_category": "n/A", "rank_second_category": "n/A", "second_category": "n/A"}
    
    def get_rating(self) -> int:
        if self.show_details: print("📝 Getting rating count")
        try:
            match = re.search(r"(\d+\.\d+)\s+([\d,]+) ratings", self.product_info_box_content["Customer Reviews"])
            if match:
                return int(match.group(2).replace(',', ''))
                           
        except Exception as e:
            print("   ❌ Error finding rating!", e)
        
    def get_review_count(self) -> int:
        if self.show_details: print("📝 Getting review count")
        try:
            match = re.search(r"(\d+\.\d+)\s+([\d,]+) ratings", self.product_info_box_content["Customer Reviews"])
            if match:
                return float(match.group(1))
    
        except Exception as e:
            print("   ❌ Error finding review count!", e)
    
    def get_blm(self) -> int:
        if self.show_details: print("📝 Getting bought last month")
        try:
            blm_element = self.driver.find_element(By.XPATH, self.web_elements["bought_last_month"])
            blm_str = blm_element.text
            blm_str = blm_str.replace("bought", "").replace("K", "000").replace("k", "000").replace("+", "").replace(" ", "").replace("inpastmonth", "")
            return int(blm_str)

        except Exception as e:
            print("   ❌ Error finding blm!")
           
    def get_store(self) ->str:
        try:
            store_element = self.driver.find_element(By.XPATH, self.web_elements["store"])
            store = store_element.text if store_element.text else "Kein store"
        except Exception as e:
            store = "Kein store gefunden"
            print("Error finding store")

        print("Store:", store)
        return store

    def get_variants(self) -> list:
        variants = []
        if self.show_details: print("📝 Getting variants")

        try:
            div_element = self.driver.find_element(By.XPATH, self.web_elements["variants_div"])
            li_elements = div_element.find_elements(By.XPATH, self.web_elements["variants_lis"])

            variants = [li.get_attribute("data-csa-c-item-id") for li in li_elements if li.get_attribute("data-csa-c-item-id")]

            variants.pop(0)
        except Exception as e:
            if self.show_details: print("   ℹ️  No variants")
        
        return variants

    def open_page(self) -> None:
        print("🔍 Start scraping:",self.asin, self.url)
        self.retry_request("https://www.amazon.com")
        
        if self.show_details: print("🍪 Setting cookies")
        for cookie in selenium_config.cookies:
            self.driver.add_cookie(cookie)
        
        self.retry_request(self.url)
        self.scroll_down() 
        self.product_info_box_content = self.get_product_infos_box_content()
        if self.show_details:
            max_key_length = max(len(key) for key in self.product_info_box_content.keys())
            for key, value in self.product_info_box_content.items():
                print(f"\t{key.ljust(max_key_length)} : {value.replace('\n', '')}")
            
    def close_driver(self):
        if self.show_details: print("\nClosing WebDriver\n")
        self.driver.quit()

    def get_product_infos(self, asin) -> dict:
        self.asin = asin
        self.url = f"https://www.amazon.com/dp/{self.asin}?language=en_US"

        try:
            self.open_page()
            bought_last_month = self.get_blm()

            if bought_last_month is None:
                print("\n❌❌❌ No BLM info available, returning None")
                return None

            self.bs_and_rank_data = self.getting_bs_and_rank_data()

            if self.show_details:
                max_key_length = max(len(key) for key in self.bs_and_rank_data.keys())
                for key, value in self.bs_and_rank_data.items():
                    print(f"\t{key.ljust(max_key_length)} : {value}")

            title = self.get_title()
            price = self.get_price()
            reviews = self.get_review_count()
            rating = self.get_rating()
            variants = self.get_variants()
            total = round(bought_last_month * price, 2)
            manufacturer = self.product_info_box_content.get("Manufacturer", "n/A")

            product = {
                "asin": self.asin,
                "title": title,
                "price": price,
                "manufacturer": manufacturer,
                "rank_main_category": self.bs_and_rank_data["rank_main_category"],
                "rank_second_category": self.bs_and_rank_data["rank_second_category"],
                "review_count": reviews,
                "rating": rating,
                "main_category": self.bs_and_rank_data["main_category"],
                "second_category": self.bs_and_rank_data["second_category"],
                "blm": bought_last_month,
                "total": total,
                "variants": variants,
                "variants_count": len(variants),
            }

            if any(value is None for value in product.values()):
                print("⚠️ Warning: Invalid product data, returning None")
                return None

            self.end_time = time.time()
            return product

        except Exception as e:
            print("❌❌❌ Error getting product info!\n", e)
            return None

        finally:
            self.close_driver()
