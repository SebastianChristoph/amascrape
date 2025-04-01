import random
import re
import time
import logging
from playwright.sync_api import Page, TimeoutError
import selenium_config as selenium_config


class OutOfStockException(Exception):
    pass

class NoSuchPageException(Exception):
    pass


class AmazonProductScraper:
    def __init__(self, page: Page, show_details=True):
        self.page = page
        self.show_details = show_details
        self.web_elements = selenium_config.web_elements_product_page
        self.asin = ""
        self.url = ""
        self.product_info_box_content = {}
        self.technical_details_box_content = {}
        self.bs_and_rank_data = {}

        # Entferne DEBUG-Logs von Playwright & Co.
        logging.getLogger("playwright").setLevel(logging.WARNING)
        logging.getLogger("httpcore").setLevel(logging.WARNING)
        logging.getLogger("httpx").setLevel(logging.WARNING)

        self.warning_callback = None

    def log(self, message):
        if self.show_details:
            logging.debug(message)

    def is_out_of_stock(self) -> bool:
        self.log("🛑 Prüfe Verfügbarkeit (Out of Stock)")
        try:
            self.page.locator('//*[@id="add-to-cart-button"]').first
        except:
            self.log("🚫 Kein 'Add to Cart'-Button gefunden.")
            return True

        try:
            page_text = self.page.content().lower()
            if "we couldn't find the" in page_text or "temporarily out of stock" in page_text or "no featured offers available" in page_text:
                return True
            return False
        except Exception as e:
            self.log(f"\t⚠️ Fehler beim Prüfen auf Lagerbestand: {e}")
            return False

    def does_product_has_page(self) -> bool:
        self.log("🔍 Prüfe, ob Produktseite existiert")
        try:
            return "couldn't find the page" not in self.page.content().lower()
        except Exception as e:
            self.log(f"\t⚠️ Fehler beim Prüfen auf Seitenexistenz: {e}")
            return True

    def scroll_down(self, duration=5):
        self.log("📜 Scrolle nach unten für dynamische Inhalte...")
        start = time.time()
        while time.time() - start < duration:
            self.page.evaluate(f"window.scrollBy(0, {random.randint(900, 1400)});")
            time.sleep(random.uniform(0.5, 1.5))

    def open_page(self):
        self.log(f"🌐 Öffne Produktseite: {self.asin} ({self.url})")
        self.page.goto(self.url)
        self.scroll_down()
        self.product_info_box_content = self.get_product_infos_box_content()
        self.technical_details_box_content = self.get_technical_details_box_content()

    def getting_bs_and_rank_data(self) -> dict:
        self.log("📈 Extrahiere Bestseller-Rangdaten...")
        try:
            # Versuche zuerst die spezifischen XPaths für die Rank-Information
            rank_xpaths = [
                '//*[@id="productDetails_detailBullets_sections1"]/tbody/tr[18]/td',
                '//*[@id="productDetails_detailBullets_sections1"]/tbody/tr[18]',
                '/html/body/div[1]/div/div[2]/div[23]/div[7]/div/div/div/div/div/div[1]/div/div/table/tbody/tr[18]'
            ]
            
            for xpath in rank_xpaths:
                try:
                    rank_element = self.page.locator(xpath).first(timeout=2000)
                    if rank_element:
                        rank_text = rank_element.text_content().strip()
                        if rank_text and ('Best Sellers Rank' in rank_text or ('#' in rank_text and 'in' in rank_text)):
                            self.log(f"\t✅ Rank-Text gefunden: {rank_text}")
                            
                            # Extrahiere die Rangdaten
                            rank_items = rank_text.split("#")[1:]
                            if not rank_items:
                                self.log("\t⚠️ Keine Rangdaten im Text gefunden")
                                return None

                            # Verarbeite den Hauptrang
                            main_rank_text, main_category = rank_items[0].split(" in ", 1)
                            main_rank = int(main_rank_text.replace(",", "").strip())
                            main_category = self.remove_parentheses(main_category).strip()

                            # Verarbeite den zweiten Rang, falls vorhanden
                            second_rank, second_category = (None, None)
                            if len(rank_items) > 1:
                                second_rank_text, second_category = rank_items[1].split(" in ", 1)
                                second_rank = int(second_rank_text.replace(",", "").strip())
                                second_category = second_category.strip()

                            result = {
                                "rank_main_category": main_rank,
                                "main_category": main_category,
                                "rank_second_category": second_rank,
                                "second_category": second_category
                            }
                            
                            self.log(f"\t✅ Rangdaten extrahiert: {result}")
                            return result
                except Exception as e:
                    self.log(f"\t⚠️ Fehler bei XPath {xpath}: {e}")
                    continue

            self.log("\t⚠️ Keine Rank-Informationen gefunden.")
            return None
        
        except Exception as e:
            self.log(f"\t❌ Fehler beim Extrahieren von Rangdaten: {e}")
            return None

    def get_rating(self) -> float | None:
        self.log("⭐️ Extrahiere Bewertung...")
        try:
            if "Customer Reviews" in self.product_info_box_content:
                match = re.search(r"(\d+\.\d+)\s+([\d,]+) ratings", self.product_info_box_content["Customer Reviews"])
                if match:
                    return float(match.group(1).replace(',', ''))

            rating_text = self.page.evaluate('''() => {
                const element = document.querySelector('#acrPopover');
                return element ? element.textContent.trim() : null;
            }''')
            
            if rating_text:
                return float(rating_text[:3])
                
        except Exception as e:
            self.log(f"⚠️ \tFehler bei Bewertung: {e}")
            if self.warning_callback:
                self.warning_callback(
                    self.asin,
                    self.url,
                    f"⚠️ \tFehler bei Bewertung: {e}",
                    self.get_location(),
                     warning_type="reviews"
                )
            return None

    def get_review_count(self) -> int:
        self.log("🗣️ Extrahiere Review-Anzahl...")
        try:
            if "Customer Reviews" in self.product_info_box_content:
                match = re.search(r"(\d+\.\d+)\s+([\d,]+) ratings", self.product_info_box_content["Customer Reviews"])
                if match:
                    return int(match.group(2).replace(',', ''))

            review_text = self.page.evaluate('''() => {
                const element = document.querySelector('#acrCustomerReviewLink');
                return element ? element.textContent.trim() : null;
            }''')
            
            if review_text:
                match = re.search(r"(\d[\d,]*)", review_text)
                if match:
                    return int(match.group(1).replace(",", ""))
                    
        except Exception as e:
            self.log(f"\t⚠️ Fehler bei Reviews: {e}")
            if self.warning_callback:
                self.warning_callback(
                    self.asin,
                    self.url,
                    f"\t⚠️ Fehler bei Reviews: {e}",
                    self.get_location(),
                     warning_type="review_count"
                )
            return None

    def get_blm(self) -> int:
        self.log("📊 Extrahiere BLM (bought last month)...")
        try:
            # Versuche zuerst den spezifischen XPath für BLM
            blm_xpath = '//*[@id="social-proofing-faceout-title-tk_bought"]/span[1]'
            try:
                blm_element = self.page.locator(blm_xpath).first(timeout=2000)
                if blm_element:
                    text = blm_element.text_content()
                    if text and 'bought in past month' in text.lower():
                        blm = text.replace('K', '000').replace('+', '').replace('bought in past month', '').strip()
                        if blm:
                            self.log(f"\t✅ BLM gefunden (XPath): {blm}")
                            return int(blm)
            except Exception as e:
                self.log(f"\t⚠️ Fehler bei BLM XPath: {e}")

            # Versuche verschiedene Selektoren für BLM
            blm_selectors = [
                '#socialProofingAsinFaceout_feature_div',
                'div.socialProofingAsinFaceout',
                'div[data-csa-c-content-id="social-proofing-asin-faceout"]'
            ]
            
            for selector in blm_selectors:
                try:
                    text = self.page.evaluate(f'''() => {{
                        const element = document.querySelector('{selector}');
                        if (!element) return null;
                        const text = element.textContent;
                        if (text.includes('bought in past month')) {{
                            // Extrahiere nur die Zahl, ignoriere JSON und andere Daten
                            const match = text.match(/(\\d+)\\s*bought in past month/);
                            if (match) {{
                                return match[1];
                            }}
                            return text
                                .replace(/bought/g, '')
                                .replace(/K/g, '000')
                                .replace(/\\+/g, '')
                                .replace(/in past month/g, '')
                                .replace(/\\{{.*?\\}}/g, '') // Entferne JSON-Objekte
                                .trim();
                        }}
                        return null;
                    }}''')
                    
                    if text:
                        # Bereinige den Text von JSON und anderen unerwünschten Daten
                        text = re.sub(r'\{.*?\}', '', text)
                        text = re.sub(r'[^\d]', '', text)
                        if text:
                            self.log(f"\t✅ BLM gefunden (Selektor): {text}")
                            return int(text)
                except Exception as e:
                    self.log(f"\t⚠️ Fehler bei BLM-Selektor {selector}: {e}")
                    continue

            self.log("\t⚠️ Kein BLM gefunden")
            return None

        except Exception as e:
            self.log(f"\t⚠️ Fehler bei BLM: {e}")
            if self.warning_callback:
                self.warning_callback(
                    self.asin,
                    self.url,
                    f"Fehler bei BLM: {e}",
                    self.get_location(),
                     warning_type="blm"
                )
            return None

    def get_store(self) -> str:
        self.log("🏪 Extrahiere Store-Information...")
        try:
            # Versuche zuerst den bylineInfo Selektor
            store = self.page.evaluate('''() => {
                const bylineElement = document.querySelector('#bylineInfo');
                if (!bylineElement) return null;
                
                // Entferne "Visit the" und "Store" aus dem Text
                const text = bylineElement.textContent.trim();
                return text.replace(/Visit the\s*/, '').replace(/\s*Store$/, '').trim();
            }''')
            
            if store:
                self.log(f"\t✅ Store gefunden: {store}")
                return store
                
            # Fallback auf die alte Methode
            store_element = self.page.locator(self.web_elements["store"]).first(timeout=2000)
            if store_element:
                store = store_element.text_content().replace("Visit the ", "").replace("Store", "").strip()
                self.log(f"\t✅ Store gefunden (Fallback): {store}")
                return store
                
            self.log("\t⚠️ Kein Store gefunden")
            return None
            
        except Exception as e:
            self.log(f"\t⚠️ Fehler bei Store-Extraktion: {e}")
            return None

    def get_variants(self) -> list:
        self.log("🎨 Extrahiere Varianten...")
        variants = []
        try:
            div = self.page.locator(self.web_elements["variants_div"]).first(timeout=2000)
            lis = div.locator(self.web_elements["variants_lis"]).all()
            variants = [li.get_attribute("data-csa-c-item-id") for li in lis if li.get_attribute("data-csa-c-item-id")]
            variants.pop(0)
        except:
            self.log("🟡 Keine Varianten gefunden.")
        return variants

    def get_title(self):
        self.log("📝 Extrahiere Titel...")
        try:
            # Versuche zuerst den spezifischen XPath für den Titel
            title_text = self.page.evaluate('''() => {
                const element = document.querySelector('#productTitle');
                return element ? element.textContent.trim() : null;
            }''')
            
            if title_text:
                self.log(f"\t✅ Titel gefunden: {title_text}")
                return title_text

            # Fallback auf andere Selektoren
            title_selectors = [
                '#title',
                'h1.a-size-large',
                'span.a-size-large'
            ]
            
            for selector in title_selectors:
                try:
                    title_text = self.page.evaluate(f'''() => {{
                        const element = document.querySelector('{selector}');
                        return element ? element.textContent.trim() : null;
                    }}''')
                    
                    if title_text:
                        self.log(f"\t✅ Titel gefunden (Fallback): {title_text}")
                        return title_text
                except Exception as e:
                    self.log(f"\t⚠️ Fehler bei Selektor {selector}: {e}")
                    continue
                    
            self.log("\t❌ Kein Titel gefunden")
            return None
                    
        except Exception as e:
            self.log(f"\t❌ Fehler beim Titel: {e}")
            if self.warning_callback:
                self.warning_callback(
                    self.asin,
                    self.url,
                    f"\t❌ Fehler beim Titel: {e}",
                    self.get_location(), 
                    warning_type="title"
                )
            return None

    def get_image_path(self):
        self.log("🖼️ Extrahiere Bildpfad...")
        try:
            # Versuche verschiedene Selektoren für das Produktbild
            image_selectors = [
                '#landingImage',
                '#imgBlkFront',
                '#main-image',
                '#main-image-container img',
                '#imgTagWrapperId img',
                'div[data-old-hires] img',
                'div[data-a-image-name="landingImage"] img'
            ]
            
            for selector in image_selectors:
                try:
                    src = self.page.evaluate(f'''() => {{
                        const img = document.querySelector('{selector}');
                        return img ? img.src : null;
                    }}''')
                    if src:
                        self.log(f"\t✅ Bild gefunden: {src}")
                        return src
                except Exception as e:
                    self.log(f"\t⚠️ Fehler bei Selektor {selector}: {e}")
                    continue
                    
            # Fallback auf XPath
            image_xpaths = [
                '//*[@id="main-image-container"]/ul/li[6]/span/span/div/img',
                '//*[@id="imgTagWrapperId"]//img',
                '//*[@id="landingImage"]',
                '//*[@id="main-image"]',
                '//div[contains(@class, "imgTagWrapper")]//img'
            ]
            
            for xpath in image_xpaths:
                try:
                    src = self.page.evaluate(f'''() => {{
                        const img = document.evaluate('{xpath}', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                        return img ? img.src : null;
                    }}''')
                    if src:
                        self.log(f"\t✅ Bild gefunden (XPath): {src}")
                        return src
                except Exception as e:
                    self.log(f"\t⚠️ Fehler bei XPath {xpath}: {e}")
                    continue
                    
        except Exception as e:
            self.log(f"\t❌ Fehler beim Bildpfad: {e}")
            if self.warning_callback:
                self.warning_callback(
                    self.asin,
                    self.url,
                    f"\t❌ Fehler beim Bildpfad: {e}",
                    self.get_location(),
                     warning_type="img"
                )
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
            self.log(f"\t⚠️ Fehler beim Preis-Parsen: {e}")
            if self.warning_callback:
                self.warning_callback(
                    self.asin,
                    self.url,
                    f"\t⚠️ Fehler beim Preis-Parsen: {e}",
                    self.get_location(),
                    warning_type="price_parsing"
                )
            return None

    def get_price(self):
        self.log("💰 Extrahiere Preis...")
        xpaths = [
            '//*[@id="corePriceDisplay_desktop_feature_div"]/div[1]/span[2]/span[2]/span[2]',
            '//*[@id="corePrice_feature_div"]/div/div/span[1]/span[1]',
            '//*[@id="apex_offerDisplay_desktop"]',
            '//*[@id="corePriceDisplay_desktop_feature_div"]/div[1]/span[1]',
            '//*[@id="corePrice_feature_div"]/div/div/span[1]/span[2]',
            '//*[@id="corePrice_desktop"]/div/table/tbody/tr/td[2]/span[1]'
        ]
        
        # Versuche die XPath-Selektoren
        for xpath in xpaths:
            try:
                element = self.page.locator(xpath)
                if element.count() > 0:
                    text_content = element.first.text_content()
                    price = self.extract_price_from_string(text_content)
                    if price:
                        self.log(f"\t✅ Preis gefunden: {price}")
                        return price
            except TimeoutError:
                continue
            except Exception as e:
                self.log(f"\t⚠️ Fehler bei Preis-Extraktion: {e}")
                continue

        # Wenn kein Preis gefunden wurde, prüfe auf Verfügbarkeit
        try:
            unavailable_locator = self.page.locator('//*[contains(text(), "Currently unavailable")]')
            if unavailable_locator.count() > 0:
                self.log("\t⚠️ Produkt ist derzeit nicht verfügbar")
                return None
        except:
            pass

        try:
            out_of_stock_locator = self.page.locator('//*[contains(text(), "Out of Stock")]')
            if out_of_stock_locator.count() > 0:
                self.log("\t⚠️ Produkt ist ausverkauft")
                return None
        except:
            pass

        self.log("\t❌ Kein Preis gefunden.")
        return None

    def get_product_infos_box_content(self):
        self.log("📦 Extrahiere Produktinformationen...")
        info = {}
        try:
            # Methode 1: Product Details Box (original)
            info_box = self.page.evaluate('''() => {
                const box = document.querySelector('#productDetails_detailBullets_sections1');
                if (!box) return null;
                
                const result = {};
                const rows = box.querySelectorAll('tr');
                
                rows.forEach(row => {
                    const key = row.querySelector('th')?.textContent.trim();
                    const value = row.querySelector('td')?.textContent.trim();
                    if (key && value) {
                        result[key] = value;
                        console.log(`Found: ${key} = ${value}`); // Debug-Log
                    }
                });
                
                return result;
            }''')
            
            if info_box:
                self.log("\t✅ Product Details Box gefunden (Methode 1)")
                self.log("\t📋 Alle gefundenen Tabellenzeilen:")
                for key, value in info_box.items():
                    info[key] = value
                    self.log(f"\t\t{key}: {value}")

            # Methode 2: Product Overview Box
            overview_box = self.page.evaluate('''() => {
                const box = document.querySelector('#productOverview_feature_div');
                if (!box) return null;
                
                const result = {};
                const rows = box.querySelectorAll('tr');
                
                rows.forEach(row => {
                    const key = row.querySelector('th')?.textContent.trim();
                    const value = row.querySelector('td')?.textContent.trim();
                    if (key && value) {
                        result[key] = value;
                        console.log(`Found: ${key} = ${value}`); // Debug-Log
                    }
                });
                
                return result;
            }''')
            
            if overview_box:
                self.log("\t✅ Product Overview Box gefunden (Methode 2)")
                self.log("\t📋 Alle gefundenen Overview-Zeilen:")
                for key, value in overview_box.items():
                    info[key] = value
                    self.log(f"\t\t{key}: {value}")

            # Methode 3: Detail Bullets Feature Div (neue Struktur)
            detail_bullets = self.page.evaluate('''() => {
                const box = document.querySelector('#detailBullets_feature_div');
                if (!box) return null;
                
                const result = {};
                
                // Extrahiere alle li Elemente
                const items = box.querySelectorAll('li');
                items.forEach(item => {
                    const text = item.textContent.trim();
                    
                    // Spezielle Behandlung für Best Sellers Rank
                    if (text.includes('Best Sellers Rank')) {
                        // Extrahiere Hauptrang
                        const mainRankText = text.match(/#[0-9]+ in [^(]+/);
                        if (mainRankText) {
                            const [rank, category] = mainRankText[0].substring(1).split(' in ');
                            result['rank_main_category'] = parseInt(rank.replace(/,/g, ''));
                            result['main_category'] = category.trim();
                        }
                        
                        // Extrahiere Unterränge
                        const subRanksList = item.querySelector('ul');
                        if (subRanksList) {
                            const subRanks = Array.from(subRanksList.querySelectorAll('li')).map(li => li.textContent.trim());
                            if (subRanks.length > 0) {
                                const firstSubRank = subRanks[0].match(/#[0-9]+ in .+/);
                                if (firstSubRank) {
                                    const [rank, category] = firstSubRank[0].substring(1).split(' in ');
                                    result['rank_second_category'] = parseInt(rank.replace(/,/g, ''));
                                    result['second_category'] = category.trim();
                                }
                            }
                        }
                        return;
                    }
                    
                    // Normale Bullet Points
                    const boldSpan = item.querySelector('.a-text-bold');
                    const valueSpan = item.querySelector('.a-text-bold + span');
                    
                    if (boldSpan && valueSpan) {
                        let key = boldSpan.textContent
                            .replace(/[\\u200E\\u200F\\u061C\\u202A-\\u202E]/g, '')
                            .replace(/[:\\u200E\\u200F]/g, '')
                            .trim();
                        let value = valueSpan.textContent
                            .replace(/[\\u200E\\u200F\\u061C\\u202A-\\u202E]/g, '')
                            .replace(/‎/g, '')
                            .trim();
                            
                        if (key && value) {
                            result[key] = value;
                        }
                    }
                });
                
                return result;
            }''')
            
            if detail_bullets:
                self.log("\t✅ Detail Bullets Box gefunden (Methode 3)")
                self.log("\t📋 Alle gefundenen Bullet-Points:")
                for key, value in detail_bullets.items():
                    info[key] = value
                    self.log(f"\t\t{key}: {value}")
                    
                # Wenn manufacturer gefunden wurde, speichere ihn direkt
                if 'Manufacturer' in detail_bullets:
                    info['manufacturer'] = detail_bullets['Manufacturer']
                    self.log(f"\t✅ Manufacturer aus Detail Bullets: {info['manufacturer']}")
                    
                # Übernehme die bereits extrahierten Rank-Informationen
                for key in ['rank_main_category', 'main_category', 'rank_second_category', 'second_category']:
                    if key in detail_bullets:
                        info[key] = detail_bullets[key]
                        
                if 'rank_main_category' in info:
                    self.log(f"\t✅ Rangdaten extrahiert: Hauptrang #{info['rank_main_category']} in {info['main_category']}")
                    if 'rank_second_category' in info:
                        self.log(f"\t✅ Unterrang #{info['rank_second_category']} in {info['second_category']}")

            # Methode 4: XPath für Detail Bullets
            try:
                detail_bullets_xpath = self.page.evaluate('''() => {
                    const xpath = '/html/body/div[1]/div/div[2]/div[31]/div/div[1]/ul';
                    const element = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                    if (!element) return null;
                    
                    const result = {};
                    const items = element.querySelectorAll('li');
                    
                    items.forEach(item => {
                        const text = item.textContent.trim();
                        if (text.includes(':')) {
                            const [key, ...valueParts] = text.split(':');
                            const value = valueParts.join(':').trim();
                            if (key && value) {
                                result[key] = value;
                                console.log(`Found: ${key} = ${value}`); // Debug-Log
                            }
                        }
                    });
                    
                    return result;
                }''')
                
                if detail_bullets_xpath:
                    self.log("\t✅ Detail Bullets Box gefunden (Methode 4 - XPath)")
                    self.log("\t📋 Alle gefundenen Bullet-Points:")
                    for key, value in detail_bullets_xpath.items():
                        info[key] = value
                        self.log(f"\t\t{key}: {value}")
            except Exception as e:
                self.log(f"\t⚠️ Fehler bei XPath-Extraktion: {e}")

            # Extrahiere Rank-Informationen aus allen gefundenen Daten
            if "Best Sellers Rank" in info:
                rank_text = info["Best Sellers Rank"]
                self.log(f"\t✅ Rank-Text gefunden: {rank_text}")
                
                # Extrahiere die Rangdaten
                rank_items = rank_text.split("#")[1:]
                if rank_items:
                    # Verarbeite den Hauptrang
                    main_rank_text, main_category = rank_items[0].split(" in ", 1)
                    main_rank = int(main_rank_text.replace(",", "").strip())
                    main_category = self.remove_parentheses(main_category).strip()

                    # Verarbeite den zweiten Rang, falls vorhanden
                    second_rank, second_category = (None, None)
                    if len(rank_items) > 1:
                        second_rank_text, second_category = rank_items[1].split(" in ", 1)
                        second_rank = int(second_rank_text.replace(",", "").strip())
                        second_category = second_category.strip()

                    info["rank_main_category"] = main_rank
                    info["rank_second_category"] = second_rank
                    info["main_category"] = main_category
                    info["second_category"] = second_category
                    
                    self.log(f"\t✅ Rangdaten extrahiert: {info}")
                    
        except Exception as e:
            self.log(f"\t⚠️ Fehler bei Produktinformationen: {e}")
            pass
        return info

    def get_technical_details_box_content(self):
        self.log("🧾 Extrahiere technische Details...")
        info = {}
        try:
            # Versuche zuerst die technische Details Box
            tech_box = self.page.evaluate('''() => {
                const box = document.querySelector('#productDetails_techSpec_section_1');
                if (!box) return null;
                const rows = box.querySelectorAll('tr');
                const result = {};
                rows.forEach(row => {
                    const key = row.querySelector('th')?.textContent.trim();
                    const value = row.querySelector('td')?.textContent.trim();
                    if (key && value) result[key] = value;
                });
                return result;
            }''')
            
            if tech_box:
                self.log("\t✅ Technische Details Box gefunden")
                for key, value in tech_box.items():
                    info[key] = value
                    self.log(f"\t✅ {key}: {value}")

            # Fallback auf die alte Methode
            tech_sections = self.page.evaluate('''() => {
                const result = {};
                // Suche nach allen Elementen, die "Technical Details" enthalten
                const elements = Array.from(document.querySelectorAll('div, section, h2')).filter(el => 
                    el.textContent.includes('Technical Details')
                );
                
                elements.forEach(element => {
                    const table = element.closest('div.a-section')?.querySelector('table');
                    if (!table) return;
                    
                    const rows = table.querySelectorAll('tr');
                    rows.forEach(row => {
                        const key = row.querySelector('th')?.textContent.trim();
                        const value = row.querySelector('td')?.textContent.trim();
                        if (key && value) result[key] = value;
                    });
                });
                return result;
            }''')
            
            if tech_sections:
                for key, value in tech_sections.items():
                    info[key] = value
                    self.log(f"\t✅ {key}: {value}")

        except Exception as e:
            self.log(f"\t⚠️ Fehler bei technischen Details: {e}")
            return {}
        return info

    def remove_parentheses(self, text: str) -> str:
        return re.sub(r"\s*\([^)]*\)", "", text).strip()

    def get_location(self) -> str:
        self.log("📍 Extrahiere Standort...")
        try:
            location = self.page.locator('//*[@id="nav-global-location-popover-link"]').first(timeout=2000).text_content()
            return location.replace("Update location", "").replace("Delivering to", "").replace("\n", "").strip()
        except:
            self.log("\t⚠️ Kein Standort gefunden.")
            return None

    def get_breadcrumb_categories(self) -> tuple:
        self.log("🧭 Extrahiere Breadcrumb-Kategorien...")
        try:
            # Versuche verschiedene XPath für Breadcrumbs
            breadcrumb_xpaths = [
                '//div[@id="wayfinding-breadcrumbs_container"]//a',
                '//div[@id="wayfinding-breadcrumbs-container"]//a',
                '//div[contains(@class, "a-breadcrumb")]//a',
                '//ul[@class="a-unordered-list a-horizontal a-size-small"]//a',
                '//div[@class="a-section a-spacing-none a-padding-none"]//a[@class="a-link-normal a-color-tertiary"]'
            ]
            
            for xpath in breadcrumb_xpaths:
                try:
                    elements = self.page.locator(xpath).all()
                    if elements:
                        categories = []
                        for el in elements:
                            text = el.text_content().strip()
                            if text and not text.startswith('Back to'):
                                categories.append(text)
                        if categories:
                            return categories[0], categories[-1]
                except:
                    continue
                    
        except Exception as e:
            self.log(f"\t⚠️ Fehler bei Breadcrumb-Kategorien: {e}")
            return None, None

    def get_product_infos(self, asin):
        self.asin = asin
        self.url = f"https://www.amazon.com/dp/{asin}?language=en_US"

        self.open_page()

        if self.is_out_of_stock():
            raise OutOfStockException(f"{asin} is out of stock.")

        if not self.does_product_has_page():
            raise NoSuchPageException(f"{asin} has no product page.")

        # Prüfe zuerst auf Preis mit Timeout
        try:
            price = self.get_price()
            if price is None:
                self.log("\t⚠️ Kein Preis verfügbar - Produkt überspringen")
                return None
        except Exception as e:
            self.log(f"\t⚠️ Fehler bei der Preis-Extraktion: {e}")
            return None

        blm = self.get_blm()
        total = round(blm * price, 2) if blm and price else None

        # Verwende die Rank-Daten aus product_info_box_content
        main_category = self.product_info_box_content.get("main_category")
        second_category = self.product_info_box_content.get("second_category")
        rank_main_category = self.product_info_box_content.get("rank_main_category")
        rank_second_category = self.product_info_box_content.get("rank_second_category")

        # Fallback auf Breadcrumb-Kategorien wenn nötig
        if not main_category or not second_category:
            bc_main, bc_second = self.get_breadcrumb_categories()
            main_category = main_category or bc_main
            second_category = second_category or bc_second

        title = self.get_title()
        self.log(f"📝 Extrahiere Titel Result: {title}")
        reviews = self.get_review_count()
        rating = self.get_rating()
        variants = self.get_variants()
        
        # Sicherer Zugriff auf die Dictionaries
        manufacturer = None
        if self.product_info_box_content:
            manufacturer = self.product_info_box_content.get("Manufacturer")
        if not manufacturer and self.technical_details_box_content:
            manufacturer = self.technical_details_box_content.get("Manufacturer")
            
        store = self.get_store()
        if not store and self.technical_details_box_content:
            store = self.technical_details_box_content.get("Brand")
            
        image_path = self.get_image_path()
        location = self.get_location()

        if not title or price is None:
            self.log("\t⚠️ Produkt hat keinen Titel oder Preis – abbrechen.")
            
            if self.warning_callback:
                self.warning_callback(
                    self.asin,
                    self.url,
                    "\t⚠️ Produkt hat keinen Titel oder Preis – abbrechen.",
                    self.get_location(),
                    warning_type="essential_data"
                )

            return None
        
        data = {
            "browser_location": location,
            "asin": self.asin,
            "title": title,
            "price": price,
            "manufacturer": manufacturer,
            "rank_main_category": rank_main_category,
            "rank_second_category": rank_second_category,
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
        return data 