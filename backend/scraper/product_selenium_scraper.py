from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.firefox.options import Options
import random
import time
from selenium.common.exceptions import NoSuchElementException
import re
import scraper.selenium_config as selenium_config

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
        
            for attempt in range(retries):
                try:
                    self.driver.get(url)
                    if self.show_details: print("✅ Page loaded successfully")
                    return
                except Exception as e:
                    if self.show_details: (f"⚠️ Error loading {url} (Attempt {attempt + 1}/{retries}): {e}")
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
    
    def get_image_path(self) ->str:
        if self.show_details: print("📝 Getting image path")
        try:
            img_wrapper = self.driver.find_element(By.XPATH, '//*[@id="imgTagWrapperId"]')
            img_element = img_wrapper.find_element(By.TAG_NAME, "img")
            img_src = img_element.get_attribute("src")
            return img_src
        except Exception as e:
            print("   ❌ Error finding image path, returning none")
            return None

    def get_price(self) -> float:
        if self.show_details: print("📝 Getting price")

        xpath = selenium_config.price_categories["default"]
    
        try:
            price_element = self.driver.find_element(By.XPATH, xpath)
            price_str = price_element.text
            price_str = price_str.replace(",", "")
           
            match = re.search(r'\$(\d+)[\s\n]*(\d+)', price_str)
            if match:
                dollars, cents = match.groups()
                return float(f"{dollars}.{cents}")
        except Exception as e:
            print("   ❌ Error finding price!")

    def get_product_infos_box_content(self) -> dict:
       
        if self.show_details: print("📝 Extracting product info box content...")
    
        # Try extracting from unordered list (ul)
        try:
            product_info_list = self.driver.find_element(By.XPATH, self.web_elements["product_infos_ul"])
            items = product_info_list.find_elements(By.TAG_NAME, 'li')
            
            data_dict = {}
            for item in items:
                text = item.text.strip()
                match = re.match(r"(.*?):\s*(.*)", text, re.DOTALL)
                if match:
                    key, value = match.groups()
                    data_dict[key.strip()] = value.strip()
            
            if self.show_details:
                print("✅ Product info extracted from list")
            return data_dict
            
        except NoSuchElementException:
            if self.show_details:
                if self.show_details: print("   🔹  List not found, trying table...")
        
        # Try extracting from table
        try:
            product_info_table = self.driver.find_element(By.XPATH, self.web_elements["product_infos_table"])
            rows = product_info_table.find_elements(By.TAG_NAME, 'tr')
            
            data_dict = {}
            for row in rows:
                try:
                    th = row.find_element(By.TAG_NAME, 'th').text.strip()
                    td = row.find_element(By.TAG_NAME, 'td').text.strip()
                    data_dict[th] = td
                except NoSuchElementException:
                    continue  # Skip rows without both th and td
            
            if self.show_details:
                if self.show_details: print("   ✅ Product info extracted from table")
            return data_dict
            
        except NoSuchElementException:
            if self.show_details:
                print("   ⚠️  No product info found in list or table. Returning None")
        
        return None
    
    def getting_bs_and_rank_data(self) -> dict:
        
        if self.show_details: print("📝 Extracting best seller rank and category data...")
    
        if not self.product_info_box_content or "Best Sellers Rank" not in self.product_info_box_content:
            if self.show_details:
                print("   ⚠️  No product info available or missing Best Sellers Rank in data. Return None")
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
                second_rank_text, second_category = rank_items[1].split(" in ", 1)
                second_rank = int(second_rank_text.replace(",", "").strip())
                second_category = second_category.strip()
            
            data = {
                "rank_main_category": main_rank,
                "main_category": main_category.strip(),
                "rank_second_category": second_rank,
                "second_category": second_category
            }

            if self.show_details:
                if self.show_details: print("   ✅ Successfully extracted rank data.")
            return data
            
        except Exception as e:
            print(f"   ❌ Error extracting best seller rank data: {e}")
            
        return None
            
    def get_rating(self) -> float | None:
        if self.show_details: print("📝 Getting rating")

        if self.product_info_box_content != None:
            try:
                match = re.search(r"(\d+\.\d+)\s+([\d,]+) ratings", self.product_info_box_content["Customer Reviews"])
                if match:
                    # print("1", match.group(1))
                    # print("2", match.group(2))
                    return float(match.group(1).replace(',', ''))
            except KeyError as e:
                print("   🔹  KeyError: 'Customer Reviews'  not found in Prodcut Info Box!, trying to get it from UI")
            except Exception as e:
                print("   ⚠️  Error parsing rating")
        else:
            if self.show_details: print("   🔹  No product info available, try to get data in UI")

        try:
            rating_element = self.driver.find_element(By.XPATH, self.web_elements["rating"])
            if self.show_details: print("   ✅ Found rating in UI")
            #print("\t before slicing", rating_element.text)
            rating_text = rating_element.text.strip()[:3]
            #print("\t after slicing", rating_text)
            return float(rating_text)
        except NoSuchElementException as e:
            print("   ⚠️  No rating element found, returning None")
        except ValueError as e:
            print("   ⚠️  Error parsing rating, returning None")
        except Exception as e:
            print("   ⚠️  Error getting rating, returning None", e)

        return None
  
    def get_review_count(self) -> int:
        if self.show_details: print("📝 Getting reviews count")

        if self.product_info_box_content != None:

            try:
                match = re.search(r"(\d+\.\d+)\s+([\d,]+) ratings", self.product_info_box_content["Customer Reviews"])
                if match:
                    # print(match.group(1))
                    # print(match.group(2))
                    return int(match.group(2).replace(',', ''))
            except KeyError as e:
                print("   🔹  KeyError: 'Customer Reviews' not found in Prodcut Info Box!, trying to get it from UI")
            except Exception as e:
                print("   ⚠️  Error parsing review count")
        else:
            if self.show_details: print("   🔹  No product info available, try to get data in UI")

        try:
            review_count_element = self.driver.find_element(By.XPATH, self.web_elements["review_count"])
            if self.show_details: print("   ✅ Found review count in UI")
            review_count_text = review_count_element.text.strip()
            #print("\ttext:", review_count_text)
            match = re.search(r"(\d[\d,]*)", review_count_text)
        
            if match:
                # print("\tgroup1:", match.group(1))
                # print("\tgroup2:", match.group(2))
                review_count = int(match.group(1).replace(",", ""))
                return review_count
        except NoSuchElementException as e:
            print("   ⚠️  No review count element found, returning None")
        except ValueError as e:
            print("   ⚠️  Error parsing review count, returning None")
        except Exception as e:
            print("   ⚠️  Error getting review count, returning None: ", e)

        return None 
    
    def get_blm(self) -> int:
        if self.show_details: print("📝 Getting bought last month")
        try:
            blm_element = self.driver.find_element(By.XPATH, self.web_elements["bought_last_month"])
            blm_str = blm_element.text
            blm_str = blm_str.replace("bought", "").replace("K", "000").replace("k", "000").replace("+", "").replace(" ", "").replace("inpastmonth", "")
            return int(blm_str)

        except Exception as e:
            print("   ⚠️  Error finding blm! Return None")
            return None
       
    def get_store(self) ->str:
        try:
            store_element = self.driver.find_element(By.XPATH, self.web_elements["store"])
            store = store_element.text if store_element.text else None
            return store.replace("Visit the ", "").replace("Store", "")
        except Exception as e:
            print("   ⚠️  Error getting store, returning None"  )
            return None

    def get_variants(self) -> list:
        variants = []
        if self.show_details: print("📝 Getting variants")

        try:
            div_element = self.driver.find_element(By.XPATH, self.web_elements["variants_div"])
            li_elements = div_element.find_elements(By.XPATH, self.web_elements["variants_lis"])

            variants = [li.get_attribute("data-csa-c-item-id") for li in li_elements if li.get_attribute("data-csa-c-item-id")]

            variants.pop(0)
        except Exception as e:
            if self.show_details: print("  🔹 No variants")
        
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
        if self.show_details and self.product_info_box_content:
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
            price = self.get_price()
            
            if bought_last_month is None:
                total = 0
            else:
                total = round(bought_last_month * price, 2) if price is not None else None
            
            self.bs_and_rank_data = self.getting_bs_and_rank_data() or {}
            
            if self.show_details and self.bs_and_rank_data:
                max_key_length = max(len(key) for key in self.bs_and_rank_data.keys()) if self.bs_and_rank_data else 0
                for key, value in self.bs_and_rank_data.items():
                    print(f"\t{key.ljust(max_key_length)} : {value}")
            
            title = self.get_title()
            reviews = self.get_review_count()
            rating = self.get_rating()
            variants = self.get_variants()
            manufacturer = self.product_info_box_content.get("Manufacturer", None) if self.product_info_box_content else None
            store = self.get_store()
            image_path = self.get_image_path()
            
            if title is None or price is None:
                print("⚠️  Warning: Missing essential product data, returning None")
                return None
            
            product = {
                "asin": self.asin,
                "title": title,
                "price": price,
                "manufacturer": manufacturer,
                "rank_main_category": self.bs_and_rank_data.get("rank_main_category", None),
                "rank_second_category": self.bs_and_rank_data.get("rank_second_category", None),
                "review_count": reviews,
                "rating": rating,
                "main_category": self.bs_and_rank_data.get("main_category", None),
                "second_category": self.bs_and_rank_data.get("second_category",None),
                "blm": bought_last_month,
                "total": total,
                "variants": variants,
                "variants_count": len(variants) if variants else 0,
                "store" : store,
                "image_url" : image_path,
            }
            
            self.end_time = time.time()
            return product
            
        except Exception as e:
            print("❌❌❌ Error getting product info!", e)
            return None
        
        finally:
            self.close_driver()
