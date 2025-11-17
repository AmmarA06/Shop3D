/**
 * Main backend server entry point
 */
import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import webhookRoutes from "./routes/webhooks.js";
import modelRoutes from "./routes/models.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());

// Store raw body for webhook verification
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "healthy", service: "3d-visualizer-backend" });
});

// Routes
app.use("/api", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/models", modelRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

// Error handler
app.use((err: any, _req: Request, res: Response, _next: any) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

export default app;
