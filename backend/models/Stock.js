import mongoose from "mongoose";
import localStore from "../localStore.js";

const USE_LOCAL_STORAGE = !process.env.MONGODB_URI;

let Stock;

if (USE_LOCAL_STORAGE) {
  // Local storage adapter for testing
  Stock = {
    create: (data) => localStore.createStock(data),
    find: (query) => Promise.resolve(localStore.findStocks(query)),
    findById: (id) => Promise.resolve(localStore.findStockById(id)),
    findByIdAndUpdate: (id, data) => Promise.resolve(localStore.updateStock(id, data)),
    findByIdAndDelete: (id) => Promise.resolve(localStore.deleteStock(id)),
  };
} else {
  const stockSchema = new mongoose.Schema(
    {
      stockName: { type: String, required: true, index: true },
      price: { type: Number, required: true },
      date: { type: Date, required: true, index: true },
    },
    { timestamps: true }
  );

  Stock = mongoose.models.Stock || mongoose.model("Stock", stockSchema);
}

export default Stock;
