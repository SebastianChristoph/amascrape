# User-Agent setzen
user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

# US-Cookies setzen
cookies = [
    {"name": "i18n-prefs", "value": "USD"},   # Währung auf USD setzen
    {"name": "lc-main", "value": "en_US"},    # Sprache auf Englisch setzen
    {"name": "sp-cdn", "value": "L5Z9:ES"},   # Verhindert Umleitung auf Amazon.es
]


web_elements_product_page = {
    "title" : '//*[@id="productTitle"]',
    "product_infos_ul" : '//*[@id="detailBulletsWrapper_feature_div"]',
    "product_infos_table" : '//*[@id="productDetails_detailBullets_sections1"]',
    "bestsellers" : "/html/body/div[1]/div/div/div[31]/div/ul[1]/li/span",
    "ratings" : '//*[@id="detailBullets_averageCustomerReviews"]',
    "store" : '//*[@id="bylineInfo"]',
    "variants_div" : '//*[@id="tp-inline-twister-dim-values-container"]',
    "variants_lis" : './/li',
    "bought_last_month" : '//*[@id="socialProofingAsinFaceout_feature_div"]/div/div'
}

price_categories = {
    "default" : '//*[@id="apex_offerDisplay_desktop"]',
    "Electronics" : '//*[@id="corePrice_feature_div"]/div/div/span[1]/span[2]',
    "Clothing, Shoes & Jewelry" : '//*[@id="corePrice_desktop"]/div/table/tbody/tr/td[2]/span[1]',
    "Grocery & Gourmet Food" : '//*[@id="sns-base-price"]/div[1]/span[2]',
    "Pet Supplies" : '//*[@id="sns-base-price"]/div[1]/span[3]',
    'Baby' : '//*[@id="sns-base-price"]/div[1]/span[3]'
}

random_asins = [
    "B0CT2R7199", "B009EO0FSU", "B08B5RZKH5", "B08WM3LMJF", "B01N05APQY", "B01M5F2YPO", "B00JT3TP1O", "B0C8TF4VK8"
]

no_blms = ["B07K2TLL6F", "B00MWTIPPE"]

no_product_info = ["B0C1Y5VL8D"]

health_and_household_asins = ["B07MHJFRBJ", "B07SCL613T", "B084HQ4DYQ", "B0D5FZGY8W", "B095YJW56C", "B083JHCCV2", "B01BZ0LXL8", "B075SN1MY9", "B000QSNYGI", "B08KG7S2FT", "B078WGKW65", "B079H53D2B", "B0756MBLNX", "B097CZCDQG", "B004G9C0SQ", "B085V5PPP8", "B0BWGZ7J7W", "B09PQ61NXF", "B082VL6SH9", "B07WCBD6YC", "B0107QP1VE"]

# B0CRDCXRK2 is product with 4digits in price, 1,099.22
electronics_asins = ["B08WM3LMJF", "B0DCLCPN9T","B0CRDCXRK2","B0C5QRZ47P", "B09X7FXHVJ", "B0D9KKSYX4", "B016P9HJIA", "B08R6VTVJG", "B08PH5Q51P",  "B0CFLPB5D9", "B0DDK1WM9K", "B0DBJ7W4DM", "B0CRDCXRK2"]