import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock Data
const bills = {
  "bill-123": {
    id: "bill-123",
    customer: "John Doe",
    date: "2026-03-30",
    items: [
      { id: 1, name: "Fresh Milk", quantity: 2, price: 4.5, expiryDate: "2026-04-05" },
      { id: 2, name: "Greek Yogurt", quantity: 1, price: 3.2, expiryDate: "2026-04-01" },
      { id: 3, name: "Bread Loaf", quantity: 1, price: 2.5, expiryDate: "2026-03-28" }, // Expired
      { id: 4, name: "Eggs (Dozen)", quantity: 1, price: 5.0, expiryDate: "2026-04-10" },
    ],
  },
  "bill-456": {
    id: "bill-456",
    customer: "Jane Smith",
    date: "2026-03-29",
    items: [
      { id: 5, name: "Organic Spinach", quantity: 1, price: 3.5, expiryDate: "2026-03-31" }, // Near expiry
      { id: 6, name: "Chicken Breast", quantity: 2, price: 12.0, expiryDate: "2026-04-02" },
      { id: 7, name: "Apples (Bag)", quantity: 1, price: 6.5, expiryDate: "2026-04-15" },
    ],
  },
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/bills/:billId", (req, res) => {
    const { billId } = req.params;
    const bill = bills[billId as keyof typeof bills];
    
    if (bill) {
      res.json(bill);
    } else {
      res.status(404).json({ error: "Bill not found" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
