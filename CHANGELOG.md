# Changelog — MilestoneX

All notable changes to MilestoneX are recorded here. The
format follows [Keep a Changelog](https://keepachangelog.com/),
and the project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Changed
- Standardize package metadata to `@milestonex/web` (matches the
  canonical project name).
- Standardize localStorage / sessionStorage namespace to the
  `milestonex-` prefix across bookmarks, theme, auth session, and
  donation receipt filenames.
- Standardize Cloudinary upload folder to `milestonex/campaigns`.
- Standardize default publisher URLs and share exemplars to
  `https://milestonex.com` and `mailto:support@milestonex.com`.
- Standardize brand-check tooling to fail the build on any leftover
  legacy-token reference in source (see `scripts/brand-check.sh`).
