# MilestoneX Brand Guidelines

This document defines brand conventions for the **MilestoneX** project.

## Name

- **Canonical**: MilestoneX
- **Lowercase**: milestonex
- **Package**: @milestonex/web
- **Domain**: milestonex.com
- **Slug**: why-milestonex

## Logo

The brand glyph is a bold capital **M** rendered inside a primary-coloured
rounded square, followed by the wordmark **MilestoneX**. Use the existing
iconography in `components/Header.tsx`, `components/dashboard/Sidebar.tsx`,
and `app/(main)/components/Footer.tsx` as the reference implementation.

## LocalStorage keys

All client storage keys are namespaced under the `milestonex-` prefix:

| Key | Purpose |
|---|---|
| `milestonex-bookmarks` | Saved campaign bookmarks |
| `milestonex-theme` | User theme preference |
| `milestonex-session-expiry` | Auth session expiry timestamp |
| `milestonex-session-only` | Cookie/session-only flag |
| `milestonex-receipt-*` | Donation receipts |

## Migration note

Users who upgrade from the previous (OrbitChain) client lose their
localStorage bookmarks and theme. This is acceptable for a major rebrand —
legacy keys can be migrated transparently in a future patch if needed.
