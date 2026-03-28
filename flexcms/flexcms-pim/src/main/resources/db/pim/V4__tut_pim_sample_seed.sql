-- =============================================================================
-- PIM V4: TUT Luxury Cars — Sample Product Data
-- Seeds the product schema, catalog, and 4 car models on fresh startup.
-- =============================================================================

-- ─── 1. PRODUCT SCHEMA ──────────────────────────────────────────────────────
INSERT INTO product_schemas (id, name, version, description, schema_def, attribute_groups, active, created_by)
VALUES (
    uuid_generate_v4(),
    'Luxury Vehicle v2026',
    '1.0',
    'Schema for TUT luxury vehicle product catalog 2026',
    '{
        "type": "object",
        "properties": {
            "name":              {"type": "string"},
            "tagline":           {"type": "string"},
            "description":       {"type": "string"},
            "bodyStyle":         {"type": "string", "enum": ["Sedan","SUV","Coupé","Convertible","GT"]},
            "year":              {"type": "integer"},
            "engineType":        {"type": "string", "enum": ["V8 Petrol","V12 Petrol","Hybrid","Full Electric"]},
            "horsepower":        {"type": "integer"},
            "torque":            {"type": "string"},
            "acceleration0to100":{"type": "string"},
            "topSpeed":          {"type": "string"},
            "transmission":      {"type": "string"},
            "exteriorColors":    {"type": "array", "items": {"type": "string"}},
            "interiorMaterials": {"type": "string"},
            "wheelSize":         {"type": "string"},
            "length":            {"type": "string"},
            "width":             {"type": "string"},
            "weight":            {"type": "string"},
            "infotainment":      {"type": "string"},
            "driverAssist":      {"type": "array", "items": {"type": "string"}},
            "connectivity":      {"type": "array", "items": {"type": "string"}},
            "basePrice_GBP":     {"type": "number"},
            "basePrice_EUR":     {"type": "number"},
            "basePrice_CAD":     {"type": "number"}
        }
    }'::jsonb,
    '{
        "General":     ["name","tagline","description","bodyStyle","year"],
        "Performance": ["engineType","horsepower","torque","acceleration0to100","topSpeed","transmission"],
        "Design":      ["exteriorColors","interiorMaterials","wheelSize","length","width","weight"],
        "Technology":  ["infotainment","driverAssist","connectivity"],
        "Pricing":     ["basePrice_GBP","basePrice_EUR","basePrice_CAD"]
    }'::jsonb,
    TRUE,
    'system'
) ON CONFLICT (name, version) DO NOTHING;

-- ─── 2. CATALOG ─────────────────────────────────────────────────────────────
INSERT INTO catalogs (id, name, year, season, description, schema_id, status, created_by)
SELECT
    uuid_generate_v4(),
    'TUT 2026 Model Lineup',
    2026,
    'Full Year',
    'Full TUT luxury vehicle lineup for 2026',
    ps.id,
    'ACTIVE',
    'system'
FROM product_schemas ps
WHERE ps.name = 'Luxury Vehicle v2026' AND ps.version = '1.0'
  AND NOT EXISTS (SELECT 1 FROM catalogs WHERE name = 'TUT 2026 Model Lineup');

-- ─── 3. PRODUCTS ────────────────────────────────────────────────────────────

-- TUT Sovereign
INSERT INTO products (id, sku, name, catalog_id, schema_id, attributes, status, created_by, updated_by)
SELECT
    uuid_generate_v4(),
    'TUT-SOVEREIGN-2026',
    'TUT Sovereign',
    c.id,
    c.schema_id,
    '{
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
        "exteriorColors": ["British Racing Green","Midnight Sapphire","Pearl White","Obsidian Black"],
        "interiorMaterials": "Hand-stitched Nappa leather, open-pore walnut veneer",
        "wheelSize": "21\" forged alloy",
        "length": "5,395 mm",
        "width": "1,950 mm",
        "weight": "2,340 kg",
        "infotainment": "12.3\" OLED touchscreen, 18-speaker Meridian surround",
        "driverAssist": ["Adaptive cruise","lane keep","night vision","360° camera"],
        "connectivity": ["5G","wireless CarPlay/Android Auto","OTA updates"],
        "basePrice_GBP": 285000,
        "basePrice_EUR": 325000,
        "basePrice_CAD": 420000
    }'::jsonb,
    'ACTIVE',
    'system',
    'system'
FROM catalogs c
WHERE c.name = 'TUT 2026 Model Lineup'
  AND NOT EXISTS (SELECT 1 FROM products WHERE sku = 'TUT-SOVEREIGN-2026');

-- TUT Vanguard
INSERT INTO products (id, sku, name, catalog_id, schema_id, attributes, status, created_by, updated_by)
SELECT
    uuid_generate_v4(),
    'TUT-VANGUARD-2026',
    'TUT Vanguard',
    c.id,
    c.schema_id,
    '{
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
        "exteriorColors": ["Glacier White","Volcano Red","Arctic Silver","Forest Green"],
        "interiorMaterials": "Semi-aniline leather, brushed aluminium trim",
        "wheelSize": "22\" diamond-cut alloy",
        "length": "5,200 mm",
        "width": "2,050 mm",
        "weight": "2,680 kg",
        "infotainment": "Dual 12.3\" displays, 20-speaker Bowers & Wilkins",
        "driverAssist": ["Terrain response","adaptive air suspension","trailer assist"],
        "connectivity": ["5G","wireless CarPlay/Android Auto","remote park"],
        "basePrice_GBP": 195000,
        "basePrice_EUR": 225000,
        "basePrice_CAD": 295000
    }'::jsonb,
    'ACTIVE',
    'system',
    'system'
FROM catalogs c
WHERE c.name = 'TUT 2026 Model Lineup'
  AND NOT EXISTS (SELECT 1 FROM products WHERE sku = 'TUT-VANGUARD-2026');

-- TUT Eclipse
INSERT INTO products (id, sku, name, catalog_id, schema_id, attributes, status, created_by, updated_by)
SELECT
    uuid_generate_v4(),
    'TUT-ECLIPSE-2026',
    'TUT Eclipse',
    c.id,
    c.schema_id,
    '{
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
        "exteriorColors": ["Electric Blue","Mercury Silver","Carbon Black"],
        "interiorMaterials": "Vegan ultra-suede, recycled carbon fibre",
        "wheelSize": "21\" aero-optimised alloy",
        "length": "4,890 mm",
        "width": "1,980 mm",
        "weight": "2,250 kg",
        "infotainment": "15.6\" curved OLED, augmented reality HUD",
        "driverAssist": ["Highway autopilot","auto park","predictive battery management"],
        "connectivity": ["5G","V2X communication","OTA updates","app remote control"],
        "basePrice_GBP": 245000,
        "basePrice_EUR": 280000,
        "basePrice_CAD": 365000
    }'::jsonb,
    'ACTIVE',
    'system',
    'system'
FROM catalogs c
WHERE c.name = 'TUT 2026 Model Lineup'
  AND NOT EXISTS (SELECT 1 FROM products WHERE sku = 'TUT-ECLIPSE-2026');

-- TUT Apex
INSERT INTO products (id, sku, name, catalog_id, schema_id, attributes, status, created_by, updated_by)
SELECT
    uuid_generate_v4(),
    'TUT-APEX-2026',
    'TUT Apex',
    c.id,
    c.schema_id,
    '{
        "name": "TUT Apex",
        "tagline": "Where passion meets precision",
        "description": "The Apex is a driver''s car in the purest sense. Lightweight carbon construction meets plug-in hybrid technology, delivering raw thrills with conscious efficiency.",
        "bodyStyle": "Coupé",
        "year": 2026,
        "engineType": "Hybrid",
        "horsepower": 650,
        "torque": "850 Nm",
        "acceleration0to100": "3.1s",
        "topSpeed": "320 km/h",
        "transmission": "7-speed dual-clutch",
        "exteriorColors": ["Racing Yellow","Titanium Grey","Deep Burgundy"],
        "interiorMaterials": "Alcantara sport seats, carbon fibre dash",
        "wheelSize": "20\" centre-lock forged",
        "length": "4,680 mm",
        "width": "1,960 mm",
        "weight": "1,780 kg",
        "infotainment": "10.25\" driver display, 9\" centre touchscreen",
        "driverAssist": ["Launch control","track mode","carbon ceramic brakes"],
        "connectivity": ["5G","telemetry data logging","pit-lane timer"],
        "basePrice_GBP": 225000,
        "basePrice_EUR": 260000,
        "basePrice_CAD": 340000
    }'::jsonb,
    'ACTIVE',
    'system',
    'system'
FROM catalogs c
WHERE c.name = 'TUT 2026 Model Lineup'
  AND NOT EXISTS (SELECT 1 FROM products WHERE sku = 'TUT-APEX-2026');

