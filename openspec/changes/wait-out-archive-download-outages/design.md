## Context

See [proposal.md](proposal.md). `officialSource` reads each platform's locked archive from the tool cache, or
downloads it, verifies its SHA-256 against the lock and caches it, so a rerun downloads only what is missing. The
download retried a server error twice, 5 and then 10 seconds later.

## Goals / Non-Goals

**Goals:**

- A release assembled during a Forge outage of up to half an hour completes on its own.
- A refusal that waiting cannot change, such as `404`, still stops at once.

**Non-Goals:**

- Making the rest of a release resumable: tagging and publishing go through ETHOS's receipts, and Forge Releases
  through each Forge's CLI, which own those steps.
- Retrying CI's own tool downloads, which each CI run reports and a rerun repeats.

## Decisions

- **A deadline, not a count.** Outages are measured in minutes, so the download waits at a doubling interval from 10
  seconds to a 2-minute ceiling until 30 minutes have passed, rather than a fixed number of attempts.
- **`429` is transient.** A rate limit answers again later, like a server error.
- **The schedule is an option of `officialSource`.** The release passes none and gets the 30-minute schedule; the
  test passes one of milliseconds against a local server.

## Risks / Trade-offs

- [A release waits up to 30 minutes per archive before it reports an outage] → It reports the archive, status and
  attempts when it gives up, and an archive already verified stays cached.
