# Changelog — MilestoneX

All notable changes to MilestoneX are recorded here. The
format follows [Keep a Changelog](https://keepachangelog.com/),
and the project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Changed
- Rebrand: project, package, and storage keys migrated from
  the legacy OrbitChain naming to MilestoneX. See
  `docs/BRAND_GUIDELINES.md` for the canonical naming
  conventions.

### Fixed
- `package-lock.json` root package name synced to `@milestonex/web`
  to match `package.json` after the rename.
- `scripts/brand-check.sh` now excludes the migration entry in
  `CHANGELOG.md`, the historical note in `docs/BRAND_GUIDELINES.md`,
  and itself (plus `package-lock.json`, which is regenerated from
  `package.json`), so the brand verification only flags real leftovers.
