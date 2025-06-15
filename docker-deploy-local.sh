#!/bin/bash

# Premier ERP System - Local/Self-Signed SSL Deployment
# Use this when domain DNS isn't configured or for local testing

set -e

echo "🚀 Premier ERP System - Local SSL Deployment"
echo "============================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

# Create environment file for local deployment
echo "⚙️ Setting up local environment..."
cat > .env.local << 'EOF'
NODE_ENV=production
POSTGRES_PASSWORD=erp_secure_password_2024
DOMAIN=localhost
EMAIL=admin@localhost
EOF

# Create SSL certificates directory
echo "📁 Creating SSL certificates directory..."
mkdir -p ssl-certs/live/localhost
chmod 755 ssl-certs

# Clean up existing containers and volumes
echo "🧹 Cleaning up existing containers..."
docker stop $(docker ps -q --filter "name=premier-erp") 2>/dev/null || true
docker rm $(docker ps -aq --filter "name=premier-erp") 2>/dev/null || true

# Create Docker network
echo "🌐 Creating Docker network..."
docker network create erp-network 2>/dev/null || true

# Create self-signed SSL certificates
echo "🔒 Creating self-signed SSL certificates..."
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout ssl-certs/live/localhost/privkey.pem \
    -out ssl-certs/live/localhost/fullchain.pem \
    -subj "/C=US/ST=CA/L=Local/O=Premier ERP/CN=localhost"

# Create local nginx config
echo "📝 Creating local Nginx configuration..."
cat > nginx-local.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    
    # Upstream definitions
    upstream premier_backend {
        server premier-erp-app:5000 max_fails=3 fail_timeout=30s;
    }

    upstream premier_frontend {
        server premier-erp-frontend:80 max_fails=3 fail_timeout=30s;
    }

    # HTTP server (redirect to HTTPS)
    server {
        listen 80;
        server_name localhost;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS server
    server {
        listen 443 ssl;
        http2 on;
        server_name localhost;

        # SSL certificates
        ssl_certificate /etc/nginx/ssl/live/localhost/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/live/localhost/privkey.pem;

        # SSL configuration
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
        ssl_prefer_server_ciphers off;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
        add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

        # API routes
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://premier_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Upload and asset handling
        location /uploads/ {
            proxy_pass http://premier_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /attached_assets/ {
            proxy_pass http://premier_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Frontend application
        location / {
            proxy_pass http://premier_frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            proxy_pass http://premier_frontend;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
EOF

# Create local docker-compose file
echo "📝 Creating local Docker Compose configuration..."
cat > docker-compose.local.yml << 'EOF'
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: premier-erp-db
    restart: unless-stopped
    environment:
      POSTGRES_DB: premier_erp
      POSTGRES_USER: erp_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-erp_secure_password_2024}
      PGDATA: /var/lib/postgresql/data/pgdata
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - erp-network

  # Premier ERP Backend
  backend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: premier-erp-app
    restart: unless-stopped
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://erp_user:${POSTGRES_PASSWORD:-erp_secure_password_2024}@postgres:5432/premier_erp
      PORT: 5000
      DOMAIN: localhost
    networks:
      - erp-network

  # Premier ERP Frontend
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    container_name: premier-erp-frontend
    restart: unless-stopped
    networks:
      - erp-network

  # Nginx Reverse Proxy with Self-Signed SSL
  nginx-proxy:
    image: nginx:alpine
    container_name: premier-erp-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx-local.conf:/etc/nginx/nginx.conf:ro
      - ./ssl-certs:/etc/nginx/ssl:ro
    networks:
      - erp-network

volumes:
  postgres_data:
    driver: local

networks:
  erp-network:
    driver: bridge
EOF

# Build and start services in sequence
echo "🏗️ Building Docker images..."
docker-compose -f docker-compose.local.yml --env-file .env.local build

echo "🗄️ Starting database..."
docker-compose -f docker-compose.local.yml --env-file .env.local up -d postgres

# Wait for database
echo "⏳ Waiting for database..."
for i in {1..30}; do
    if docker exec premier-erp-db pg_isready -U erp_user -d premier_erp > /dev/null 2>&1; then
        echo "✅ Database ready"
        break
    fi
    echo "Waiting for database... ($i/30)"
    sleep 2
done

echo "🖥️ Starting backend..."
docker-compose -f docker-compose.local.yml --env-file .env.local up -d backend

# Wait for backend
echo "⏳ Waiting for backend..."
for i in {1..30}; do
    if docker exec premier-erp-app curl -f http://localhost:5000/api/dashboard/summary > /dev/null 2>&1; then
        echo "✅ Backend ready"
        break
    fi
    echo "Waiting for backend... ($i/30)"
    sleep 3
done

echo "🌐 Starting frontend..."
docker-compose -f docker-compose.local.yml --env-file .env.local up -d frontend

# Wait for frontend
echo "⏳ Waiting for frontend..."
for i in {1..20}; do
    if docker exec premier-erp-frontend curl -f http://localhost:80 > /dev/null 2>&1; then
        echo "✅ Frontend ready"
        break
    fi
    echo "Waiting for frontend... ($i/20)"
    sleep 2
done

echo "🔧 Starting Nginx..."
docker-compose -f docker-compose.local.yml --env-file .env.local up -d nginx-proxy

# Wait for Nginx
echo "⏳ Waiting for Nginx..."
sleep 5

# Display status
echo ""
echo "🎉 Local deployment completed successfully!"
echo "=============================================="
echo "📊 Service Status:"
docker-compose -f docker-compose.local.yml --env-file .env.local ps

echo ""
echo "🌐 Access Points:"
echo "• Application: https://localhost (self-signed certificate)"
echo "• API: https://localhost/api/"
echo "• HTTP Redirect: http://localhost"

echo ""
echo "⚠️ Certificate Warning:"
echo "Your browser will show a security warning for the self-signed certificate."
echo "Click 'Advanced' and 'Proceed to localhost' to access the application."

echo ""
echo "📋 Management Commands:"
echo "• View logs: docker-compose -f docker-compose.local.yml logs -f"
echo "• Stop services: docker-compose -f docker-compose.local.yml down"
echo "• Restart services: docker-compose -f docker-compose.local.yml restart"

echo ""
echo "✅ Premier ERP System is now running locally with HTTPS!"