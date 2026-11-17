
const Alert = require("../models/Alert");

// Store active connection information for each IP
const activeConnections = new Map();

const TIME_WINDOW = 5000;
const PORT_THRESHOLD = 4;

// Determine current DFA state
function getState(portCount) {
    if (portCount === 0) return "q0";
    if (portCount === 1) return "q1";
    if (portCount === 2) return "q2";
    if (portCount === 3) return "q3";

    return "q_alert";
}

// Classify port scanning pattern
function classifyScan(ports) {
    if (ports.length < 2) return "Unknown";

    let sequential = true;

    for (let i = 1; i < ports.length; i++) {
        if (Math.abs(ports[i] - ports[i - 1]) !== 1) {
            sequential = false;
            break;
        }
    }

    return sequential ? "Sequential Scan" : "Random Scan";
}

// Process incoming connection attempt
async function processConnectionAttempt(sourceIp, targetPort) {

    const now = Date.now();

    // Get existing IP information
    let connection = activeConnections.get(sourceIp);

    if (!connection) {
        connection = {
            events: [],
            state: "q0",
            alertSaved: false
        };
    }

    // Remove events older than 5 seconds
    connection.events = connection.events.filter(
        event => now - event.time <= TIME_WINDOW
    );

    // Check whether the port is already present
    const existingPort = connection.events.some(
        event => event.port === targetPort
    );

    // Record new connection attempt
    connection.events.push({
        port: targetPort,
        time: now
    });

    // Get unique ports in arrival order
    const uniquePorts = [
        ...new Set(connection.events.map(event => event.port))
    ];

    // Update DFA state
    const previousState = connection.state;

    connection.state = getState(uniquePorts.length);

    // Store updated information
    activeConnections.set(sourceIp, connection);

    let alert = null;

    // Check accepting state
    if (
        connection.state === "q_alert" &&
        !connection.alertSaved
    ) {
        const scanPattern = classifyScan(uniquePorts);

        // Save confirmed attack in MongoDB
        alert = await Alert.create({
            sourceIp,
            targetedPorts: uniquePorts,
            scanPattern,
            automataState: "q_alert",
            packetCount: connection.events.length
        });

        connection.alertSaved = true;
    }

    // Reset alert flag after falling below threshold
    if (
        connection.state !== "q_alert" &&
        previousState === "q_alert"
    ) {
        connection.alertSaved = false;
    }

    return {
        sourceIp,
        targetPort,
        uniquePorts,
        packetCount: connection.events.length,
        previousState,
        currentState: connection.state,
        eventType: existingPort ? "P_same" : "P_new",
        alert
    };
}

// Get all active DFA states
function getActiveStates() {

    const now = Date.now();
    const states = [];

    for (const [sourceIp, connection] of activeConnections) {

        // Remove expired events
        connection.events = connection.events.filter(
            event => now - event.time <= TIME_WINDOW
        );

        const uniquePorts = [
            ...new Set(connection.events.map(event => event.port))
        ];

        connection.state = getState(uniquePorts.length);

        if (connection.state !== "q_alert") {
            connection.alertSaved = false;
        }

        // Remove inactive IPs
        if (connection.events.length === 0) {
            activeConnections.delete(sourceIp);
            continue;
        }

        states.push({
            sourceIp,
            state: connection.state,
            targetedPorts: uniquePorts,
            packetCount: connection.events.length
        });
    }

    return states;
}

module.exports = {
    processConnectionAttempt,
    getActiveStates
};
