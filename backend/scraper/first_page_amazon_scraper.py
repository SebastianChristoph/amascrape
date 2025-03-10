from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.firefox.options import Options
import random
import time
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.support.ui import WebDriverWait
import re
import scraper.selenium_config as selenium_config
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys

class AmazonFirstPageScraper:
    def __init__(self, headless = True, show_details = True):
        self.user_agent = selenium_config.user_agent
        self.cookies = selenium_config.cookies
        options = Options()
        options.set_preference("general.useragent.override",selenium_config.user_agent)
        self.web_elements = selenium_config.web_elements_product_page
        self.show_details = show_details
        self.start_time = 0
        self.end_time = 0
        self.searchterm = ""
        
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
                    if self.show_details: print(f"⚠️ Error loading {url} (Attempt {attempt + 1}/{retries}): {e}")
                    time.sleep(wait)
            raise Exception(f"❌ Failed to load {url} after {retries} attempts")

    def scroll_down(self, duration=5) -> None:
        if self.show_details: print("📜 Scrolling down")
        start = time.time()
        while time.time() - start < duration:
            self.driver.execute_script(f"window.scrollBy(0, {random.randint(900, 1400)});")
            time.sleep(random.uniform(0.5, 1.5))
    
    def open_page(self, searchterm) -> None:
        self.searchterm = searchterm
        if self.show_details: print("🔍 Start scraping:", self.searchterm)
        self.retry_request("https://www.amazon.com/gp/bestsellers/?ref_=nav_em_cs_bestsellers_0_1_1_2")
        
        if self.show_details: print("🍪 Setting cookies")
        for cookie in selenium_config.cookies:
            self.driver.add_cookie(cookie)
        
        #self.scroll_down() 

    def get_top_search_suggestions(self):
        if self.show_details: print("⌨️  Get Top Suggestions")
        try:
            wait = WebDriverWait(self.driver, 15)
    
            search_box = self.driver.find_element(By.XPATH, '//input[@role="searchbox"]')
            search_box.clear()
            search_box.send_keys(self.searchterm)
            time.sleep(2)
            
            # Wait for autocomplete results to appear
            autocomplete = wait.until(EC.visibility_of_element_located((By.XPATH, '//*[@id="sac-autocomplete-results-container"]')))
            autocomplete_text = autocomplete.text
            autocomplete_list = autocomplete_text.split("\n")
            autocomplete_list = [item for item in autocomplete_list if self.searchterm in item]
            if self.show_details: print("\t", autocomplete_list)
            search_box.send_keys(Keys.RETURN)
            self.scroll_down()
            return autocomplete_list
            
            

        except Exception as e:
            print("   ❌ Error entering text in search box or fetching autocomplete results!", e)
            return ""

    def get_first_page_products(self) -> list:
        if self.show_details:
            if self.show_details: print("📋 Collecting list items")
        try:
            self.scroll_down()
            wait = WebDriverWait(self.driver, 10)
            list_items = wait.until(EC.presence_of_all_elements_located((By.XPATH, "//div[@role='listitem' and @data-asin]")))
            
            results = []
            for item in list_items:
                try:
                    # Extract ASIN
                    asin = item.get_attribute("data-asin")
                    
                    # Extract price
                    price_link = next((a for a in item.find_elements(By.TAG_NAME, "a") if a.get_attribute("aria-describedby") == "price-link"), None)
                    if not price_link:
                        #raise Exception("Price link not found")
                        price = -1
                    else:
                        price_text = price_link.text.replace("$", "").strip()
                        price_numbers = re.findall(r'\d+', price_text)
                        if len(price_numbers) >= 2:
                            price =  float(f"{price_numbers[0]}.{price_numbers[1]}")
                        else:
                            price = float(price_numbers[0]) if price_numbers else None

                    # Extract title
                    title_element = item.find_element(By.TAG_NAME, "h2")
                    title = title_element.text.strip()
                  
                    # Extract img
                    img_element = item.find_element(By.XPATH, ".//img[@class='s-image']")
                    image_src = img_element.get_attribute("src")    

                    # Store in results list
                    results.append({"asin": asin, "price": price, "title" : title, "image": image_src})
                except Exception as e:
                    print(f"   ❌ Skipping item ({asin}) due to missing element!", e)
                    continue
            
                #print("Extracted items:")
                # for item in results:
                #     print("\n")
                #     print(60 *"-")
                #     print(f"ASIN: {item['asin']}, \nTitle: {item['title'][:30]}..., \nPrice: {item['price']}, \nImage: {item['image']}")
            return results
        except Exception as e:
            print("   ❌ Error finding list items!", e)
            return []

    def close_driver(self):
        if self.show_details: print("\nClosing WebDriver\n")
        self.driver.quit()

    def get_first_page_data(self, searchterm) -> list:
        try:
            self.open_page(searchterm)
            top_search_suggestions = self.get_top_search_suggestions()
            first_page_products = self.get_first_page_products()
            if self.show_details: print("\n✅ Done")
            return {"top_search_suggestions": top_search_suggestions, "first_page_products": first_page_products}   
        except Exception as e:
            print("❌❌❌ Error getting first page data!", e)
            return None
        
        finally:
            self.close_driver()
if __name__ == "__main__":
    scraper = AmazonFirstPageScraper(headless=True, show_details=True)
    results = scraper.get_first_page_data("turf grass")

    print(results['top_search_suggestions'])
    print("----------------")

    for product in results['first_page_products']:
        print(product['asin'])
        print(product['price'])
        print(product['title'])
        print(product['image'])
        print("\n")


