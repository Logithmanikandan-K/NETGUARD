
const express = require("express");
const router = express.Router();

const AccessPoint = require("../models/AccessPoint");
const Device = require("../models/Device");

const { getWifiInfo } = require("../services/networkMonitor");
const { getLocalDevice } = require("../services/deviceDiscovery");

const {
    getPendingTcpConnections
} = require("../services/tcpMonitor");

const {
    processConnectionAttempt
} = require("../engine/automataEngine");

const {
    getMonitoringStatus
} = require("../services/continuousMonitor");
// =====================================
// 1. GET MONITORING SERVICE STATUS
// =====================================

router.get("/status", (req, res) => {
    try {
        res.json({
            message: "Monitoring status retrieved successfully",
            monitoring: getMonitoringStatus()
        });

    } catch (error) {
        res.status(500).json({
            message: "Unable to retrieve monitoring status",
            error: error.message
        });
    }
});

// =====================================
// 1. GET REAL WI-FI INFORMATION
// =====================================

router.get("/wifi", async (req, res) => {
    try {
        const wifi = await getWifiInfo();

        if (!wifi.connected) {
            return res.status(400).json({
                message: "Wi-Fi is not connected",
                wifi
            });
        }

        if (!wifi.ssid) {
            return res.status(400).json({
                message: "Could not detect Wi-Fi SSID",
                wifi
            });
        }

        const accessPoint = await AccessPoint.findOneAndUpdate(
            {
                ssid: wifi.ssid,
                bssid: wifi.bssid,
                mode: "Real"
            },
            {
                name: wifi.ssid,
                ssid: wifi.ssid,
                bssid: wifi.bssid,
                ipAddress: wifi.ipAddress,
                gateway: wifi.gateway,
                band: wifi.band,
                channel: wifi.channel,
                signal: wifi.signal,
                rssi: wifi.rssi,
                interfaceName: wifi.interfaceName,
                adapterDescription: wifi.adapterDescription,
                status: "Online",
                mode: "Real"
            },
            {
                new: true,
                upsert: true,
                runValidators: true,
                setDefaultsOnInsert: true
            }
        );

        res.json({
            message: "Real Wi-Fi information detected successfully",
            wifi,
            accessPoint
        });

    } catch (error) {
        res.status(500).json({
            message: "Wi-Fi monitoring failed",
            error: error.message
        });
    }
});


// =====================================
// 2. DETECT THIS LOCAL COMPUTER
// =====================================

router.get("/device", async (req, res) => {
    try {
        const localDevice = getLocalDevice();

        const accessPoint = await AccessPoint.findOne({
            mode: "Real",
            status: "Online"
        }).sort({ updatedAt: -1 });

        const device = await Device.findOneAndUpdate(
            {
                ipAddress: localDevice.ipAddress,
                mode: "Real"
            },
            {
                deviceName: localDevice.deviceName,
                ipAddress: localDevice.ipAddress,
                macAddress: localDevice.macAddress,
                accessPoint: accessPoint
                    ? accessPoint._id
                    : undefined,
                status: "Connected",
                mode: "Real"
            },
            {
                new: true,
                upsert: true,
                runValidators: true,
                setDefaultsOnInsert: true
            }
        );

        res.json({
            message: "Local device detected successfully",
            device
        });

    } catch (error) {
        res.status(500).json({
            message: "Device detection failed",
            error: error.message
        });
    }
});

// =====================================
// 3. REAL TCP PORT SCAN MONITORING
// =====================================

router.get("/port-events", async (req, res) => {
    try {
        const connections = await getPendingTcpConnections();

        const results = [];

        for (const connection of connections) {

            const result = await processConnectionAttempt(
                connection.sourceIp,
                connection.targetPort
            );

            results.push({
                ...result,
                tcpState: connection.state
            });
        }

        const alerts = results.filter(
            item => item.alert !== null
        );

        res.json({
            message: "TCP monitoring completed",
            totalEvents: results.length,
            detectedAlerts: alerts.length,
            events: results
        });

    } catch (error) {
        console.error("TCP Monitoring Error:", error);

        res.status(500).json({
            message: "TCP monitoring failed",
            error: error.message
        });
    }
});


// =====================================
// 3. EXPORT ROUTER
// =====================================

module.exports = router;
