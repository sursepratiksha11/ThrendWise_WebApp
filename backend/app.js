import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import stockRoutes from "./routes/stocks.js";
import predictRoutes from "./routes/predict.js";
import chatRoutes from "./routes/chat.js";
import expenseRoutes from "./routes/expense.js";
import fraudRoutes from "./routes/fraud.js";

dotenv.config();
const localEnv = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(localEnv)) {
  dotenv.config({ path: localEnv });
}

const app = express();

app.use(cors());
app.use(express.json());

// Vercel can invoke a catch-all function with the /api prefix removed.
app.use((req, _res, next) => {
  if (req.url !== "/health" && !req.url.startsWith("/api/")) {
    req.url = `/api${req.url.startsWith("/") ? "" : "/"}${req.url}`;
  }
  next();
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "backend" });
});

app.use("/api/stocks", stockRoutes);
app.use("/api/predict", predictRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/fraud", fraudRoutes);

const mongoUri = process.env.MONGODB_URI;
if (mongoUri) {
  mongoose
    .connect(mongoUri)
    .then(() => {
      console.log("MongoDB connected");
    })
    .catch((error) => {
      console.error("MongoDB connection failed:", error.message);
    });
} else {
  console.log("Using local in-memory storage (no MONGODB_URI set)");
}

const hasOpenAiKey = Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 0);
console.log("OpenAI API key present:", hasOpenAiKey ? "yes" : "no");

export default app;