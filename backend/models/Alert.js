
const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema({
    sourceIp: {
        type: String,
        required: true
    },
    targetedPorts: [Number],
    scanPattern: String,
    automataState: {
        type: String,
        default: "q_alert"
    },
    packetCount: Number,
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model("Alert", alertSchema);
