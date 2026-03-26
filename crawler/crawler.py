"""Simple crawler that downloads Audi assets into size-specific folders."""
import argparse
import logging
import re
from collections import deque
from io import BytesIO
from pathlib import Path
from typing import Deque, Dict, Optional, Set
from urllib.parse import urljoin, urlparse, urlunparse

import requests
from bs4 import BeautifulSoup, Tag
from PIL import Image

MAX_PAGES_DEFAULT = 400
MAX_ASSETS_DEFAULT = 1000
BASE_URL = "https://www.mbusa.com/en/home"
ALLOWED_DOMAIN_SUFFIX = "mbusa.com"
DOCUMENT_DOWNLOAD_LIMIT = 20
IMAGE_DOWNLOAD_LIMIT = 1000
VIDEO_DOWNLOAD_LIMIT = 1000
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tiff", ".tif", ".svg"}
VIDEO_EXTENSIONS = {".mp4", ".webm", ".ogg", ".mov", ".avi", ".m4v", ".mkv"}
DOCUMENT_EXTENSIONS = {".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".csv", ".rtf"}
IMAGE_BUCKETS = ("s", "m", "l")

logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")


class AssetCrawler:
    def __init__(
        self,
        base_url: str,
        download_root: Path,
        max_pages: int,
        max_assets: int,
    ):
        self.base_url = base_url
        self.download_root = download_root
        self.max_pages = max_pages
        self.max_assets = max_assets
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": "FlexCMS-Audi-Crawler/1.0"})
        self.image_dirs: Dict[str, Path] = {}
        for bucket in IMAGE_BUCKETS:
            path = self.download_root / "images" / bucket
            path.mkdir(parents=True, exist_ok=True)
            self.image_dirs[bucket] = path
        self.video_dir = self.download_root / "videos"
        self.video_dir.mkdir(parents=True, exist_ok=True)
        self.document_dir = self.download_root / "documents"
        self.document_dir.mkdir(parents=True, exist_ok=True)
        self.seen_pages: Set[str] = set()
        self.seen_assets: Set[str] = set()
        self.asset_count = 0
        self.stats = {
            "images": {"s": 0, "m": 0, "l": 0},
            "videos": 0,
            "documents": 0,
        }

    def run(self) -> None:
        queue: Deque[str] = deque([self.base_url])
        while queue and len(self.seen_pages) < self.max_pages:
            url = queue.popleft()
            normalized = self._normalize_page_url(url)
            if not normalized or normalized in self.seen_pages:
                continue
            self.seen_pages.add(normalized)
            logging.info("Fetching page %d/%d: %s", len(self.seen_pages), self.max_pages, normalized)
            try:
                response = self.session.get(normalized, timeout=20)
                response.raise_for_status()
            except requests.RequestException as exc:  # pragma: no cover - network
                logging.warning("Skipping %s (%s)", normalized, exc)
                continue
            soup = BeautifulSoup(response.text, "html.parser")
            self._queue_links(soup, queue)
            self._collect_assets(soup)
            if self.asset_count >= self.max_assets:
                logging.info("Reached asset limit (%d).", self.max_assets)
                break
        self._log_summary()

    def _queue_links(self, soup: BeautifulSoup, queue: Deque[str]) -> None:
        for anchor in soup.select("a[href]"):
            candidate = anchor.get("href")
            normalized = self._normalize_page_url(candidate)
            if not normalized or normalized in self.seen_pages:
                continue
            if normalized not in queue and len(self.seen_pages) + len(queue) < self.max_pages:
                queue.append(normalized)

    def _collect_assets(self, soup: BeautifulSoup) -> None:
        if self.asset_count >= self.max_assets:
            return
        # Image elements
        for tag in soup.select("img"):
            src = tag.get("src") or tag.get("data-src") or self._extract_src_from_srcset(tag.get("srcset"))
            self._consume_asset(src, "image")
            if self.asset_count >= self.max_assets:
                return
        # Video + source
        for tag in soup.select("video"):
            src = tag.get("src") or self._extract_source_from_video(tag)
            self._consume_asset(src, "video")
            if self.asset_count >= self.max_assets:
                return
        for tag in soup.select("source"):
            src = tag.get("src") or tag.get("data-src")
            self._consume_asset(src, "video")
            if self.asset_count >= self.max_assets:
                return
        # Documents via anchor links
        for anchor in soup.select("a[href]"):
            href = anchor.get("href")
            if not self._is_document(href):
                continue
            self._consume_asset(href, "document")
            if self.asset_count >= self.max_assets:
                return

    def _consume_asset(self, href: Optional[str], asset_type: str) -> None:
        if not href or self.asset_count >= self.max_assets:
            return
        if not self._can_download(asset_type):
            logging.debug("Skipping %s: limit reached", asset_type)
            return
        normalized = self._normalize_asset_url(href)
        if not normalized or normalized in self.seen_assets:
            return
        folder = ""
        if asset_type == "image":
            path = self._download_and_sort_image(normalized)
            folder = f"images/{path.name}" if path else ""
        elif asset_type == "video":
            path = self._download_to_folder(normalized, self.video_dir)
            folder = "videos"
        else:
            path = self._download_to_folder(normalized, self.document_dir)
            folder = "documents"
        if path:
            self.seen_assets.add(normalized)
            logging.info("Downloaded %s into %s", normalized, folder)

    def _download_and_sort_image(self, url: str) -> Optional[Path]:
        data = self._download(url)
        if not data:
            return None
        bucket = self._choose_bucket(data)
        dest_dir = self.image_dirs[bucket]
        dest_path = self._unique_path(dest_dir, self._filename_from_url(url))
        dest_path.write_bytes(data)
        self.asset_count += 1
        self.stats["images"][bucket] += 1
        return dest_path

    def _download_to_folder(self, url: str, target_folder: Path) -> Optional[Path]:
        data = self._download(url)
        if not data:
            return None
        dest_path = self._unique_path(target_folder, self._filename_from_url(url))
        dest_path.write_bytes(data)
        if target_folder is self.video_dir:
            self.stats["videos"] += 1
        else:
            self.stats["documents"] += 1
        self.asset_count += 1
        return dest_path

    def _download(self, url: str) -> Optional[bytes]:
        try:
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
        except requests.RequestException as exc:  # pragma: no cover - network
            logging.warning("Failed to download %s (%s)", url, exc)
            return None
        return response.content

    def _choose_bucket(self, data: bytes) -> str:
        try:
            with Image.open(BytesIO(data)) as image:
                width, _ = image.size
        except Exception:  # pragma: no cover - pillow
            width = 0
        if width < 1000:
            bucket = "s"
        elif width < 2000:
            bucket = "m"
        else:
            bucket = "l"
        logging.debug("Image width=%s bucket=%s", width, bucket)
        return bucket

    def _normalize_page_url(self, href: Optional[str]) -> Optional[str]:
        if not href:
            return None
        absolute = urljoin(self.base_url, href)
        parsed = urlparse(absolute)
        if parsed.scheme not in ("http", "https"):
            return None
        if not self._is_allowed_domain(parsed.netloc):
            return None
        path = parsed.path or "/"
        if not path.startswith("/en"):
            return None
        cleaned = parsed._replace(fragment="", query="")
        normalized_path = cleaned.path.rstrip("/") or "/"
        cleaned = cleaned._replace(path=normalized_path)
        return urlunparse(cleaned)

    def _normalize_asset_url(self, href: str) -> Optional[str]:
        absolute = urljoin(self.base_url, href)
        parsed = urlparse(absolute)
        if parsed.scheme not in ("http", "https"):
            return None
        if not self._is_allowed_domain(parsed.netloc):
            return None
        cleaned = parsed._replace(fragment="")
        return urlunparse(cleaned)

    @staticmethod
    def _is_allowed_domain(netloc: str) -> bool:
        return netloc.lower().endswith(ALLOWED_DOMAIN_SUFFIX)

    @staticmethod
    def _filename_from_url(url: str) -> str:
        raw = Path(urlparse(url).path).name
        if not raw:
            raw = "asset"
        raw = re.sub(r"[^\w\.\-]+", "_", raw)
        return raw

    @staticmethod
    def _unique_path(target_folder: Path, name: str) -> Path:
        dest = target_folder / name
        stem = dest.stem or "asset"
        suffix = dest.suffix
        counter = 1
        while dest.exists():
            dest = target_folder / f"{stem}-{counter}{suffix}"
            counter += 1
        return dest

    @staticmethod
    def _extract_src_from_srcset(srcset: Optional[str]) -> Optional[str]:
        if not srcset:
            return None
        for candidate in srcset.split(","):
            piece = candidate.strip().split(" ", 1)[0]
            if piece:
                return piece
        return None

    @staticmethod
    def _extract_source_from_video(tag: Tag) -> Optional[str]:
        for child in tag.select("source[src]"):
            if child.get("type", "").startswith("video"):
                return child.get("src")
        return tag.get("src")

    def _is_document(self, href: Optional[str]) -> bool:
        if not href:
            return False
        normalized = urljoin(self.base_url, href)
        suffix = Path(urlparse(normalized).path).suffix.lower()
        return suffix in DOCUMENT_EXTENSIONS

    def _log_summary(self) -> None:
        logging.info(
            "Summary: visited %d pages, downloaded %d assets (images s=%d m=%d l=%d, videos=%d, documents=%d)",
            len(self.seen_pages),
            self.asset_count,
            self.stats["images"]["s"],
            self.stats["images"]["m"],
            self.stats["images"]["l"],
            self.stats["videos"],
            self.stats["documents"],
        )

    def _can_download(self, asset_type: str) -> bool:
        if asset_type == "image":
            total_images = sum(self.stats["images"].values())
            return total_images < IMAGE_DOWNLOAD_LIMIT
        if asset_type == "video":
            return self.stats["videos"] < VIDEO_DOWNLOAD_LIMIT
        if asset_type == "document":
            return self.stats["documents"] < DOCUMENT_DOWNLOAD_LIMIT
        return True


def main() -> None:
    parser = argparse.ArgumentParser(description="Audi.com asset crawler")
    parser.add_argument("--max-pages", type=int, default=MAX_PAGES_DEFAULT, help="Maximum pages to crawl")
    parser.add_argument("--max-assets", type=int, default=MAX_ASSETS_DEFAULT, help="Stop after this many downloads")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Describe what would happen without network activity (recommended for testing)",
    )
    args = parser.parse_args()
    download_root = Path(__file__).resolve().parent / "downloads"
    download_root.mkdir(parents=True, exist_ok=True)

    if args.dry_run:
        logging.info("Dry run enabled: no network requests or downloads will be performed.")
        logging.info("Would crawl %s with up to %d pages and %d assets.", BASE_URL, args.max_pages, args.max_assets)
        return

    crawler = AssetCrawler(
        base_url=BASE_URL,
        download_root=download_root,
        max_pages=args.max_pages,
        max_assets=args.max_assets,
    )
    crawler.run()


if __name__ == "__main__":
    main()

