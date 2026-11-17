
const express = require("express");
const router = express.Router();

const Device = require("../models/Device");
const AccessPoint = require("../models/AccessPoint");

// Get all devices
router.get("/", async (req, res) => {
    try {
        const devices = await Device.find()
            .populate("accessPoint", "ssid name")
            .sort({ createdAt: -1 });

        res.json({
            count: devices.length,
            devices
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add a connected device
router.post("/", async (req, res) => {
    try {
        const {
            deviceName,
            ipAddress,
            macAddress,
            accessPoint
        } = req.body;

        if (!deviceName || !ipAddress || !accessPoint) {
            return res.status(400).json({
                message: "Device name, IP address and access point are required"
            });
        }

        const wifi = await AccessPoint.findById(accessPoint);

        if (!wifi) {
            return res.status(404).json({
                message: "Access point not found"
            });
        }

        const device = new Device({
            deviceName,
            ipAddress,
            macAddress,
            accessPoint,
            status: "Connected",
            mode: "Simulation"
        });

        await device.save();

        res.status(201).json({
            message: "Device added successfully",
            device
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update device connection status
router.patch("/:id", async (req, res) => {
    try {
        const device = await Device.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true, runValidators: true }
        );

        if (!device) {
            return res.status(404).json({
                message: "Device not found"
            });
        }

        res.json({
            message: "Device status updated successfully",
            device
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
