# Changelog

**Repository:** `VISTA`\
**Description:** `Tracks all notable changes, version history, and roadmap toward 1.0.0 following Semantic Versioning.`\
**SPDX-License-Identifier:** `OGL-UK-3.0`

All notable changes to this repository will be documented in this file.

This project follows **Semantic Versioning (SemVer)** ([semver.org](https://semver.org/)), using the format:

`[MAJOR].[MINOR].[PATCH]`

- **MAJOR** (`X.0.0`) – Incompatible API/feature changes that break backward compatibility.
- **MINOR** (`0.X.0`) – Backward-compatible new features, enhancements, or functionality changes.
- **PATCH** (`0.0.X`) – Backward-compatible bug fixes, security updates, or minor corrections.
- **Pre-release versions** – Use suffixes such as `-alpha`, `-beta`, `-rc.1` (e.g., `2.1.0-beta.1`).
- **Build metadata** – If needed, use `+build` (e.g., `2.1.0+20250314`).

---

## [0.90.0]

### Features and Improvements

- Introduced a major VISTA redesign with scenarios, scenario-specific criticality scores, focus areas, exposure layers, and an overall four-dimensional score (criticality, dependency, exposure, redundancy).
- Added administrator capabilities to invite users, manage access via groups, approve shared exposure layers, and update criticality scores.
- Added the ability to draw user-specific exposure layers and display status indicators for focus-area inclusion.
- Added resource workflows, allowing users to withdraw and restock resources at configured locations.
- Added map constraints and a draggable circle polygon drawing tool.
- Rebuilt road routing using an A\* approach with local road and speed data, and moved routing graph construction to startup.
- Integrated key external and reference data sources, including OS NGD, NAPTAN, OS Names, NHS, live weather, Admiralty tide data, and live rail boards.
- Added dynamic proximity analysis to show assets/buildings within a selected radius.
- Added vulnerable people visualisation and completed low bridge display support.
- Introduced new and improved UI capabilities, including a new layers interface, map legend, asset table preview, privacy notice, progress indicators, and styling/cosmetic refinements.
- Improved dependency visualisation by restoring and hardening visual dependency rendering.
- Improved data handling and resilience, including nightly data refresh and fault-tolerant dataset query logic.
- Improved deployment and operations through OpenTofu infrastructure as code, automated database migrations, backend dependency patching, and updated branding (favicon).

---

## Future Roadmap to `1.0.0`

The `0.90.x` series is part of NDTP’s **pre-stable development cycle**, meaning:

- **Minor versions (`0.91.0`, `0.92.0`...) introduce features and improvements** leading to a stable `1.0.0`.
- **Patch versions (`0.90.1`, `0.90.2`...) contain only bug fixes and security updates**.
- **Backward compatibility is NOT guaranteed until `1.0.0`**, though NDTP aims to minimise breaking changes.

Once `1.0.0` is reached, future versions will follow **strict SemVer rules**.

---

## Versioning Policy

1. **MAJOR updates (`X.0.0`)** – Typically introduce breaking changes that require users to modify their code or configurations.

- **Breaking changes (default rule)**: Any backward-incompatible modifications require a major version bump.
- **Non-breaking major updates (exceptional cases)**: A major version may also be incremented if the update represents a significant milestone, such as a shift in governance, a long-term stability commitment, or substantial new functionality that redefines the project’s scope.

2. **MINOR updates (`0.X.0`)** – New functionality that is backward-compatible.
3. **PATCH updates (`0.0.X`)** – Bug fixes, performance improvements, or security patches.
4. **Dependency updates** – A **major dependency upgrade** that introduces breaking changes should trigger a **MAJOR** version bump (once at `1.0.0`).

---

## How to Update This Changelog

1. When making changes, update this file under the **Unreleased** section.
2. Before a new release, move changes from **Unreleased** to a new dated section with a version number.
3. Follow **Semantic Versioning** rules to categorise changes correctly.
4. If pre-release versions are used, clearly mark them as `-alpha`, `-beta`, or `-rc.X`.

---

**Maintained by the National Digital Twin Programme (NDTP).**

© Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
Licensed under the Open Government Licence v3.0.
For full licensing terms, see [OGL_LICENSE.md](OGL_LICENSE.md).
