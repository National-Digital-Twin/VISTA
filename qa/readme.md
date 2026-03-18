# Playwright + Cucumber (BDD)

E2E test framework for the VISTA map application.

## Project structure

- `features` – Cucumber `.feature` files
- `steps` – Step definition `.ts` files (use `page` from `support/browser.ts`)
- `support` – Browser lifecycle and hooks; `config/.env.<env>` for BASEURL
- `config/cucumber.js` – Cucumber config

## Get started

1. `cd qa`
2. `npm ci`
3. `npx playwright install`
4. For local tests, start the app (e.g. `npm start` in `frontend/` from the project root) and ensure `config/.env.local` has `BASEURL` (default `http://localhost:3001`).

## Run options

From the project root, in the `qa` folder:

| Command | Description |
|--------|-------------|
| `npm test` | Run with `ENV=local` (uses `config/.env.local`). Browser opens so you can watch (default). |
| `npm run test:parallel` | Run with 4 parallel workers (faster). |
| `npm run test:ci` | Same as `npm test` but headless for CI. |
| `npm run test:e2e` | Run with `ENV=dev` (uses `config/.env.dev`). |
| `npm run debug` | Playwright debug mode with `ENV=local`. |

To force headless locally, set `HEADLESS=true` or `CI=true`. To force headed when `CI=true`, set `HEADLESS=false`.

**Parallel execution:** Set `PARALLEL` in `config/.env.local` (or `config/.env.<env>` for the env you use) to the number of workers (1–8). You can still override at run time: `PARALLEL=4 npm test`. Default is 1; `npm run test:parallel` overrides with 4.

**Single feature:** Run one feature file by setting `FEATURE` or passing the path after `--`. Examples: `FEATURE=features/vista.feature npm test` or `npm test -- features/vista.feature`.

To use another env, add `config/.env.<env>` with `BASEURL` and run:

```bash
ENV=staging npx cucumber-js -c config/cucumber.js
```

## Sample test

The suite includes a scenario that opens the app and checks the VISTA logo is visible in the navigation bar (`features/vista.feature`).
