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

// Load default .env then overlay .env.local if present (allows IDEs to write secrets there)
dotenv.config();
const localEnv = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(localEnv)) {
  dotenv.config({ path: localEnv });
}

const app = express();
const PORT = Number(process.env.PORT || 4000);

app.use(cors());
app.use(express.json());

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
  console.log("ℹ️  Using local in-memory storage for testing (no MONGODB_URI set)");
}

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});

// Log non-sensitive OpenAI key presence for easier debugging (yes/no)
const hasOpenAiKey = Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 0);
console.log("OpenAI API key present:", hasOpenAiKey ? "yes" : "no");
