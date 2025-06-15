#!/bin/bash

# Fix Nginx configuration to match actual container names

echo "Fixing Nginx upstream configuration..."

# Create corrected nginx config
cat > nginx-fixed.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    # Upstream definitions - Updated to match actual container names
    upstream premier_backend {
        server premier-erp-app:5000 max_fails=3 fail_timeout=30s;
    }

    upstream premier_frontend {
        server premier-erp-frontend:80 max_fails=3 fail_timeout=30s;
    }

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # HTTP redirect to HTTPS
    server {
        listen 80;
        server_name demo.premiererp.io;
        
        # Let's Encrypt challenge
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }
        
        location / {
            return 301 https://$server_name$request_uri;
        }
    }

    # HTTPS server
    server {
        listen 443 ssl;
        http2 on;
        server_name demo.premiererp.io;

        # SSL certificates
        ssl_certificate /etc/nginx/ssl/live/demo.premiererp.io/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/live/demo.premiererp.io/privkey.pem;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
        add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

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
            proxy_set_header X-Forwarded-Host $host;
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

# Copy the fixed config to the running container
echo "Updating Nginx configuration in container..."
docker cp nginx-fixed.conf premier-erp-nginx:/etc/nginx/nginx.conf

# Test the configuration
echo "Testing Nginx configuration..."
docker exec premier-erp-nginx nginx -t

if [ $? -eq 0 ]; then
    echo "Configuration valid. Reloading Nginx..."
    docker exec premier-erp-nginx nginx -s reload
    echo "✅ Nginx configuration updated and reloaded successfully"
else
    echo "❌ Configuration test failed. Check the logs:"
    docker logs premier-erp-nginx --tail 20
fi

# Test connectivity
echo "Testing upstream connectivity..."
docker exec premier-erp-nginx wget -q --spider http://premier-erp-app:5000/api/dashboard/summary && echo "✅ Backend connection OK" || echo "❌ Backend connection failed"
docker exec premier-erp-nginx wget -q --spider http://premier-erp-frontend:80 && echo "✅ Frontend connection OK" || echo "❌ Frontend connection failed"

echo "Configuration update completed"