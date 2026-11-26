const DisasterModel = require("./Disaster")

const getId = (req) => req.params?._id || req.body?._id || req.query?._id

const add = async (req, res) => {
    try {
        const formData = req.body || {}
        let validation = ""

        if (!formData.disasterId) validation += "disasterId is required, "
        if (!formData.disasterName) validation += "disasterName is required, "
        if (!formData.type) validation += "type is required, "
        if (!formData.location) validation += "location is required, "
        if (!formData.severity) validation += "severity is required, "
        if (!formData.status) validation += "status is required, "

        if (validation) {
            return res.status(400).json({ status: 400, success: false, message: validation })
        }

        const item = await DisasterModel.create({
            disasterId: formData.disasterId,
            disasterName: formData.disasterName,
            type: formData.type,
            location: formData.location,
            severity: formData.severity,
            status: formData.status
        })

        return res.status(200).json({ status: 200, success: true, message: "Disaster added", data: item })
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message })
    }
}

const all = async (req, res) => {
    try {
        const filter = req.query || req.body || {}
        const items = await DisasterModel.find({ ...filter, isDelete: false }).sort({ createdAt: -1 })
        return res.status(200).json({ status: 200, success: true, message: "Disasters loaded", data: items })
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message })
    }
}

const getSingle = async (req, res) => {
    try {
        const _id = getId(req)
        if (!_id) return res.status(400).json({ status: 400, success: false, message: "_id is required" })

        const item = await DisasterModel.findById(_id)
        if (!item) return res.status(404).json({ status: 404, success: false, message: "Disaster not found" })

        return res.status(200).json({ status: 200, success: true, message: "Disaster loaded", data: item })
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message })
    }
}

const update = async (req, res) => {
    try {
        const _id = getId(req)
        const formData = req.body || {}
        if (!_id) return res.status(400).json({ status: 400, success: false, message: "_id is required" })

        const item = await DisasterModel.findById(_id)
        if (!item) return res.status(404).json({ status: 404, success: false, message: "Disaster not found" })

        if (formData.disasterId !== undefined) item.disasterId = formData.disasterId
        if (formData.disasterName !== undefined) item.disasterName = formData.disasterName
        if (formData.type !== undefined) item.type = formData.type
        if (formData.location !== undefined) item.location = formData.location
        if (formData.severity !== undefined) item.severity = formData.severity
        if (formData.status !== undefined) item.status = formData.status

        const updated = await item.save()
        return res.status(200).json({ status: 200, success: true, message: "Disaster updated", data: updated })
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message })
    }
}

const deletePermanent = async (req, res) => {
    try {
        const _id = getId(req)
        if (!_id) return res.status(400).json({ status: 400, success: false, message: "_id is required" })

        const item = await DisasterModel.findByIdAndDelete(_id)
        if (!item) return res.status(404).json({ status: 404, success: false, message: "Disaster not found" })

        return res.status(200).json({ status: 200, success: true, message: "Disaster deleted permanently", data: item })
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message })
    }
}

const softDelete = async (req, res) => {
    try {
        const _id = getId(req)
        if (!_id) return res.status(400).json({ status: 400, success: false, message: "_id is required" })

        const item = await DisasterModel.findById(_id)
        if (!item) return res.status(404).json({ status: 404, success: false, message: "Disaster not found" })

        item.isDelete = true
        item.status = "Inactive"
        const saved = await item.save()
        return res.status(200).json({ status: 200, success: true, message: "Disaster closed", data: saved })
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message })
    }
}

module.exports = { add, all, getSingle, update, deletePermanent, softDelete }
