#!/bin/bash

# Premier ERP - Nginx Diagnostic and Fix Script

echo "Premier ERP System - Nginx Diagnostics"
echo "======================================"

# Check container status
echo "Container Status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Image}}"

echo ""
echo "Network Inspection:"
docker network ls | grep erp

echo ""
echo "Container Network Details:"
for container in premier-erp-nginx premier-erp-app premier-erp-frontend premier-erp-db; do
    if docker ps -q -f name=$container > /dev/null; then
        echo "--- $container ---"
        docker inspect $container | grep -A 10 NetworkMode
        docker inspect $container | grep -A 5 Networks
    fi
done

echo ""
echo "Testing Internal Connectivity:"

# Test backend connectivity from nginx
echo "Testing Nginx -> Backend:"
docker exec premier-erp-nginx nslookup premier-erp-app 2>/dev/null || echo "DNS resolution failed"
docker exec premier-erp-nginx wget -q --timeout=5 --tries=1 -O- http://premier-erp-app:5000/api/dashboard/summary 2>/dev/null && echo "✅ Backend reachable" || echo "❌ Backend unreachable"

# Test frontend connectivity from nginx
echo "Testing Nginx -> Frontend:"
docker exec premier-erp-nginx nslookup premier-erp-frontend 2>/dev/null || echo "DNS resolution failed"
docker exec premier-erp-nginx wget -q --timeout=5 --tries=1 -O- http://premier-erp-frontend:80 2>/dev/null && echo "✅ Frontend reachable" || echo "❌ Frontend unreachable"

echo ""
echo "Nginx Configuration Check:"
docker exec premier-erp-nginx nginx -t 2>&1

echo ""
echo "Nginx Error Logs (last 10 lines):"
docker logs premier-erp-nginx --tail 10 2>&1

echo ""
echo "Backend Health Check:"
docker exec premier-erp-app curl -f http://localhost:5000/api/dashboard/summary > /dev/null 2>&1 && echo "✅ Backend API responding" || echo "❌ Backend API not responding"

echo ""
echo "Frontend Health Check:"
docker exec premier-erp-frontend curl -f http://localhost:80 > /dev/null 2>&1 && echo "✅ Frontend responding" || echo "❌ Frontend not responding"

# Check if containers are on the same network
echo ""
echo "Network Connectivity Fix:"
echo "Ensuring all containers are on the same network..."

# Add containers to erp-network if not already connected
for container in premier-erp-nginx premier-erp-app premier-erp-frontend premier-erp-db; do
    if docker ps -q -f name=$container > /dev/null; then
        docker network connect erp-network $container 2>/dev/null || echo "$container already connected to erp-network"
    fi
done

echo ""
echo "Final connectivity test after network fix:"
docker exec premier-erp-nginx wget -q --timeout=5 --tries=1 -O- http://premier-erp-app:5000/api/dashboard/summary > /dev/null 2>&1 && echo "✅ Backend now reachable" || echo "❌ Backend still unreachable"
docker exec premier-erp-nginx wget -q --timeout=5 --tries=1 -O- http://premier-erp-frontend:80 > /dev/null 2>&1 && echo "✅ Frontend now reachable" || echo "❌ Frontend still unreachable"

echo ""
echo "Reloading Nginx configuration..."
docker exec premier-erp-nginx nginx -s reload 2>&1

echo ""
echo "Diagnostics completed. Try accessing https://demo.premiererp.io"