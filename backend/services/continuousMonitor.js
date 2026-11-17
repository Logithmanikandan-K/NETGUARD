
const {
    getPendingTcpConnections
} = require("./tcpMonitor");

const {
    processConnectionAttempt
} = require("../engine/automataEngine");

const MONITOR_INTERVAL = 5000;

let monitorTimer = null;
let isChecking = false;

// Prevent processing the same pending connection repeatedly
const processedConnections = new Map();

async function checkTcpConnections() {

    if (isChecking) return;

    isChecking = true;

    try {
        const connections = await getPendingTcpConnections();
        const now = Date.now();

        // Remove old entries
        for (const [key, time] of processedConnections) {
            if (now - time > 10000) {
                processedConnections.delete(key);
            }
        }

        for (const connection of connections) {

            const key =
                connection.sourceIp + ":" +
                connection.targetPort;

            if (processedConnections.has(key)) {
                continue;
            }

            processedConnections.set(key, now);

            const result = await processConnectionAttempt(
                connection.sourceIp,
                connection.targetPort
            );

            if (result.alert) {
                console.log("PORT SCAN DETECTED!");
                console.log(result.alert);
            }
        }

        console.log(
            `[TCP Monitor] Checked ${connections.length} connection(s)`
        );

    } catch (error) {
        console.error(
            "[TCP Monitor Error]",
            error.message
        );

    } finally {
        isChecking = false;
    }
}

// Start automatic monitoring
function startContinuousMonitoring() {

    if (monitorTimer) {
        console.log("TCP monitoring is already running");
        return;
    }

    console.log("Continuous TCP monitoring started");
    console.log("Monitoring interval: 5 seconds");

    // Perform first check immediately
    checkTcpConnections();

    monitorTimer = setInterval(
        checkTcpConnections,
        MONITOR_INTERVAL
    );
}

// Stop automatic monitoring
function stopContinuousMonitoring() {

    if (monitorTimer) {
        clearInterval(monitorTimer);
        monitorTimer = null;

        console.log("TCP monitoring stopped");
    }
}

// Get continuous monitoring status
function getMonitoringStatus() {
    return {
        running: monitorTimer !== null,
        checking: isChecking,
        interval: MONITOR_INTERVAL
    };
}

module.exports = {
    startContinuousMonitoring,
    stopContinuousMonitoring,
    getMonitoringStatus
};
