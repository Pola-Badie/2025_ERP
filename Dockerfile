# Multi-stage Docker build for Premier ERP System
# Stage 1: Build frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY components.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY client/ ./client/
COPY shared/ ./shared/

# Create attached_assets directory and dummy files for missing assets
RUN mkdir -p attached_assets
RUN echo "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" | base64 -d > attached_assets/hazard_0_0.png

# Copy available attached assets (if any exist)
COPY attached_assets/ ./attached_assets/ 2>/dev/null || true

# Build frontend with error handling
ENV NODE_ENV=production
RUN npm run build

# Stage 2: Build backend and final image
FROM node:18-alpine AS production

WORKDIR /app

# Install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built frontend from previous stage
COPY --from=frontend-builder /app/dist ./dist

# Copy backend source code
COPY server/ ./server/
COPY shared/ ./shared/
COPY tsconfig.json ./
COPY drizzle.config.ts ./

# Install tsx for running TypeScript
RUN npm install -g tsx

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/dashboard/summary || exit 1

# Start the application
CMD ["tsx", "server/index.ts"]