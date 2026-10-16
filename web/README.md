# PeyajFlow judges' demo

This is the code version of `project/PeyajFlow Demo.dc.html` from the Claude Design handoff. It's a static mobile web page: no build step and no dependencies.

- `index.html` is the entry point.
- `app.js` holds all the screens, the flow lists and the navigation.
- `app.css` holds the demo-shell styles.
- `broadsheet.css` is the Broadsheet design system, copied unchanged.
- `vendor/phosphor/` holds the Phosphor icon fonts (v2.1.1: regular, fill, bold and duotone, woff2 only). They're stored here so the demo doesn't depend on a CDN.
- Google Fonts are still loaded from the web.

## Run locally

```sh
cd web && python3 -m http.server 8000
# open http://localhost:8000
```

## Publish for the QR code

Host the `web/` folder on any static host, such as GitHub Pages, Netlify or Cloudflare Pages, and point the QR code at its URL.

## Design tweaks

The design tool's tweak panels are URL parameters here:

- `?advice=wait|sell|part`: the advice card on F01 (default `wait`)
- `?otp=filled|error|loading`: the OTP screen state (default `filled`)

The last flow opened is remembered in `localStorage` under the key `pf-demo`.
