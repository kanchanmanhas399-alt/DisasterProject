const mongoose = require("mongoose")

const rescueCenterSchema = new mongoose.Schema({
    resourceId: { type: String, required: true, trim: true },
    centerName: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    contact: { type: String, required: true, trim: true },
    services: { type: String, required: true, trim: true },
    status: { type: String, default: "Available", trim: true },
    isDelete: { type: Boolean, default: false }
}, { timestamps: true })

module.exports = mongoose.model("RescueCenter", rescueCenterSchema)
