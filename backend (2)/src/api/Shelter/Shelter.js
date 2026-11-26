const mongoose = require("mongoose")

const shelterSchema = new mongoose.Schema({
    resourceId: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    contact: { type: String, required: true, trim: true },
    capacity: { type: Number, required: true },
    status: { type: String, default: "Available", trim: true },
    isDelete: { type: Boolean, default: false }
}, { timestamps: true })

module.exports = mongoose.model("Shelter", shelterSchema)
