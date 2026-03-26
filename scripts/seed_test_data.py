#!/usr/bin/env python3
"""
TUT Luxury Cars — Test Data Seeder
Populates FlexCMS with the full TUT test dataset per docs/TEST_DATA_SPECIFICATION.md
"""

import json
import os
import sys
import uuid
import subprocess
import psycopg2
import requests
from pathlib import Path

AUTHOR_API = "http://localhost:8080"
ASSETS_BASE = Path(__file__).parent.parent / "Design" / "assets"
USER_ID = "admin"

# ── DB connection ──────────────────────────────────────────────────────────────
def get_db_conn():
    return psycopg2.connect(
        host="localhost", port=5432,
        dbname="flexcms_author", user="flexcms", password="flexcms"
    )

def get_pim_db_conn():
    return psycopg2.connect(
        host="localhost", port=5432,
        dbname="flexcms_pim", user="flexcms", password="flexcms"
    )

# ── HTTP helpers ───────────────────────────────────────────────────────────────
def post(path, body):
    r = requests.post(f"{AUTHOR_API}{path}", json=body,
                      headers={"Content-Type": "application/json"})
    if not r.ok:
        print(f"  ERROR POST {path}: {r.status_code} {r.text[:300]}")
        return None
    return r.json()

def put(path, body):
    r = requests.put(f"{AUTHOR_API}{path}", json=body,
                     headers={"Content-Type": "application/json"})
    if not r.ok:
        print(f"  ERROR PUT {path}: {r.status_code} {r.text[:300]}")
        return None
    return r.json()

def get(path):
    r = requests.get(f"{AUTHOR_API}{path}")
    if not r.ok:
        return None
    return r.json()

def post_status(path_query):
    r = requests.post(f"{AUTHOR_API}/api/author/content/node/status?{path_query}")
    return r.ok

# ── Phase 1: Component Definitions ────────────────────────────────────────────
COMPONENTS = [
    {
        "resource_type": "tut/hero-banner",
        "name": "hero-banner",
        "title": "Hero Banner",
        "group_name": "Marketing",
        "is_container": False,
        "data_schema": {
            "title": "string",
            "subtitle": "string",
            "backgroundImage": "string",
            "ctaLabel": "string",
            "ctaLink": "string",
            "theme": "enum:light|dark|gradient",
            "height": "enum:medium|full",
            "overlayOpacity": "number"
        }
    },
    {
        "resource_type": "tut/text-image",
        "name": "text-image",
        "title": "Text + Image",
        "group_name": "Content",
        "is_container": False,
        "data_schema": {
            "title": "string",
            "text": "string",
            "image": "string",
            "imageAlt": "string",
            "imagePosition": "enum:left|right",
            "theme": "enum:light|dark"
        }
    },
    {
        "resource_type": "tut/card-grid",
        "name": "card-grid",
        "title": "Card Grid",
        "group_name": "Content",
        "is_container": True,
        "data_schema": {
            "columns": "number",
            "title": "string"
        }
    },
    {
        "resource_type": "tut/card",
        "name": "card",
        "title": "Card",
        "group_name": "Content",
        "is_container": False,
        "data_schema": {
            "image": "string",
            "title": "string",
            "description": "string",
            "ctaLabel": "string",
            "ctaLink": "string"
        }
    },
    {
        "resource_type": "tut/product-teaser",
        "name": "product-teaser",
        "title": "Product Teaser",
        "group_name": "Commerce",
        "is_container": False,
        "data_schema": {
            "productSku": "string",
            "displayMode": "enum:hero|compact|card",
            "showPrice": "boolean",
            "ctaLabel": "string",
            "ctaLink": "string"
        }
    },
    {
        "resource_type": "tut/product-specs",
        "name": "product-specs",
        "title": "Product Specifications",
        "group_name": "Commerce",
        "is_container": False,
        "data_schema": {
            "productSku": "string",
            "highlightedSpecs": "string[]"
        }
    },
    {
        "resource_type": "tut/gallery",
        "name": "gallery",
        "title": "Image Gallery",
        "group_name": "Media",
        "is_container": False,
        "data_schema": {
            "images": "string[]",
            "layout": "enum:carousel|grid",
            "columns": "number"
        }
    },
    {
        "resource_type": "tut/cta-banner",
        "name": "cta-banner",
        "title": "CTA Banner",
        "group_name": "Marketing",
        "is_container": False,
        "data_schema": {
            "title": "string",
            "text": "string",
            "ctaLabel": "string",
            "ctaLink": "string",
            "theme": "enum:primary|dark|accent"
        }
    },
    {
        "resource_type": "tut/accordion",
        "name": "accordion",
        "title": "Accordion / FAQ",
        "group_name": "Content",
        "is_container": True,
        "data_schema": {}
    },
    {
        "resource_type": "tut/accordion-item",
        "name": "accordion-item",
        "title": "Accordion Item",
        "group_name": "Content",
        "is_container": False,
        "data_schema": {
            "title": "string",
            "body": "string"
        }
    },
    {
        "resource_type": "tut/video-embed",
        "name": "video-embed",
        "title": "Video Embed",
        "group_name": "Media",
        "is_container": False,
        "data_schema": {
            "videoUrl": "string",
            "damVideo": "string",
            "posterImage": "string",
            "autoplay": "boolean",
            "title": "string"
        }
    },
    {
        "resource_type": "tut/navigation",
        "name": "navigation",
        "title": "Navigation Menu",
        "group_name": "Navigation",
        "is_container": False,
        "data_schema": {
            "rootPath": "string",
            "depth": "number",
            "brandLogo": "string",
            "brandName": "string",
            "showLanguageSelector": "boolean"
        }
    },
    {
        "resource_type": "tut/breadcrumb",
        "name": "breadcrumb",
        "title": "Breadcrumb",
        "group_name": "Navigation",
        "is_container": False,
        "data_schema": {}
    },
    {
        "resource_type": "tut/footer-links",
        "name": "footer-links",
        "title": "Footer Links",
        "group_name": "Navigation",
        "is_container": False,
        "data_schema": {
            "columns": "array",
            "copyrightText": "string",
            "socialLinks": "array"
        }
    },
    {
        "resource_type": "tut/language-selector",
        "name": "language-selector",
        "title": "Language Selector",
        "group_name": "Navigation",
        "is_container": False,
        "data_schema": {}
    },
    {
        "resource_type": "tut/stat-counter",
        "name": "stat-counter",
        "title": "Stat Counter",
        "group_name": "Marketing",
        "is_container": False,
        "data_schema": {
            "value": "string",
            "unit": "string",
            "label": "string"
        }
    },
    {
        "resource_type": "tut/testimonial",
        "name": "testimonial",
        "title": "Testimonial",
        "group_name": "Content",
        "is_container": False,
        "data_schema": {
            "quote": "string",
            "author": "string",
            "source": "string",
            "image": "string"
        }
    },
    {
        "resource_type": "tut/model-comparison",
        "name": "model-comparison",
        "title": "Model Comparison",
        "group_name": "Commerce",
        "is_container": False,
        "data_schema": {
            "productSkus": "string[]",
            "compareAttributes": "string[]"
        }
    },
]

def register_components(conn):
    print("\n=== Phase 1: Registering Component Definitions ===")
    cur = conn.cursor()
    inserted = 0
    skipped = 0
    for c in COMPONENTS:
        cur.execute("SELECT id FROM component_definitions WHERE resource_type = %s", (c["resource_type"],))
        if cur.fetchone():
            print(f"  SKIP (exists): {c['resource_type']}")
            skipped += 1
            continue
        new_id = uuid.uuid4()
        cur.execute("""
            INSERT INTO component_definitions
              (id, resource_type, name, title, group_name, is_container, active, data_schema, dialog)
            VALUES (%s, %s, %s, %s, %s, %s, true, %s::jsonb, '{}'::jsonb)
        """, (
            str(new_id),
            c["resource_type"],
            c["name"],
            c["title"],
            c["group_name"],
            c["is_container"],
            json.dumps(c["data_schema"])
        ))
        print(f"  OK: {c['resource_type']}")
        inserted += 1
    conn.commit()
    cur.close()
    print(f"  Done: {inserted} inserted, {skipped} skipped")

# ── Phase 2: DAM Assets ────────────────────────────────────────────────────────
ASSET_MAP = [
    # shared/brand
    ("/dam/tut/shared/brand",       "z-image-turbo_00001_.png",   "1024x1024", "tut-logo.png"),
    # shared/banners
    ("/dam/tut/shared/banners",     "Flux2-Klein_00001_.png",     "banner", "hero-home.png"),
    ("/dam/tut/shared/banners",     "Flux2-Klein_00002_.png",     "banner", "hero-models.png"),
    ("/dam/tut/shared/banners",     "Flux2-Klein_00005_.png",     "banner", "hero-innovation.png"),
    ("/dam/tut/shared/banners",     "openart-image_1774524665435_8ee570b7_1774524666604_bccc0b4c.png", "banner", "hero-safety.png"),
    ("/dam/tut/shared/banners",     "openart-image_1774524670799_60639cbb_1774524671922_18d47bfd.png", "banner", "hero-about.png"),
    ("/dam/tut/shared/banners",     "openart-image_1774524671714_bb094f70_1774524672752_2a5d0d5e.png", "banner", "hero-heritage.png"),
    ("/dam/tut/shared/banners",     "openart-image_1774524675992_c9e45a26_1774524677335_26fd5455.png", "banner", "cta-test-drive.png"),
    # shared/models
    ("/dam/tut/shared/models",      "z-image-turbo1_00001_.png",  "1024x1024", "tut-sovereign.png"),
    ("/dam/tut/shared/models",      "z-image-turbo1_00002_.png",  "1024x1024", "tut-sovereign-2.png"),
    ("/dam/tut/shared/models",      "z-image-turbo1_00003_.png",  "1024x1024", "tut-sovereign-3.png"),
    ("/dam/tut/shared/models",      "z-image-turbo2_00001_.png",  "1024x1024", "tut-vanguard.png"),
    ("/dam/tut/shared/models",      "z-image-turbo2_00002_.png",  "1024x1024", "tut-vanguard-2.png"),
    ("/dam/tut/shared/models",      "z-image-turbo2_00003_.png",  "1024x1024", "tut-vanguard-3.png"),
    ("/dam/tut/shared/models",      "z-image-turbo3_00001_.png",  "1024x1024", "tut-eclipse.png"),
    ("/dam/tut/shared/models",      "z-image-turbo3_00002_.png",  "1024x1024", "tut-eclipse-2.png"),
    ("/dam/tut/shared/models",      "z-image-turbo3_00003_.png",  "1024x1024", "tut-eclipse-3.png"),
    ("/dam/tut/shared/models",      "z-image-turbo4_00001_.png",  "1024x1024", "tut-apex.png"),
    ("/dam/tut/shared/models",      "z-image-turbo4_00002_.png",  "1024x1024", "tut-apex-2.png"),
    ("/dam/tut/shared/models",      "z-image-turbo4_00003_.png",  "1024x1024", "tut-apex-3.png"),
    # shared/features
    ("/dam/tut/shared/features",    "Flux2-Klein_00002_.png",     "1024x1024", "innovation-engine.png"),
    ("/dam/tut/shared/features",    "Flux2-Klein_00003_.png",     "1024x1024", "innovation-aero.png"),
    ("/dam/tut/shared/features",    "Flux2-Klein_00004_.png",     "1024x1024", "innovation-ai.png"),
    ("/dam/tut/shared/features",    "Flux2-Klein_00005_.png",     "1024x1024", "safety-shield.png"),
    ("/dam/tut/shared/features",    "Flux2-Klein_00006_.png",     "1024x1024", "safety-night.png"),
    ("/dam/tut/shared/features",    "Flux2-Klein_00007_.png",     "1024x1024", "safety-assist.png"),
    ("/dam/tut/shared/features",    "Flux2-Klein_00008_.png",     "1024x1024", "interior-cockpit.png"),
    ("/dam/tut/shared/features",    "Flux2-Klein_203003_.png",    "1024x1024", "interior-materials.png"),
    ("/dam/tut/shared/features",    "Flux2-Klein_203004_.png",    "1024x1024", "sustainability.png"),
    # shared/lifestyle
    ("/dam/tut/shared/lifestyle",   "z-image-turbo_00003_.png",   "1024x1024", "driving-experience.png"),
    ("/dam/tut/shared/lifestyle",   "z-image-turbo_00004_.png",   "1024x1024", "concierge.png"),
    ("/dam/tut/shared/lifestyle",   "z-image-turbo_00005_.png",   "1024x1024", "heritage-1.png"),
    ("/dam/tut/shared/lifestyle",   "z-image-turbo_00006_.png",   "1024x1024", "heritage-2.png"),
    ("/dam/tut/shared/lifestyle",   "z-image-turbo_00007_.png",   "1024x1024", "craftsmanship.png"),
]

def upload_assets():
    print("\n=== Phase 2: Uploading DAM Assets ===")
    asset_paths = {}  # dam_path -> asset id
    uploaded = 0
    skipped = 0
    errors = 0

    # Pre-load existing asset paths from DB
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("SELECT path, id FROM assets")
    existing_assets = {row[0]: str(row[1]) for row in cur.fetchall()}
    cur.close()
    conn.close()

    for (dam_folder, src_filename, src_subdir, dam_filename) in ASSET_MAP:
        # Resolve source file
        if src_subdir:
            src_path = ASSETS_BASE / src_subdir / src_filename
        else:
            src_path = ASSETS_BASE / src_filename

        dam_path = f"{dam_folder}/{dam_filename}"

        if not src_path.exists():
            print(f"  MISSING source: {src_path}")
            errors += 1
            continue

        # Check if already exists via DB lookup
        if dam_path in existing_assets:
            print(f"  SKIP (exists): {dam_path}")
            asset_paths[dam_path] = existing_assets[dam_path]
            skipped += 1
            continue

        with open(src_path, "rb") as f:
            files = {"file": (dam_filename, f, "image/png")}
            data = {"path": dam_path, "siteId": "tut-gb", "userId": USER_ID}
            resp = requests.post(f"{AUTHOR_API}/api/author/assets",
                                 files=files, data=data)

        if resp.ok:
            asset = resp.json()
            asset_paths[dam_path] = asset.get("id")
            print(f"  OK: {dam_path} (id={asset.get('id', '?')})")
            uploaded += 1
        else:
            print(f"  ERROR uploading {dam_path}: {resp.status_code} {resp.text[:200]}")
            errors += 1

    print(f"  Done: {uploaded} uploaded, {skipped} skipped, {errors} errors")
    return asset_paths

# ── Phase 3: PIM ───────────────────────────────────────────────────────────────
def create_pim_data():
    print("\n=== Phase 3: PIM Schema, Catalog, Products ===")

    # Create schema
    schema_payload = {
        "name": "Luxury Vehicle v2026",
        "version": "1.0",
        "description": "Schema for TUT luxury vehicle product catalog 2026",
        "userId": USER_ID,
        "schemaDef": {
            "type": "object",
            "properties": {
                "name": {"type": "string"},
                "tagline": {"type": "string"},
                "description": {"type": "string"},
                "bodyStyle": {"type": "string", "enum": ["Sedan", "SUV", "Coupé", "Convertible", "GT"]},
                "year": {"type": "integer"},
                "engineType": {"type": "string", "enum": ["V8 Petrol", "V12 Petrol", "Hybrid", "Full Electric"]},
                "horsepower": {"type": "integer"},
                "torque": {"type": "string"},
                "acceleration0to100": {"type": "string"},
                "topSpeed": {"type": "string"},
                "transmission": {"type": "string"},
                "exteriorColors": {"type": "array", "items": {"type": "string"}},
                "interiorMaterials": {"type": "string"},
                "wheelSize": {"type": "string"},
                "length": {"type": "string"},
                "width": {"type": "string"},
                "weight": {"type": "string"},
                "infotainment": {"type": "string"},
                "driverAssist": {"type": "array", "items": {"type": "string"}},
                "connectivity": {"type": "array", "items": {"type": "string"}},
                "basePrice_GBP": {"type": "number"},
                "basePrice_EUR": {"type": "number"},
                "basePrice_CAD": {"type": "number"}
            }
        },
        "attributeGroups": {
            "General": ["name", "tagline", "description", "bodyStyle", "year"],
            "Performance": ["engineType", "horsepower", "torque", "acceleration0to100", "topSpeed", "transmission"],
            "Design": ["exteriorColors", "interiorMaterials", "wheelSize", "length", "width", "weight"],
            "Technology": ["infotainment", "driverAssist", "connectivity"],
            "Pricing": ["basePrice_GBP", "basePrice_EUR", "basePrice_CAD"]
        }
    }

    # Check if schema exists
    schema_id = None
    r = requests.get(f"{AUTHOR_API}/api/pim/v1/schemas/by-name/Luxury%20Vehicle%20v2026")
    if r.ok:
        data = r.json()
        if isinstance(data, list):
            schema_id = data[0].get("id") if data else None
        else:
            schema_id = data.get("id")
        if schema_id:
            print(f"  SKIP schema (exists): id={schema_id}")
    else:
        r = requests.post(f"{AUTHOR_API}/api/pim/v1/schemas",
                          json=schema_payload,
                          headers={"Content-Type": "application/json"})
        if r.ok:
            schema_id = r.json().get("id")
            print(f"  OK schema created: id={schema_id}")
        else:
            print(f"  ERROR creating schema: {r.status_code} {r.text[:300]}")
            return None, None

    # Create catalog
    catalog_id = None
    r = requests.get(f"{AUTHOR_API}/api/pim/v1/catalogs")
    if r.ok:
        catalogs = r.json()
        items = catalogs if isinstance(catalogs, list) else catalogs.get("content", catalogs.get("items", []))
        existing = [c for c in items if c.get("name") == "TUT 2026 Model Lineup"]
        if existing:
            catalog_id = existing[0]["id"]
            print(f"  SKIP catalog (exists): id={catalog_id}")

    if not catalog_id:
        catalog_payload = {
            "name": "TUT 2026 Model Lineup",
            "year": 2026,
            "season": "Full Year",
            "description": "Full TUT luxury vehicle lineup for 2026",
            "schemaId": schema_id,
            "userId": USER_ID
        }
        r = requests.post(f"{AUTHOR_API}/api/pim/v1/catalogs",
                          json=catalog_payload,
                          headers={"Content-Type": "application/json"})
        if r.ok:
            catalog_id = r.json().get("id")
            print(f"  OK catalog created: id={catalog_id}")
            # Activate catalog
            requests.post(f"{AUTHOR_API}/api/pim/v1/catalogs/{catalog_id}/activate")
        else:
            print(f"  ERROR creating catalog: {r.status_code} {r.text[:300]}")
            return schema_id, None

    # Create 4 products
    products = [
        {
            "sku": "TUT-SOVEREIGN-2026",
            "name": "TUT Sovereign",
            "catalogId": catalog_id,
            "userId": USER_ID,
            "attributes": {
                "name": "TUT Sovereign",
                "tagline": "The art of arrival",
                "description": "The Sovereign represents the pinnacle of luxury motoring. Hand-crafted in our Oxfordshire atelier, every detail is meticulously engineered for those who demand nothing less than perfection.",
                "bodyStyle": "Sedan",
                "year": 2026,
                "engineType": "V12 Petrol",
                "horsepower": 600,
                "torque": "900 Nm",
                "acceleration0to100": "3.8s",
                "topSpeed": "310 km/h",
                "transmission": "8-speed automatic",
                "exteriorColors": ["British Racing Green", "Midnight Sapphire", "Pearl White", "Obsidian Black"],
                "interiorMaterials": "Hand-stitched Nappa leather, open-pore walnut veneer",
                "wheelSize": "21\" forged alloy",
                "length": "5,395 mm",
                "width": "1,950 mm",
                "weight": "2,340 kg",
                "infotainment": "12.3\" OLED touchscreen, 18-speaker Meridian surround",
                "driverAssist": ["Adaptive cruise", "lane keep", "night vision", "360° camera"],
                "connectivity": ["5G", "wireless CarPlay/Android Auto", "OTA updates"],
                "basePrice_GBP": 285000,
                "basePrice_EUR": 325000,
                "basePrice_CAD": 420000
            }
        },
        {
            "sku": "TUT-VANGUARD-2026",
            "name": "TUT Vanguard",
            "catalogId": catalog_id,
            "userId": USER_ID,
            "attributes": {
                "name": "TUT Vanguard",
                "tagline": "Command every horizon",
                "description": "The Vanguard blends commanding presence with athletic agility. Powered by our twin-turbo V8, it conquers any terrain while cocooning occupants in supreme luxury.",
                "bodyStyle": "SUV",
                "year": 2026,
                "engineType": "V8 Petrol",
                "horsepower": 550,
                "torque": "770 Nm",
                "acceleration0to100": "4.2s",
                "topSpeed": "280 km/h",
                "transmission": "8-speed automatic AWD",
                "exteriorColors": ["Glacier White", "Volcano Red", "Arctic Silver", "Forest Green"],
                "interiorMaterials": "Semi-aniline leather, brushed aluminium trim",
                "wheelSize": "22\" diamond-cut alloy",
                "length": "5,200 mm",
                "width": "2,050 mm",
                "weight": "2,680 kg",
                "infotainment": "Dual 12.3\" displays, 20-speaker Bowers & Wilkins",
                "driverAssist": ["Terrain response", "adaptive air suspension", "trailer assist"],
                "connectivity": ["5G", "wireless CarPlay/Android Auto", "remote park"],
                "basePrice_GBP": 195000,
                "basePrice_EUR": 225000,
                "basePrice_CAD": 295000
            }
        },
        {
            "sku": "TUT-ECLIPSE-2026",
            "name": "TUT Eclipse",
            "catalogId": catalog_id,
            "userId": USER_ID,
            "attributes": {
                "name": "TUT Eclipse",
                "tagline": "Silent thunder",
                "description": "Our first fully electric grand tourer. The Eclipse delivers breathtaking acceleration with zero emissions, proving that sustainability and luxury are not mutually exclusive.",
                "bodyStyle": "GT",
                "year": 2026,
                "engineType": "Full Electric",
                "horsepower": 700,
                "torque": "1,100 Nm",
                "acceleration0to100": "2.9s",
                "topSpeed": "290 km/h",
                "transmission": "Single-speed direct drive",
                "exteriorColors": ["Electric Blue", "Mercury Silver", "Carbon Black"],
                "interiorMaterials": "Vegan ultra-suede, recycled carbon fibre",
                "wheelSize": "21\" aero-optimised alloy",
                "length": "4,890 mm",
                "width": "1,980 mm",
                "weight": "2,250 kg",
                "infotainment": "15.6\" curved OLED, augmented reality HUD",
                "driverAssist": ["Highway autopilot", "auto park", "predictive battery management"],
                "connectivity": ["5G", "V2X communication", "OTA updates", "app remote control"],
                "basePrice_GBP": 245000,
                "basePrice_EUR": 280000,
                "basePrice_CAD": 365000
            }
        },
        {
            "sku": "TUT-APEX-2026",
            "name": "TUT Apex",
            "catalogId": catalog_id,
            "userId": USER_ID,
            "attributes": {
                "name": "TUT Apex",
                "tagline": "Where passion meets precision",
                "description": "The Apex is a driver's car in the purest sense. Lightweight carbon construction meets plug-in hybrid technology, delivering raw thrills with conscious efficiency.",
                "bodyStyle": "Coupé",
                "year": 2026,
                "engineType": "Hybrid",
                "horsepower": 650,
                "torque": "850 Nm",
                "acceleration0to100": "3.1s",
                "topSpeed": "320 km/h",
                "transmission": "7-speed dual-clutch",
                "exteriorColors": ["Racing Yellow", "Titanium Grey", "Deep Burgundy"],
                "interiorMaterials": "Alcantara sport seats, carbon fibre dash",
                "wheelSize": "20\" centre-lock forged",
                "length": "4,680 mm",
                "width": "1,960 mm",
                "weight": "1,780 kg",
                "infotainment": "10.25\" driver display, 9\" centre touchscreen",
                "driverAssist": ["Launch control", "track mode", "carbon ceramic brakes"],
                "connectivity": ["5G", "telemetry data logging", "pit-lane timer"],
                "basePrice_GBP": 225000,
                "basePrice_EUR": 260000,
                "basePrice_CAD": 340000
            }
        }
    ]

    for prod in products:
        # Check existence
        r = requests.get(f"{AUTHOR_API}/api/pim/v1/products/{prod['sku']}")
        if r.ok:
            print(f"  SKIP product (exists): {prod['sku']}")
            continue
        r = requests.post(f"{AUTHOR_API}/api/pim/v1/products",
                          json=prod,
                          headers={"Content-Type": "application/json"})
        if r.ok:
            print(f"  OK product: {prod['sku']}")
        else:
            print(f"  ERROR product {prod['sku']}: {r.status_code} {r.text[:300]}")

    return schema_id, catalog_id

# ── Phase 4/5: Content Nodes ───────────────────────────────────────────────────
def create_node(parent_path, name, resource_type, properties=None):
    """Create a content node, skip if it already exists."""
    body = {
        "parentPath": parent_path,
        "name": name,
        "resourceType": resource_type,
        "properties": properties or {},
        "userId": USER_ID
    }
    r = requests.post(f"{AUTHOR_API}/api/author/content/node",
                      json=body,
                      headers={"Content-Type": "application/json"})
    if r.ok:
        return r.json()
    elif r.status_code == 409:
        # Already exists — fetch it
        check = requests.get(f"{AUTHOR_API}/api/author/content/node",
                             params={"path": f"{parent_path}/{name}"})
        if check.ok:
            return check.json()
        return None
    else:
        print(f"  ERROR create_node {parent_path}/{name}: {r.status_code} {r.text[:200]}")
        return None

def set_published(path):
    r = requests.post(f"{AUTHOR_API}/api/author/content/node/status",
                      params={"path": path, "status": "PUBLISHED", "userId": USER_ID})
    return r.ok

def xf_path(site_id, locale):
    return f"content.experience-fragments.{site_id}.{locale}"

def create_xf_for_site(site_id, locale, lang_label, show_lang_sel=False, currency="GBP"):
    """Create header + footer XF for a site+locale."""
    xf_root = f"experience-fragments/{site_id}/{locale}"
    xf_base_parent = f"content.experience-fragments.{site_id}.{locale}"

    # content.experience-fragments.{site_id}.{locale} already bootstrapped via SQL

    # Header XF folder
    create_node(f"content.experience-fragments.{site_id}.{locale}", "header", "flexcms/xf-folder", {
        "jcr:title": "Header",
        "fragmentType": "header"
    })
    # Header master variation
    create_node(f"content.experience-fragments.{site_id}.{locale}.header", "master", "flexcms/xf-page", {
        "jcr:title": "Master",
        "variantType": "master"
    })
    # Navigation component
    create_node(f"content.experience-fragments.{site_id}.{locale}.header.master", "navigation", "tut/navigation", {
        "rootPath": f"content.{site_id}.{locale}",
        "depth": 2,
        "brandLogo": "/dam/tut/shared/brand/tut-logo.png",
        "brandName": "TUT",
        "showLanguageSelector": show_lang_sel
    })
    # Language selector
    create_node(f"content.experience-fragments.{site_id}.{locale}.header.master", "language-selector", "tut/language-selector", {})

    # Footer XF folder
    create_node(f"content.experience-fragments.{site_id}.{locale}", "footer", "flexcms/xf-folder", {
        "jcr:title": "Footer",
        "fragmentType": "footer"
    })
    # Footer master variation
    create_node(f"content.experience-fragments.{site_id}.{locale}.footer", "master", "flexcms/xf-page", {
        "jcr:title": "Master",
        "variantType": "master"
    })

    # Build footer links per locale
    models_heading = {"en": "Models", "de": "Modelle", "fr": "Modèles"}
    discover_heading = {"en": "Discover", "de": "Entdecken", "fr": "Découvrir"}
    support_heading = {"en": "Support", "de": "Support", "fr": "Support"}
    copyright_text = f"© 2026 TUT Motors Ltd. All rights reserved."

    footer_links_props = {
        "columns": [
            {
                "heading": models_heading.get(locale, "Models"),
                "links": [
                    {"label": "Sovereign", "url": "/models/sovereign"},
                    {"label": "Vanguard", "url": "/models/vanguard"},
                    {"label": "Eclipse", "url": "/models/eclipse"},
                    {"label": "Apex", "url": "/models/apex"}
                ]
            },
            {
                "heading": discover_heading.get(locale, "Discover"),
                "links": [
                    {"label": {"en": "Innovation", "de": "Innovation", "fr": "Innovation"}.get(locale, "Innovation"), "url": "/innovation"},
                    {"label": {"en": "Safety", "de": "Sicherheit", "fr": "Sécurité"}.get(locale, "Safety"), "url": "/safety"},
                    {"label": {"en": "About TUT", "de": "Über uns", "fr": "À propos"}.get(locale, "About TUT"), "url": "/about"}
                ]
            },
            {
                "heading": support_heading.get(locale, "Support"),
                "links": [
                    {"label": {"en": "Contact", "de": "Kontakt", "fr": "Contact"}.get(locale, "Contact"), "url": "/contact"},
                    {"label": {"en": "Privacy Policy", "de": "Datenschutz", "fr": "Politique de confidentialité"}.get(locale, "Privacy Policy"), "url": "/legal/privacy"},
                    {"label": {"en": "Terms & Conditions", "de": "AGB", "fr": "Conditions générales"}.get(locale, "Terms & Conditions"), "url": "/legal/terms"}
                ]
            }
        ],
        "copyrightText": copyright_text,
        "socialLinks": [
            {"platform": "instagram", "url": "https://instagram.com/tutmotors"},
            {"platform": "youtube", "url": "https://youtube.com/tutmotors"},
            {"platform": "linkedin", "url": "https://linkedin.com/company/tutmotors"}
        ]
    }
    create_node(f"content.experience-fragments.{site_id}.{locale}.footer.master", "footer-links", "tut/footer-links", footer_links_props)
    print(f"  OK XF: {site_id}/{locale}")

def xf_ref_path(site_id, locale, slot):
    return f"content.experience-fragments.{site_id}.{locale}.{slot}.master"

def create_page_with_components(site_id, locale, parent_content_path, page_name, resource_type, props, components):
    """Create a page node plus its component tree."""
    node = create_node(parent_content_path, page_name, resource_type, props)
    if not node:
        return

    # Add standard header/breadcrumb/main/footer for flexcms/page nodes
    if resource_type == "flexcms/page":
        header_xf = xf_ref_path(site_id, locale, "header")
        footer_xf = xf_ref_path(site_id, locale, "footer")
        page_path = f"{parent_content_path}.{page_name}"

        create_node(page_path, "header", "flexcms/experience-fragment", {
            "fragmentPath": header_xf
        })
        create_node(page_path, "breadcrumb", "tut/breadcrumb", {})
        main = create_node(page_path, "main", "flexcms/container", {"layout": "single-column"})
        create_node(page_path, "footer", "flexcms/experience-fragment", {
            "fragmentPath": footer_xf
        })

        main_path = f"{page_path}.main"
        for comp in components:
            create_node(main_path, comp["name"], comp["resourceType"], comp.get("props", {}))
            # Handle children
            if comp.get("children"):
                comp_path = f"{main_path}.{comp['name']}"
                for child in comp["children"]:
                    create_node(comp_path, child["name"], child["resourceType"], child.get("props", {}))
                    if child.get("children"):
                        child_path = f"{comp_path}.{child['name']}"
                        for grandchild in child["children"]:
                            create_node(child_path, grandchild["name"], grandchild["resourceType"], grandchild.get("props", {}))

    set_published(f"{parent_content_path}/{page_name}")

def get_locale_strings(locale):
    strings = {
        "en": {
            "explore_models": "Explore Models",
            "book_test_drive": "Book Test Drive",
            "our_models": "Our Models",
            "home_hero_title": "The New TUT Sovereign",
            "home_hero_subtitle": "Luxury redefined for 2026",
            "innovation_without_compromise": "Innovation Without Compromise",
            "your_safety_perfected": "Your Safety, Perfected",
            "experience_tut": "Experience TUT",
            "book_test_drive_today": "Book your personal test drive today",
            "the_tut_lineup": "The TUT Lineup",
            "four_masterpieces": "Four masterpieces. One vision.",
            "innovation_at_tut": "Innovation at TUT",
            "about_tut": "About TUT",
            "our_story": "Our Story",
            "contact_tut": "Contact TUT",
            "configure_your": "Configure Your",
            "contact_us": "Contact Us",
            "discover": "Discover",
        },
        "de": {
            "explore_models": "Modelle entdecken",
            "book_test_drive": "Probefahrt buchen",
            "our_models": "Unsere Modelle",
            "home_hero_title": "Der neue TUT Sovereign",
            "home_hero_subtitle": "Luxus neu definiert für 2026",
            "innovation_without_compromise": "Innovation ohne Kompromisse",
            "your_safety_perfected": "Ihre Sicherheit, perfektioniert",
            "experience_tut": "TUT erleben",
            "book_test_drive_today": "Buchen Sie noch heute Ihre persönliche Probefahrt",
            "the_tut_lineup": "Die TUT Modellpalette",
            "four_masterpieces": "Vier Meisterwerke. Eine Vision.",
            "innovation_at_tut": "Innovation bei TUT",
            "about_tut": "Über TUT",
            "our_story": "Unsere Geschichte",
            "contact_tut": "TUT kontaktieren",
            "configure_your": "Konfigurieren Sie Ihren",
            "contact_us": "Kontakt aufnehmen",
            "discover": "Entdecken",
        },
        "fr": {
            "explore_models": "Découvrir les modèles",
            "book_test_drive": "Réserver un essai",
            "our_models": "Nos modèles",
            "home_hero_title": "Le nouveau TUT Sovereign",
            "home_hero_subtitle": "Le luxe redéfini pour 2026",
            "innovation_without_compromise": "L'innovation sans compromis",
            "your_safety_perfected": "Votre sécurité, perfectionnée",
            "experience_tut": "Vivez l'expérience TUT",
            "book_test_drive_today": "Réservez votre essai personnalisé aujourd'hui",
            "the_tut_lineup": "La gamme TUT",
            "four_masterpieces": "Quatre chefs-d'œuvre. Une vision.",
            "innovation_at_tut": "L'innovation chez TUT",
            "about_tut": "À propos de TUT",
            "our_story": "Notre histoire",
            "contact_tut": "Contacter TUT",
            "configure_your": "Configurez votre",
            "contact_us": "Nous contacter",
            "discover": "Découvrir",
        }
    }
    return strings.get(locale, strings["en"])

def create_site_pages(site_id, locale):
    """Create the full 17-page tree for a site+locale."""
    s = get_locale_strings(locale)
    site_root = f"content.{site_id}.{locale}"

    print(f"\n  Creating pages for {site_id}/{locale}...")

    # === Home ===
    home_components = [
        {"name": "hero", "resourceType": "tut/hero-banner", "props": {
            "title": s["home_hero_title"],
            "subtitle": s["home_hero_subtitle"],
            "backgroundImage": "/dam/tut/shared/banners/hero-home.png",
            "ctaLabel": s["explore_models"],
            "ctaLink": f"/{site_id}/{locale}/models",
            "theme": "dark",
            "height": "full",
            "overlayOpacity": 0.4
        }},
        {"name": "model-highlights", "resourceType": "tut/card-grid", "props": {
            "columns": 4,
            "title": s["our_models"]
        }, "children": [
            {"name": "card-sovereign", "resourceType": "tut/card", "props": {
                "image": "/dam/tut/shared/models/tut-sovereign.png",
                "title": "Sovereign",
                "description": "The art of arrival",
                "ctaLabel": s["discover"],
                "ctaLink": f"/{site_id}/{locale}/models/sovereign"
            }},
            {"name": "card-vanguard", "resourceType": "tut/card", "props": {
                "image": "/dam/tut/shared/models/tut-vanguard.png",
                "title": "Vanguard",
                "description": "Command every horizon",
                "ctaLabel": s["discover"],
                "ctaLink": f"/{site_id}/{locale}/models/vanguard"
            }},
            {"name": "card-eclipse", "resourceType": "tut/card", "props": {
                "image": "/dam/tut/shared/models/tut-eclipse.png",
                "title": "Eclipse",
                "description": "Silent thunder",
                "ctaLabel": s["discover"],
                "ctaLink": f"/{site_id}/{locale}/models/eclipse"
            }},
            {"name": "card-apex", "resourceType": "tut/card", "props": {
                "image": "/dam/tut/shared/models/tut-apex.png",
                "title": "Apex",
                "description": "Where passion meets precision",
                "ctaLabel": s["discover"],
                "ctaLink": f"/{site_id}/{locale}/models/apex"
            }}
        ]},
        {"name": "innovation-section", "resourceType": "tut/text-image", "props": {
            "title": s["innovation_without_compromise"],
            "text": "<p>At TUT, we push the boundaries of engineering to deliver extraordinary performance without sacrificing refinement. Every innovation serves a purpose.</p>",
            "image": "/dam/tut/shared/features/innovation-engine.png",
            "imagePosition": "right",
            "theme": "light"
        }},
        {"name": "stats", "resourceType": "flexcms/container", "props": {"layout": "three-equal"}, "children": [
            {"name": "stat-1", "resourceType": "tut/stat-counter", "props": {"value": "600+", "unit": "HP", "label": "Maximum Power"}},
            {"name": "stat-2", "resourceType": "tut/stat-counter", "props": {"value": "2.9s", "unit": "", "label": "0-100 km/h"}},
            {"name": "stat-3", "resourceType": "tut/stat-counter", "props": {"value": "75+", "unit": "years", "label": "Heritage"}}
        ]},
        {"name": "safety-preview", "resourceType": "tut/text-image", "props": {
            "title": s["your_safety_perfected"],
            "text": "<p>Every TUT is engineered with our proprietary SafeShield™ architecture, a multi-layered safety system that anticipates and prevents incidents before they occur.</p>",
            "image": "/dam/tut/shared/features/safety-shield.png",
            "imagePosition": "left",
            "theme": "light"
        }},
        {"name": "testimonial", "resourceType": "tut/testimonial", "props": {
            "quote": "The TUT Sovereign is the closest thing to perfection on four wheels.",
            "author": "James Henderson",
            "source": "Luxury Motoring Magazine"
        }},
        {"name": "cta-test-drive", "resourceType": "tut/cta-banner", "props": {
            "title": s["experience_tut"],
            "text": s["book_test_drive_today"],
            "ctaLabel": s["book_test_drive"],
            "ctaLink": f"/{site_id}/{locale}/contact",
            "theme": "primary"
        }}
    ]
    create_page_with_components(site_id, locale, site_root, "home", "flexcms/page", {
        "jcr:title": {"en": "Home", "de": "Startseite", "fr": "Accueil"}.get(locale, "Home"),
        "siteId": site_id
    }, home_components)

    # === Models Hub ===
    models = create_node(site_root, "models", "flexcms/container", {"jcr:title": {"en": "Models", "de": "Modelle", "fr": "Modèles"}.get(locale, "Models")})
    create_page_with_components(site_id, locale, site_root, "models", "flexcms/page", {
        "jcr:title": {"en": "Models", "de": "Modelle", "fr": "Modèles"}.get(locale, "Models"),
        "siteId": site_id
    }, [
        {"name": "hero", "resourceType": "tut/hero-banner", "props": {
            "title": s["the_tut_lineup"],
            "subtitle": s["four_masterpieces"],
            "backgroundImage": "/dam/tut/shared/banners/hero-models.png",
            "theme": "dark",
            "height": "full"
        }},
        {"name": "sovereign-teaser", "resourceType": "tut/product-teaser", "props": {
            "productSku": "TUT-SOVEREIGN-2026",
            "displayMode": "hero",
            "ctaLabel": s["discover"],
            "ctaLink": f"/{site_id}/{locale}/models/sovereign"
        }},
        {"name": "vanguard-teaser", "resourceType": "tut/product-teaser", "props": {
            "productSku": "TUT-VANGUARD-2026",
            "displayMode": "hero",
            "ctaLabel": s["discover"],
            "ctaLink": f"/{site_id}/{locale}/models/vanguard"
        }},
        {"name": "eclipse-teaser", "resourceType": "tut/product-teaser", "props": {
            "productSku": "TUT-ECLIPSE-2026",
            "displayMode": "hero",
            "ctaLabel": s["discover"],
            "ctaLink": f"/{site_id}/{locale}/models/eclipse"
        }},
        {"name": "apex-teaser", "resourceType": "tut/product-teaser", "props": {
            "productSku": "TUT-APEX-2026",
            "displayMode": "hero",
            "ctaLabel": s["discover"],
            "ctaLink": f"/{site_id}/{locale}/models/apex"
        }},
        {"name": "comparison", "resourceType": "tut/model-comparison", "props": {
            "productSkus": ["TUT-SOVEREIGN-2026", "TUT-VANGUARD-2026", "TUT-ECLIPSE-2026"],
            "compareAttributes": ["horsepower", "acceleration0to100", "topSpeed", "engineType", "basePrice_GBP"]
        }}
    ])

    # === Model Detail Pages ===
    model_details = [
        {
            "slug": "sovereign",
            "sku": "TUT-SOVEREIGN-2026",
            "title": "TUT Sovereign",
            "tagline": "The art of arrival",
            "hero_img": "/dam/tut/shared/models/tut-sovereign.png",
            "intro_img": "/dam/tut/shared/models/tut-sovereign-2.png",
            "gallery": ["/dam/tut/shared/models/tut-sovereign.png", "/dam/tut/shared/models/tut-sovereign-2.png", "/dam/tut/shared/models/tut-sovereign-3.png"],
            "desc": "The Sovereign represents the pinnacle of luxury motoring. Hand-crafted in our Oxfordshire atelier, every detail is meticulously engineered."
        },
        {
            "slug": "vanguard",
            "sku": "TUT-VANGUARD-2026",
            "title": "TUT Vanguard",
            "tagline": "Command every horizon",
            "hero_img": "/dam/tut/shared/models/tut-vanguard.png",
            "intro_img": "/dam/tut/shared/models/tut-vanguard-2.png",
            "gallery": ["/dam/tut/shared/models/tut-vanguard.png", "/dam/tut/shared/models/tut-vanguard-2.png", "/dam/tut/shared/models/tut-vanguard-3.png"],
            "desc": "The Vanguard blends commanding presence with athletic agility. Powered by our twin-turbo V8, it conquers any terrain."
        },
        {
            "slug": "eclipse",
            "sku": "TUT-ECLIPSE-2026",
            "title": "TUT Eclipse",
            "tagline": "Silent thunder",
            "hero_img": "/dam/tut/shared/models/tut-eclipse.png",
            "intro_img": "/dam/tut/shared/models/tut-eclipse-2.png",
            "gallery": ["/dam/tut/shared/models/tut-eclipse.png", "/dam/tut/shared/models/tut-eclipse-2.png", "/dam/tut/shared/models/tut-eclipse-3.png"],
            "desc": "Our first fully electric grand tourer. The Eclipse delivers breathtaking acceleration with zero emissions."
        },
        {
            "slug": "apex",
            "sku": "TUT-APEX-2026",
            "title": "TUT Apex",
            "tagline": "Where passion meets precision",
            "hero_img": "/dam/tut/shared/models/tut-apex.png",
            "intro_img": "/dam/tut/shared/models/tut-apex-2.png",
            "gallery": ["/dam/tut/shared/models/tut-apex.png", "/dam/tut/shared/models/tut-apex-2.png", "/dam/tut/shared/models/tut-apex-3.png"],
            "desc": "The Apex is a driver's car in the purest sense. Lightweight carbon construction meets plug-in hybrid technology."
        }
    ]

    for m in model_details:
        create_page_with_components(site_id, locale, f"{site_root}.models", m["slug"], "flexcms/page", {
            "jcr:title": m["title"],
            "siteId": site_id
        }, [
            {"name": "hero", "resourceType": "tut/hero-banner", "props": {
                "title": m["title"],
                "subtitle": m["tagline"],
                "backgroundImage": m["hero_img"],
                "theme": "dark",
                "height": "full"
            }},
            {"name": "intro", "resourceType": "tut/text-image", "props": {
                "title": "A masterpiece of engineering",
                "text": f"<p>{m['desc']}</p>",
                "image": m["intro_img"],
                "imagePosition": "right",
                "theme": "light"
            }},
            {"name": "gallery", "resourceType": "tut/gallery", "props": {
                "images": m["gallery"],
                "layout": "carousel"
            }},
            {"name": "specs", "resourceType": "tut/product-specs", "props": {
                "productSku": m["sku"],
                "highlightedSpecs": ["horsepower", "torque", "acceleration0to100", "topSpeed"]
            }},
            {"name": "features", "resourceType": "tut/card-grid", "props": {
                "columns": 3,
                "title": "Key Features"
            }, "children": [
                {"name": "card-1", "resourceType": "tut/card", "props": {
                    "image": "/dam/tut/shared/features/interior-cockpit.png",
                    "title": "Interior Craftsmanship",
                    "description": "Hand-finished materials chosen for both beauty and longevity."
                }},
                {"name": "card-2", "resourceType": "tut/card", "props": {
                    "image": "/dam/tut/shared/features/innovation-ai.png",
                    "title": "Infotainment",
                    "description": "State-of-the-art connectivity and entertainment at your fingertips."
                }},
                {"name": "card-3", "resourceType": "tut/card", "props": {
                    "image": "/dam/tut/shared/features/safety-night.png",
                    "title": "Night Vision",
                    "description": "Advanced night vision system detects hazards up to 300m ahead."
                }}
            ]},
            {"name": "cta", "resourceType": "tut/cta-banner", "props": {
                "title": f"{s['configure_your']} {m['title'].split()[-1]}",
                "ctaLabel": s["contact_us"],
                "ctaLink": f"/{site_id}/{locale}/contact",
                "theme": "primary"
            }}
        ])

    # === Innovation Hub ===
    create_page_with_components(site_id, locale, site_root, "innovation", "flexcms/page", {
        "jcr:title": {"en": "Innovation", "de": "Innovation", "fr": "Innovation"}.get(locale, "Innovation"),
        "siteId": site_id
    }, [
        {"name": "hero", "resourceType": "tut/hero-banner", "props": {
            "title": s["innovation_at_tut"],
            "backgroundImage": "/dam/tut/shared/banners/hero-innovation.png",
            "theme": "dark",
            "height": "full"
        }},
        {"name": "intro", "resourceType": "flexcms/rich-text", "props": {
            "content": "<p>At TUT, innovation is not a department — it's a philosophy. Every system, every component, every material is chosen with one question in mind: how can we make this better?</p>"
        }},
        {"name": "pillars", "resourceType": "tut/card-grid", "props": {
            "columns": 3,
            "title": "Our Pillars"
        }, "children": [
            {"name": "card-performance", "resourceType": "tut/card", "props": {
                "image": "/dam/tut/shared/features/innovation-engine.png",
                "title": {"en": "Performance", "de": "Leistung", "fr": "Performance"}.get(locale, "Performance"),
                "description": "Engineering excellence at every rpm.",
                "ctaLink": f"/{site_id}/{locale}/innovation/performance"
            }},
            {"name": "card-electrification", "resourceType": "tut/card", "props": {
                "image": "/dam/tut/shared/features/innovation-aero.png",
                "title": "Electrification",
                "description": "The future of luxury motoring is electric.",
                "ctaLink": f"/{site_id}/{locale}/innovation/electrification"
            }},
            {"name": "card-craftsmanship", "resourceType": "tut/card", "props": {
                "image": "/dam/tut/shared/lifestyle/craftsmanship.png",
                "title": {"en": "Craftsmanship", "de": "Handwerkskunst", "fr": "Artisanat"}.get(locale, "Craftsmanship"),
                "description": "A century of perfectionism.",
                "ctaLink": f"/{site_id}/{locale}/innovation/craftsmanship"
            }}
        ]}
    ])

    # Innovation sub-pages
    for sub in [("performance", "Performance", "/dam/tut/shared/features/innovation-engine.png"),
                ("electrification", "Electrification", "/dam/tut/shared/features/innovation-aero.png"),
                ("craftsmanship", "Craftsmanship", "/dam/tut/shared/lifestyle/craftsmanship.png")]:
        create_page_with_components(site_id, locale, f"{site_root}.innovation", sub[0], "flexcms/page", {
            "jcr:title": sub[1], "siteId": site_id
        }, [
            {"name": "hero", "resourceType": "tut/hero-banner", "props": {
                "title": sub[1],
                "backgroundImage": sub[2],
                "theme": "dark", "height": "medium"
            }},
            {"name": "intro", "resourceType": "tut/text-image", "props": {
                "title": sub[1],
                "text": f"<p>Our commitment to {sub[1].lower()} drives everything we do at TUT.</p>",
                "image": sub[2],
                "imagePosition": "right"
            }},
            {"name": "details", "resourceType": "flexcms/rich-text", "props": {
                "content": f"<p>Explore how TUT leads the industry in {sub[1].lower()}.</p>"
            }},
            {"name": "cta", "resourceType": "tut/cta-banner", "props": {
                "title": s["explore_models"],
                "ctaLabel": s["explore_models"],
                "ctaLink": f"/{site_id}/{locale}/models",
                "theme": "primary"
            }}
        ])

    # === Safety Hub ===
    create_page_with_components(site_id, locale, site_root, "safety", "flexcms/page", {
        "jcr:title": {"en": "Safety", "de": "Sicherheit", "fr": "Sécurité"}.get(locale, "Safety"),
        "siteId": site_id
    }, [
        {"name": "hero", "resourceType": "tut/hero-banner", "props": {
            "title": {"en": "Safety at TUT", "de": "Sicherheit bei TUT", "fr": "La sécurité chez TUT"}.get(locale, "Safety at TUT"),
            "backgroundImage": "/dam/tut/shared/banners/hero-safety.png",
            "theme": "dark", "height": "full"
        }},
        {"name": "safety-intro", "resourceType": "tut/text-image", "props": {
            "title": s["your_safety_perfected"],
            "text": "<p>SafeShield™ is our proprietary multi-layered active and passive safety system, engineered to exceed every global safety standard.</p>",
            "image": "/dam/tut/shared/features/safety-shield.png",
            "imagePosition": "right"
        }},
        {"name": "features", "resourceType": "tut/card-grid", "props": {"columns": 2}, "children": [
            {"name": "card-driver-assist", "resourceType": "tut/card", "props": {
                "image": "/dam/tut/shared/features/safety-assist.png",
                "title": "Driver Assistance",
                "ctaLink": f"/{site_id}/{locale}/safety/driver-assist"
            }},
            {"name": "card-structural", "resourceType": "tut/card", "props": {
                "image": "/dam/tut/shared/features/safety-shield.png",
                "title": "Structural Safety",
                "ctaLink": f"/{site_id}/{locale}/safety/structural"
            }}
        ]}
    ])

    for sub in [("driver-assist", "Driver Assistance", "/dam/tut/shared/features/safety-assist.png"),
                ("structural", "Structural Safety", "/dam/tut/shared/features/safety-shield.png")]:
        create_page_with_components(site_id, locale, f"{site_root}.safety", sub[0], "flexcms/page", {
            "jcr:title": sub[1], "siteId": site_id
        }, [
            {"name": "hero", "resourceType": "tut/hero-banner", "props": {
                "title": sub[1], "backgroundImage": sub[2], "theme": "dark", "height": "medium"
            }},
            {"name": "content", "resourceType": "flexcms/rich-text", "props": {
                "content": f"<p>TUT's {sub[1].lower()} systems set the benchmark for the industry.</p>"
            }}
        ])

    # === About Hub ===
    create_page_with_components(site_id, locale, site_root, "about", "flexcms/page", {
        "jcr:title": {"en": "About Us", "de": "Über uns", "fr": "À propos"}.get(locale, "About Us"),
        "siteId": site_id
    }, [
        {"name": "hero", "resourceType": "tut/hero-banner", "props": {
            "title": s["about_tut"],
            "backgroundImage": "/dam/tut/shared/banners/hero-about.png",
            "theme": "dark", "height": "full"
        }},
        {"name": "story", "resourceType": "tut/text-image", "props": {
            "title": s["our_story"],
            "text": "<p>Founded in 1949, TUT has been at the forefront of luxury automotive design for over 75 years. Our heritage is one of uncompromising quality and relentless innovation.</p>",
            "image": "/dam/tut/shared/lifestyle/heritage-1.png",
            "imagePosition": "right"
        }},
        {"name": "values", "resourceType": "tut/card-grid", "props": {"columns": 3}, "children": [
            {"name": "card-heritage", "resourceType": "tut/card", "props": {
                "image": "/dam/tut/shared/lifestyle/heritage-2.png",
                "title": {"en": "Heritage", "de": "Tradition", "fr": "Héritage"}.get(locale, "Heritage"),
                "ctaLink": f"/{site_id}/{locale}/about/heritage"
            }},
            {"name": "card-sustainability", "resourceType": "tut/card", "props": {
                "image": "/dam/tut/shared/features/sustainability.png",
                "title": "Sustainability",
                "ctaLink": f"/{site_id}/{locale}/about/sustainability"
            }},
            {"name": "card-craftsmanship", "resourceType": "tut/card", "props": {
                "image": "/dam/tut/shared/lifestyle/craftsmanship.png",
                "title": {"en": "Craftsmanship", "de": "Handwerkskunst", "fr": "Artisanat"}.get(locale, "Craftsmanship"),
            }}
        ]}
    ])

    for sub in [("heritage", "Heritage", "/dam/tut/shared/banners/hero-heritage.png"),
                ("sustainability", "Sustainability", "/dam/tut/shared/features/sustainability.png")]:
        create_page_with_components(site_id, locale, f"{site_root}.about", sub[0], "flexcms/page", {
            "jcr:title": sub[1], "siteId": site_id
        }, [
            {"name": "hero", "resourceType": "tut/hero-banner", "props": {
                "title": sub[1], "backgroundImage": sub[2], "theme": "dark", "height": "medium"
            }},
            {"name": "content", "resourceType": "flexcms/rich-text", "props": {
                "content": f"<p>TUT's {sub[1].lower()} story spans decades of passionate craftsmanship.</p>"
            }}
        ])

    # === Contact ===
    create_page_with_components(site_id, locale, site_root, "contact", "flexcms/page", {
        "jcr:title": {"en": "Contact", "de": "Kontakt", "fr": "Contact"}.get(locale, "Contact"),
        "siteId": site_id
    }, [
        {"name": "hero", "resourceType": "tut/hero-banner", "props": {
            "title": s["contact_tut"],
            "backgroundImage": "/dam/tut/shared/banners/cta-test-drive.png",
            "theme": "dark", "height": "medium"
        }},
        {"name": "intro", "resourceType": "flexcms/rich-text", "props": {
            "content": "<p>Visit a showroom near you to experience TUT in person. Our specialists are ready to guide you through every detail of your perfect luxury automobile.</p>"
        }},
        {"name": "faq", "resourceType": "tut/accordion", "props": {}, "children": [
            {"name": "item-1", "resourceType": "tut/accordion-item", "props": {
                "title": "How do I book a test drive?",
                "body": "<p>Contact your nearest TUT dealer or use our online booking form to schedule a test drive at your convenience.</p>"
            }},
            {"name": "item-2", "resourceType": "tut/accordion-item", "props": {
                "title": "Where is my nearest dealer?",
                "body": "<p>Use our dealer locator tool to find your nearest TUT showroom. We have over 200 locations worldwide.</p>"
            }},
            {"name": "item-3", "resourceType": "tut/accordion-item", "props": {
                "title": "Do you offer financing?",
                "body": "<p>Yes, TUT Financial Services offers bespoke financing solutions to suit your requirements. Our specialists will guide you through the options.</p>"
            }}
        ]}
    ])

    # === Legal ===
    create_page_with_components(site_id, locale, site_root, "legal", "flexcms/container", {
        "jcr:title": "Legal"
    }, [])

    create_page_with_components(site_id, locale, f"{site_root}.legal", "privacy", "flexcms/page", {
        "jcr:title": {"en": "Privacy Policy", "de": "Datenschutz", "fr": "Politique de confidentialité"}.get(locale, "Privacy Policy"),
        "siteId": site_id
    }, [
        {"name": "content", "resourceType": "flexcms/rich-text", "props": {
            "content": "<h1>Privacy Policy</h1><p>TUT Motors Ltd is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your personal data in accordance with applicable data protection legislation.</p><p>Last updated: 2026-01-01</p>"
        }}
    ])

    create_page_with_components(site_id, locale, f"{site_root}.legal", "terms", "flexcms/page", {
        "jcr:title": {"en": "Terms & Conditions", "de": "AGB", "fr": "Conditions générales"}.get(locale, "Terms & Conditions"),
        "siteId": site_id
    }, [
        {"name": "content", "resourceType": "flexcms/rich-text", "props": {
            "content": "<h1>Terms & Conditions</h1><p>These terms govern your use of TUT Motors Ltd websites and services. By accessing our services, you agree to these terms.</p><p>Last updated: 2026-01-01</p>"
        }}
    ])

    print(f"  OK: {site_id}/{locale} — 17 pages created")

# ── Main ───────────────────────────────────────────────────────────────────────
def main():
    print("=" * 60)
    print("  TUT Luxury Cars — FlexCMS Test Data Seeder")
    print("=" * 60)

    # Phase 1: Component Definitions (direct DB insert)
    conn = get_db_conn()
    try:
        register_components(conn)
    finally:
        conn.close()

    # Phase 2: DAM Assets
    asset_paths = upload_assets()

    # Phase 3: PIM
    schema_id, catalog_id = create_pim_data()

    # Phase 4: XF + Content Nodes
    print("\n=== Phase 4: Experience Fragments & Site Roots ===")

    sites = [
        ("tut-gb", "en", False),
        ("tut-de", "de", False),
        ("tut-fr", "fr", False),
        ("tut-ca", "en", True),
        ("tut-ca", "fr", True),
    ]

    # Bootstrap root nodes directly in DB (toContentPath can't reference root 'content' as parent)
    conn2 = get_db_conn()
    cur2 = conn2.cursor()
    bootstrap_nodes = [
        ("content.experience-fragments", "experience-fragments", "flexcms/container", "content", None, None),
    ]
    seen_sites = set()
    for (site_id, locale, _) in sites:
        if site_id not in seen_sites:
            bootstrap_nodes.append(
                (f"content.{site_id}", site_id, "flexcms/site-root", "content", site_id, None)
            )
            seen_sites.add(site_id)
        bootstrap_nodes.append(
            (f"content.{site_id}.{locale}", locale, "flexcms/container", f"content.{site_id}", site_id, locale)
        )
    for (path, name, rt, parent, sid, loc) in bootstrap_nodes:
        cur2.execute("SELECT path FROM content_nodes WHERE path = %s", (path,))
        if not cur2.fetchone():
            cur2.execute("""
                INSERT INTO content_nodes
                  (id, path, name, resource_type, parent_path, order_index, properties, version, status, site_id, locale, created_by, modified_by)
                VALUES
                  (gen_random_uuid(), %s, %s, %s, %s, 0, '{}'::jsonb, 1, 'PUBLISHED', %s, %s, 'system', 'system')
                ON CONFLICT (path) DO NOTHING
            """, (path, name, rt, parent, sid, loc))
            print(f"  Bootstrap DB: {path}")
    conn2.commit()
    cur2.close()
    conn2.close()

    # Create XFs for each site+locale
    for (site_id, locale, show_lang_sel) in sites:
        create_xf_for_site(site_id, locale, locale, show_lang_sel)

    # Phase 5: Content Pages
    print("\n=== Phase 5: Content Pages ===")
    for (site_id, locale, _) in sites:
        create_site_pages(site_id, locale)

    print("\n" + "=" * 60)
    print("  Seeding COMPLETE!")
    print("=" * 60)

if __name__ == "__main__":
    main()
