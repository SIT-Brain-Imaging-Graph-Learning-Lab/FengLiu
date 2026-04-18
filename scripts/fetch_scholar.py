#!/usr/bin/env python3
"""
Fetch publications + citation metrics from Google Scholar and write JSON files
consumed by the static site.

- Writes  assets/data/publications.json  (list of papers)
- Writes  assets/data/scholar-meta.json  (citation totals, h-index, i10-index)

Fail-soft behavior: if Scholar returns a CAPTCHA / blocks the runner, the script
prints a warning and exits 0 without touching the JSON files so the existing
committed baseline keeps serving the site.

Usage:
    python scripts/fetch_scholar.py            # write JSONs
    python scripts/fetch_scholar.py --dry-run  # compute but don't write
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import date
from pathlib import Path

SCHOLAR_ID = "HVZdbX0AAAAJ"
ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "assets" / "data"
PUB_PATH = DATA / "publications.json"
META_PATH = DATA / "scholar-meta.json"


TOPIC_KEYWORDS = [
    ("neuroscience", ["brain", "eeg", "fmri", "neuro", "seizure", "epilep", "connectome", "cortex", "depress", "schizophren", "addict", "alzheimer", "cognit"]),
    ("ai-health",    ["llm", "language model", "clinical", "health", "diagnosis", "icu", "medical image"]),
    ("dynamics",     ["chaos", "chaotic", "attractor", "nonlinear dynam", "bifurc", "lyapunov"]),
    ("optimization", ["optim", "genetic algorithm", "programming", "schedul"]),
    ("energy",       ["wind", "solar", "renew", "power grid", "energy"]),
    ("systems",      ["control", "marine", "vehicle", "formation", "tracking", "robot"]),
]


def infer_topic(title: str, venue: str) -> str:
    hay = (title + " " + (venue or "")).lower()
    for topic, keys in TOPIC_KEYWORDS:
        if any(k in hay for k in keys):
            return topic
    return "other"


def format_authors(authors) -> str:
    """Normalize to comma-separated. Scholar emits 'A and B and C'; we prefer 'A, B, C'."""
    if not authors:
        return ""
    if isinstance(authors, list):
        return ", ".join(authors)
    s = str(authors)
    # " and " → ", " (case-insensitive, word-bounded)
    import re as _re
    s = _re.sub(r"\s+and\s+", ", ", s)
    return s.strip()


def try_fetch():
    """Fetch author + publications. Return (meta, papers) or (None, None) on soft failure."""
    try:
        from scholarly import scholarly, ProxyGenerator  # type: ignore
    except ImportError:
        print("ERROR: scholarly not installed. `pip install -r requirements.txt`", file=sys.stderr)
        sys.exit(1)

    # Optional proxy setup (FreeProxies or ScraperAPI) to dodge CAPTCHAs.
    try:
        pg = ProxyGenerator()
        if pg.FreeProxies():
            scholarly.use_proxy(pg)
            print("[info] using FreeProxies")
    except Exception as e:  # noqa: BLE001
        print(f"[warn] proxy setup failed, continuing without: {e}")

    try:
        author = scholarly.search_author_id(SCHOLAR_ID)
        author = scholarly.fill(author, sections=["basics", "indices", "publications"])
    except Exception as e:  # noqa: BLE001 — anything from here is a soft failure
        print(f"[warn] Scholar fetch failed (likely CAPTCHA / block): {e}")
        return None, None

    meta = {
        "last_updated": date.today().isoformat(),
        "source": f"Google Scholar (user={SCHOLAR_ID})",
        "citations_all":    author.get("citedby", 0),
        "citations_recent": author.get("citedby5y", 0),
        "h_index_all":      author.get("hindex", 0),
        "h_index_recent":   author.get("hindex5y", 0),
        "i10_all":          author.get("i10index", 0),
        "i10_recent":       author.get("i10index5y", 0),
        "publication_count": len(author.get("publications", [])),
    }

    papers = []
    for pub in author.get("publications", []):
        bib = pub.get("bib", {}) or {}
        title = bib.get("title", "")
        authors = format_authors(bib.get("author", ""))
        venue = bib.get("citation", "") or bib.get("journal", "") or bib.get("conference", "")
        year = bib.get("pub_year")
        try:
            year = int(year) if year else None
        except (ValueError, TypeError):
            year = None
        cites = pub.get("num_citations", 0) or 0
        url = pub.get("pub_url") or pub.get("eprint_url") or (
            f"https://scholar.google.com/citations?view_op=view_citation&hl=en&user={SCHOLAR_ID}&citation_for_view={pub.get('author_pub_id','')}"
        )
        papers.append({
            "title": title.strip(),
            "authors": authors.strip(),
            "venue": venue.strip(),
            "year": year,
            "citations": int(cites),
            "topic": infer_topic(title, venue),
            "url": url,
        })

    papers.sort(key=lambda p: ((p["year"] or 0), p["citations"]), reverse=True)
    return meta, papers


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Print diff, don't write")
    args = parser.parse_args()

    meta, papers = try_fetch()
    if meta is None or papers is None:
        print("[warn] exiting 0 without changes (fail-soft). Existing JSON baseline preserved.")
        return 0

    if not papers:
        print("[warn] Scholar returned 0 publications — suspicious. Not overwriting.")
        return 0

    if args.dry_run:
        print(f"[dry-run] would write {len(papers)} papers, h={meta['h_index_all']}, cites={meta['citations_all']}")
        print(json.dumps(papers[:3], indent=2))
        return 0

    DATA.mkdir(parents=True, exist_ok=True)
    PUB_PATH.write_text(json.dumps(papers, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    META_PATH.write_text(json.dumps(meta, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"[ok] wrote {len(papers)} papers → {PUB_PATH.relative_to(ROOT)}")
    print(f"[ok] wrote meta → {META_PATH.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
