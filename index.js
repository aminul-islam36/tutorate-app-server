import "dotenv/config";
import express, { json } from "express";
import cors from "cors";
import { MongoClient, ServerApiVersion } from "mongodb";

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(json());

// MongoDB connection
const uri = process.env.MONGO_URI_TEST;

// Create MongoDB client
const client = new MongoClient(uri, {
  family: 4,
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 30000,
});

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    console.log("Connecting to MongoDB...");
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("✅ Successfully connected to MongoDB!");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
  }
}

// Routes
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/health", async (req, res) => {
  try {
    await client.db("admin").command({ ping: 1 });
    res.json({
      status: "healthy",
      mongodb: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      mongodb: "disconnected",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Start server and connect to database
app.listen(port, () => {
  console.log(`🚀 Server listening on port ${port}`);
  console.log(`📍 Health check: http://localhost:${port}/health`);
  connectToMongoDB();
});
