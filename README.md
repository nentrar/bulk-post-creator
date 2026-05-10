# Bulk Post Creator

A lightweight, browser-based tool for generating bulk social media posts (Instagram / Facebook square format) from a background image and a CSV file. No server, no backend, no account needed — everything runs locally in the browser.

> Built as a free alternative to Canva's premium bulk create feature.

## Features

- Upload any image as background (JPG, PNG, WEBP)
- Add multiple text fields with independent font, size, color, alignment, max-width, and line-height settings
- Choose from 20 Google Fonts via dropdown
- Drag text fields anywhere on the preview canvas to set position
- Preview each CSV row individually with ◀ ▶ navigation
- Supports comma, semicolon, or tab as CSV delimiters (useful when text contains commas)
- Text wraps automatically within configured max-width
- Export as JPG, PNG, or WEBP — output resolution matches source image
- Downloads all posts as a single ZIP file
- Validates CSV field count against defined text fields and shows clear error messages
- Dark mode support

## CSV format

First column is the row number (lp), followed by one value per text field:

```
# 1 text field
1,Hello world
2,Another caption

# 2 text fields (semicolon delimiter recommended when text has commas)
1;First line of text;Secondary caption here
2;Summer vibes;Join us at the event
```

## How to use

1. Upload a square (or any) image — it will be cropped to square from center
2. Add one or more text fields and configure font/size/color
3. Drag the field handles on the preview to position text
4. Choose your CSV delimiter
5. Upload your CSV file
6. Pick export format (JPG / PNG / WEBP)
7. Click **Generate & Download ZIP**

## Project structure

```
bulk-post-creator/
├── index.html   # App shell and layout
├── style.css    # All styling (light + dark mode)
├── app.js       # All logic (parsing, canvas, drag, export)
└── README.md
```

No build step, no dependencies to install. Just open `index.html` in a browser.

## Deployment

### Vercel

1. Push this folder to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
3. Leave all settings as default (Vercel auto-detects static sites)
4. Click Deploy

### GitHub Pages

1. Push to GitHub
2. Go to repo **Settings → Pages**
3. Set source to `main` branch, root folder `/`
4. Save — your site will be live at `https://<username>.github.io/<repo>/`

## Local development

No build step needed:

```bash
# Option 1 — Python
python3 -m http.server 8080

# Option 2 — Node
npx serve .
```

Then open `http://localhost:8080`.

## License

MIT
