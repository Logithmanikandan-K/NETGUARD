
const express = require("express");
const router = express.Router();

const {
    processConnectionAttempt
} = require("../engine/automataEngine");

// POST /api/simulate
router.post("/", async (req, res) => {
    try {
        const { sourceIp, targetPort } = req.body;

        // Validate input
        if (
            typeof sourceIp !== "string" ||
            !sourceIp.trim() ||
            !Number.isInteger(targetPort) ||
            targetPort < 1 ||
            targetPort > 65535
        ) {
            return res.status(400).json({
                message: "Enter a valid source IP and port number."
            });
        }

        const result = await processConnectionAttempt(
            sourceIp.trim(),
            targetPort
        );

        res.status(200).json({
            message: result.alert
                ? "Port Scan Detected!"
                : "Connection Attempt Processed",
            data: result
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Simulation failed"
        });
    }
});

module.exports = router;
