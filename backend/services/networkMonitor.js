
const { execFile } = require("child_process");
const { promisify } = require("util");

const execFileAsync = promisify(execFile);

// Read Windows command output
async function runCommand(command, args) {
    const result = await execFileAsync(command, args, {
        windowsHide: true,
        encoding: "utf8"
    });

    return result.stdout;
}

// Get a value from netsh output
function getValue(output, label) {
    const regex = new RegExp(
        "^\\s*" + label + "\\s*:\\s*(.+)$",
        "mi"
    );

    const match = output.match(regex);
    return match ? match[1].trim() : "";
}

// Get actual Wi-Fi information
async function getWifiInfo() {
    const wifiOutput = await runCommand(
        "netsh",
        ["wlan", "show", "interfaces"]
    );

    const ipOutput = await runCommand("ipconfig", []);

    const state = getValue(wifiOutput, "State");
    const connected = state.toLowerCase() === "connected";

    // Find the Wi-Fi adapter section in ipconfig
    const wifiSection = ipOutput.match(
        /Wireless LAN adapter Wi-Fi:([\s\S]*?)(?=\r?\n\S[^\r\n]*adapter|\s*$)/i
    );

    const ipDetails = wifiSection ? wifiSection[1] : "";

    const ipMatch = ipDetails.match(
        /IPv4 Address[.\s]*:\s*([^\r\n]+)/i
    );

    const gatewayMatch = ipDetails.match(
        /Default Gateway[.\s]*:\s*([^\r\n]+)/i
    );

    const channel = getValue(wifiOutput, "Channel");
    const rssi = getValue(wifiOutput, "Rssi");

    return {
        connected,
        interfaceName: getValue(wifiOutput, "Name"),
        adapterDescription: getValue(wifiOutput, "Description"),
        ssid: connected ? getValue(wifiOutput, "SSID") : "",
        bssid: connected ? getValue(wifiOutput, "AP BSSID") : "",
        band: connected ? getValue(wifiOutput, "Band") : "",
        channel: connected && channel ? Number(channel) : null,
        signal: connected ? getValue(wifiOutput, "Signal") : "",
        rssi: connected && rssi ? Number(rssi) : null,
        ipAddress: ipMatch ? ipMatch[1].trim() : "",
        gateway: gatewayMatch ? gatewayMatch[1].trim() : ""
    };
}

module.exports = { getWifiInfo };
