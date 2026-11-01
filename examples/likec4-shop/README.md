# LikeC4 shop

[`model.c4`](model.c4) and [`views.c4`](views.c4) are a small LikeC4 workspace:
a customer, a shop with its web store, orders API and database, a payment
provider and a nested platform, with an index view, the shop's internals and a
dynamic checkout view. Import it into an Architecture Model, then check and
build that model like any other:

```sh
archpub import likec4 examples/likec4-shop --out build/shop.json --id shop
archpub check build/shop.json
archpub build build/shop.json --out build/shop
```

The tests import this workspace, so the commands stay current with the importer.
