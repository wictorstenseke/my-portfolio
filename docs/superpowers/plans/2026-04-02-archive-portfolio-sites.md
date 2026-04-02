# Archive Portfolio Sites Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers-extended-cc:subagent-driven-development (if subagents available) or superpowers-extended-cc:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separate the old (v1) and new (v2) portfolio sites into self-contained static HTML archives under `archive/`, leaving the repo root clean for a future v3 site.

**Architecture:** Both sites are pure PHP include-based templates with zero dynamic logic. We render each page via PHP CLI, fix absolute asset paths to relative, copy static assets, then remove the original source directories. Each archive is a fully browsable static site — open `index.html` in any browser.

**Tech Stack:** PHP CLI (rendering), sed (path fixing), bash (file operations)

---

## Context

### Current repo structure
```
wictorstenseke/
├── public_html/          # V1 old site (web root)
│   ├── index.php
│   ├── projekt/          # 3 case study pages
│   ├── css/, js/, img/, fonts/
│   └── favicons at root level
├── includes/             # V1 shared PHP includes
├── js/                   # V1 source JS
├── sass/                 # V1 source SASS
├── new_site/             # V2 new site (self-contained)
│   ├── public/           # V2 web root
│   ├── includes/
│   ├── js/, sass/
│   └── config.codekit3
├── .codekit-cache/
├── config.codekit3       # Root CodeKit config
└── .gitignore
```

### Target structure
```
wictorstenseke/
├── archive/
│   ├── v1/               # Fully static old portfolio
│   │   ├── index.html
│   │   ├── projekt/
│   │   │   ├── bokningssystem.html
│   │   │   ├── servicedesign.html
│   │   │   └── webbplats.html
│   │   ├── css/all.css
│   │   ├── js/app-3.6.2.min.js
│   │   ├── img/ (16 files)
│   │   ├── fonts/ (3 files)
│   │   ├── apple-touch-icon.png, favicon.ico, ...
│   │   ├── manifest.json, browserconfig.xml
│   │   └── config.codekit3
│   └── v2/               # Fully static newer portfolio
│       ├── index.html
│       ├── error_404.html
│       ├── css/main.css
│       ├── js/startkit.min.js
│       ├── img/ (4 files)
│       ├── favicons/ (10 files)
│       └── config.codekit3
├── docs/
├── .gitignore
└── .git/
```

### Key technical details

**PHP rendering:** Each page must be rendered from its own directory for include paths to resolve:
- `cd public_html && php index.php` (includes use `../includes/`)
- `cd public_html/projekt && php bokningssystem.php` (includes use `../../includes/`)
- `cd new_site/public && php index.php` (includes use `../includes/`)

**Path types found in rendered HTML:**

| Type | Example | Fix needed |
|------|---------|-----------|
| Root-absolute | `href="/css/all.css"` | Strip leading `/` (root pages) or replace with `../` (subdir pages) |
| Relative | `src="img/avatar2.jpg"` | No fix needed |
| Parent-relative | `src="../js/app-3.6.2.min.js"` | No fix needed |
| Protocol-relative | `src="//use.fontawesome.com/..."` | No fix needed |
| External absolute | `href="https://..."` | No fix needed |
| Internal page link | `href="/projekt/bokningssystem"` | Strip `/`, add `.html` |
| Sibling page link | `href="webbplats"` | Add `.html` |
| Home link | `href="/"` | Convert to `../index.html` or `index.html` |

**V2 dynamic element:** `<?php echo date("Y"); ?>` in index-include.php outputs current year. PHP CLI handles this automatically (renders as "2026").

---

### Task 1: Create archive directory structure

**Goal:** Create all directories needed for both archives

**Files:**
- Create: `archive/v1/projekt/`
- Create: `archive/v1/css/`, `archive/v1/js/`, `archive/v1/img/`, `archive/v1/fonts/`
- Create: `archive/v2/css/`, `archive/v2/js/`, `archive/v2/img/`, `archive/v2/favicons/`

**Acceptance Criteria:**
- [ ] All archive subdirectories exist

**Verify:** `ls archive/v1/ archive/v2/` → shows expected subdirectories

**Steps:**

- [ ] **Step 1: Create all directories**

```bash
cd /Users/wictorstenseke/Webprojects/wictorstenseke

mkdir -p archive/v1/{projekt,css,js,img,fonts}
mkdir -p archive/v2/{css,js,img,favicons}
```

- [ ] **Step 2: Verify and commit**

```bash
ls archive/v1/ archive/v2/
```

Expected: `css fonts img js projekt` and `css favicons img js`

```bash
git add archive/
git commit -m "chore: create archive directory structure for v1 and v2"
```

---

### Task 2: Flatten V1 (old site) to static HTML and copy assets

**Goal:** Render all 4 V1 PHP pages to static HTML with working relative paths, copy all static assets

**Files:**
- Create: `archive/v1/index.html`
- Create: `archive/v1/projekt/bokningssystem.html`
- Create: `archive/v1/projekt/servicedesign.html`
- Create: `archive/v1/projekt/webbplats.html`
- Copy: `public_html/css/all.css` → `archive/v1/css/all.css`
- Copy: `public_html/js/app-3.6.2.min.js` → `archive/v1/js/app-3.6.2.min.js`
- Copy: `public_html/img/*` → `archive/v1/img/`
- Copy: `public_html/fonts/*` → `archive/v1/fonts/`
- Copy: favicons, manifest.json, browserconfig.xml → `archive/v1/`
- Copy: `public_html/config.codekit3` → `archive/v1/config.codekit3`

**Acceptance Criteria:**
- [ ] 4 HTML pages render from PHP without errors
- [ ] No remaining `href="/` or `src="/` paths (except external URLs and protocol-relative)
- [ ] Internal page links use `.html` extensions
- [ ] All static assets copied
- [ ] Pages open in browser with styles and images

**Verify:** `grep -n 'href="/' archive/v1/index.html | grep -v https | grep -v http | grep -v '//'` → no output

**Steps:**

- [ ] **Step 1: Render PHP pages to HTML**

```bash
cd /Users/wictorstenseke/Webprojects/wictorstenseke

# Index page (CWD must be public_html for ../includes/ to resolve)
(cd public_html && php index.php) > archive/v1/index.html

# Projekt pages (CWD must be public_html/projekt for ../../includes/ to resolve)
(cd public_html/projekt && php bokningssystem.php) > archive/v1/projekt/bokningssystem.html
(cd public_html/projekt && php servicedesign.php) > archive/v1/projekt/servicedesign.html
(cd public_html/projekt && php webbplats.php) > archive/v1/projekt/webbplats.html
```

Verify: `wc -l archive/v1/*.html archive/v1/projekt/*.html` → all files have content (no empty files)

- [ ] **Step 2: Fix paths in index.html (root level)**

The index page has these internal page links to fix before the general absolute-path strip:

```bash
cd /Users/wictorstenseke/Webprojects/wictorstenseke

# Fix specific internal page links (must run BEFORE general / strip)
sed -i '' \
  -e 's|href="/projekt/bokningssystem"|href="projekt/bokningssystem.html"|g' \
  -e 's|href="/projekt/servicedesign"|href="projekt/servicedesign.html"|g' \
  -e 's|href="projekt/webbplats"|href="projekt/webbplats.html"|g' \
  archive/v1/index.html

# Strip leading / from remaining absolute asset paths
# Pattern: href="/X where X is not / (avoids matching // protocol-relative URLs)
sed -i '' -E \
  -e 's|href="/([^/])|href="\1|g' \
  -e 's|src="/([^/])|src="\1|g' \
  archive/v1/index.html
```

- [ ] **Step 3: Fix paths in projekt/ pages (subdirectory level)**

Projekt pages need `../` prefix for root-relative assets, `.html` for sibling links:

```bash
cd /Users/wictorstenseke/Webprojects/wictorstenseke

# Fix specific links (must run BEFORE general / replacement)
sed -i '' \
  -e 's|href="webbplats"|href="webbplats.html"|g' \
  -e 's|href="bokningssystem"|href="bokningssystem.html"|g' \
  -e 's|href="servicedesign"|href="servicedesign.html"|g' \
  -e 's|href="/"|href="../index.html"|g' \
  archive/v1/projekt/bokningssystem.html \
  archive/v1/projekt/servicedesign.html \
  archive/v1/projekt/webbplats.html

# Replace remaining /X paths with ../X (for assets)
sed -i '' -E \
  -e 's|href="/([^/])|href="../\1|g' \
  -e 's|src="/([^/])|src="../\1|g' \
  archive/v1/projekt/bokningssystem.html \
  archive/v1/projekt/servicedesign.html \
  archive/v1/projekt/webbplats.html
```

- [ ] **Step 4: Copy static assets**

```bash
cd /Users/wictorstenseke/Webprojects/wictorstenseke

# CSS, JS, images, fonts
cp public_html/css/all.css archive/v1/css/
cp public_html/js/app-3.6.2.min.js archive/v1/js/
cp public_html/img/* archive/v1/img/
cp public_html/fonts/* archive/v1/fonts/

# Favicons (at root level in public_html)
cp public_html/favicon.ico archive/v1/
cp public_html/favicon-16x16.png archive/v1/
cp public_html/favicon-32x32.png archive/v1/
cp public_html/apple-touch-icon.png archive/v1/
cp public_html/android-chrome-192x192.png archive/v1/
cp public_html/android-chrome-512x512.png archive/v1/
cp public_html/mstile-150x150.png archive/v1/
cp public_html/safari-pinned-tab.svg archive/v1/

# Manifest and browser config
cp public_html/manifest.json archive/v1/
cp public_html/browserconfig.xml archive/v1/

# CodeKit config (for build history)
cp public_html/config.codekit3 archive/v1/
```

- [ ] **Step 5: Verify and commit**

```bash
# Check no remaining absolute paths (except external)
grep -rn 'href="/' archive/v1/ | grep -v 'https\|http\|//'
grep -rn 'src="/' archive/v1/ | grep -v 'https\|http\|//'
```

Expected: no output (all absolute paths converted)

```bash
# Check asset files exist
ls archive/v1/css/all.css archive/v1/js/app-3.6.2.min.js archive/v1/fonts/ archive/v1/img/ archive/v1/favicon.ico
```

```bash
git add archive/v1/
git commit -m "feat: archive v1 portfolio as static HTML

Flatten PHP includes to static HTML, convert absolute asset paths
to relative, copy all static assets (CSS, JS, images, fonts, favicons)."
```

---

### Task 3: Flatten V2 (new site) to static HTML and copy assets

**Goal:** Render V2 PHP pages to static HTML with working relative paths, copy all static assets

**Files:**
- Create: `archive/v2/index.html`
- Create: `archive/v2/error_404.html`
- Copy: `new_site/public/css/main.css` → `archive/v2/css/main.css`
- Copy: `new_site/public/js/startkit.min.js` → `archive/v2/js/startkit.min.js`
- Copy: `new_site/public/img/*` → `archive/v2/img/`
- Copy: `new_site/public/favicons/*` → `archive/v2/favicons/`
- Copy: `new_site/config.codekit3` → `archive/v2/config.codekit3`

**Acceptance Criteria:**
- [ ] 2 HTML pages render from PHP without errors
- [ ] No remaining `href="/` or `src="/` paths (except external URLs)
- [ ] `error_404.html` links to `index.html` (not `/`)
- [ ] All static assets copied
- [ ] Pages open in browser with styles and images

**Verify:** `grep -n 'href="/' archive/v2/index.html | grep -v https | grep -v http` → no output

**Steps:**

- [ ] **Step 1: Render PHP pages to HTML**

```bash
cd /Users/wictorstenseke/Webprojects/wictorstenseke

# Both pages (CWD must be new_site/public for ../includes/ to resolve)
(cd new_site/public && php index.php) > archive/v2/index.html
(cd new_site/public && php error_404.php) > archive/v2/error_404.html
```

Verify: `wc -l archive/v2/*.html` → both files have content

- [ ] **Step 2: Fix paths in both pages**

V2 pages are all at root level. All internal paths are absolute (`/css/`, `/favicons/`, `/img/`, `/js/`):

```bash
cd /Users/wictorstenseke/Webprojects/wictorstenseke

# Fix home link in 404 page (must run BEFORE general / strip)
sed -i '' \
  -e 's|href="/"|href="index.html"|g' \
  archive/v2/error_404.html

# Strip leading / from absolute asset paths in both files
# Includes content= for <meta name="msapplication-config" content="/favicons/...">
sed -i '' -E \
  -e 's|href="/([^/])|href="\1|g' \
  -e 's|src="/([^/])|src="\1|g' \
  -e 's|content="/([^/])|content="\1|g' \
  archive/v2/index.html \
  archive/v2/error_404.html
```

- [ ] **Step 3: Copy static assets**

```bash
cd /Users/wictorstenseke/Webprojects/wictorstenseke

# CSS, JS, images
cp new_site/public/css/main.css archive/v2/css/
cp new_site/public/js/startkit.min.js archive/v2/js/
cp new_site/public/img/* archive/v2/img/

# Favicons (in subdirectory for v2)
cp new_site/public/favicons/* archive/v2/favicons/

# CodeKit config
cp new_site/config.codekit3 archive/v2/
```

- [ ] **Step 4: Verify and commit**

```bash
# Check no remaining absolute paths
grep -rn 'href="/' archive/v2/ | grep -v 'https\|http\|//'
grep -rn 'src="/' archive/v2/ | grep -v 'https\|http\|//'
```

Expected: no output

```bash
git add archive/v2/
git commit -m "feat: archive v2 portfolio as static HTML

Flatten PHP includes to static HTML, convert absolute asset paths
to relative, copy all static assets (CSS, JS, images, favicons)."
```

---

### Task 4: Clean root directory and update .gitignore

**Goal:** Remove all old site directories from the repo root, update .gitignore

**Files:**
- Delete: `public_html/`, `new_site/`, `includes/`, `js/`, `sass/`
- Delete: `.codekit-cache/`, root `config.codekit3`
- Modify: `.gitignore`

**Acceptance Criteria:**
- [ ] Old directories removed from working tree and git
- [ ] Root contains only `archive/`, `docs/`, `.gitignore`, `.git/`
- [ ] `.gitignore` covers OS artifacts, SASS cache, CodeKit cache
- [ ] `config.codekit3` files in archive are NOT ignored (exception rule)

**Verify:** `ls` → `archive docs` (plus dotfiles)

**Steps:**

- [ ] **Step 1: Remove old directories from git**

```bash
cd /Users/wictorstenseke/Webprojects/wictorstenseke

git rm -r public_html/
git rm -r new_site/
git rm -r includes/
git rm -r js/
git rm -r sass/
```

- [ ] **Step 2: Remove untracked build artifacts**

```bash
rm -rf .codekit-cache/
rm -f config.codekit3
```

- [ ] **Step 3: Update .gitignore**

Replace `.gitignore` with a clean version that covers OS/build artifacts and allows archive configs:

```gitignore
### OS ###
.DS_Store
._*
.AppleDouble
.LSOverride
.Spotlight-V100
.Trashes
.VolumeIcon.icns
.com.apple.timemachine.donotpresent
Icon
Thumbs.db

### Sass ###
.sass-cache/
*.css.map

### CodeKit ###
.codekit-cache/
config.codekit
config.codekit3
*/codekit-config.json
/min

# Allow config.codekit3 in archives (kept for build history)
!archive/**/config.codekit3

### IDE ###
.idea/
.vscode/
*.swp
*.swo

### Node (for future v3) ###
node_modules/
.env
.env.local
```

- [ ] **Step 4: Force-add archive config.codekit3 files (they were gitignored)**

```bash
git add -f archive/v1/config.codekit3 archive/v2/config.codekit3
```

- [ ] **Step 5: Verify and commit**

```bash
ls
git status
```

Expected: only `archive/`, `docs/`, `.gitignore` at root. Git status shows staged deletions and .gitignore modification.

```bash
git add .gitignore
git commit -m "chore: remove old site sources, clean root for v3

Remove public_html/, new_site/, includes/, js/, sass/ and build
artifacts. Update .gitignore for clean slate with future Node support."
```

---

### Task 5: Final verification — all archive pages render correctly

**Goal:** Confirm both archives are complete, self-contained, and browsable

**Acceptance Criteria:**
- [ ] No absolute asset paths remain (except external URLs)
- [ ] Every referenced local asset exists on disk
- [ ] All internal page links resolve to existing `.html` files
- [ ] Pages open in browser with correct styles and images

**Verify:** All checks below pass with no errors

**Steps:**

- [ ] **Step 1: Check for remaining absolute paths**

```bash
cd /Users/wictorstenseke/Webprojects/wictorstenseke

# Should return nothing (all absolute paths converted)
grep -rn 'href="/' archive/ | grep -v 'https\|http\|//'
grep -rn 'src="/' archive/ | grep -v 'https\|http\|//'
```

- [ ] **Step 2: Verify all referenced local assets exist**

```bash
# Extract all relative href/src values from v1 and check they exist
for file in archive/v1/index.html; do
  dir=$(dirname "$file")
  grep -oP '(?:href|src)="\K[^"]+' "$file" | grep -v '^https\|^http\|^//\|^#\|^mailto' | while read -r path; do
    target="$dir/$path"
    target="${target%%\?*}"  # strip query params
    [ -f "$target" ] || echo "MISSING: $target (from $file)"
  done
done

for file in archive/v1/projekt/*.html; do
  dir=$(dirname "$file")
  grep -oP '(?:href|src)="\K[^"]+' "$file" | grep -v '^https\|^http\|^//\|^#\|^mailto' | while read -r path; do
    target="$dir/$path"
    target="${target%%\?*}"
    [ -f "$target" ] || echo "MISSING: $target (from $file)"
  done
done

for file in archive/v2/*.html; do
  dir=$(dirname "$file")
  grep -oP '(?:href|src)="\K[^"]+' "$file" | grep -v '^https\|^http\|^//\|^#\|^mailto' | while read -r path; do
    target="$dir/$path"
    target="${target%%\?*}"
    [ -f "$target" ] || echo "MISSING: $target (from $file)"
  done
done
```

Expected: no "MISSING" output

- [ ] **Step 3: Open pages in browser for visual check**

```bash
open archive/v1/index.html
open archive/v2/index.html
```

Manually verify: styles load, images display, navigation links work between pages.
