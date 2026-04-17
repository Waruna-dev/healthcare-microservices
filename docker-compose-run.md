# Docker Compose Local Run Steps

Use this guide to run the full project with `docker-compose.yml` (without Kubernetes).

## 1. Prerequisites

- Docker Desktop installed and running
- `docker compose` available in terminal
- Ports available: `3000`, `5000`, `5002`, `5004`, `5005`, `5015`, `5018`, `5025`, `5035`

## 2. Build all services

```powershell
docker compose build
```

## 3. Start all services in background

```powershell
docker compose up -d
```

## 4. Check running containers

```powershell
docker compose ps
```

All services should show `Up`.

## 5. Verify app URLs

- Frontend: `http://localhost:3000`
- API Gateway health: `http://localhost:5000/health`
- API Gateway API health: `http://localhost:5000/api/health`

## 6. View logs (if needed)

All services:

```powershell
docker compose logs -f
```

Single service example:

```powershell
docker compose logs -f api-gateway
```

## 7. Restart a service (if needed)

```powershell
docker compose restart api-gateway
```

## 8. Stop stack

```powershell
docker compose down
```

## 9. Stop and remove volumes (full reset)

```powershell
docker compose down -v
```

