const ShelterModel = require("./Shelter")

const getId = (req) => req.params?._id || req.body?._id || req.query?._id

const add = async (req, res) => {
    try {
        const formData = req.body || {}
        let validation = ""

        if (!formData.resourceId) validation += "resourceId is required, "
        if (!formData.name) validation += "name is required, "
        if (!formData.address) validation += "address is required, "
        if (!formData.contact) validation += "contact is required, "
        if (!formData.capacity && formData.capacity !== 0) validation += "capacity is required, "
        if (!formData.status) validation += "status is required, "

        if (validation) {
            return res.status(400).json({ status: 400, success: false, message: validation })
        }

        const item = await ShelterModel.create({
            resourceId: formData.resourceId,
            name: formData.name,
            address: formData.address,
            contact: formData.contact,
            capacity: Number(formData.capacity),
            status: formData.status
        })

        return res.status(200).json({ status: 200, success: true, message: "Shelter added", data: item })
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message })
    }
}

const all = async (req, res) => {
    try {
        const filter = req.query || req.body || {}
        const items = await ShelterModel.find({ ...filter, isDelete: false }).sort({ createdAt: -1 })
        return res.status(200).json({ status: 200, success: true, message: "Shelters loaded", data: items })
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message })
    }
}

const getSingle = async (req, res) => {
    try {
        const _id = getId(req)
        if (!_id) return res.status(400).json({ status: 400, success: false, message: "_id is required" })

        const item = await ShelterModel.findById(_id)
        if (!item) return res.status(404).json({ status: 404, success: false, message: "Shelter not found" })

        return res.status(200).json({ status: 200, success: true, message: "Shelter loaded", data: item })
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message })
    }
}

const update = async (req, res) => {
    try {
        const _id = getId(req)
        const formData = req.body || {}
        if (!_id) return res.status(400).json({ status: 400, success: false, message: "_id is required" })

        const item = await ShelterModel.findById(_id)
        if (!item) return res.status(404).json({ status: 404, success: false, message: "Shelter not found" })

        if (formData.resourceId !== undefined) item.resourceId = formData.resourceId
        if (formData.name !== undefined) item.name = formData.name
        if (formData.address !== undefined) item.address = formData.address
        if (formData.contact !== undefined) item.contact = formData.contact
        if (formData.capacity !== undefined) item.capacity = Number(formData.capacity)
        if (formData.status !== undefined) item.status = formData.status

        const updated = await item.save()
        return res.status(200).json({ status: 200, success: true, message: "Shelter updated", data: updated })
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message })
    }
}

const deletePermanent = async (req, res) => {
    try {
        const _id = getId(req)
        if (!_id) return res.status(400).json({ status: 400, success: false, message: "_id is required" })

        const item = await ShelterModel.findByIdAndDelete(_id)
        if (!item) return res.status(404).json({ status: 404, success: false, message: "Shelter not found" })

        return res.status(200).json({ status: 200, success: true, message: "Shelter deleted permanently", data: item })
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message })
    }
}

const softDelete = async (req, res) => {
    try {
        const _id = getId(req)
        if (!_id) return res.status(400).json({ status: 400, success: false, message: "_id is required" })

        const item = await ShelterModel.findById(_id)
        if (!item) return res.status(404).json({ status: 404, success: false, message: "Shelter not found" })

        item.isDelete = true
        item.status = "Inactive"
        const saved = await item.save()
        return res.status(200).json({ status: 200, success: true, message: "Shelter closed", data: saved })
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message })
    }
}

module.exports = { add, all, getSingle, update, deletePermanent, softDelete }
