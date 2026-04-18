# Feng Liu — Personal Academic Homepage

Source for the academic homepage of **Dr. Feng Liu**, Assistant Professor of Systems Engineering at Stevens Institute of Technology. Neuroscience-themed, scroll-driven, with auto-synced Google Scholar publications.

**Live URL (after Pages is enabled):** https://sit-brain-imaging-graph-learning-lab.github.io/FengLiu/

## Deploy on GitHub Pages

After the repo is pushed to `main`:

1. Repo → **Settings → Pages**
   - **Source:** `Deploy from a branch`
   - **Branch:** `main`
   - **Folder:** `/ (root)`
   - Click **Save**
2. Wait ~1 min for the first build, then visit the Live URL above.

### Actions permissions (required for Scholar auto-sync)

1. Repo → **Settings → Actions → General**
2. Scroll to **Workflow permissions**
   - Select **Read and write permissions**
   - ✅ tick **Allow GitHub Actions to create and approve pull requests**
   - Click **Save**

Without this the monthly/daily sync workflow won't be able to commit updated JSON files.

### Custom domain (optional)

Copy `CNAME.example` to `CNAME`, replace the contents with your domain, and configure DNS. Settings → Pages will pick it up automatically. If you move to a custom domain, also update `<base href="/FengLiu/">` in `404.html` to `<base href="/">`.

## Edit text content

All textual content lives in [assets/data/profile.json](assets/data/profile.json). Edit that single file to update bio, awards, students, courses, etc. The page re-hydrates at load time — no build step.

## Publications auto-sync

- [.github/workflows/update-scholar.yml](.github/workflows/update-scholar.yml) runs **daily @ 06:00 UTC** and on manual dispatch.
- It calls [scripts/fetch_scholar.py](scripts/fetch_scholar.py), which uses [`scholarly`](https://pypi.org/project/scholarly/) to pull the Scholar profile (`user=HVZdbX0AAAAJ`) and writes:
  - `assets/data/publications.json` — list of papers
  - `assets/data/scholar-meta.json` — citation totals, h-index, i10-index, publication count
- If Google Scholar blocks the runner (CAPTCHA — Scholar has no official API, so this happens), the script exits 0 without changes. The existing committed JSON baseline continues to serve the site. Run the workflow manually from the Actions tab to retry.

### Local dry-run

```bash
pip install -r requirements.txt
python scripts/fetch_scholar.py --dry-run
```

## Local preview

```bash
python -m http.server 8080
# open http://localhost:8080
```

## File tree

```
.
├── index.html              # single-page entry (all sections)
├── 404.html                # themed fallback (uses <base href="/FengLiu/">)
├── .nojekyll               # disables Jekyll processing
├── CNAME.example           # rename to CNAME if using a custom domain
├── assets/
│   ├── css/                # tokens, base, components, sections, motion
│   ├── js/                 # canvas bg, scroll, publications, interests graph, bootstrap
│   ├── img/                # portrait, campus watermark, favicon
│   └── data/               # profile.json + publications.json + scholar-meta.json
├── scripts/fetch_scholar.py
└── .github/workflows/update-scholar.yml
```
