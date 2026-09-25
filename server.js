require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// ==========================
// 🌐 MIDDLEWARE (FIXED CORS)
// ==========================
app.use(
  cors({
    origin: "*", // FIX: avoids Network Error in dev
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  })
);

app.use(express.json());

// ==========================
// 📡 SOCKET.IO (FIXED)
// ==========================
const io = new Server(server, {
  cors: {
    origin: "*", // FIX
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ["websocket", "polling"] // FIX for Network Error issues
});

// ==========================
// 🧠 DATABASE CONNECTION
// ==========================
mongoose
  .connect(
    process.env.MONGO_URI || "mongodb://127.0.0.1:27017/dustbin"
  )
  .then(() => {
    console.log("✅ MongoDB Connected");
  })
  .catch((err) => {
    console.error("❌ MongoDB Error:", err);
  });

// ==========================
// 📦 SCHEMA
// ==========================
const DataSchema = new mongoose.Schema({
  binId: { type: String, default: "BIN_01" },
  level: { type: Number, required: true },
  distance: { type: Number, default: 0 },
  weight: { type: Number, default: 0 },
  time: {
    type: String,
    default: () => new Date().toLocaleTimeString()
  }
});

const Data = mongoose.model("Data", DataSchema);

// ==========================
// 🧪 FIX: PING ROUTE (ADDED)
// ==========================
app.get("/ping", (req, res) => {
  res.json({ status: "ok", message: "server alive 🟢" });
});

// ==========================
// 🚨 ALERT STATE
// ==========================
let alertState = {};

// ==========================
// 🚨 ALERT ENGINE
// ==========================
function getAlert(level, distance) {
  return {
    full: level >= 85,
    warning: level >= 60 && level < 85,
    safe: level < 60,
    obstruction: distance < 10
  };
}

// ==========================
// 🔮 PREDICTION ENGINE
// ==========================
function predictFill(data) {
  if (!data || data.length < 5) {
    return {
      trend: "Not enough data",
      estimate: "-"
    };
  }

  const recent = data.slice(-5);

  const velocity =
    (recent[4].level - recent[0].level) / 5;

  const remaining = 100 - recent[4].level;

  let estimate = "Stable";

  if (velocity > 0) {
    estimate = Math.max(
      0,
      Math.round(remaining / velocity)
    );
  }

  return {
    velocity: Number(velocity.toFixed(2)),
    estimatedStepsToFull: estimate,
    trend: velocity > 0 ? "Filling 📈" : "Stable 📊"
  };
}

// ==========================
// 🏠 HOME ROUTE
// ==========================
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🚀 Smart Dustbin Server is running",
    port: process.env.PORT || 5000
  });
});

// ==========================
// 📥 POST SENSOR DATA
// ==========================
app.post("/data", async (req, res) => {
  try {
    const {
      binId = "BIN_01",
      level,
      distance = 0,
      weight
    } = req.body;

    if (level === undefined || level === null) {
      return res.status(400).json({
        success: false,
        error: "level is required"
      });
    }

    const numericLevel = Number(level);
    const numericDistance = Number(distance);

    const numericWeight =
      weight !== undefined
        ? Number(weight)
        : numericLevel * 0.8;

    const entry = new Data({
      binId,
      level: numericLevel,
      distance: numericDistance,
      weight: numericWeight,
      time: new Date().toLocaleTimeString()
    });

    await entry.save();

    console.log(
      `📥 Data | ${binId} | Level: ${numericLevel}%`
    );

    io.emit("newData", entry);

    const alert = getAlert(
      numericLevel,
      numericDistance
    );

    if (!alertState[binId]) {
      alertState[binId] = false;
    }

    if (alert.full && !alertState[binId]) {
      io.emit("alert", {
        binId,
        type: "FULL",
        message: "Dustbin is 85%+ full"
      });
      alertState[binId] = true;
    }

    if (alert.safe) {
      alertState[binId] = false;
    }

    if (alert.obstruction) {
      io.emit("alert", {
        binId,
        type: "OBSTRUCTION",
        message: "Obstacle detected"
      });
    }

    res.json({ success: true, data: entry });

  } catch (err) {
    console.error("❌ POST /data:", err);
    res.status(500).json({
      success: false,
      error: "Server error"
    });
  }
});

// ==========================
// 📊 GET DATA
// ==========================
app.get("/data", async (req, res) => {
  try {
    const data = await Data.find()
      .sort({ _id: -1 })
      .limit(30);

    res.json(data.reverse());
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "Server error"
    });
  }
});

// ==========================
// 📈 ANALYTICS
// ==========================
app.get("/analytics", async (req, res) => {
  try {
    const data = await Data.find();

    if (!data.length) {
      return res.json({
        averageFill: 0,
        maxFill: 0,
        minFill: 0,
        count: 0
      });
    }

    const levels = data.map(d => d.level);

    const avg =
      levels.reduce((a, b) => a + b, 0) /
      levels.length;

    res.json({
      averageFill: avg,
      maxFill: Math.max(...levels),
      minFill: Math.min(...levels),
      count: data.length
    });

  } catch (err) {
    res.status(500).json({ error: "Error" });
  }
});

// ==========================
// 🔮 PREDICTION
// ==========================
app.get("/prediction", async (req, res) => {
  try {
    const data = await Data.find().sort({
      _id: 1
    });

    res.json(predictFill(data));
  } catch (err) {
    res.status(500).json({ error: "Error" });
  }
});

// ==========================
// 📡 SOCKET CONNECTION
// ==========================
io.on("connection", (socket) => {
  console.log("📡 Connected:", socket.id);

  socket.emit("status", {
    message: "Connected to Smart Dustbin"
  });

  socket.on("disconnect", () => {
    console.log("❌ Disconnected:", socket.id);
  });
});

// ==========================
// 🚀 START SERVER
// ==========================
const PORT = process.env.PORT || 5000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

// ==========================
// 🔥 GLOBAL ERROR HANDLER
// ==========================
process.on("unhandledRejection", (err) => {
  console.error("🔥 Unhandled Error:", err);
});