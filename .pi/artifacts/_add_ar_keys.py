"""Add 11 missing keys to ar.json.

Targets:
- 5 leaf additions to existing dicts:
  * common.filters, common.placeholderImage
  * auth.account_benefits
  * order_confirmation.loading
  * profile.nav_aria
- 2 new sub-dicts inside home:
  * home.featuredProducts.{title, subtitle}
  * home.specialOffers.{title, loading}
- 2 new top-level dicts:
  * languages.en
  * track.order_number_placeholder
"""
import json
from collections import OrderedDict

AR = "/Users/mohamedbardouni/projects/beldify/beldify-frontend/src/i18n/locales/ar.json"

try:
    with open(AR, encoding="utf-8") as f:
        raw = f.read()
except FileNotFoundError:
    print(f"FAIL: {AR} not found")
    raise SystemExit(1)
try:
    data = json.loads(raw, object_pairs_hook=OrderedDict)
except json.JSONDecodeError as e:
    print(f"FAIL: invalid JSON in {AR}: {e}")
    raise SystemExit(1)

# 1) common
common = data["common"]
assert "filters" not in common, "filters already exists"
assert "placeholderImage" not in common, "placeholderImage already exists"
common["filters"] = "فلاتر"
common["placeholderImage"] = "صورة افتراضية"

# 2) auth
auth = data["auth"]
assert "account_benefits" not in auth, "account_benefits already exists"
auth["account_benefits"] = "مزايا الحساب"

# 3) order_confirmation — add as new top-level leaf in the section
oc = data["order_confirmation"]
assert "loading" not in oc, "loading already exists"
oc["loading"] = "جاري تحميل تفاصيل الطلب"

# 4) profile
prof = data["profile"]
assert "nav_aria" not in prof, "nav_aria already exists"
prof["nav_aria"] = "تنقل الملف الشخصي"

# 5) home — add new sub-dicts
home = data["home"]
assert "featuredProducts" not in home, "featuredProducts already exists"
home["featuredProducts"] = OrderedDict([
    ("title", "المنتجات المميزة"),
    ("subtitle", "اكتشف أكثر الملابس المغربية التقليدية شعبية"),
])
assert "specialOffers" not in home, "specialOffers already exists"
home["specialOffers"] = OrderedDict([
    ("title", "العروض الخاصة"),
    ("loading", "جاري تحميل العروض الخاصة..."),
])

# 6) Top-level additions
assert "languages" not in data, "languages already exists"
data["languages"] = OrderedDict([("en", "الإنجليزية")])
assert "track" not in data, "track already exists"
data["track"] = OrderedDict([("order_number_placeholder", "ORD-XXXXXX")])

# Write back with same formatting (2-space indent, ensure_ascii=False)
try:
    with open(AR, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")
except OSError as e:
    print(f"FAIL: cannot write {AR}: {e}")
    raise SystemExit(1)

print("OK — 11 keys added to ar.json")
