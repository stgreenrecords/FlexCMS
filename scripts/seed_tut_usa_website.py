#!/usr/bin/env python3
"""Re-runnable TUT USA website seeder for E-15."""

from __future__ import annotations

import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable

import requests

AUTHOR_API = "http://localhost:8080"
USER_ID = "admin"
SITE_ID = "tut-usa"
ROOT_PATH = "tut-usa"
MISSING_ASSETS_PATH = Path(__file__).resolve().parent.parent / "Design" / "sample-website-tut" / "missing-assets.txt"


@dataclass(frozen=True)
class ModelData:
    key: str
    name: str
    slug: str
    family: str
    price: int
    range_miles: int
    horsepower: int
    torque: str
    zero_to_sixty: str
    drivetrain: str
    hero_line: str
    summary: str
    buyer: str
    colors: list[str]
    highlights: list[str]


@dataclass(frozen=True)
class TopicData:
    key: str
    title: str
    short_title: str
    summary: str
    benefit: str
    proof_points: list[str]


@dataclass(frozen=True)
class ArticleData:
    key: str
    headline: str
    subtitle: str
    author: str
    publish_date: str
    summary: str
    body_html: str


@dataclass(frozen=True)
class PageSpec:
    path: str
    title: str
    template: str
    description: str
    kind: str
    meta: dict[str, Any] = field(default_factory=dict)


MODELS: dict[str, ModelData] = {
    "tut-s": ModelData("tut-s", "TUT S", "tut-s", "Sedans", 129900, 420, 602, "612 lb-ft", "3.6 sec", "Dual-motor intelligent AWD", "The flagship sedan tuned for quiet authority and uncompromising pace.", "TUT S pairs a long-wheelbase executive cabin with rapid electric response, adaptive air suspension, and an interior trimmed for coast-to-coast comfort.", "Executives and owners who want limousine calm without giving up immediate performance.", ["Graphite Silver", "Onyx Black", "Satin Pearl", "Midnight Blue"], ["Executive rear comfort package", "Active rear steering", "Panoramic electrochromic roof"]),
    "tut-e": ModelData("tut-e", "TUT E", "tut-e", "Sedans", 93900, 388, 482, "528 lb-ft", "4.4 sec", "Rear-biased dual-motor AWD", "The executive sedan that makes every daily mile feel deliberately crafted.", "TUT E balances elegant proportions, confident electric torque, and a technology suite designed for buyers moving up from established German sport sedans.", "Drivers who want a refined daily luxury sedan with modern EV packaging and easy long-range usability.", ["Arctic White", "Graphite Silver", "Forest Stone", "Deep Burgundy"], ["Highway pilot assist", "19-speaker studio audio", "Heated comfort seating"]),
    "tut-x": ModelData("tut-x", "TUT X", "tut-x", "SUVs", 118500, 365, 644, "702 lb-ft", "3.8 sec", "Performance AWD with torque vectoring", "A luxury SUV shaped for mountain roads, winter highways, and dramatic arrivals.", "TUT X combines commanding ride height with serious acceleration, configurable cargo flexibility, and a cabin that feels like a private lounge between destinations.", "Families and founders who want utility, all-weather confidence, and super-sedan acceleration in one silhouette.", ["Storm Grey", "Obsidian Black", "Alpine White", "Bronze Quartz"], ["Tow-ready chassis package", "Five-zone climate control", "Adaptive load-leveling"]),
    "tut-q": ModelData("tut-q", "TUT Q", "tut-q", "SUVs", 104200, 352, 510, "585 lb-ft", "4.6 sec", "Dual-motor touring AWD", "Grand touring luxury for buyers who expect grace before theatrics.", "TUT Q is the calm, long-legged SUV in the range, prioritizing supple ride quality, rear-seat comfort, and elegant family travel over outright drama.", "Owners who value serene cruising, premium utility, and discreet design language.", ["Champagne Silver", "Navy Metallic", "Quartz White", "Warm Graphite"], ["Acoustic glass cabin", "Third-row occasional seating", "Concierge cabin fragrance system"]),
    "tut-eon": ModelData("tut-eon", "TUT Eon", "tut-eon", "Electric Vehicles", 136500, 471, 690, "740 lb-ft", "3.3 sec", "800V tri-zone thermal platform", "The all-electric grand tourer engineered to make range confidence feel effortless.", "TUT Eon leads the portfolio with an 800-volt architecture, ultra-fast charging behavior, and a long-body silhouette designed for high-speed interstate refinement.", "Early adopters, luxury EV shoppers, and innovation-first owners who want flagship technology leadership.", ["Liquid Titanium", "Polar White", "Ink Sapphire", "Copper Dusk"], ["800V fast charging", "Predictive route energy planning", "Executive recline rear seats"]),
}

TOPICS: dict[str, TopicData] = {
    "electrification": TopicData("electrification", "Electrification", "Electrification", "Battery architecture, thermal management, and charging intelligence designed to preserve confidence at real highway speeds.", "Owners get repeatable performance, predictable range, and charging behavior that feels premium instead of procedural.", ["800V battery switching", "Pre-conditioned DC charging", "Route-aware energy prediction"]),
    "performance-engineering": TopicData("performance-engineering", "Performance Engineering", "Performance", "Power delivery, chassis calibration, and aero management developed to feel decisive without losing day-long refinement.", "Drivers experience precision and calm in the same moment, whether on canyon roads or city commutes.", ["Rear-steer stability logic", "Air suspension body control", "Brake-by-wire confidence tuning"]),
    "driver-assistance": TopicData("driver-assistance", "Driver Assistance", "Driver Assistance", "Layered sensing, predictive alerts, and intervention logic shaped to reduce fatigue without undermining driver trust.", "Owners stay more relaxed in dense traffic, low visibility, and long-distance interstate driving.", ["Sensor fusion stack", "Night visibility overlays", "Lane confidence monitoring"]),
    "craftsmanship-and-materials": TopicData("craftsmanship-and-materials", "Craftsmanship & Materials", "Craftsmanship", "Material sourcing, trim fit, and tactile detailing that make engineering quality visible and touchable.", "The interior feels expensive because every interface, seam, and finish earns the impression over time.", ["Open-pore wood finishing", "Low-gloss metals", "Hand-reviewed stitch alignment"]),
    "connectivity-and-digital-cabin": TopicData("connectivity-and-digital-cabin", "Connectivity & Digital Cabin", "Digital Cabin", "A software environment focused on calm information hierarchy, over-the-air evolution, and passenger comfort controls.", "Drivers spend less time hunting through menus and more time using technology that anticipates intent.", ["Scene-based UI presets", "OTA feature cadence", "Passenger-first productivity tools"]),
}

ARTICLES: dict[str, ArticleData] = {
    "product-launch-article": ArticleData("product-launch-article", "TUT Eon arrives with 800-volt charging and a 471-mile EPA estimate", "The brand's new electric grand tourer brings flagship cabin comfort, faster charging behavior, and a wider owner travel envelope.", "Marina Cole, Senior Editor", "2026-02-18", "Launch coverage focused on range, thermal management, and premium long-distance usability.", "<p>TUT positioned the Eon as the flagship expression of its electric strategy, combining a low-slung grand touring shape with a thermal system designed for repeatable charging sessions.</p><p>At launch, engineers highlighted how predictive battery conditioning starts long before the final approach to a fast charger, allowing the car to hold stronger charging performance through real road-trip use.</p><p>Inside, the Eon leans into quiet luxury: softer acoustic isolation, rear executive seating, and a digital cabin tuned to reduce visual clutter. The result feels more like a private lounge than a technology showcase.</p>"),
    "press-release-article": ArticleData("press-release-article", "TUT expands U.S. retail support with five new metropolitan experience centers", "New locations in Dallas, Seattle, Washington D.C., Atlanta, and San Diego add concierge delivery, service intake, and immersive product consultations.", "Corporate Communications", "2026-01-09", "Corporate expansion news covering retail footprint and ownership support access.", "<p>TUT announced a measured expansion of its U.S. retail network, pairing each new experience center with certified service capacity and white-glove ownership support.</p><p>The company said the strategy is not about maximum store count. Instead, each location is designed to support premium retail consultation, test drives, delivery, and long-term service relationships in high-demand luxury markets.</p><p>Customers will be able to schedule model consultations, configure vehicles with product specialists, and access concierge delivery programs tailored to local market expectations.</p>"),
    "event-coverage-article": ArticleData("event-coverage-article", "Inside TUT's Monterey design preview: quieter cabins, warmer materials, smarter interfaces", "Media drives and studio walkthroughs put the spotlight on tactile quality and the next phase of the brand's digital-cabin strategy.", "Julian Park, Event Correspondent", "2026-03-03", "Event coverage centered on craftsmanship, design preview content, and hands-on media reaction.", "<p>At the Monterey preview, TUT spent less time quoting specifications and more time explaining why material warmth, acoustic calm, and interface restraint remain central to the brand's identity.</p><p>Design leaders walked media through new switchgear finishes, revised seat contouring, and a scene-based cabin interface meant to reduce distraction during long drives.</p><p>The event also previewed a new dealer training program so the ownership handoff matches the level of polish shown on stage.</p>"),
}


def form_field(name: str, label: str, field_type: str = "text", *, required: bool = False, placeholder: str | None = None) -> dict[str, Any]:
    return {"name": name, "label": label, "type": field_type, "required": required, "placeholder": placeholder or label}


def component(name: str, resource_type: str, properties: dict[str, Any], children: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    return {"name": name, "resourceType": resource_type, "properties": properties, "children": children or []}


class AssetLog:
    def __init__(self) -> None:
        self.entries: list[str] = []
        self.counter = 1

    def image(self, page_path: str, component_title: str, filename: str, resolution: str, description: str) -> str:
        self.entries.append(f"missing asset number {self.counter} {filename}, content/{page_path} ({component_title}), {resolution}, {description}")
        self.counter += 1
        return f"/dam/{SITE_ID}/missing/{filename}"

    def write(self) -> None:
        MISSING_ASSETS_PATH.parent.mkdir(parents=True, exist_ok=True)
        MISSING_ASSETS_PATH.write_text("\n".join(self.entries) + ("\n" if self.entries else ""), encoding="utf-8")


def api_request(method: str, path: str, *, expected: tuple[int, ...] = (200,), **kwargs: Any) -> requests.Response:
    response = requests.request(method, f"{AUTHOR_API}{path}", timeout=30, **kwargs)
    if response.status_code not in expected:
        raise RuntimeError(f"{method} {path} failed with {response.status_code}: {response.text[:500]}")
    return response


def get_node(path: str) -> dict[str, Any] | None:
    response = requests.get(f"{AUTHOR_API}/api/author/content/node", params={"path": path}, timeout=30)
    if response.status_code == 404:
        return None
    if not response.ok:
        raise RuntimeError(f"GET node {path} failed with {response.status_code}: {response.text[:300]}")
    return response.json()


def get_tree(path: str) -> dict[str, Any] | None:
    response = requests.get(f"{AUTHOR_API}/api/author/content/page", params={"path": path}, timeout=30)
    if response.status_code == 404:
        return None
    if not response.ok:
        raise RuntimeError(f"GET page {path} failed with {response.status_code}: {response.text[:300]}")
    return response.json()


def create_node(parent_path: str, name: str, resource_type: str, properties: dict[str, Any]) -> dict[str, Any]:
    payload = {"parentPath": parent_path, "name": name, "resourceType": resource_type, "properties": properties, "userId": USER_ID}
    response = requests.post(f"{AUTHOR_API}/api/author/content/node", json=payload, headers={"Content-Type": "application/json"}, timeout=30)
    if response.status_code == 409:
        existing = get_node(f"{parent_path}/{name}")
        if existing is None:
            raise RuntimeError(f"Node {parent_path}/{name} reported conflict but could not be fetched")
        return existing
    if not response.ok:
        raise RuntimeError(f"Create node {parent_path}/{name} failed with {response.status_code}: {response.text[:400]}")
    return response.json()


def update_properties(path: str, properties: dict[str, Any]) -> dict[str, Any]:
    payload = {"path": path, "properties": properties, "userId": USER_ID}
    return api_request("PUT", "/api/author/content/node/properties", json=payload, headers={"Content-Type": "application/json"}).json()


def ensure_node(parent_path: str, name: str, resource_type: str, properties: dict[str, Any]) -> dict[str, Any]:
    path = f"{parent_path}/{name}"
    existing = get_node(path)
    if existing:
        return update_properties(path, properties)
    return create_node(parent_path, name, resource_type, properties)


def delete_node(path: str) -> None:
    response = requests.delete(f"{AUTHOR_API}/api/author/content/node", params={"path": path, "userId": USER_ID}, timeout=30)
    if response.status_code == 404:
        return
    if not response.ok:
        raise RuntimeError(f"Delete node {path} failed with {response.status_code}: {response.text[:300]}")


def publish_path(path: str) -> None:
    api_request("POST", "/api/author/content/node/status", params={"path": path, "status": "PUBLISHED", "userId": USER_ID})


def write_component_tree(parent_path: str, nodes: list[dict[str, Any]], published_paths: list[str]) -> None:
    for node in nodes:
        created = ensure_node(parent_path, node["name"], node["resourceType"], node["properties"])
        created_path = created["path"].replace(".", "/").replace("content/", "", 1)
        published_paths.append(created_path)
        if node["children"]:
            write_component_tree(created_path, node["children"], published_paths)


def family_slug(family: str) -> str:
    return family.lower().replace(" ", "-")


def page_metadata(spec: PageSpec) -> dict[str, Any]:
    return component("page-metadata", "tut-usa/layout-page-structure/page-metadata", {"pageTitle": spec.title, "slug": spec.path.split("/")[-1], "template": spec.template, "tags": [SITE_ID, spec.kind, *spec.meta.get("tags", [])], "publishDate": spec.meta.get("publishDate", "2026-03-29")})


def link(path: str) -> dict[str, str]:
    title = PAGE_INDEX[path].title
    return {"label": title, "url": "/" + path}


def breadcrumb_items(path: str) -> list[dict[str, str]]:
    items = [{"label": "Home", "url": "/tut-usa/home"}]
    parts = path.split("/")
    running: list[str] = []
    for part in parts:
        if part == "home":
            continue
        running.append(part)
        joined = "/".join(running)
        if joined == "tut-usa":
            continue
        title = PAGE_INDEX.get(joined, PageSpec("", part.replace("-", " ").title(), "", "", "")).title
        items.append({"label": title, "url": "/" + joined})
    return items


def breadcrumb_component(spec: PageSpec) -> dict[str, Any]:
    return component("breadcrumb", "tut-usa/navigation-search-discovery/breadcrumb", {"items": breadcrumb_items(spec.path)[1:], "showHome": True})


def page_header(spec: PageSpec, assets: AssetLog) -> dict[str, Any]:
    bg = assets.image(spec.path, "Page Header", f"{spec.path.replace('/', '-')}-page-header.jpg", "1920x600", f"Wide cinematic banner for {spec.title}, premium automotive art direction, balanced lighting, calm luxury mood, polished neutral palette, editorial composition.")
    return component("page-header", "tut-usa/layout-page-structure/page-header", {"title": spec.title, "subtitle": spec.description, "backgroundImage": bg, "breadcrumbs": breadcrumb_items(spec.path)})


def model_cards(model_keys: list[str], assets: AssetLog, page_path: str) -> list[dict[str, Any]]:
    items = []
    for key in model_keys:
        model = MODELS[key]
        items.append({"productName": model.name, "image": assets.image(page_path, "Product Grid", f"{page_path.replace('/', '-')}-{model.slug}-card.jpg", "600x600", f"Premium studio image of {model.name}, front three-quarter angle, crisp reflections, dark satin floor, luxury automotive launch photography."), "price": model.price, "cta": {"label": "Explore", "url": f"/tut-usa/vehicles/{family_slug(model.family)}/{model.slug}"}})
    return items


def vehicle_feature_list(model: ModelData) -> list[dict[str, str]]:
    return [
        {"title": "Range Confidence", "description": f"Up to {model.range_miles} miles of EPA-estimated range with route-aware conditioning."},
        {"title": "Power Delivery", "description": f"{model.horsepower} hp and {model.torque} tuned for immediate, refined acceleration."},
        {"title": "Cabin Experience", "description": f"{model.highlights[0]} with materials and acoustics tailored to {model.buyer.lower()}."},
    ]


def home_components(spec: PageSpec, assets: AssetLog) -> list[dict[str, Any]]:
    return [
        page_metadata(spec),
        component("hero-banner", "tut-usa/calls-to-action-promotions-campaigns/hero-banner", {"eyebrow": "TUT USA", "headline": "Luxury electric touring, resolved for real life.", "subheadline": "Explore the sedan, SUV, and flagship EV range with trusted specs, design stories, and concierge-led conversion paths.", "backgroundImage": assets.image(spec.path, "Hero Banner", "tut-usa-home-hero.jpg", "1920x820", "Front three-quarter hero scene showing the TUT lineup at sunrise on a modern coastal residence drive, polished concrete, warm gold light, premium understated luxury mood."), "primaryCta": {"label": "Explore Vehicles", "url": "/tut-usa/vehicles"}, "secondaryCta": {"label": "Book a Test Drive", "url": "/tut-usa/offers-and-finance/book-a-test-drive"}}),
        component("product-grid", "tut-usa/commerce-catalog-merchandising/product-grid", {"title": "Highlighted Vehicles", "products": model_cards(["tut-s", "tut-x", "tut-eon"], assets, spec.path), "columns": 3, "enableSorting": False}),
        component("feature-list", "tut-usa/editorial-article-content/feature-list", {"title": "Why TUT USA feels different", "features": [{"title": "Product storytelling", "description": "Every top-tier page translates engineering into buyer-relevant outcomes.", "icon": ""}, {"title": "High-touch retail", "description": "Dealer locator, concierge contact, and appointment pathways stay visible without becoming aggressive.", "icon": ""}, {"title": "Ownership clarity", "description": "Manuals, service, charging, and support content are structured to feel dependable under pressure.", "icon": ""}], "iconStyle": "none"}),
        component("featured-content", "tut-usa/calls-to-action-promotions-campaigns/featured-content", {"title": "Featured stories", "items": ["Electrification systems that preserve confidence at highway speeds.", "Monterey design preview: materials, interfaces, and quiet luxury.", "Owners hub: service, manuals, warranty, and EV guidance in one place."], "layout": "grid"}),
        component("latest-news", "tut-usa/editorial-article-content/latest-news", {"title": "Latest updates", "source": "TUT Newsroom", "count": 3, "showDates": True}),
        component("dealer-locator", "tut-usa/location-local-physical-presence/dealer-locator", {"title": "Find a nearby TUT retailer", "apiEndpoint": "/api/retail/dealers", "radiusOptions": [25, 50, 100], "filters": [{"label": "Sales", "value": "sales"}, {"label": "Service", "value": "service"}, {"label": "EV specialist", "value": "ev"}]}),
        component("newsletter-signup", "tut-usa/calls-to-action-promotions-campaigns/newsletter-signup", {"title": "Stay close to launch news and owner insights", "description": "Receive thoughtful updates on product launches, dealer experiences, charging education, and invitation-only retail events.", "formReference": "tut-usa-newsletter", "successMessage": "You are subscribed.", "consentText": "I consent to receiving product and ownership updates from TUT USA."}),
    ]


def model_overview_components(spec: PageSpec, assets: AssetLog) -> list[dict[str, Any]]:
    model_keys = spec.meta.get("models", list(MODELS.keys()))
    return [
        page_metadata(spec),
        page_header(spec, assets),
        component("product-hero", "tut-usa/calls-to-action-promotions-campaigns/product-hero", {"title": spec.title, "description": spec.description, "items": [MODELS[k].hero_line for k in model_keys[:3]], "layout": "centered", "cta": {"label": "Compare Vehicles", "url": "/tut-usa/vehicles/compare-vehicles"}}),
        component("category-grid", "tut-usa/navigation-search-discovery/category-grid", {"title": "Browse by segment", "categories": model_keys, "columns": min(3, max(2, len(model_keys)))}),
        component("product-grid", "tut-usa/commerce-catalog-merchandising/product-grid", {"title": "Available models", "products": model_cards(model_keys, assets, spec.path), "columns": 3 if len(model_keys) > 2 else 2, "enableSorting": True}),
        component("filter-panel", "tut-usa/layout-page-structure/filter-panel", {"title": "Refine your shortlist", "filters": [{"label": "Powertrain", "options": ["All-electric", "Performance AWD", "Executive touring"]}, {"label": "Body style", "options": [MODELS[k].family[:-1] if MODELS[k].family.endswith("s") else MODELS[k].family for k in model_keys]}], "applyMode": "manual"}),
        component("sort-control", "tut-usa/layout-page-structure/sort-control", {"label": "Sort", "options": ["Featured", "Price", "Range", "Acceleration"], "defaultOption": "Featured"}),
        component("comparison-tool", "tut-usa/commerce-catalog-merchandising/comparison-tool", {"title": "Compare key figures", "comparisonFields": ["Price", "Range", "0-60", "Drivetrain"], "maxItems": min(4, len(model_keys)), "items": [{"name": MODELS[k].name, "image": assets.image(spec.path, "Comparison Tool", f"{spec.path.replace('/', '-')}-{k}-compare.jpg", "600x400", f"{MODELS[k].name} comparison image on a premium dealership forecourt with overcast editorial lighting."), "values": {"Price": f"${MODELS[k].price:,}", "Range": f"{MODELS[k].range_miles} mi", "0-60": MODELS[k].zero_to_sixty, "Drivetrain": MODELS[k].drivetrain}} for k in model_keys]}),
        component("cta-button", "tut-usa/calls-to-action-promotions-campaigns/cta-button", {"label": "Book a guided consultation", "url": "/tut-usa/contact-and-concierge/concierge-request", "styleVariant": "primary", "openInNewTab": False}),
    ]


def model_detail_components(spec: PageSpec, assets: AssetLog) -> list[dict[str, Any]]:
    model = MODELS[spec.meta["model"]]
    return [
        page_metadata(spec),
        breadcrumb_component(spec),
        component("product-hero", "tut-usa/calls-to-action-promotions-campaigns/product-hero", {"title": model.name, "description": model.summary, "items": model.highlights, "layout": "centered", "cta": {"label": "Build This Vehicle", "url": f"/{spec.path}/build-{model.slug}"}}),
        component("product-gallery", "tut-usa/commerce-catalog-merchandising/product-gallery", {"title": f"{model.name} gallery", "images": [assets.image(spec.path, "Product Gallery", f"{model.slug}-gallery-front.jpg", "960x720", f"{model.name} front three-quarter rolling shot, wet road reflections, dusk blue sky, premium cinematic automotive photography."), assets.image(spec.path, "Product Gallery", f"{model.slug}-gallery-rear.jpg", "960x720", f"{model.name} rear design detail on a private coastal overlook, soft sunset rim light, high-end editorial composition."), assets.image(spec.path, "Product Gallery", f"{model.slug}-gallery-interior.jpg", "960x720", f"{model.name} interior cockpit view, warm ambient cabin lighting, stitched leather detail, luxury design photography.")], "layout": "grid", "thumbnailPosition": "bottom"}),
        component("feature-list", "tut-usa/editorial-article-content/feature-list", {"title": f"{model.name} highlights", "features": vehicle_feature_list(model), "iconStyle": "none"}),
        component("product-specs", "tut-usa/commerce-catalog-merchandising/product-specs", {"title": "Key specifications", "specGroups": [{"groupName": "Performance", "specs": [{"name": "Horsepower", "value": str(model.horsepower)}, {"name": "Torque", "value": model.torque}, {"name": "0-60 mph", "value": model.zero_to_sixty}]}, {"groupName": "Ownership", "specs": [{"name": "Range", "value": f"{model.range_miles} miles"}, {"name": "Drivetrain", "value": model.drivetrain}, {"name": "Starting price", "value": f"${model.price:,}"}]}], "downloadSheet": f"/docs/{model.slug}-spec-sheet.pdf"}),
        component("comparison-tool", "tut-usa/commerce-catalog-merchandising/comparison-tool", {"title": f"How {model.name} stacks up", "comparisonFields": ["Price", "Range", "0-60"], "maxItems": 2, "items": [{"name": model.name, "image": assets.image(spec.path, "Comparison Tool", f"{model.slug}-compare-self.jpg", "600x400", f"{model.name} hero image for comparison module, studio side profile, clean neutral backdrop."), "values": {"Price": f"${model.price:,}", "Range": f"{model.range_miles} mi", "0-60": model.zero_to_sixty}}, {"name": "Luxury segment benchmark", "image": assets.image(spec.path, "Comparison Tool", f"{model.slug}-compare-benchmark.jpg", "600x400", "Generic benchmark luxury vehicle silhouette, subdued lighting, neutral editorial backdrop for comparison context."), "values": {"Price": f"${model.price + 6000:,}", "Range": f"{max(model.range_miles - 25, 300)} mi", "0-60": "4.8 sec"}}]}),
        component("offer-card", "tut-usa/calls-to-action-promotions-campaigns/offer-card", {"title": f"{model.name} launch consultation", "description": f"Reserve a product specialist session to review {model.colors[0]} and {model.colors[1]} finishes, ownership plans, and delivery timing.", "offerCode": model.slug.upper().replace("-", "") + "USA", "expiryDate": "2026-06-30", "cta": {"label": "Request a quote", "url": "/tut-usa/offers-and-finance/financing-and-leasing"}}),
        component("dealer-locator", "tut-usa/location-local-physical-presence/dealer-locator", {"title": f"Find a {model.name} retailer", "apiEndpoint": "/api/retail/dealers", "radiusOptions": [25, 50, 100], "filters": [{"label": "Demo vehicle", "value": "demo"}, {"label": "Delivery concierge", "value": "concierge"}]}),
        component("recommended-articles", "tut-usa/navigation-search-discovery/recommended-articles", {"title": "Related stories", "articles": ["Charging confidence on long U.S. routes", "Why TUT calibrates ride comfort before outright spectacle", f"{model.name} buyer guide: which package fits your routine?"]}),
        component("cta-button", "tut-usa/calls-to-action-promotions-campaigns/cta-button", {"label": "Start your build", "url": f"/tut-usa/vehicles/{family_slug(model.family)}/{model.slug}/build-{model.slug}", "styleVariant": "primary", "openInNewTab": False}),
    ]


def build_configure_components(spec: PageSpec, assets: AssetLog) -> list[dict[str, Any]]:
    model = MODELS[spec.meta["model"]]
    return [
        page_metadata(spec),
        page_header(spec, assets),
        component("configurator", "tut-usa/commerce-catalog-merchandising/configurator", {"title": f"Configure {model.name}", "steps": [{"title": "Exterior finish", "options": [{"label": color, "value": color} for color in model.colors]}, {"title": "Wheel design", "options": [{"label": "20-inch forged", "value": "20-forged", "price": 0}, {"label": "21-inch aero polished", "value": "21-aero", "price": 1800}]}, {"title": "Interior experience", "options": [{"label": "Performance cabin", "value": "performance", "price": 0}, {"label": "Executive lounge", "value": "executive", "price": 4500}]}], "pricingLogic": "Base MSRP plus selected options and destination.", "completionCta": {"label": "Send configuration to retailer", "url": "/tut-usa/contact-and-concierge/concierge-request"}}),
        component("pricing-table", "tut-usa/calls-to-action-promotions-campaigns/pricing-table", {"title": f"{model.name} package guide", "plans": [{"name": "Core", "price": f"${model.price:,}", "billingLabel": "Base MSRP", "features": [model.highlights[0], "Premium audio", "Adaptive air suspension"], "cta": {"label": "Choose Core", "url": "#"}, "badge": ""}, {"name": "Signature", "price": f"${model.price + 6200:,}", "billingLabel": "Most selected", "features": [model.highlights[0], model.highlights[1], "Extended leather package"], "cta": {"label": "Choose Signature", "url": "#"}, "badge": "Popular"}, {"name": "Atelier", "price": f"${model.price + 13800:,}", "billingLabel": "Coachbuilt options", "features": [model.highlights[0], model.highlights[2], "Bespoke material consultation"], "cta": {"label": "Choose Atelier", "url": "#"}, "badge": "Bespoke"}], "highlightedPlan": "Signature", "billingToggle": False}),
        component("calculator", "tut-usa/forms-data-capture-consent/calculator", {"title": "Estimate your monthly structure", "inputs": [{"label": "Down payment", "name": "down-payment", "min": 5000, "max": 60000, "defaultValue": 15000, "unit": "USD"}, {"label": "Term length", "name": "term", "min": 24, "max": 72, "defaultValue": 48, "unit": "months"}, {"label": "Miles per year", "name": "mileage", "min": 8000, "max": 18000, "defaultValue": 12000, "unit": "mi"}], "formula": "Illustrative only", "resultLabel": "Estimated payment", "disclaimer": "Illustrative only - retailer will confirm taxes and fees."}),
        component("offer-card-alt", "tut-usa/calls-to-action-promotions-campaigns/offer-card-alt", {"title": "Configuration next steps", "description": f"Have a retailer review the {model.name} you built, confirm color allocation, and propose delivery timing.", "items": ["Retail consultation within 1 business day", "Reserved test-drive slot", "Estimated delivery window aligned to your selected trim"], "layout": "list", "cta": {"label": "Request retailer follow-up", "url": "/tut-usa/contact-and-concierge/contact-us"}}),
        component("cta-button", "tut-usa/calls-to-action-promotions-campaigns/cta-button", {"label": "Compare with another TUT", "url": f"/tut-usa/vehicles/{family_slug(model.family)}/{model.slug}/compare-{model.slug}", "styleVariant": "secondary", "openInNewTab": False}),
    ]


def compare_components(spec: PageSpec, assets: AssetLog) -> list[dict[str, Any]]:
    preferred = spec.meta.get("model")
    if preferred:
        group = [preferred] + [key for key, model in MODELS.items() if model.family == MODELS[preferred].family and key != preferred]
        compare_keys = group[:2]
    else:
        compare_keys = ["tut-s", "tut-x", "tut-eon"]
    return [
        page_metadata(spec),
        page_header(spec, assets),
        component("comparison-tool", "tut-usa/commerce-catalog-merchandising/comparison-tool", {"title": spec.title, "comparisonFields": ["Price", "Range", "Horsepower", "0-60", "Drivetrain"], "maxItems": len(compare_keys), "items": [{"name": MODELS[key].name, "image": assets.image(spec.path, "Comparison Tool", f"{spec.path.replace('/', '-')}-{key}.jpg", "600x400", f"{MODELS[key].name} comparison render on neutral premium backdrop, clear silhouette and wheel detail."), "values": {"Price": f"${MODELS[key].price:,}", "Range": f"{MODELS[key].range_miles} mi", "Horsepower": str(MODELS[key].horsepower), "0-60": MODELS[key].zero_to_sixty, "Drivetrain": MODELS[key].drivetrain}} for key in compare_keys]}),
        component("feature-comparison", "tut-usa/editorial-article-content/feature-comparison", {"title": "What changes across the shortlist", "columns": [{"label": MODELS[key].name} for key in compare_keys], "rows": [{"feature": "Best use", **{MODELS[key].name: MODELS[key].buyer for key in compare_keys}}, {"feature": "Signature strength", **{MODELS[key].name: MODELS[key].highlights[0] for key in compare_keys}}], "highlightDifferences": True}),
        component("cta-button", "tut-usa/calls-to-action-promotions-campaigns/cta-button", {"label": "Talk to a product specialist", "url": "/tut-usa/contact-and-concierge/concierge-request", "styleVariant": "primary", "openInNewTab": False}),
    ]


def innovation_hub_components(spec: PageSpec, assets: AssetLog) -> list[dict[str, Any]]:
    return [
        page_metadata(spec),
        page_header(spec, assets),
        component("brand-story-hero", "tut-usa/calls-to-action-promotions-campaigns/brand-story-hero", {"title": spec.title, "description": spec.description, "items": [topic.summary for topic in TOPICS.values()], "layout": "centered", "cta": {"label": "Explore the digital cabin story", "url": "/tut-usa/innovation/connectivity-and-digital-cabin"}}),
        component("feature-list", "tut-usa/editorial-article-content/feature-list", {"title": "Innovation themes", "features": [{"title": topic.title, "description": topic.benefit} for topic in TOPICS.values()], "iconStyle": "none"}),
        component("resource-list", "tut-usa/media-visual-storytelling-assets/resource-list", {"title": "Research-backed explainers", "resources": [f"/innovation/{topic.key}" for topic in TOPICS.values()], "cta": {"label": "Open newsroom", "url": "/tut-usa/news-and-updates"}}),
        component("cta-button", "tut-usa/calls-to-action-promotions-campaigns/cta-button", {"label": "See featured models", "url": "/tut-usa/vehicles", "styleVariant": "primary", "openInNewTab": False}),
    ]


def innovation_detail_components(spec: PageSpec, assets: AssetLog) -> list[dict[str, Any]]:
    topic = TOPICS[spec.meta["topic"]]
    return [
        page_metadata(spec),
        breadcrumb_component(spec),
        page_header(spec, assets),
        component("rich-text-block", "tut-usa/editorial-article-content/rich-text-block", {"heading": topic.title, "body": f"<p>{topic.summary}</p><p>{topic.benefit}</p>", "alignment": "left", "backgroundColor": "", "spacing": "medium"}),
        component("feature-list", "tut-usa/editorial-article-content/feature-list", {"title": "Proof points", "features": [{"title": point, "description": f"{point} is translated into customer language so shoppers understand the ownership outcome."} for point in topic.proof_points], "iconStyle": "none"}),
        component("fact-box", "tut-usa/editorial-article-content/fact-box", {"title": "Why it matters", "text": topic.benefit, "icon": "", "variant": "info"}),
        component("related-content", "tut-usa/navigation-search-discovery/related-content", {"title": "Related vehicles", "items": [MODELS["tut-eon"].name, MODELS["tut-s"].name]}),
        component("cta-button", "tut-usa/calls-to-action-promotions-campaigns/cta-button", {"label": "Book a product walkthrough", "url": "/tut-usa/contact-and-concierge/concierge-request", "styleVariant": "primary", "openInNewTab": False}),
        component("video-embed", "tut-usa/media-visual-storytelling-assets/video-embed", {"title": f"{topic.short_title} deep dive", "videoUrl": "/media/tut-innovation-overview.mp4", "posterImage": assets.image(spec.path, "Video Embed", f"{spec.path.replace('/', '-')}-poster.jpg", "1280x720", f"Technical close-up illustrating {topic.short_title.lower()} systems, low-key lighting, premium engineering documentary style."), "transcript": f"TUT engineers explain how {topic.short_title.lower()} decisions influence customer confidence, refinement, and trust.", "autoplay": False}),
    ]


def news_landing_components(spec: PageSpec, assets: AssetLog) -> list[dict[str, Any]]:
    return [
        page_metadata(spec),
        page_header(spec, assets),
        component("search-bar", "tut-usa/navigation-search-discovery/search-bar", {"placeholder": "Search product launches, events, and press releases"}),
        component("filter-panel", "tut-usa/layout-page-structure/filter-panel", {"title": "Refine updates", "filters": [{"label": "Type", "options": ["Launch", "Press release", "Event coverage"]}, {"label": "Audience", "options": ["Press", "Owners", "Shoppers", "Investors"]}], "applyMode": "manual"}),
        component("sort-control", "tut-usa/layout-page-structure/sort-control", {"label": "Sort", "options": ["Newest first", "Featured", "Most relevant"], "defaultOption": "Newest first"}),
        component("blog-listing", "tut-usa/editorial-article-content/blog-listing", {"title": "Stories and announcements", "posts": list(ARTICLES.keys()), "showPagination": True, "enableTagFilter": True}),
        component("latest-news", "tut-usa/editorial-article-content/latest-news", {"title": "Headlines this month", "source": "TUT Newsroom", "count": 3, "showDates": True}),
        component("pagination", "tut-usa/layout-page-structure/pagination", {"currentPage": 1, "totalPages": 3, "baseUrl": f"/{spec.path}", "showFirstLast": True}),
    ]


def article_detail_components(spec: PageSpec, assets: AssetLog) -> list[dict[str, Any]]:
    article = ARTICLES[spec.meta["article"]]
    return [
        page_metadata(spec),
        breadcrumb_component(spec),
        component("article-detail", "tut-usa/editorial-article-content/article-detail", {"headline": article.headline, "subtitle": article.subtitle, "heroImage": assets.image(spec.path, "Article Detail", f"{spec.path.replace('/', '-')}-hero.jpg", "1920x1080", f"Editorial news hero for {article.headline}, premium automotive press photography, realistic event or studio setting, sharp subject separation."), "body": article.body_html, "author": article.author, "publishDate": article.publish_date}),
        component("author-list", "tut-usa/editorial-article-content/author-list", {"title": "Contributors", "authors": [article.author], "showBio": False}),
        component("estimated-read-time", "tut-usa/editorial-article-content/estimated-read-time", {"minutes": 4, "label": "Estimated read time"}),
        component("table-of-contents", "tut-usa/editorial-article-content/table-of-contents", {"title": "In this story", "items": [{"label": "Launch summary", "url": "#summary"}, {"label": "Why it matters", "url": "#impact"}, {"label": "Next steps", "url": "#next"}], "sticky": False}),
        component("social-share", "tut-usa/community-social-proof-engagement/social-share", {"title": "Share", "networks": ["LinkedIn", "X", "Email"], "shareUrl": f"https://www.tutmotors.com/{spec.path}", "shareText": article.headline}),
        component("related-content", "tut-usa/navigation-search-discovery/related-content", {"title": "Related coverage", "items": [ARTICLES["product-launch-article"].headline, ARTICLES["press-release-article"].headline, ARTICLES["event-coverage-article"].headline]}),
        component("press-kit", "tut-usa/media-visual-storytelling-assets/press-kit", {"title": "Press kit", "companyOverview": "<p>TUT USA press resources include approved brand copy, executive quotes, and downloadable product imagery requests.</p>", "assets": ["/press/tut-usa-brand-overview.pdf", "/press/tut-eon-launch-factsheet.pdf"], "contact": "media@tutmotors.com"}),
        component("media-coverage-card", "tut-usa/media-visual-storytelling-assets/media-coverage-card", {"publication": "Mobility Review", "headline": "Why TUT's quiet-luxury strategy is resonating in the U.S.", "date": "2026-03-05", "url": "https://example.com/mobility-review", "logo": assets.image(spec.path, "Media Coverage Card", f"{spec.path.replace('/', '-')}-logo.png", "120x40", "Monochrome publication wordmark for editorial media coverage card, transparent background, crisp vector-style finish.")}),
    ]


def owners_hub_components(spec: PageSpec, assets: AssetLog) -> list[dict[str, Any]]:
    return [
        page_metadata(spec),
        page_header(spec, assets),
        component("search-bar", "tut-usa/navigation-search-discovery/search-bar", {"placeholder": "Search manuals, charging, warranty, and service topics"}),
        component("side-navigation", "tut-usa/navigation-search-discovery/side-navigation", {"title": "Owners hub", "items": [link("tut-usa/owners/manuals-and-technical-documents"), link("tut-usa/owners/service-and-maintenance"), link("tut-usa/owners/charging-and-ev-ownership"), link("tut-usa/owners/warranty-and-coverage")], "sticky": True}),
        component("category-grid", "tut-usa/navigation-search-discovery/category-grid", {"title": "Choose a pathway", "categories": ["Manuals", "Service", "Charging", "Warranty"], "columns": 2}),
        component("quick-links", "tut-usa/editorial-article-content/quick-links", {"title": "Owner shortcuts", "links": [link("tut-usa/owners/manuals-and-technical-documents"), link("tut-usa/offers-and-finance/find-a-dealer"), link("tut-usa/contact-and-concierge/roadside-and-emergency-help")], "iconMode": True}),
        component("warranty-registration", "tut-usa/forms-data-capture-consent/warranty-registration", {"title": "Register a recently delivered vehicle", "fields": [form_field("owner-name", "Owner name", required=True), form_field("email", "Email", "email", required=True), form_field("delivery-date", "Delivery date", "date")], "productLookup": True, "submitAction": "/owners/warranty/register"}),
        component("vin-lookup", "tut-usa/forms-data-capture-consent/vin-lookup", {"title": "Lookup build-specific guidance", "inputLabel": "Vehicle Identification Number", "validationPattern": "^[A-HJ-NPR-Z0-9]{17}$", "submitAction": "/owners/vin/lookup"}),
        component("resource-list", "tut-usa/media-visual-storytelling-assets/resource-list", {"title": "Most-used owner resources", "resources": ["/docs/tut-eon-charging-guide.pdf", "/docs/tut-s-delivery-guide.pdf", "/docs/tut-usa-warranty-overview.pdf"], "cta": {"label": "Open manuals library", "url": "/tut-usa/owners/manuals-and-technical-documents"}}),
        component("contact-card", "tut-usa/community-social-proof-engagement/contact-card", {"name": "Owner Support Concierge", "role": "Ownership specialist", "email": "owners@tutmotors.com", "phone": "1-800-888-0101", "photo": assets.image(spec.path, "Contact Card", f"{spec.path.replace('/', '-')}-concierge.jpg", "80x80", "Portrait of a professional luxury automotive concierge, studio headshot, warm neutral background, approachable premium service tone.")}),
    ]


def manual_components(spec: PageSpec, assets: AssetLog) -> list[dict[str, Any]]:
    return [
        page_metadata(spec),
        breadcrumb_component(spec),
        component("knowledge-base-article", "tut-usa/editorial-article-content/knowledge-base-article", {"title": spec.title, "summary": spec.description, "body": "<p>This page centralizes owner documentation, quick-start instructions, and downloadable technical references for U.S. delivered vehicles.</p><p>Use the table of contents to jump to charging, safety, storage, and maintenance sections without scrolling through unrelated content.</p>", "category": "Owner documentation", "relatedArticles": ["Charging & EV Ownership", "Safety & Assistance How-To", "Warranty & Coverage"]}),
        component("table-of-contents", "tut-usa/editorial-article-content/table-of-contents", {"title": "On this page", "items": [{"label": "Delivery checklist", "url": "#delivery"}, {"label": "Charging basics", "url": "#charging"}, {"label": "Service intervals", "url": "#service"}], "sticky": False}),
        component("anchor-links", "tut-usa/navigation-search-discovery/anchor-links", {"links": [{"label": "Battery care", "url": "#battery-care"}, {"label": "Cold weather", "url": "#cold-weather"}, {"label": "Software", "url": "#software"}], "orientation": "horizontal"}),
        component("document-download", "tut-usa/media-visual-storytelling-assets/document-download", {"title": "Owner manual PDF", "description": "Full downloadable PDF with searchable sections for setup, charging, storage, and service planning.", "file": "/docs/tut-usa-owner-manual.pdf", "fileType": "PDF", "fileSize": "12.4 MB"}),
        component("framed-message", "tut-usa/layout-page-structure/framed-message", {"title": "Important", "message": "Always confirm tire pressure and charging connector cleanliness before long-distance travel.", "styleVariant": "info", "icon": ""}),
    ]


def service_components(spec: PageSpec, assets: AssetLog) -> list[dict[str, Any]]:
    return [
        page_metadata(spec),
        page_header(spec, assets),
        component("feature-list", "tut-usa/editorial-article-content/feature-list", {"title": "Service commitments", "features": [{"title": "Predictive maintenance", "description": "Intervals are based on usage patterns, not generic ownership assumptions."}, {"title": "Retailer transparency", "description": "Owners receive concise service summaries, timing windows, and pickup coordination details."}, {"title": "Parts quality", "description": "Certified parts and software updates are tracked against VIN-specific service history."}], "iconStyle": "none"}),
        component("faq", "tut-usa/editorial-article-content/faq", {"title": "Common service questions", "questions": [{"question": "How often should brake fluid be inspected?", "answer": "TUT recommends inspection during each annual service review or whenever brake feel changes."}, {"question": "Can I book valet pickup?", "answer": "Select retailers offer covered pickup and delivery in major metro areas."}], "schemaMarkup": False}),
        component("service-center-card", "tut-usa/location-local-physical-presence/service-center-card", {"name": "TUT Manhattan Service Atelier", "address": "605 West 54th Street, New York, NY 10019", "phone": "1-646-555-0148", "services": ["Routine maintenance", "Software updates", "Battery diagnostics"], "appointmentUrl": "/tut-usa/offers-and-finance/book-a-test-drive"}),
        component("appointment-scheduler", "tut-usa/events-booking-travel-hospitality/appointment-scheduler", {"title": "Schedule service intake", "calendarSource": "retail-service-calendar", "durationOptions": [30, 45, 60], "timeZone": "Eastern Time"}),
        component("contact-card", "tut-usa/community-social-proof-engagement/contact-card", {"name": "Regional Service Lead", "role": "After-sales support", "email": "service@tutmotors.com", "phone": "1-800-888-0122", "photo": assets.image(spec.path, "Contact Card", f"{spec.path.replace('/', '-')}-service-lead.jpg", "80x80", "Portrait of a premium service advisor, studio headshot, navy wardrobe, polished and reassuring expression.")}),
        component("framed-message", "tut-usa/layout-page-structure/framed-message", {"title": "Planning ahead", "message": "Book maintenance two weeks early before holiday travel or peak winter service periods.", "styleVariant": "warning", "icon": ""}),
    ]


def locator_components(spec: PageSpec, assets: AssetLog) -> list[dict[str, Any]]:
    return [
        page_metadata(spec),
        page_header(spec, assets),
        component("search-bar", "tut-usa/navigation-search-discovery/search-bar", {"placeholder": "Search by ZIP code, city, or metro area"}),
        component("dealer-locator", "tut-usa/location-local-physical-presence/dealer-locator", {"title": "Locate a TUT retailer", "apiEndpoint": "/api/retail/dealers", "radiusOptions": [25, 50, 100, 150], "filters": [{"label": "Sales", "value": "sales"}, {"label": "Service", "value": "service"}, {"label": "Charging support", "value": "charging"}]}),
        component("interactive-map", "tut-usa/location-local-physical-presence/interactive-map", {"title": "Retail coverage", "mapDataSource": "https://maps.example.com/tut-usa", "defaultRegion": "United States", "legend": [{"label": "Experience center", "color": "#d4af37"}, {"label": "Service center", "color": "#4f46e5"}]}),
        component("location-card", "tut-usa/location-local-physical-presence/location-card", {"name": "TUT Beverly Hills Studio", "address": "402 North Canon Drive, Beverly Hills, CA 90210", "phone": "1-310-555-0162", "hours": "Mon-Sat 9:00 AM - 7:00 PM\nSun 11:00 AM - 5:00 PM", "mapLink": "https://maps.example.com/tut-beverly-hills"}),
        component("contact-card", "tut-usa/community-social-proof-engagement/contact-card", {"name": "Retail Experience Desk", "role": "Dealer support", "email": "retail@tutmotors.com", "phone": "1-800-888-0135", "photo": assets.image(spec.path, "Contact Card", f"{spec.path.replace('/', '-')}-retail-desk.jpg", "80x80", "Portrait of a retailer experience coordinator, premium hospitality styling, soft natural light, approachable expression.")}),
        component("office-location", "tut-usa/brand-corporate-investor-governance/office-location", {"officeName": "TUT USA West Coast Experience Office", "address": "9800 Wilshire Blvd, Beverly Hills, CA 90212", "map": "https://maps.example.com/tut-west-office", "photo": assets.image(spec.path, "Office Location", f"{spec.path.replace('/', '-')}-office.jpg", "800x500", "Exterior image of a modern luxury automotive studio office with glass facade, clean stone frontage, warm afternoon light."), "amenities": ["Concierge lounge", "Delivery suite", "EV specialist team"]}),
    ]


def book_test_drive_components(spec: PageSpec, assets: AssetLog) -> list[dict[str, Any]]:
    model = MODELS[spec.meta.get("model", "tut-eon")]
    return [
        page_metadata(spec),
        page_header(spec, assets),
        component("product-card", "tut-usa/commerce-catalog-merchandising/product-card", {"productName": model.name, "image": assets.image(spec.path, "Product Card", f"{spec.path.replace('/', '-')}-{model.slug}-drive.jpg", "600x600", f"{model.name} parked outside a modern boutique hotel, polished paint, premium lifestyle automotive photography."), "price": model.price, "shortDescription": model.hero_line, "cta": {"label": "View model page", "url": f"/tut-usa/vehicles/{family_slug(model.family)}/{model.slug}"}}),
        component("dealer-locator", "tut-usa/location-local-physical-presence/dealer-locator", {"title": "Choose your preferred retailer", "apiEndpoint": "/api/retail/dealers", "radiusOptions": [25, 50, 100], "filters": [{"label": "Home delivery eligible", "value": "delivery"}, {"label": "Evening appointments", "value": "evening"}]}),
        component("appointment-scheduler", "tut-usa/events-booking-travel-hospitality/appointment-scheduler", {"title": "Select a drive window", "calendarSource": "retail-test-drive-calendar", "durationOptions": [30, 45, 60], "timeZone": "Local retailer time"}),
        component("meeting-request-form", "tut-usa/forms-data-capture-consent/meeting-request-form", {"title": "Tell us what you want to experience", "fields": [form_field("full-name", "Full name", required=True), form_field("email", "Email", "email", required=True), form_field("phone", "Phone", required=True)], "availableTopics": ["Ride comfort", "Rear-seat experience", "Charging", "Driver assistance", "Trade-in discussion"], "submitAction": "/retail/test-drive/request"}),
        component("privacy-notice", "tut-usa/forms-data-capture-consent/privacy-notice", {"title": "Privacy notice", "body": "<p>Your information is used to coordinate retailer contact, preferred appointment timing, and vehicle availability.</p>", "lastUpdated": "2026-01-01", "owner": "TUT USA Retail Operations"}),
        component("faq", "tut-usa/editorial-article-content/faq", {"title": "Before you arrive", "questions": [{"question": "Should I bring my driver's license?", "answer": "Yes. A valid driver's license is required before any public-road drive."}, {"question": "Can I request a specific trim?", "answer": "Retailers will do their best to align your appointment with the most relevant vehicle on site."}], "schemaMarkup": False}),
    ]


def offers_components(spec: PageSpec, assets: AssetLog) -> list[dict[str, Any]]:
    return [
        page_metadata(spec),
        page_header(spec, assets),
        component("pricing-table", "tut-usa/calls-to-action-promotions-campaigns/pricing-table", {"title": "Illustrative ownership pathways", "plans": [{"name": "Purchase", "price": "$1,849/mo", "billingLabel": "With qualified financing", "features": ["Flexible term lengths", "Retailer-delivered quote", "Tailored trade-in support"], "cta": {"label": "Review purchase path", "url": "#"}, "badge": ""}, {"name": "Lease", "price": "$1,379/mo", "billingLabel": "36 months / 10k miles", "features": ["Wear-and-tear guidance", "Mileage flexibility", "End-of-term concierge"], "cta": {"label": "Review lease path", "url": "#"}, "badge": "Popular"}, {"name": "Executive mobility", "price": "$2,240/mo", "billingLabel": "Managed ownership", "features": ["Dedicated concierge", "Priority service scheduling", "Fleet-style reporting"], "cta": {"label": "Review mobility path", "url": "#"}, "badge": "Premium"}], "highlightedPlan": "Lease", "billingToggle": False}),
        component("plan-card", "tut-usa/calls-to-action-promotions-campaigns/plan-card", {"planName": "Lease with confidence", "price": "$1,379/mo", "features": ["36-month structure", "10,000 miles per year", "Battery warranty coverage aligned to term"], "cta": {"label": "Ask a retailer", "url": "/tut-usa/contact-and-concierge/contact-us"}, "badge": "Most asked about"}),
        component("offer-card", "tut-usa/calls-to-action-promotions-campaigns/offer-card", {"title": "Spring delivery event", "description": "Select U.S. retailers are pairing rate support with complimentary home charging consultation for qualified buyers.", "offerCode": "SPRINGTUT", "expiryDate": "2026-05-31", "cta": {"label": "Request offer details", "url": "/tut-usa/offers-and-finance/financing-and-leasing"}}),
        component("quote-request-form", "tut-usa/forms-data-capture-consent/quote-request-form", {"title": "Request a tailored quote", "fields": [form_field("full-name", "Full name", required=True), form_field("email", "Email", "email", required=True), form_field("preferred-model", "Preferred model", required=True), form_field("zip-code", "ZIP code", required=True)], "productType": "TUT USA retail", "submitAction": "/retail/quote/request"}),
        component("faq", "tut-usa/editorial-article-content/faq", {"title": "Financing questions", "questions": [{"question": "Do rates vary by state?", "answer": "Yes. Retailer, lender, and state-specific taxes or fees can affect the final structure."}, {"question": "Can I combine trade-in and loyalty programs?", "answer": "In many cases yes, but the final combination depends on the offer window and retailer participation."}], "schemaMarkup": False}),
        component("cta-button", "tut-usa/calls-to-action-promotions-campaigns/cta-button", {"label": "Speak with financing concierge", "url": "/tut-usa/contact-and-concierge/concierge-request", "styleVariant": "primary", "openInNewTab": False}),
        component("terms-and-conditions", "tut-usa/forms-data-capture-consent/terms-and-conditions", {"title": "Retail offer terms", "body": "<p>Illustrative payment examples exclude tax, title, license, registration, dealer documentation fees, and optional protection products.</p>", "effectiveDate": "2026-01-01", "version": "2026.1"}),
    ]


def accessories_components(spec: PageSpec, assets: AssetLog) -> list[dict[str, Any]]:
    items = spec.meta.get("items", ["Track-ready luggage", "All-weather cabin set", "Signature charging accessories"])
    return [
        page_metadata(spec),
        page_header(spec, assets),
        component("collection-spotlight", "tut-usa/calls-to-action-promotions-campaigns/collection-spotlight", {"title": spec.title, "description": spec.description, "items": items, "layout": "grid", "cta": {"label": "View featured accessories", "url": "#"}}),
        component("product-grid", "tut-usa/commerce-catalog-merchandising/product-grid", {"title": "Collection highlights", "products": [{"productName": items[0], "image": assets.image(spec.path, "Product Grid", f"{spec.path.replace('/', '-')}-item-1.jpg", "600x600", f"Luxury accessory still-life for {items[0]}, premium studio product photography, soft directional light."), "price": 995, "cta": {"label": "View", "url": "#"}}, {"productName": items[1], "image": assets.image(spec.path, "Product Grid", f"{spec.path.replace('/', '-')}-item-2.jpg", "600x600", f"Luxury accessory still-life for {items[1]}, tactile materials, premium neutral backdrop."), "price": 650, "cta": {"label": "View", "url": "#"}}, {"productName": items[2], "image": assets.image(spec.path, "Product Grid", f"{spec.path.replace('/', '-')}-item-3.jpg", "600x600", f"Luxury accessory still-life for {items[2]}, refined brand styling, high-end retail photography."), "price": 420, "cta": {"label": "View", "url": "#"}}], "columns": 3, "enableSorting": True}),
        component("filter-panel", "tut-usa/layout-page-structure/filter-panel", {"title": "Shop by intent", "filters": [{"label": "Use case", "options": ["Travel", "Performance", "Cabin comfort"]}, {"label": "Vehicle fit", "options": ["Sedans", "SUVs", "All models"]}], "applyMode": "manual"}),
        component("sort-control", "tut-usa/layout-page-structure/sort-control", {"label": "Sort", "options": ["Featured", "Newest", "Price"], "defaultOption": "Featured"}),
        component("offer-card", "tut-usa/calls-to-action-promotions-campaigns/offer-card", {"title": "Concierge gift wrapping", "description": "Select lifestyle items can be delivered with premium presentation packaging for gifting moments.", "offerCode": "LIFESTYLETUT", "expiryDate": "2026-12-31", "cta": {"label": "Ask retailer", "url": "/tut-usa/contact-and-concierge/contact-us"}}),
    ]


def learning_components(spec: PageSpec, assets: AssetLog) -> list[dict[str, Any]]:
    courses = spec.meta.get("courses", ["Charging strategy", "Luxury EV ownership", "Driver assistance basics"])
    return [
        page_metadata(spec),
        page_header(spec, assets),
        component("search-bar", "tut-usa/navigation-search-discovery/search-bar", {"placeholder": "Search guides, explainers, and ownership education"}),
        component("category-grid", "tut-usa/navigation-search-discovery/category-grid", {"title": "Learning tracks", "categories": courses, "columns": 3}),
        component("course-catalog", "tut-usa/education-learning-developer-content/course-catalog", {"title": "Learning catalog", "courses": courses, "filters": [{"label": "Ownership", "value": "ownership"}, {"label": "Buying", "value": "buying"}, {"label": "Technology", "value": "technology"}], "searchEnabled": True}),
        component("resource-list", "tut-usa/media-visual-storytelling-assets/resource-list", {"title": "Recommended downloads", "resources": ["/learn/ev-buying-guide.pdf", "/learn/charging-basics.pdf", "/learn/test-drive-checklist.pdf"], "cta": {"label": "Browse all learning content", "url": "/tut-usa/learn"}}),
        component("faq", "tut-usa/editorial-article-content/faq", {"title": "Learning questions", "questions": [{"question": "Is this content written for first-time EV buyers?", "answer": "Yes. The hub is designed to make advanced topics feel calm, precise, and practical."}, {"question": "Can owners use these guides too?", "answer": "Yes. Ownership, charging, and safety articles are structured for both prospects and existing owners."}], "schemaMarkup": False}),
    ]


def how_to_components(spec: PageSpec, assets: AssetLog) -> list[dict[str, Any]]:
    return [
        page_metadata(spec),
        breadcrumb_component(spec),
        component("how-to-guide", "tut-usa/editorial-article-content/how-to-guide", {"title": spec.title, "introduction": spec.description, "steps": [{"title": "Prepare your route", "instructions": "Review destination charging or service requirements before departure.\nConfirm software status and account access."}, {"title": "Verify vehicle setup", "instructions": "Check charge state, tire pressure, and any model-specific alerts.\nAdjust cabin preconditioning if needed."}, {"title": "Execute with confidence", "instructions": "Follow the guided process, monitor feedback, and contact support if any status remains unclear."}], "estimatedTime": 12}),
        component("numbered-steps", "tut-usa/editorial-article-content/numbered-steps", {"title": "Quick summary", "steps": [{"title": "Check prerequisites", "description": "Confirm vehicle readiness and route assumptions."}, {"title": "Follow the guided sequence", "description": "Use the car's prompts or owner documentation to stay accurate."}, {"title": "Escalate if unsure", "description": "Reach TUT support instead of guessing on safety-critical topics."}], "orientation": "vertical"}),
        component("faq", "tut-usa/editorial-article-content/faq", {"title": "Common owner questions", "questions": [{"question": "What if my nearest fast charger is occupied?", "answer": "Use route planning to identify a secondary charging option before your state of charge becomes tight."}, {"question": "When should I contact support?", "answer": "Immediately if a warning remains active or if the car's guidance conflicts with the owner's manual."}], "schemaMarkup": False}),
        component("related-content", "tut-usa/navigation-search-discovery/related-content", {"title": "Continue learning", "items": ["Manuals & Technical Documents", "Service & Maintenance", "Roadside & Emergency Help"]}),
        component("document-download", "tut-usa/media-visual-storytelling-assets/document-download", {"title": "Printable quick guide", "description": "A concise one-page checklist for glovebox or mobile reference.", "file": f"/docs/{spec.path.split('/')[-1]}-quick-guide.pdf", "fileType": "PDF", "fileSize": "1.2 MB"}),
    ]


def contact_components(spec: PageSpec, assets: AssetLog) -> list[dict[str, Any]]:
    persona = spec.meta.get("persona", "General")
    return [
        page_metadata(spec),
        page_header(spec, assets),
        component("framed-message", "tut-usa/layout-page-structure/framed-message", {"title": "Premium support", "message": f"{persona} requests are routed to specialists trained to respond with clear next steps, realistic timing, and documented follow-through.", "styleVariant": "info", "icon": ""}),
        component("contact-card", "tut-usa/community-social-proof-engagement/contact-card", {"name": f"{persona} Concierge Desk", "role": "Primary support contact", "email": "concierge@tutmotors.com", "phone": "1-800-888-0188", "photo": assets.image(spec.path, "Contact Card", f"{spec.path.replace('/', '-')}-concierge.jpg", "80x80", "Portrait of a luxury brand concierge specialist, studio headshot, tailored attire, confident and welcoming expression.")}),
        component("contact-form", "tut-usa/forms-data-capture-consent/contact-form", {"title": "Start a conversation", "description": "Share your goal and preferred contact method so the right TUT USA team can respond with context.", "fields": [form_field("full-name", "Full name", required=True), form_field("email", "Email", "email", required=True), form_field("phone", "Phone"), form_field("message", "Message", "textarea", required=True)], "recipientGroup": "concierge", "spamProtection": True}),
        component("support-form", "tut-usa/forms-data-capture-consent/support-form", {"title": "Need active case support?", "issueTypes": ["Roadside assistance", "Service follow-up", "Delivery question", "Retail escalation"], "fields": [form_field("vin", "VIN"), form_field("case-number", "Case number"), form_field("details", "Issue details", "textarea", required=True)], "caseRouting": "tier1"}),
        component("faq", "tut-usa/editorial-article-content/faq", {"title": "Support FAQs", "questions": [{"question": "How quickly will TUT respond?", "answer": "Most concierge and contact requests receive a human response within one business day."}, {"question": "Can urgent roadside requests use this page?", "answer": "For urgent roadside situations, use the dedicated emergency help page or phone number immediately."}], "schemaMarkup": False}),
        component("escalation-matrix", "tut-usa/support-documentation-knowledge/escalation-matrix", {"title": "Support escalation path", "levels": [{"level": "Tier 1", "contact": "Owner care desk", "responseTime": "Within 1 business day", "escalateTo": "Regional support lead"}, {"level": "Tier 2", "contact": "Regional support lead", "responseTime": "Same business day", "escalateTo": "National concierge manager"}, {"level": "Tier 3", "contact": "National concierge manager", "responseTime": "4 business hours", "escalateTo": "Executive resolution office"}], "owner": "TUT USA Client Operations", "lastReviewed": "2026-03-01"}),
        component("chat-widget", "tut-usa/community-social-proof-engagement/chat-widget", {"title": "Live chat", "provider": "TUT Care", "offlineMessage": "Our advisors are assisting other guests. Leave your details and we will follow up promptly.", "routingRule": "Sales and owner care triage"}),
        component("virtual-assistant", "tut-usa/community-social-proof-engagement/virtual-assistant", {"title": "Virtual Assistant", "botEndpoint": "/api/assistant/tut", "welcomeMessage": "I can help you find a dealer, route an ownership question, or prepare for a concierge conversation.", "fallbackContact": "concierge@tutmotors.com"}),
        component("privacy-notice", "tut-usa/forms-data-capture-consent/privacy-notice", {"title": "Privacy notice", "body": "<p>TUT USA uses inquiry data to coordinate support, retailer follow-up, and documented service recovery where needed.</p>", "lastUpdated": "2026-01-01", "owner": "TUT USA Client Operations"}),
        component("terms-and-conditions", "tut-usa/forms-data-capture-consent/terms-and-conditions", {"title": "Support terms", "body": "<p>Response times can vary by issue severity, retailer participation, and local time zone. Emergency cases should always use the dedicated urgent support number.</p>", "effectiveDate": "2026-01-01", "version": "2026.1"}),
    ]


BUILDERS: dict[str, Callable[[PageSpec, AssetLog], list[dict[str, Any]]]] = {
    "home": home_components,
    "model-overview": model_overview_components,
    "model-detail": model_detail_components,
    "build-configure": build_configure_components,
    "compare-models": compare_components,
    "innovation-hub": innovation_hub_components,
    "innovation-detail": innovation_detail_components,
    "news-landing": news_landing_components,
    "article-detail": article_detail_components,
    "owners-hub": owners_hub_components,
    "manual-docs": manual_components,
    "service": service_components,
    "dealer-locator": locator_components,
    "book-test-drive": book_test_drive_components,
    "offers-finance": offers_components,
    "accessories": accessories_components,
    "learning-hub": learning_components,
    "how-to": how_to_components,
    "contact-support": contact_components,
}


PAGES: list[PageSpec] = [
    PageSpec("tut-usa/home", "Home", "global-home-page", "Premium entry page for TUT USA with featured vehicles, innovation stories, latest updates, and conversion paths.", "home"),
    PageSpec("tut-usa/vehicles", "Vehicles", "model-overview-page", "Section landing page for browsing the TUT vehicle portfolio by model family and body style.", "model-overview", {"models": ["tut-s", "tut-e", "tut-x", "tut-q", "tut-eon"]}),
    PageSpec("tut-usa/innovation", "Innovation", "innovation-hub-page", "Editorial landing page for advanced vehicle technology, safety systems, electrification, materials, and design innovation.", "innovation-hub"),
    PageSpec("tut-usa/news-and-updates", "News & Updates", "news-updates-landing-page", "Publishing hub for company announcements, launches, product news, and editorial updates.", "news-landing"),
    PageSpec("tut-usa/owners", "Owners", "owners-hub-landing-page", "Ownership support hub for manuals, service, charging, maintenance, and educational content.", "owners-hub"),
    PageSpec("tut-usa/offers-and-finance", "Offers & Finance", "offers-financing-leasing-page", "Landing page for current offers, leasing, financing, and purchase-support journeys.", "offers-finance"),
    PageSpec("tut-usa/accessories", "Accessories", "accessories-lifestyle-collection-page", "Landing page for branded accessories, vehicle add-ons, and luxury lifestyle collections.", "accessories", {"items": ["Performance charging cable set", "All-weather floor collection", "Signature travel luggage"]}),
    PageSpec("tut-usa/learn", "Learn", "learning-education-hub-page", "Educational landing page for buying guides, EV learning, feature explainers, and ownership how-to content.", "learning-hub"),
    PageSpec("tut-usa/contact-and-concierge", "Contact & Concierge", "contact-concierge-support-page", "Premium support entry page for concierge contact, help, inquiries, and assistance.", "contact-support", {"persona": "General"}),
    PageSpec("tut-usa/vehicles/vehicle-lineup", "Vehicle Lineup", "model-overview-page", "Overview of all TUT models available in the U.S. market.", "model-overview", {"models": ["tut-s", "tut-e", "tut-x", "tut-q", "tut-eon"]}),
    PageSpec("tut-usa/vehicles/compare-vehicles", "Compare Vehicles", "compare-models-page", "Structured comparison page for evaluating selected TUT models side by side.", "compare-models"),
    PageSpec("tut-usa/vehicles/build-and-configure", "Build & Configure", "build-configure-page", "Entry page for configuring a selected vehicle, package, and options.", "build-configure", {"model": "tut-eon"}),
    PageSpec("tut-usa/vehicles/sedans", "Sedans", "model-overview-page", "Category page for TUT sedan models.", "model-overview", {"models": ["tut-s", "tut-e"]}),
    PageSpec("tut-usa/vehicles/sedans/tut-s", "TUT S", "vehicle-model-detail-page", "Model detail page for the flagship luxury sedan.", "model-detail", {"model": "tut-s"}),
    PageSpec("tut-usa/vehicles/sedans/tut-s/build-tut-s", "Build TUT S", "build-configure-page", "Dedicated configuration page for TUT S.", "build-configure", {"model": "tut-s"}),
    PageSpec("tut-usa/vehicles/sedans/tut-s/compare-tut-s", "Compare TUT S", "compare-models-page", "Preloaded comparison page for TUT S against peer models.", "compare-models", {"model": "tut-s"}),
    PageSpec("tut-usa/vehicles/sedans/tut-e", "TUT E", "vehicle-model-detail-page", "Model detail page for the executive sedan.", "model-detail", {"model": "tut-e"}),
    PageSpec("tut-usa/vehicles/sedans/tut-e/build-tut-e", "Build TUT E", "build-configure-page", "Dedicated configuration page for TUT E.", "build-configure", {"model": "tut-e"}),
    PageSpec("tut-usa/vehicles/suvs", "SUVs", "model-overview-page", "Category page for TUT SUV and crossover models.", "model-overview", {"models": ["tut-x", "tut-q"]}),
    PageSpec("tut-usa/vehicles/suvs/tut-x", "TUT X", "vehicle-model-detail-page", "Model detail page for the performance luxury SUV.", "model-detail", {"model": "tut-x"}),
    PageSpec("tut-usa/vehicles/suvs/tut-x/build-tut-x", "Build TUT X", "build-configure-page", "Dedicated configuration page for TUT X.", "build-configure", {"model": "tut-x"}),
    PageSpec("tut-usa/vehicles/suvs/tut-x/compare-tut-x", "Compare TUT X", "compare-models-page", "Preloaded comparison page for TUT X against peer models.", "compare-models", {"model": "tut-x"}),
    PageSpec("tut-usa/vehicles/suvs/tut-q", "TUT Q", "vehicle-model-detail-page", "Model detail page for the grand touring SUV.", "model-detail", {"model": "tut-q"}),
    PageSpec("tut-usa/vehicles/suvs/tut-q/build-tut-q", "Build TUT Q", "build-configure-page", "Dedicated configuration page for TUT Q.", "build-configure", {"model": "tut-q"}),
    PageSpec("tut-usa/vehicles/electric-vehicles", "Electric Vehicles", "model-overview-page", "Category page for TUT electric models and electrified mobility.", "model-overview", {"models": ["tut-eon"]}),
    PageSpec("tut-usa/vehicles/electric-vehicles/tut-eon", "TUT Eon", "vehicle-model-detail-page", "Model detail page for the all-electric grand tourer.", "model-detail", {"model": "tut-eon"}),
    PageSpec("tut-usa/vehicles/electric-vehicles/tut-eon/build-tut-eon", "Build TUT Eon", "build-configure-page", "Dedicated configuration page for TUT Eon.", "build-configure", {"model": "tut-eon"}),
    PageSpec("tut-usa/vehicles/electric-vehicles/tut-eon/compare-tut-eon", "Compare TUT Eon", "compare-models-page", "Preloaded comparison page for TUT Eon against peer models.", "compare-models", {"model": "tut-eon"}),
    PageSpec("tut-usa/innovation/innovation-overview", "Innovation Overview", "innovation-hub-page", "Overview page for all innovation themes across the TUT brand.", "innovation-hub"),
    PageSpec("tut-usa/innovation/electrification", "Electrification", "innovation-feature-detail-page", "Innovation story page about battery systems, charging, range, and energy management.", "innovation-detail", {"topic": "electrification"}),
    PageSpec("tut-usa/innovation/performance-engineering", "Performance Engineering", "innovation-feature-detail-page", "Innovation story page about powertrain, chassis, dynamics, and driving precision.", "innovation-detail", {"topic": "performance-engineering"}),
    PageSpec("tut-usa/innovation/driver-assistance", "Driver Assistance", "innovation-feature-detail-page", "Innovation story page about safety systems, assistive intelligence, and confidence features.", "innovation-detail", {"topic": "driver-assistance"}),
    PageSpec("tut-usa/innovation/craftsmanship-and-materials", "Craftsmanship & Materials", "innovation-feature-detail-page", "Innovation story page about interior materials, design detail, and luxury execution.", "innovation-detail", {"topic": "craftsmanship-and-materials"}),
    PageSpec("tut-usa/innovation/connectivity-and-digital-cabin", "Connectivity & Digital Cabin", "innovation-feature-detail-page", "Innovation story page about infotainment, connected services, and software experience.", "innovation-detail", {"topic": "connectivity-and-digital-cabin"}),
    PageSpec("tut-usa/news-and-updates/news-landing", "News Landing", "news-updates-landing-page", "Overview page for the latest TUT announcements and stories.", "news-landing"),
    PageSpec("tut-usa/news-and-updates/product-launch-article", "Product Launch Article", "news-press-article-detail-page", "Detail article page for a new model or feature announcement.", "article-detail", {"article": "product-launch-article"}),
    PageSpec("tut-usa/news-and-updates/press-release-article", "Press Release Article", "news-press-article-detail-page", "Detail article page for formal corporate or product communications.", "article-detail", {"article": "press-release-article"}),
    PageSpec("tut-usa/news-and-updates/event-coverage-article", "Event Coverage Article", "news-press-article-detail-page", "Detail article page for launch events, auto shows, or media previews.", "article-detail", {"article": "event-coverage-article"}),
    PageSpec("tut-usa/owners/owners-overview", "Owners Overview", "owners-hub-landing-page", "Main ownership landing page with segmented pathways for manuals, service, and support.", "owners-hub"),
    PageSpec("tut-usa/owners/manuals-and-technical-documents", "Manuals & Technical Documents", "owner-manual-technical-documentation-page", "Searchable library of manuals, guides, and technical downloads.", "manual-docs"),
    PageSpec("tut-usa/owners/service-and-maintenance", "Service & Maintenance", "service-maintenance-page", "Service education and maintenance support page with booking pathways.", "service"),
    PageSpec("tut-usa/owners/charging-and-ev-ownership", "Charging & EV Ownership", "safety-charging-ownership-how-to-page", "Help page for charging, range best practices, and EV ownership guidance.", "how-to"),
    PageSpec("tut-usa/owners/safety-and-assistance-how-to", "Safety & Assistance How-To", "safety-charging-ownership-how-to-page", "Help page explaining safety and assistance features in owner-friendly language.", "how-to"),
    PageSpec("tut-usa/owners/warranty-and-coverage", "Warranty & Coverage", "service-maintenance-page", "Ownership support page for warranty and coverage education.", "service"),
    PageSpec("tut-usa/offers-and-finance/offers-and-incentives", "Offers & Incentives", "offers-financing-leasing-page", "Landing page for current retail programs and model-specific offers.", "offers-finance"),
    PageSpec("tut-usa/offers-and-finance/financing-and-leasing", "Financing & Leasing", "offers-financing-leasing-page", "Education and conversion page for finance and lease options.", "offers-finance"),
    PageSpec("tut-usa/offers-and-finance/book-a-test-drive", "Book a Test Drive", "book-a-test-drive-page", "Conversion page for scheduling a premium test-drive appointment.", "book-test-drive", {"model": "tut-eon"}),
    PageSpec("tut-usa/offers-and-finance/find-a-dealer", "Find a Dealer", "dealer-showroom-locator-page", "Dealer and showroom lookup page with geolocation and contact pathways.", "dealer-locator"),
    PageSpec("tut-usa/accessories/accessories-overview", "Accessories Overview", "accessories-lifestyle-collection-page", "Landing page for vehicle accessories and branded lifestyle items.", "accessories", {"items": ["Signature charging cable set", "Interior air-care package", "Winter touring wheel bag"]}),
    PageSpec("tut-usa/accessories/performance-accessories", "Performance Accessories", "accessories-lifestyle-collection-page", "Collection page for performance-oriented vehicle accessories.", "accessories", {"items": ["Carbon pedal set", "Track wheel package", "Performance brake care kit"]}),
    PageSpec("tut-usa/accessories/interior-accessories", "Interior Accessories", "accessories-lifestyle-collection-page", "Collection page for cabin and comfort enhancements.", "accessories", {"items": ["Executive rear table", "Cashmere cabin blanket", "Leather travel organizer"]}),
    PageSpec("tut-usa/accessories/lifestyle-collection", "Lifestyle Collection", "accessories-lifestyle-collection-page", "Collection page for apparel, luggage, and luxury brand goods.", "accessories", {"items": ["Leather weekender", "Racing chronograph", "Heritage travel jacket"]}),
    PageSpec("tut-usa/learn/learning-overview", "Learning Overview", "learning-education-hub-page", "Entry page for buyer education, feature explainers, and ownership learning content.", "learning-hub"),
    PageSpec("tut-usa/learn/ev-buying-guide", "EV Buying Guide", "learning-education-hub-page", "Educational guide for evaluating electric vehicle ownership.", "learning-hub", {"courses": ["Charging strategy", "Home charging setup", "Cold-weather planning"]}),
    PageSpec("tut-usa/learn/model-comparison-guide", "Model Comparison Guide", "learning-education-hub-page", "Educational page helping users choose the right TUT vehicle.", "learning-hub", {"courses": ["Sedan vs SUV fit", "Range priorities", "Rear-seat comfort evaluation"]}),
    PageSpec("tut-usa/learn/ownership-how-to-article", "Ownership How-To Article", "safety-charging-ownership-how-to-page", "Practical instructional page for common ownership tasks.", "how-to"),
    PageSpec("tut-usa/learn/feature-explainer-article", "Feature Explainer Article", "innovation-feature-detail-page", "Educational page describing a specific vehicle technology or system.", "innovation-detail", {"topic": "connectivity-and-digital-cabin"}),
    PageSpec("tut-usa/contact-and-concierge/contact-us", "Contact Us", "contact-concierge-support-page", "General support and inquiry page for TUT USA visitors.", "contact-support", {"persona": "General"}),
    PageSpec("tut-usa/contact-and-concierge/concierge-request", "Concierge Request", "contact-concierge-support-page", "White-glove assistance page for premium pre-sale or owner requests.", "contact-support", {"persona": "Concierge"}),
    PageSpec("tut-usa/contact-and-concierge/roadside-and-emergency-help", "Roadside & Emergency Help", "contact-concierge-support-page", "Support page for urgent ownership assistance and service contacts.", "contact-support", {"persona": "Roadside"}),
]

PAGE_INDEX = {page.path: page for page in PAGES}


def seed_root() -> None:
    ensure_node("content", SITE_ID, "flexcms/site-root", {"jcr:title": "TUT USA Website Root", "jcr:description": "US market root for all public TUT brand, vehicle, innovation, ownership, commerce-support, and help content.", "siteId": SITE_ID, "template": "global-home-page"})
    publish_path(ROOT_PATH)


def clear_existing_site_pages() -> None:
    # The current delete endpoint issues a broken subtree delete query in local dev.
    # We seed in place instead so repeated runs remain safe without removing descendants first.
    return


def delete_children(path: str) -> None:
    # The current delete endpoint issues a broken subtree delete query in local dev.
    # We update/create deterministic child nodes instead of clearing them first.
    return


def seed_experience_fragments() -> None:
    nav_master = "experience-fragments/tut-usa/global/navigation/master"
    footer_master = "experience-fragments/tut-usa/global/footer/master"
    delete_children(nav_master)
    delete_children(footer_master)
    nav_component = create_node(nav_master, "navigation", "tut-usa/navigation-search-discovery/navigation", {"logo": "TUT", "primaryLinks": ["Vehicles", "Innovation", "News", "Owners", "Offers", "Accessories", "Learn", "Contact"], "utilityLinks": [{"label": "Search", "url": "/tut-usa/search"}, {"label": "Dealer Locator", "url": "/tut-usa/offers-and-finance/find-a-dealer"}, {"label": "My TUT", "url": "/tut-usa/owners"}], "accountEntry": "Book a Test Drive", "sticky": True})
    footer_component = create_node(footer_master, "footer", "tut-usa/navigation-search-discovery/footer", {"logo": "TUT", "footerLinkGroups": [{"title": "Vehicles", "links": [link("tut-usa/vehicles/vehicle-lineup"), link("tut-usa/vehicles/sedans"), link("tut-usa/vehicles/suvs"), link("tut-usa/vehicles/electric-vehicles")]}, {"title": "Owners", "links": [link("tut-usa/owners/owners-overview"), link("tut-usa/owners/manuals-and-technical-documents"), link("tut-usa/owners/service-and-maintenance")]}, {"title": "Company", "links": [link("tut-usa/innovation"), link("tut-usa/news-and-updates"), link("tut-usa/contact-and-concierge/contact-us")]}, {"title": "Legal", "links": [{"label": "Privacy notice", "url": "/tut-usa/contact-and-concierge/contact-us#privacy"}, {"label": "Terms", "url": "/tut-usa/offers-and-finance/financing-and-leasing#terms"}, {"label": "Roadside support", "url": "/tut-usa/contact-and-concierge/roadside-and-emergency-help"}]}], "socialLinks": [{"label": "LinkedIn", "url": "https://www.linkedin.com/company/tutmotors"}, {"label": "Instagram", "url": "https://www.instagram.com/tutmotors"}, {"label": "YouTube", "url": "https://www.youtube.com/@tutmotors"}, {"label": "X", "url": "https://x.com/tutmotors"}], "legalLinks": [{"label": "Privacy", "url": "/tut-usa/contact-and-concierge/contact-us#privacy"}, {"label": "Terms", "url": "/tut-usa/offers-and-finance/financing-and-leasing#terms"}], "copyrightText": "© 2026 TUT Motors USA. All rights reserved."})
    for path in ["experience-fragments/tut-usa/global/navigation", "experience-fragments/tut-usa/global/navigation/master", nav_component["path"].replace(".", "/").replace("content/", "", 1), "experience-fragments/tut-usa/global/footer", "experience-fragments/tut-usa/global/footer/master", footer_component["path"].replace(".", "/").replace("content/", "", 1)]:
        publish_path(path)


def seed_pages(assets: AssetLog) -> None:
    for spec in PAGES:
        parent = "/".join(spec.path.split("/")[:-1])
        name = spec.path.split("/")[-1]
        ensure_node(parent, name, "flexcms/page", {"jcr:title": spec.title, "jcr:description": spec.description, "siteId": SITE_ID, "template": spec.template})
        published_paths = [spec.path]
        write_component_tree(spec.path, BUILDERS[spec.kind](spec, assets), published_paths)
        for path in published_paths:
            publish_path(path)


def verify_author_reachable() -> None:
    try:
        api_request("GET", "/api/author/content/list", params={"site": SITE_ID, "size": 1})
    except Exception as exc:
        raise RuntimeError("Author API is not reachable. Start the author app with the local profile before running this script.") from exc


def main() -> int:
    print("=== TUT USA website seeder ===")
    verify_author_reachable()
    assets = AssetLog()
    seed_root()
    clear_existing_site_pages()
    seed_experience_fragments()
    seed_pages(assets)
    assets.write()
    print(f"Seeded {len(PAGES) + 1} pages including the TUT USA root.")
    print(f"Missing assets log written to {MISSING_ASSETS_PATH}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        raise SystemExit(130)
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1)
