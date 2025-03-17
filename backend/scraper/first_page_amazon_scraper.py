import random
import re
import time

import scraper.selenium_config as selenium_config
from selenium import webdriver
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


class AmazonFirstPageScraper:
    def __init__(self, headless=True, show_details=True):
        self.user_agent = selenium_config.user_agent
        self.cookies = selenium_config.cookies
        self.options = Options()
        
        # Set Firefox preferences
        for key, value in selenium_config.firefox_preferences.items():
            self.options.set_preference(key, value)
        
        # Add Firefox arguments
        for arg in selenium_config.firefox_arguments:
            self.options.add_argument(arg)
        
        self.web_elements = selenium_config.web_elements_product_page
        self.show_details = show_details
        self.start_time = 0
        self.end_time = 0
        self.searchterm = ""
        self.top_search_suggestions = []
        self.first_page_products = []
        self.driver = None

        # Set log level
        self.options.log.level = "error"

        if headless:
            self.options.add_argument("--headless")

        self.options.add_argument("--disable-gpu")
        self.options.add_argument("--no-sandbox")
        self.options.add_argument("--disable-dev-shm-usage")

    def retry_request(self, url, retries=3, wait=10) -> None:
        for attempt in range(retries):
            try:
                self.driver.get(url)
                return
            except Exception as e:
                if attempt == retries - 1:
                    print(f"Critical error: Failed to load {url} after {retries} attempts: {e}")
                time.sleep(wait)
        raise Exception(f"Failed to load {url} after {retries} attempts")

    def scroll_down(self, duration=5) -> None:
        start = time.time()
        while time.time() - start < duration:
            self.driver.execute_script(
                f"window.scrollBy(0, {random.randint(900, 1400)});")
            time.sleep(random.uniform(0.5, 1.5))

    def open_page(self, searchterm) -> None:
        self.searchterm = searchterm
        self.retry_request(
            "https://www.amazon.com/gp/bestsellers/?ref_=nav_em_cs_bestsellers_0_1_1_2")

        for cookie in selenium_config.cookies:
            self.driver.add_cookie(cookie)

    def get_top_search_suggestions(self):
        try:
            wait = WebDriverWait(self.driver, 15)

            search_box = self.driver.find_element(
                By.XPATH, '//input[@role="searchbox"]')
            search_box.clear()
            search_box.send_keys(self.searchterm)
            time.sleep(2)

            autocomplete = wait.until(EC.visibility_of_element_located(
                (By.XPATH, '//*[@id="sac-autocomplete-results-container"]')))
            autocomplete_text = autocomplete.text
            autocomplete_list = autocomplete_text.split("\n")
            autocomplete_list = [
                item for item in autocomplete_list if self.searchterm in item]
            search_box.send_keys(Keys.RETURN)
            self.scroll_down()
            return autocomplete_list

        except Exception as e:
            print(f"Critical error: Failed to get search suggestions: {e}")
            return []

    def get_first_page_products(self) -> list:
        try:
            self.scroll_down()
            wait = WebDriverWait(self.driver, 10)
            
            wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "[data-asin]")))
            list_items = self.driver.find_elements(By.CSS_SELECTOR, "[data-asin]")

            results = []
            for item in list_items:
                try:
                    asin = item.get_attribute("data-asin")
                    if not asin:
                        continue

                    price = None
                    try:
                        price_link = item.find_element(By.CSS_SELECTOR, "a[aria-describedby='price-link']")
                        price_text = price_link.text.replace("$", "").strip()
                        if price_text and price_text != ".":
                            price_numbers = re.findall(r'\d+', price_text)
                            if len(price_numbers) >= 2:
                                price = float(f"{price_numbers[0]}.{price_numbers[1]}")
                            elif len(price_numbers) == 1:
                                price = float(price_numbers[0])
                    except (NoSuchElementException, ValueError):
                        pass

                    if price is None:
                        try:
                            price_span = item.find_element(By.CSS_SELECTOR, "span.a-price span.a-offscreen")
                            price_text = price_span.text.replace("$", "").strip()
                            if price_text and price_text != ".":
                                price_numbers = re.findall(r'\d+', price_text)
                                if len(price_numbers) >= 2:
                                    price = float(f"{price_numbers[0]}.{price_numbers[1]}")
                                elif len(price_numbers) == 1:
                                    price = float(price_numbers[0])
                        except (NoSuchElementException, ValueError):
                            pass

                    if price is None:
                        try:
                            whole_price = item.find_element(By.CSS_SELECTOR, "span.a-price-whole")
                            fraction_price = item.find_element(By.CSS_SELECTOR, "span.a-price-fraction")
                            whole_text = whole_price.text.strip()
                            fraction_text = fraction_price.text.strip()
                            if whole_text and fraction_text:
                                price = float(f"{whole_text}.{fraction_text}")
                        except (NoSuchElementException, ValueError):
                            pass

                    if price is None:
                        try:
                            price_elements = item.find_elements(By.CSS_SELECTOR, "span.a-price")
                            for price_elem in price_elements:
                                price_text = price_elem.text.replace("$", "").strip()
                                if price_text and price_text != ".":
                                    price_numbers = re.findall(r'\d+', price_text)
                                    if len(price_numbers) >= 2:
                                        price = float(f"{price_numbers[0]}.{price_numbers[1]}")
                                        break
                                    elif len(price_numbers) == 1:
                                        price = float(price_numbers[0])
                                        break
                        except (NoSuchElementException, ValueError):
                            pass

                    title = None
                    try:
                        title_element = item.find_element(By.TAG_NAME, "h2")
                        title = title_element.text.strip()
                    except NoSuchElementException:
                        pass

                    if not title:
                        try:
                            title_link = item.find_element(By.CSS_SELECTOR, "a.a-link-normal h2")
                            title = title_link.text.strip()
                        except NoSuchElementException:
                            pass

                    if not title:
                        try:
                            title_span = item.find_element(By.CSS_SELECTOR, "span.a-text-normal")
                            title = title_span.text.strip()
                        except NoSuchElementException:
                            pass

                    try:
                        img_element = item.find_element(By.CSS_SELECTOR, "img.s-image")
                        image_src = img_element.get_attribute("src")
                    except NoSuchElementException:
                        image_src = None

                    if title or price:
                        results.append({
                            "asin": asin,
                            "price": price,
                            "title": title,
                            "image": image_src
                        })

                except Exception as e:
                    print(f"Error processing item {asin}: {e}")
                    continue

            return results

        except Exception as e:
            print(f"Critical error: Failed to get first page products: {e}")
            return []

    def close_driver(self):
        try:
            if self.driver:
                self.driver.quit()
        except Exception as e:
            print(f"Error closing driver: {e}")

    def get_first_page_data(self, searchterm) -> list:
        try:
            if not self.driver:
                self.driver = webdriver.Firefox(options=self.options)
            self.open_page(searchterm)
            top_search_suggestions = self.get_top_search_suggestions()
            first_page_products = self.get_first_page_products()
            self.top_search_suggestions = top_search_suggestions
            self.first_page_products = first_page_products
            return {"top_search_suggestions": self.top_search_suggestions, "first_page_products": self.first_page_products}
        except Exception as e:
            print(f"❌❌❌ [get_first_page_data] Error getting first page data! Message: {str(e)}\n")
            return None
        finally:
            print("\nClosing WebDriver\n")
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
