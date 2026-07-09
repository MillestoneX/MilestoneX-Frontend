# Contributing to MilestoneX

Thanks for your interest in helping build **MilestoneX** — a transparent,
on-chain crowdfunding platform on the Stellar Network.

## Brand rules

When adding new code or docs:

- Use `MilestoneX` (camel-cased) for the product name.
- Use `milestonex` (lowercase) for slugs, package names, and keys.
- Use `milestonex.com` for canonical URLs.
- Use `milestonex-bookmarks` (and the other `milestonex-*` prefixes) for
  `localStorage` keys.
- The brand glyph uses the letter **M**, not **O** — see the implementation
  in `components/Header.tsx`.

## Verifying

Run the brand-check script before opening a PR:

```bash
./scripts/brand-check.sh
```
