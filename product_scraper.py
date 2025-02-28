import re

def get_product_title(soup):
    h2 = soup.find("h2", class_="a-size-base-plus a-spacing-none a-color-base a-text-normal")
    if h2:
        if h2 is None: print("h2:", h2)
        return h2.text
    
    h2_2 = soup.find("h2", class_ = "a-size-small a-spacing-none a-color-base s-line-clamp-3 a-text-normal")

    if h2_2:
        if h2_2 == None: 
            print("h2_2: ", h2_2)
        else:
            return h2_2.text
    
    print("no h2 found")


def get_price(soup):

    price_span = soup.find("span", class_ = "a-offscreen")
    if price_span:
        # Preis-Text bereinigen: Nur Zahlen und Punkte behalten
        price_text = price_span.get_text(strip=True)
        price_match = re.search(r"\d+\.\d{2}", price_text)  # Sucht nach einem Muster wie 20.24 oder 25.00

        return price_match.group() if price_match else None

      

    # Alle <span>-Tags mit der Klasse "a-color-base" finden
    # all_spans = soup.find_all("span", class_="a-color-base")

    # # Nur das <span> auswählen, das ausschließlich diese Klasse hat und ein "$" im Text enthält
    # price_span = next(
    #     (span for span in all_spans 
    #      if 'class' in span.attrs and len(span['class']) == 1 and "$" in span.get_text()), 
    #     None
    # )

    # if price_span:
    #     # Preis-Text bereinigen: Nur Zahlen und Punkte behalten
    #     price_text = price_span.get_text(strip=True)
    #     price_match = re.search(r"\d+\.\d{2}", price_text)  # Sucht nach einem Muster wie 20.24 oder 25.00

    #     return price_match.group() if price_match else None
    # else:
    #     all_spans = soup.find_all("span", class_="a-color-base")


def get_bought_last_month(soup):
    target_span = soup.find("span", string=lambda text: text and "in past month" in text)
    if target_span:
        blm = target_span.get_text(strip=True)[:-22] 
        blm = blm.replace("k", "000")
        blm = blm.replace("K", "000")
        return blm
    else:
        print("no target span")
