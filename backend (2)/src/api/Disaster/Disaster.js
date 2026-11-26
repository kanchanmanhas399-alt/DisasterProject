const mongoose = require("mongoose")

const disasterSchema = new mongoose.Schema({
    disasterId: { type: String, required: true, trim: true },
    disasterName: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    severity: { type: String, required: true, trim: true },
    status: { type: String, default: "Active", trim: true },
    isDelete: { type: Boolean, default: false }
}, { timestamps: true })

module.exports = mongoose.model("Disaster", disasterSchema)
