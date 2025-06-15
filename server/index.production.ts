import express, { type Request, Response, NextFunction } from "express";
import path from "path";

// Import routes with error handling
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
    console.error("Failed to import route modules:", error);
    return null;
  }
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Serve static files from attached_assets directory
app.use('/attached_assets', express.static('attached_assets'));

// Basic logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const originalSend = res.send;
  
  res.send = function(data) {
    const duration = Date.now() - start;
    console.log(`${new Date().toLocaleTimeString()} [express] ${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
    return originalSend.call(this, data);
  };
  
  next();
});

// Register all API routes
async function setupRoutes() {
  const routes = await importRoutes();
  
  if (!routes) {
    console.log("⚠️ Running in minimal mode - only basic endpoints available");
    
    // Add basic API endpoints
    app.get("/api/dashboard/summary", (req, res) => {
      res.json({
        message: "Premier ERP Backend Running",
        status: "operational",
        timestamp: new Date().toISOString()
      });
    });
    
    app.get("/api/health", (req, res) => {
      res.json({ status: "healthy", service: "Premier ERP System" });
    });
    
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

    console.log("✅ All API routes registered successfully");
  } catch (error) {
    console.error("❌ Error registering routes:", error);
    
    // Fallback basic endpoints
    app.get("/api/dashboard/summary", (req, res) => {
      res.json({
        message: "Premier ERP Backend Running - Limited Mode",
        status: "operational",
        timestamp: new Date().toISOString(),
        note: "Full features available when frontend runs via npm run dev"
      });
    });
  }
}

// Serve static frontend files
app.use(express.static(path.join(process.cwd(), 'dist')));

// Fallback to serve index.html for SPA routing
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
});

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Server error:", err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

// Start server
const PORT = parseInt(process.env.PORT || "5000", 10);

setupRoutes().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Premier ERP System Backend running on port ${PORT}`);
    console.log(`📊 API endpoints available at http://localhost:${PORT}/api/`);
    console.log(`🌐 Frontend interface at http://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/api/dashboard/summary`);
  });
}).catch((error) => {
  console.error("❌ Failed to start server:", error);
  process.exit(1);
});

export default app;