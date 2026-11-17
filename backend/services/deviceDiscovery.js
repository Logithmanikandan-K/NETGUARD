
const os = require("os");

function getLocalDevice() {
    const interfaces = os.networkInterfaces();

    for (const [name, addresses] of Object.entries(interfaces)) {
        if (!name.toLowerCase().includes("wi-fi")) {
            continue;
        }

        for (const address of addresses || []) {
            if (
                address.family === "IPv4" &&
                !address.internal
            ) {
                return {
                    deviceName: os.hostname(),
                    ipAddress: address.address,
                    macAddress: address.mac,
                    interfaceName: name
                };
            }
        }
    }

    throw new Error("Wi-Fi network interface not found");
}

module.exports = { getLocalDevice };
