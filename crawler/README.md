# Audi Asset Crawler

Simple Python crawler that scans `https://www.audi.com/en/`, discovers assets (images, videos, documents), and saves them under `crawler/downloads` with the requested folder hierarchy.

## Project layout

```
crawler/
├── crawler.py          # main crawler script
├── requirements.txt    # Python dependencies
└── downloads/          # populated when the crawler runs
    ├── images/
    │   ├── s/          # images with width < 1000 px
    │   ├── m/          # images with 1000 ≤ width < 2000 px
    │   └── l/          # remaining images
    ├── videos/
    └── documents/
```

## Setup

```powershell
cd C:\Users\Viach\IdeaProjects\FlexCMS\crawler
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

## Running the crawler

```powershell
cd C:\Users\Viach\IdeaProjects\FlexCMS
python crawler/crawler.py [--max-pages N] [--max-assets M] [--dry-run]
```

- `--max-pages` controls how many HTML pages will be fetched (default: 40). Only `/en/` paths on `audi.com` are explored.
- `--max-assets` stops the run after that many downloads (default: 100).
- `--dry-run` is strongly recommended for the first execution; it prints what would happen without making network calls or writing files.

### Output folders

- Images are classified immediately after download. Width < 1000 px → `images/s/`, width < 2000 px → `images/m/`, otherwise `images/l/`.
- Videos go to `videos/`, documents (PDF, DOCX, XLSX, etc.) go to `documents/`.
- The crawler stops collecting documents after 20 downloads and images/videos after 1,000 downloads each; use `--max-assets` to lower those caps further.

## Notes

- This script does not obey `robots.txt` or rate limiting—add delays if you extend it for heavier crawling.
- Running without `--dry-run` requires internet access and will write files under `crawler/downloads/`.

