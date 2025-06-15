# Premier ERP System - Production Docker Build
FROM node:18-alpine

# Install curl for health checks
RUN apk add --no-cache curl

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
COPY tsconfig*.json ./
RUN npm ci

# Copy source code
COPY server/ ./server/
COPY shared/ ./shared/

# Create shared directory in server and copy files to avoid import issues
RUN mkdir -p ./server/shared/
RUN cp -r ./shared/* ./server/shared/

# Install tsx for TypeScript execution
RUN npm install -g tsx

# Create directories
RUN mkdir -p uploads dist

# Create basic frontend fallback
RUN echo '<!DOCTYPE html><html><head><title>Premier ERP Backend</title><style>body{font-family:Arial,sans-serif;margin:40px;background:#f5f5f5}.container{max-width:800px;margin:0 auto;background:white;padding:40px;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.1)}h1{color:#2563eb;margin-bottom:20px}.status{background:#10b981;color:white;padding:8px 16px;border-radius:4px;display:inline-block;margin:10px 0}</style></head><body><div class="container"><h1>Premier ERP System Backend</h1><div class="status">Backend Running Successfully</div><p>Backend API is operational. Use <code>npm run dev</code> locally for full frontend access.</p><p><strong>API Base:</strong> http://localhost:5000/api/</p></div></body></html>' > dist/index.html

# Set environment
ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

# Start with production server
CMD ["tsx", "server/index.production.ts"]