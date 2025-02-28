from flask import Flask, render_template, request
import scraper_app

app = Flask(__name__)

@app.route("/", methods=["GET"] )
def home():
    return render_template("index.html")

@app.route("/details", methods=["POST"] )
def details():
    searchterm = request.form.get("searchterm")

    results = scraper_app.get_results(searchterm)

    total = 0
    for product in results:
        total += float(product["price"]) * float(product["blm"])

    return render_template("details.html", searchterm = searchterm, results=results, total=round(total,2))



if __name__ == "__main__":
    app.run(debug=True)