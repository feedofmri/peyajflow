# PeyajFlow

ন্যায্য দামে পেঁয়াজ, সরাসরি · Fair price, direct.

Two separate static sites, each hosted on its own:

- [`demo/`](demo/): the judges' phone demo (first QR code)
- [`faq/`](faq/): the FAQ and sources page (second QR code)

`scripts/package.sh` builds one zip per site in `dist/`, with `index.html` at the top level, ready to extract in cPanel's File Manager. A GitHub Pages copy is also deployed on every push to `main` (demo at `/peyajflow/`, FAQ at `/peyajflow/faq/`).

## Design source

- `project/`: the Claude Design export (HTML prototypes, the Broadsheet design system, assets).
- `chats/`: the design conversation.
- `DESIGN_HANDOFF.md`: the handoff notes.
