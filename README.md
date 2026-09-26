# Surf FED 

<img width="2560" height="1440" alt="32-browser-tab-volume-meter" src="https://github.com/user-attachments/assets/b945c8ef-1d6d-4e93-866f-d2b16e4bfec0" />

A static, GitHub Pages-ready promotional site for Surf FED and FED-EDU.

## Local preview

Because the site is plain HTML, CSS, and JavaScript, it can be previewed with any static server:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Publishing

The included `.github/workflows/deploy-pages.yml` deploys the repository to GitHub Pages whenever `main` changes. In repository settings, set Pages to **GitHub Actions**.

## Design system

The site carries over the source project’s dark editorial language: Space Grotesk, DM Mono, amber `#f0b35b`, violet `#8e83ff`, deep navy backgrounds, subtle noise, and asymmetrical product storytelling.

## Asset note

The promotional images in `assets/` are adapted from the supplied Surf FED project archive and retained as local files for GitHub Pages reliability.
