# Distributed System Local Demo

Cloud deployment is pending, but the project can demonstrate a real distributed runtime locally using Docker Compose.

## Architecture

```text
Browser
  -> frontend container (nginx, port 8080)
  -> api container (Node.js HTTP API, port 3001)
  -> Supabase Cloud (PostgreSQL/Auth/Storage)
```

The frontend and backend are separate processes, separate containers, and separate network services.

## Prerequisites

- Docker Desktop installed.
- `local.env` exists at the repository root.
- `local.env` contains Supabase values needed by the API.

`local.env` is ignored by Git and Docker build context. It is only read by Docker Compose on the local machine.

## Run

```powershell
docker compose up --build
```

Open:

```text
http://localhost:8080
http://localhost:3001/api/health
```

Check containers:

```powershell
docker compose ps
```

Stop:

```powershell
docker compose down
```

## Evidence For Report

- Screenshot of `docker compose ps` showing `api` and `frontend`.
- Screenshot of `http://localhost:8080`.
- Screenshot of `http://localhost:3001/api/health`.
- Screenshot or short terminal capture of JSON request logs from the API.

## Cloud Follow-Up

When AWS/Azure/GCP access is available, deploy the same separation:

```text
frontend static hosting or container
api container/service
Supabase cloud database
provider logging/monitoring
```
