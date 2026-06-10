# CI/CD

The repository includes a GitHub Actions workflow at `.github/workflows/ci.yml`.

## What The Pipeline Checks

```text
checkout
setup Node.js 20
npm install --package-lock=false
npm run check:env
npm run check:architecture
npm test
```

## Why This Counts

- The pipeline runs automatically on pushes and pull requests.
- It blocks tracked env files and common leaked-token patterns.
- It enforces the layered architecture rules with a repeatable script.
- It runs the repository and service contract tests.

## Local Equivalent

Run the same checks locally:

```powershell
npm run ci
```

## Evidence For Report

- Screenshot of GitHub Actions workflow passing.
- Screenshot of the command `npm run ci` passing locally.
- Short explanation that this is a CI quality gate and can be extended with cloud deploy once billing access is available.
