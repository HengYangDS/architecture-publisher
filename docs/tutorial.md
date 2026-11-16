---
subject: architecture-publisher:tutorial
role: how-to
state: canonical
relations:
  governed_by: product-contract.md
---

# Publish your first architecture

In this tutorial you will describe a small repository in an
Architecture Model, check it against the code, build its print edition and its
page, and accept and publish the result. You need `archpub` on your path, which
the [how-to guides](how-to.md#install-the-command) install, and Git.

## 1. Make a repository to describe

Any Git repository works. This one is small enough to read at a glance: a web
checkout calls an order service, which saves to an order store.

```sh
mkdir -p shop/web shop/orders shop/store
cat > shop/web/checkout.js <<'EOF'
import { placeOrder } from "../orders/place.js";

export async function checkout(cart) {
  return placeOrder(cart.items);
}
EOF
cat > shop/orders/place.js <<'EOF'
import { saveOrder } from "../store/orders.js";

export async function placeOrder(items) {
  const order = { items, placedAt: new Date().toISOString() };
  await saveOrder(order);
  return order;
}
EOF
cat > shop/store/orders.js <<'EOF'
const orders = [];

export async function saveOrder(order) {
  orders.push(order);
}
EOF
git -C shop init -b main
git -C shop add -A
git -C shop commit -m "A small shop"
git -C shop rev-parse HEAD
```

The last command prints the commit you just made. The model pins it, so the
work keeps describing this exact code however the repository moves on.

## 2. Write the model

Save this as `model.json` beside `shop/`, and replace `<commit>` with the
commit from step 1:

```json
{
  "format": "architecture-publisher.model",
  "version": 3,
  "id": "shop",
  "title": "Shop",
  "question": "How does an order reach the store?",
  "summary": "The web checkout places each order through the order service, which saves it in the order store.",
  "editors": [{ "name": "Your Name" }],
  "repository": { "name": "shop", "revision": "<commit>" },
  "components": [
    { "id": "web", "label": "Web checkout", "kind": "frontend", "files": ["web/"] },
    { "id": "orders", "label": "Order service", "files": ["orders/"] },
    { "id": "store", "label": "Order store", "kind": "store", "files": ["store/"] }
  ],
  "relations": [
    {
      "id": "web-orders",
      "from": "web",
      "to": "orders",
      "label": "places orders",
      "files": ["web/checkout.js"]
    },
    {
      "id": "orders-store",
      "from": "orders",
      "to": "store",
      "label": "saves",
      "files": ["orders/place.js"]
    }
  ],
  "kinds": {
    "frontend": { "label": "web application", "category": "frontend" },
    "store": { "label": "database", "category": "database" }
  },
  "views": [
    {
      "id": "order-path",
      "title": "Order path",
      "question": "Which parts does an order pass through?",
      "summary": "The web checkout places each order through the order service, which saves it in the order store. Each part owns one directory of the shop.",
      "members": ["web", "orders", "store"]
    }
  ]
}
```

Each component claims the directory it owns in `files`, and each relation cites
the file that shows it: `web/checkout.js` imports the order service, and
`orders/place.js` imports the store. The view asks one question and answers it
with the three parts and a summary.

## 3. Check it against the code

```sh
archpub check model.json --repo shop
```

```text
┌  archpub check · shop
│
│  Model
◆  Views  1 view admitted
◆  Files  3 files verified
│
│  Plates
▲  01  order-path · figure 65% of the body, beside its reading · misses
│      emptyShare 0.377 (limit 0.12), blankBand 224 (limit 96) and holes 0.78
│      (limit 0.4)
│
│  Coverage at b371a1b
◆  Files  3 of 3 owned, 0 uncovered, 0 excluded
│
└  Next: archpub build model.json --repo shop --out <directory>
```

Your commit differs from `b371a1b`. The check read every claimed and cited file
at the pinned commit and wrote nothing; on a terminal it shows the step it is at
while it runs. Each line is one fact: `◆` marks what passed and `▲` what needs
attention, and a value longer than the terminal continues under its own column.
Three parts leave most of a plate blank, so the plate misses balance gates, each
printed with what was measured and its limit; that is recorded for the reviewer,
not refused. Misspell a field, such as `labl`, and the check refuses the model:
each problem is one line marked `■` with its path, and the line of
`/components/1/labl` names the field you meant.

## 4. Build the work

```sh
archpub build model.json --repo shop --out delivery
```

`delivery/` now holds `shop.pdf`, the print edition with a title page, contents
and one plate for the view; `images/`, a picture of each plate; `shop.html`, the
interactive page; `model.json`, `shop.json` and `shop.md`, the model, its data
with the digest of every file the build read, and the reader file for a reader
that works from text; and `manifest.json`, which records the digest of every
file the build wrote. Open the PDF and the page and read them as your reader
will.

## 5. Accept and publish

A reviewer accepts a delivery; a build never does.

```sh
archpub accept delivery --reviewer "Your Name"
archpub publish delivery --to published
```

`accept` checks that nothing in the delivery changed since it was built and
records your name. `publish` copies only an accepted delivery, to
`published/shop/<version>/`.

## Next

- Write a [guide](how-to.md#write-the-guide) to explain the system in your own
  words, with citations into the code.
- [Re-pin the work](how-to.md#re-pin-a-work-to-a-later-commit) when the code
  moves on.
- Look up every field in the [model reference](reference/model.md) and every
  command in the [operations reference](reference/operations.md).
