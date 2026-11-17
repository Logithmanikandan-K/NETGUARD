
const express = require("express");
const router = express.Router();

const Alert = require("../models/Alert");

// GET /api/alerts
router.get("/", async (req, res) => {
    try {
        const alerts = await Alert.find()
            .sort({ timestamp: -1 })
            .limit(50);

        res.json({
            count: alerts.length,
            alerts
        });

    } catch (error) {
        res.status(500).json({
            message: "Unable to retrieve alerts"
        });
    }
});

// DELETE /api/alerts
router.delete("/", async (req, res) => {
    try {
        await Alert.deleteMany({});

        res.json({
            message: "Alert history cleared successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: "Unable to clear alerts"
        });
    }
});

module.exports = router;
