from flask import Flask, render_template, request
import scraper_app

app = Flask(__name__)

@app.route("/", methods=["GET"] )
def home():
    return render_template("index.html")

@app.route("/details", methods=["POST"] )
def details():
    check_only_five = False
    searchterm = request.form.get("searchterm")
    only_five = request.form.get("only_five")
    if only_five == "on":
        check_only_five = True

    results = scraper_app.get_results(searchterm, check_only_five)

    total = 0
    for product in results:
        total += float(product["price"]) * float(product["blm"])

    return render_template("details.html", searchterm = searchterm, results=results, total=round(total,2), only_five=only_five)

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)
