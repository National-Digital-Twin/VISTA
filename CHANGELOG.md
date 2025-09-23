# Changelog 

**Repository:** `vista`  
**Description:** `Tracks all notable changes, version history, and roadmap toward 1.0.0 following Semantic Versioning.`  

All notable changes to this repository will be documented in this file.

This project follows **Semantic Versioning (SemVer)** ([semver.org](https://semver.org/)), using the format:


`[MAJOR].[MINOR].[PATCH]` 
- **MAJOR** (`X.0.0`) – Incompatible API/feature changes that break backward compatibility. 
- **MINOR** (`0.X.0`) – Backward-compatible new features, enhancements, or functionality changes. 
- **PATCH** (`0.0.X`) – Backward-compatible bug fixes, security updates, or minor corrections. 
- **Pre-release versions** – Use suffixes such as `-alpha`, `-beta`, `-rc.1` (e.g., `2.1.0-beta.1`). 
- **Build metadata** – If needed, use `+build` (e.g., `2.1.0+20250314`). 

---

## [0.92.2]

- Fixed styling issues between asset layer panels and toolbar buttons
- Restored visual dependency lines between assets

## [0.92.1]

- Backend API dependency patching
- Progress indicator added on asset layer panel
- Refactored the query to fetch the datasets to be more fault tolerant

## [0.92.0]

- Integrate OS NGD API
- Integration of non-OS/NAPTAN data sources
- Integrate NAPTAN API
- Integrate OS names API
- Integrate with NHS open data portal

## [0.91.0]

- Add draggable circle polygon

## [0.90.0]

- Live weather station readings from the Met Office
- Tide times and levels from the Admiralty
- Dynamic proximity tool, showing all buildings in a given radius of a point
- Live rail arrival and departure boards
- "Feedback" button for providing live feedback and bug reports from inside the tool
- Vulnerable people visualisation
- Low bridge display (complete)
- New layers UI replacing the dropdowns
- New asset table (in preview)
- Visualisation of environmentally sensitive areas
- Map legend explaining the meanings of symbols and colours
- Full infrastructure-as-code OpenTofu deployment for staging and production
- Automatic database migrations in deployment
- New favicon design
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

© Crown Copyright 2025. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

Licensed under the NDTP InnerSource Licence – Version 1.0.

For full licensing terms, see [LICENSE.md](LICENSE.md).

