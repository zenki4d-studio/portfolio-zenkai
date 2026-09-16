# Viet Nguyen — portfolio

Static portfolio with 107 films from `videos/`, real JPEG posters, and AI-first browsing.

## Preview

Run `python -m http.server 3000 --bind 127.0.0.1` in this folder, then open http://localhost:3000.

## Update the film library

Add MP4 files inside the category folders in `videos/`, then run:

```sh
python -m pip install imageio-ffmpeg
python scripts/build_catalog.py
```

The script creates `assets/catalog.js` and caches real frames in `assets/posters/`. Display titles omit generic Study/sequence suffixes, and original filenames are hidden on cards and in the player. The homepage mosaic is image-only. Curated homepage picks are in `portfolio.js`.

The page order is mosaic, About, film library, Connect. The library shows three rows per page: 15 films on desktop, 12 on tablet, and 6 on mobile. Filters and searches reset to page one.

The opening envelope runs for 3.6 seconds: the pocket drops clear before the letter approaches the viewer. It can be skipped with the button or Escape and replayed from Connect. Reduced-motion preferences skip it. Social destinations are in `socialProfiles` in `portfolio.js`; YouTube, Instagram and TikTok remain visibly inactive until the owner supplies profile URLs.

Only the hovered or keyboard-focused preview loads a video; leaving it unloads that source. Clicking opens a single native video player. Mobile users tap to play. Reduced-motion preferences disable automatic previews.

The website is static and needs no Node build. Deploy the HTML, CSS, JavaScript, assets and video directories together on a host that supports byte-range video requests. Google Fonts is the only external display dependency; serif and sans-serif fallbacks are provided.
