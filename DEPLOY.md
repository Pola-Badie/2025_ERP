# Premier ERP System - Docker Deployment

## Quick Deployment

```bash
# Deploy with the consolidated setup
sudo ./docker-deploy-manual.sh
```

## Manual Deployment

```bash
# Clean any existing containers
sudo docker stop premier-erp-app premier-erp-db 2>/dev/null || true
sudo docker rm premier-erp-app premier-erp-db 2>/dev/null || true
sudo docker volume rm premier_postgres_data 2>/dev/null || true

# Create network
sudo docker network create premier-erp-network 2>/dev/null || true

# Start database
sudo docker run -d \
  --name premier-erp-db \
  --network premier-erp-network \
  -e POSTGRES_DB=premier_erp \
  -e POSTGRES_USER=erp_user \
  -e POSTGRES_PASSWORD=erp_secure_password \
  -p 5432:5432 \
  postgres:15-alpine

# Build and start application
sudo docker build -t premier-erp-app .
sudo docker run -d \
  --name premier-erp-app \
  --network premier-erp-network \
  -e NODE_ENV=production \
  -e DATABASE_URL=postgresql://erp_user:erp_secure_password@premier-erp-db:5432/premier_erp \
  -e PORT=5000 \
  -p 5000:5000 \
  premier-erp-app
```

## Access

- **Backend API:** http://localhost:5000
- **Full Frontend:** Run `npm run dev` locally

## Verification

```bash
# Check status
sudo docker ps

# Test API
curl http://localhost:5000/api/dashboard/summary

# View logs
sudo docker logs premier-erp-app
```