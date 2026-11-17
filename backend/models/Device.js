
const mongoose = require("mongoose");

const deviceSchema = new mongoose.Schema({
    deviceName: {
        type: String,
        required: true
    },
    ipAddress: {
        type: String,
        required: true
    },
    macAddress: String,
    accessPoint: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AccessPoint"
    },
    status: {
        type: String,
        default: "Connected"
    },
    mode: {
        type: String,
        default: "Simulation"
    }
}, { timestamps: true });

module.exports = mongoose.model("Device", deviceSchema);
