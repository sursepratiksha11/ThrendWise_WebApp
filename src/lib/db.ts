import mongoose from "mongoose";

declare global {

  namespace NodeJS {
    interface Global {
      mongoose: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
    }
  }
}

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("❌ Please define the MONGODB_URI environment variable inside .env.local");
}

// 👇 Use correct global ref
let cached = (global as any).mongoose;

if (!cached) {
  cached = ((global as any).mongoose = { conn: null, promise: null });
}

async function dbConnect() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then((mongooseInstance) => {
      console.log("✅ MongoDB connected");
      return mongooseInstance;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;
