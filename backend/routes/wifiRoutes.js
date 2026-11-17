
const express = require("express");
const router = express.Router();
const AccessPoint = require("../models/AccessPoint");

// Get all access points
router.get("/", async (req, res) => {
    try {
        const accessPoints = await AccessPoint.find().sort({ createdAt: -1 });
        res.json({
            count: accessPoints.length,
            accessPoints
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add a Wi-Fi access point
router.post("/", async (req, res) => {
    try {
        const { name, ssid, ipAddress, gateway } = req.body;

        if (!ssid) {
            return res.status(400).json({
                message: "SSID is required"
            });
        }

        const accessPoint = new AccessPoint({
            name: name || ssid,
            ssid,
            ipAddress,
            gateway,
            status: "Online",
            mode: "Simulation"
        });

        await accessPoint.save();

        res.status(201).json({
            message: "Access point added successfully",
            accessPoint
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update access point status
router.patch("/:id", async (req, res) => {
    try {
        const accessPoint = await AccessPoint.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true, runValidators: true }
        );

        if (!accessPoint) {
            return res.status(404).json({
                message: "Access point not found"
            });
        }

        res.json({
            message: "Access point updated successfully",
            accessPoint
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
