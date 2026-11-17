
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import Routes
const simulationRoutes = require("./routes/simulationRoutes");
const stateRoutes = require("./routes/stateRoutes");
const alertRoutes = require("./routes/alertRoutes");
const wifiRoutes = require("./routes/wifiRoutes");
const deviceRoutes = require("./routes/deviceRoutes");
const monitoringRoutes = require("./routes/monitoringRoutes");
const {
    startContinuousMonitoring
} = require("./services/continuousMonitor");

// API Routes
app.use("/api/simulate", simulationRoutes);
app.use("/api/states", stateRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/wifi", wifiRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/monitoring", monitoringRoutes);

// Home Route
app.get("/", (req, res) => {
    res.send("Wi-Fi and Port Scan Detection Server Running!");
});

// Connect MongoDB and Start Server
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB Connected Successfully");
           startContinuousMonitoring();

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error("MongoDB Connection Error:", error.message);
    });
