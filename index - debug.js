import "dotenv/config";
import express, { json } from "express";
import cors from "cors";
import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";
import { promises as dns, setDefaultResultOrder, Resolver } from "dns";

// Test DNS resolution
// try {
//   const addresses = await dns.resolve4(
//     "ac-urqml8p-shard-00-00.ga9zffb.mongodb.net",
//   );
//   console.log("Resolved:", addresses);
// } catch (err) {
//   console.log("Failed:", err);
// }

// setDefaultResultOrder("ipv4first");
const resolver = new Resolver();
resolver.setServers(["8.8.8.8", "8.8.4.4"]);

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(json());

// mongodb
const uri = process.env.MONGO_URI_TEST;

async function debugDNS() {
  const hosts = [
    "ac-urqml8p-shard-00-00.ga9zffb.mongodb.net",
    "ac-urqml8p-shard-00-01.ga9zffb.mongodb.net",
    "ac-urqml8p-shard-00-02.ga9zffb.mongodb.net",
  ];

  console.log("\n🔍 Debugging DNS resolution:");
  for (const host of hosts) {
    try {
      // Use the custom resolver instead of dns.resolve4
      const addresses = await resolver.resolve4(host);
      console.log(`✅ ${host} -> ${addresses.join(", ")}`);
    } catch (err) {
      console.log(`❌ ${host} -> Failed: ${err.message}`);
    }
  }
  console.log(""); // empty line
}

// Call it before connecting
debugDNS().then(() => {
  run();
});

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  family: 4,
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  connectTimeoutMS: 10000, // 10 seconds
  socketTimeoutMS: 45000, // 45 seconds
  serverSelectionTimeoutMS: 30000, // 30 seconds
  // Add these options
  // directConnection: false,
  // retryWrites: true,
  // retryReads: true,
  // Try different DNS resolvers
  // srvServiceName: "mongodb",
  // srvMaxHosts: 0,
});

// async function getReplicaSetName() {
//   const client = new MongoClient(uri);
//   try {
//     await client.connect();
//     const admin = client.db().admin();
//     const status = await admin.command({ replSetGetStatus: 1 });
//     console.log("✅ Replica Set Name:", status.set);
//     console.log("✅ Shard Hostnames:");
//     status.members.forEach((member) => {
//       console.log(member.name);
//     });
//   } catch (error) {
//     console.error("Error:", error);
//   } finally {
//     await client.close();
//   }
// }

// getReplicaSetName();

async function run() {
  try {
    console.log("1. Connecting to MongoDB...");
    await client.connect();
    console.log("2. Connected! Pinging database...");

    await client.db("admin").command({ ping: 1 });
    console.log("3. ✅ Successfully connected to MongoDB!");
  } catch (error) {
    console.error("❌ MongoDB connection error:");
    console.error("Error name:", error.name);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    // process.exit(1); // Exit if cannot connect to database
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
// run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/health", async (req, res) => {
  try {
    // Try to ping the database
    await client.db("admin").command({ ping: 1 });
    res.json({
      status: "healthy",
      mongodb: "connected",
      message: "MongoDB connection is working",
    });
  } catch (error) {
    res.json({
      status: "unhealthy",
      mongodb: "disconnected",
      error: error.message,
    });
  }
});

// Debug endpoint to check DNS
app.get("/debug", async (req, res) => {
  const results = {};

  try {
    // Test DNS resolution with the same resolver you're using
    const hosts = [
      "ac-urqml8p-shard-00-00.ga9zffb.mongodb.net",
      "ac-urqml8p-shard-00-01.ga9zffb.mongodb.net",
      "ac-urqml8p-shard-00-02.ga9zffb.mongodb.net",
    ];

    results.dns = {};
    for (const host of hosts) {
      try {
        const addresses = await resolver.resolve4(host);
        results.dns[host] = { success: true, addresses };
      } catch (err) {
        results.dns[host] = { success: false, error: err.message };
      }
    }

    res.json(results);
  } catch (error) {
    res.json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server listening on port ${port}`);
  console.log(`📍 Test the server: http://localhost:${port}`);
  console.log(`📍 Check MongoDB health: http://localhost:${port}/health`);
  console.log(`📍 Debug DNS: http://localhost:${port}/debug`);
});

// app.listen(port, () => {
//   console.log(`Example app listening on port ${port}`);
// });
