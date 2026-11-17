
const mongoose = require("mongoose");

const accessPointSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    ssid: {
        type: String,
        required: true
    },
    ipAddress: String,
    gateway: String,
    status: {
        type: String,
        default: "Offline"
    },
    mode: {
        type: String,
        default: "Simulation"
    },
    bssid: {
    type: String,
    default: ""
},
band: {
    type: String,
    default: ""
},
channel: {
    type: Number,
    default: null
},
signal: {
    type: String,
    default: ""
},
rssi: {
    type: Number,
    default: null
},
interfaceName: {
    type: String,
    default: ""
},
adapterDescription: {
    type: String,
    default: ""
}
}, { timestamps: true });

module.exports = mongoose.model("AccessPoint", accessPointSchema);
