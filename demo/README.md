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
cd demo && python3 -m http.server 8000
# open http://localhost:8000
```

## Publish

Run `scripts/package.sh` from the repo root to build `dist/peyajflow-demo.zip`, then extract it into the site's folder in cPanel. Any static host works.

## Story and numbers

The flows follow the pitch deck's numbers for Rahim Uddin's 100 maunds: a production cost of ৳1,500/maund, ৳1,100 locally today, ৳1,450 in Dhaka minus ৳10,000 delivery, or ৳1,950 after a month minus delivery and ৳15,000 storage. They're set in `ECON` at the top of `app.js`.

`?otp=filled|error|loading` switches the OTP screen state. The last flow opened is remembered in `localStorage` under the key `pf-demo`.
