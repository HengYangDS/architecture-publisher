# Security

Report a vulnerability in Architecture Publisher privately. Do not open a
public issue or pull request for it. Write to the maintainer at the email
address on [their GitHub profile](https://github.com/HengYangDS), with the
version (`archpub --version`), what an attacker could do and how to reproduce
it.

Examples of what to report, a way to:

- make a build or a check change the checkout it reads, fetch into it, or
  write anywhere but the directories the caller names and a temporary
  directory of its own;
- make a build, a check or a verification reach the network, or run a program
  or load code that a model, a guide or the described repository supplies;
- have `archpub verify` pass a delivery whose bytes differ from its manifest,
  or `archpub publish` replace a different published delivery.

This is a documented limit, not a vulnerability: the publisher draws what a
model states and does not judge whether the model is true. The
[product contract](docs/product-contract.md#boundaries) names the others.

The project has one maintainer, so a report is handled on a best-effort basis
with no fixed response time. A fix ships in a new release whose notes name it;
earlier releases are not patched.
