# Monitoring And Logging

The backend now exposes a health endpoint and emits structured JSON logs.

## Health Check

```text
GET /api/health
GET /health
```

Example:

```powershell
curl http://localhost:3001/api/health
```

Expected response:

```json
{
  "success": true,
  "status": "ok",
  "service": "snevo-layered",
  "environment": "development",
  "timestamp": "2026-06-10T00:00:00.000Z"
}
```

## Structured Logs

Each request produces a JSON log line with:

```text
timestamp
level
event
service
environment
requestId
method
path
statusCode
durationMs
userAgent
ip
```

Example event:

```json
{"level":"info","event":"http_request","requestId":"...","method":"GET","path":"/api/health","statusCode":200,"durationMs":3}
```

## Error Logs

API and server errors are logged with:

```text
event
requestId
method/path or url
error.name
error.message
error.code
error.statusCode
```

## Evidence For Report

- Screenshot of `/api/health` returning `status: ok`.
- Screenshot of terminal logs showing `event":"http_request"`.
- Screenshot of an error log if available.
- Explanation that these logs can be ingested by Cloud Logging, Azure Monitor, AWS CloudWatch, Render logs, or any container log collector.
