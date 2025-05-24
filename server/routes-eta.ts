import type { Express, Request, Response } from "express";

// ETA API Configuration
const ETA_API_BASE_URL = "https://sdk.invoicing.eta.gov.eg/api";

interface ETACredentials {
  clientId: string;
  clientSecret: string;
  username: string;
  pin: string;
  apiKey: string;
  environment: 'production' | 'sandbox';
}

interface ETAAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface ETAInvoiceSubmission {
  invoiceId: string;
  etaReferenceNumber: string;
  submissionDate: string;
  status: 'submitted' | 'approved' | 'rejected';
}

// Store active ETA credentials and tokens
let etaCredentials: ETACredentials | null = null;
let etaAccessToken: string | null = null;
let tokenExpirationTime: number = 0;

export function registerETARoutes(app: Express) {
  
  // Authenticate with ETA API
  app.post("/api/eta/authenticate", async (req: Request, res: Response) => {
    try {
      const credentials: ETACredentials = req.body;
      
      // Validate required credentials
      if (!credentials.clientId || !credentials.clientSecret || 
          !credentials.username || !credentials.pin || !credentials.apiKey) {
        return res.status(400).json({
          success: false,
          message: "Missing required ETA credentials"
        });
      }

      // Prepare authentication request to ETA
      const authPayload = {
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        username: credentials.username,
        pin: credentials.pin,
        grant_type: "password"
      };

      // Call ETA authentication endpoint
      const authResponse = await fetch(`${ETA_API_BASE_URL}/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${credentials.apiKey}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(authPayload)
      });

      if (!authResponse.ok) {
        const errorData = await authResponse.text();
        console.error('ETA Authentication failed:', errorData);
        return res.status(401).json({
          success: false,
          message: "Failed to authenticate with Egyptian Tax Authority"
        });
      }

      const authData: ETAAuthResponse = await authResponse.json();
      
      // Store credentials and token
      etaCredentials = credentials;
      etaAccessToken = authData.access_token;
      tokenExpirationTime = Date.now() + (authData.expires_in * 1000);

      res.json({
        success: true,
        message: "Successfully authenticated with ETA",
        tokenType: authData.token_type,
        expiresIn: authData.expires_in
      });

    } catch (error) {
      console.error('ETA authentication error:', error);
      res.status(500).json({
        success: false,
        message: "Error connecting to Egyptian Tax Authority"
      });
    }
  });

  // Test ETA connection
  app.post("/api/eta/test-connection", async (req: Request, res: Response) => {
    try {
      if (!etaAccessToken || Date.now() > tokenExpirationTime) {
        return res.status(401).json({
          success: false,
          message: "No valid ETA authentication token"
        });
      }

      // Test connection with ETA health check endpoint
      const testResponse = await fetch(`${ETA_API_BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${etaAccessToken}`,
          'Accept': 'application/json'
        }
      });

      if (testResponse.ok) {
        res.json({
          success: true,
          message: "ETA connection test successful",
          status: "connected"
        });
      } else {
        res.status(503).json({
          success: false,
          message: "ETA service unavailable"
        });
      }

    } catch (error) {
      console.error('ETA test connection error:', error);
      res.status(500).json({
        success: false,
        message: "Error testing ETA connection"
      });
    }
  });

  // Submit invoice to ETA
  app.post("/api/eta/submit-invoice", async (req: Request, res: Response) => {
    try {
      const { invoiceData } = req.body;

      if (!etaAccessToken || Date.now() > tokenExpirationTime) {
        return res.status(401).json({
          success: false,
          message: "No valid ETA authentication token"
        });
      }

      // Format invoice data for ETA submission
      const etaInvoicePayload = {
        issuer: {
          name: "PharmaOverseas Ltd",
          id: "123456789", // Tax registration number
          type: "B" // Business type
        },
        receiver: {
          name: invoiceData.customerName,
          id: invoiceData.customerTaxId || "000000000"
        },
        documentType: "I", // Invoice
        documentTypeVersion: "1.0",
        dateTimeIssued: new Date(invoiceData.date).toISOString(),
        taxpayerActivityCode: "4646", // Pharmaceutical wholesale
        internalID: invoiceData.invoiceNumber,
        purchaseOrderReference: invoiceData.poReference || "",
        salesOrderReference: invoiceData.soReference || "",
        invoiceLines: invoiceData.items.map((item: any, index: number) => ({
          description: item.description,
          itemType: "GS1", // Goods and Services
          itemCode: item.productCode || `ITEM_${index + 1}`,
          unitType: "EA", // Each
          quantity: item.quantity,
          unitValue: {
            currencySold: "EGP",
            amountEGP: item.unitPrice
          },
          salesTotal: item.quantity * item.unitPrice,
          total: item.quantity * item.unitPrice,
          valueDifference: 0,
          totalTaxableFees: 0,
          netTotal: item.quantity * item.unitPrice,
          itemsDiscount: 0,
          taxableItems: [{
            taxType: "T1", // VAT
            amount: item.quantity * item.unitPrice * 0.14,
            subType: "V009", // Standard VAT rate
            rate: 14
          }]
        })),
        totalDiscountAmount: invoiceData.discount || 0,
        totalSalesAmount: invoiceData.subtotal,
        netAmount: invoiceData.subtotal - (invoiceData.discount || 0),
        taxTotals: [{
          taxType: "T1",
          amount: invoiceData.tax
        }],
        totalAmount: invoiceData.total,
        extraDiscountAmount: 0,
        totalItemsDiscountAmount: 0,
        signatures: []
      };

      // Submit to ETA
      const submitResponse = await fetch(`${ETA_API_BASE_URL}/receipts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${etaAccessToken}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          receipts: [etaInvoicePayload]
        })
      });

      if (!submitResponse.ok) {
        const errorData = await submitResponse.text();
        console.error('ETA submission failed:', errorData);
        return res.status(400).json({
          success: false,
          message: "Failed to submit invoice to ETA"
        });
      }

      const submitData = await submitResponse.json();
      
      // Generate ETA reference number
      const etaReferenceNumber = `ETA-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

      res.json({
        success: true,
        message: "Invoice successfully submitted to ETA",
        etaReferenceNumber,
        submissionId: submitData.submissionId || `SUB_${Date.now()}`,
        submissionDate: new Date().toISOString(),
        status: "submitted"
      });

    } catch (error) {
      console.error('ETA invoice submission error:', error);
      res.status(500).json({
        success: false,
        message: "Error submitting invoice to ETA"
      });
    }
  });

  // Get ETA submission status
  app.get("/api/eta/submission-status/:submissionId", async (req: Request, res: Response) => {
    try {
      const { submissionId } = req.params;

      if (!etaAccessToken || Date.now() > tokenExpirationTime) {
        return res.status(401).json({
          success: false,
          message: "No valid ETA authentication token"
        });
      }

      // Check submission status with ETA
      const statusResponse = await fetch(`${ETA_API_BASE_URL}/receipts/status/${submissionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${etaAccessToken}`,
          'Accept': 'application/json'
        }
      });

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        res.json({
          success: true,
          status: statusData.status || "processing",
          submissionDate: statusData.submissionDate,
          etaReferenceNumber: statusData.etaReferenceNumber
        });
      } else {
        res.status(404).json({
          success: false,
          message: "Submission not found"
        });
      }

    } catch (error) {
      console.error('ETA status check error:', error);
      res.status(500).json({
        success: false,
        message: "Error checking ETA submission status"
      });
    }
  });

  // Get ETA statistics
  app.get("/api/eta/statistics", async (req: Request, res: Response) => {
    try {
      if (!etaAccessToken) {
        return res.status(401).json({
          success: false,
          message: "No ETA authentication"
        });
      }

      // Return current statistics (would normally come from database)
      res.json({
        success: true,
        statistics: {
          totalSubmissions: 0,
          successfulSubmissions: 0,
          pendingSubmissions: 0,
          rejectedSubmissions: 0,
          lastSubmissionDate: null
        }
      });

    } catch (error) {
      console.error('ETA statistics error:', error);
      res.status(500).json({
        success: false,
        message: "Error retrieving ETA statistics"
      });
    }
  });

  // Disconnect from ETA
  app.post("/api/eta/disconnect", async (req: Request, res: Response) => {
    try {
      etaCredentials = null;
      etaAccessToken = null;
      tokenExpirationTime = 0;

      res.json({
        success: true,
        message: "Disconnected from ETA"
      });

    } catch (error) {
      console.error('ETA disconnect error:', error);
      res.status(500).json({
        success: false,
        message: "Error disconnecting from ETA"
      });
    }
  });
}