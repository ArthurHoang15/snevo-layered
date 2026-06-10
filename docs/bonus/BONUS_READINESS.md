# Bonus Readiness Plan

This document maps the current repository work to the bonus criteria.

## Current Priority

AWS Elastic Beanstalk deployment is available, and the repository now includes CI plus AWS CD automation. The remaining bonus evidence should focus on screenshots of the deployed URL, GitHub Actions, health/logging, and distributed local runtime:

| Bonus item | Points | Current readiness | Evidence to show |
|---|---:|---|---|
| Cloud provider | +3 | Ready for evidence | AWS Elastic Beanstalk URL and environment health |
| CI/CD | +3 | Ready for evidence | GitHub Actions `CI` and `CD - AWS Elastic Beanstalk` workflows passing |
| Monitoring/logging | +2 | Ready | `/api/health` response and JSON request/error logs |
| Distributed system | +2 | Ready for local demo | Docker Compose with separate `api` and `frontend` services |

## Recommended Presentation Story

1. The core app is already refactored into layered architecture.
2. CI/CD quality gates protect the architecture and tests on every push/PR.
3. The backend emits structured logs and exposes a health endpoint for monitoring.
4. The system can run as two separately deployed services locally:
   - `frontend`: nginx static web server
   - `api`: Node.js native HTTP API
   - `database/auth`: Supabase cloud
5. AWS Elastic Beanstalk hosts the production-like cloud deployment; GitHub Actions can redeploy tested commits.

## Quick Evidence Checklist

- GitHub Actions screenshot: CI workflow green.
- GitHub Actions screenshot: AWS CD workflow green.
- AWS screenshot: Elastic Beanstalk environment health is OK.
- Browser screenshot: deployed Elastic Beanstalk URL opens the app.
- Terminal screenshot: `npm run ci` passes locally.
- Browser or curl screenshot: `http://localhost:3001/api/health`.
- Terminal screenshot: JSON log line containing `event":"http_request"`.
- Docker screenshot: `docker compose ps` showing `api` and `frontend`.
- Browser screenshot: `http://localhost:8080` frontend and `http://localhost:3001/api/health` API.

## Commands

```powershell
npm run ci
npm start
curl http://localhost:3001/api/health
docker compose up --build
docker compose ps
```

## Notes

- Do not commit `local.env`, `.env`, or real secret values.
- `local.env` is read by Docker Compose only on the local machine.
- Cloud deployment should use provider secrets, not local env files.
