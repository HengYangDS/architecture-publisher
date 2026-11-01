# Big Bank

[`model.json`](model.json) is the C4 model's classic Internet Banking System of
Big Bank plc as an Architecture Model: eight components, ten relations, two
views, and its own kinds and details. It is fictional and cites no sources, so
it builds without `--repo`:

```sh
archpub check examples/big-bank/model.json
archpub build examples/big-bank/model.json --out build/big-bank
```

The tests build this file, so the commands stay current with the model format.
