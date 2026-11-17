
const express = require("express");
const router = express.Router();

const {
    getActiveStates
} = require("../engine/automataEngine");

// GET /api/states
router.get("/", (req, res) => {
    try {
        const states = getActiveStates();

        res.status(200).json({
            count: states.length,
            states
        });

    } catch (error) {
        res.status(500).json({
            message: "Unable to retrieve DFA states"
        });
    }
});

module.exports = router;
