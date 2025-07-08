import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import path from "path";
import { fileURLToPath } from 'url';
import { Client } from 'pg';

// Import middleware
import { apiRateLimit, sanitizeInput } from "./middleware/auth.js";
import { errorHandler, notFound, logger } from "./middleware/errorHandler.js";
import { initializeDatabase, closeDatabaseConnection } from "./config/database.js";

// Import routes
import healthRoutes from "./routes/health.js";

// Import Vite setup for development
import { setupVite } from "./vite.js";

// Import route handlers with error handling
async function importRoutes() {
  try {
    const { registerRoutes } = await import("./routes-new.js");
    const { registerOrderRoutes } = await import("./routes-orders.js");
    const { registerReportsRoutes } = await import("./routes-reports.js");
    const { registerAccountingRoutes } = await import("./routes-accounting.js");
    const { registerCustomerPaymentRoutes } = await import("./routes-customer-payments.js");
    const { registerETARoutes } = await import("./routes-eta.js");
    const { registerChemicalRoutes } = await import("./routes-chemical.js");

    return {
      registerRoutes,
      registerOrderRoutes,
      registerReportsRoutes,
      registerAccountingRoutes,
      registerCustomerPaymentRoutes,
      registerETARoutes,
      registerChemicalRoutes
    };
  } catch (error) {
    logger.error("Failed to import route modules:", error);
    return null;
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || "5000", 10);
const NODE_ENV = process.env.NODE_ENV || 'development';

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:", "wss:"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Trust proxy for rate limiting in production
if (NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// CORS configuration
app.use(cors({
  origin: NODE_ENV === 'production' 
    ? ['https://your-domain.com', 'https://www.your-domain.com']
    : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api', apiRateLimit);

// Input sanitization
app.use(sanitizeInput);

// Request logging
app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';

    logger.log(logLevel, {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
  });

  next();
});

// Static file serving
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/attached_assets', express.static(path.join(process.cwd(), 'attached_assets')));

// Health check routes (before other routes)
app.use('/api', healthRoutes);

// API Routes
async function setupRoutes() {
  const routes = await importRoutes();

  if (!routes) {
    logger.warn("⚠️ Running in minimal mode - only health endpoints available");
    return;
  }

  try {
    await routes.registerRoutes(app);
    routes.registerOrderRoutes(app);
    routes.registerReportsRoutes(app);
    routes.registerAccountingRoutes(app);
    routes.registerCustomerPaymentRoutes(app);
    routes.registerETARoutes(app);
    routes.registerChemicalRoutes(app);

    logger.info("✅ All API routes registered successfully");
  } catch (error) {
    logger.error("❌ Error registering routes:", error);
  }
}

// Development vs Production frontend serving
if (NODE_ENV === 'production') {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));

  // SPA fallback
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// 404 handler (only for production or non-Vite routes)
if (NODE_ENV === 'production') {
  app.use(notFound);
}

// Error handling middleware (must be last)
app.use(errorHandler);

// Graceful shutdown handling
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      await closeDatabaseConnection();
      logger.info('Database connections closed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

// Initialize and start server
async function startServer() {
  try {
    // Initialize database first
    await initializeDatabase();
    
    // Wait a moment for database to be fully ready
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Setup routes
    await setupRoutes();

    // Start server
    const server = app.listen(PORT, "0.0.0.0", async () => {
      logger.info(`🚀 Premier ERP System running on port ${PORT}`);
      logger.info(`📊 Environment: ${NODE_ENV}`);
      logger.info(`📋 Health check: http://localhost:${PORT}/api/health`);

      // Setup Vite middleware for development
      if (NODE_ENV === 'development') {
        try {
          await setupVite(app, server);
          logger.info(`🌐 Frontend: http://localhost:${PORT}/`);
          logger.info(`🌐 API Base: http://localhost:${PORT}/api/`);
        } catch (error) {
          logger.error('Failed to setup Vite middleware:', error);
        }
      }
    });

    // Graceful shutdown
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    return server;
  } catch (error) {
    logger.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Start the server
const server = await startServer();

export default app;