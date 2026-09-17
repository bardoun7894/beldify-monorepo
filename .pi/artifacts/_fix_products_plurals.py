"""Fix products.results plural forms across all 7 locales.

Per test src/__tests__/p1-marketplace-fixes.test.ts (P1-4):
  - Every locale must have products.results_one AND products.results_other
  - i18next will pick the right variant based on { count } option

Also clean up orphaned plural keys in ar+ma:
  - products.results_{few,many,two,zero} (legacy, not in en, not in test)
"""
import json
from collections import OrderedDict
import os

LOCALES = "/Users/mohamedbardouni/projects/beldify/beldify-frontend/src/i18n/locales"

# Translations: (one, other)
TRANSLATIONS = {
    "en": ("{{count}} product", "{{count}} products"),
    "ar": ("منتوج {{count}}", "{{count}} منتوج"),
    "de": ("{{count}} Produkt", "{{count}} Produkte"),
    "es": ("{{count}} producto", "{{count}} productos"),
    "fr": ("{{count}} produit", "{{count}} produits"),
    "ma": ("منتوج {{count}}", "{{count}} منتوج"),
    "nl": ("{{count}} product", "{{count}} producten"),
}

# Orphan keys to remove (legacy, only existed in ar+ma)
ORPHANS = {"results_few", "results_many", "results_two", "results_zero"}

for lang, (one, other) in TRANSLATIONS.items():
    path = os.path.join(LOCALES, f"{lang}.json")
    try:
        with open(path, encoding="utf-8") as f:
            data = json.load(f, object_pairs_hook=OrderedDict)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"FAIL: cannot load {lang}.json: {e}")
        raise SystemExit(1)

    products = data.get("products")
    if not isinstance(products, OrderedDict):
        products = OrderedDict()
        data["products"] = products

    # Remove orphan legacy plural keys if present
    removed = []
    for k in list(products.keys()):
        if k in ORPHANS:
            del products[k]
            removed.append(k)

    # Add (or update) the canonical plural forms
    products["results_one"] = one
    products["results_other"] = other

    # Write back
    try:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            f.write("\n")
    except OSError as e:
        print(f"FAIL: cannot write {lang}.json: {e}")
        raise SystemExit(1)

    print(f"OK {lang}: results_one='{one}' results_other='{other}' (removed: {removed})")
