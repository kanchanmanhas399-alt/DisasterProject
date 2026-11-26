const HospitalModel = require("./Hospital")

const getId = (req) => req.params?._id || req.body?._id || req.query?._id

const add = async (req, res) => {
    try {
        const formData = req.body || {}
        let validation = ""

        if (!formData.resourceId) validation += "resourceId is required, "
        if (!formData.hospitalName) validation += "hospitalName is required, "
        if (!formData.address) validation += "address is required, "
        if (!formData.contact) validation += "contact is required, "
        if (!formData.services) validation += "services is required, "
        if (!formData.status) validation += "status is required, "

        if (validation) {
            return res.status(400).json({ status: 400, success: false, message: validation })
        }

        const item = await HospitalModel.create({
            resourceId: formData.resourceId,
            hospitalName: formData.hospitalName,
            address: formData.address,
            contact: formData.contact,
            services: formData.services,
            status: formData.status
        })

        return res.status(200).json({ status: 200, success: true, message: "Hospital added", data: item })
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message })
    }
}

const all = async (req, res) => {
    try {
        const filter = req.query || req.body || {}
        const items = await HospitalModel.find({ ...filter, isDelete: false }).sort({ createdAt: -1 })
        return res.status(200).json({ status: 200, success: true, message: "Hospitals loaded", data: items })
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message })
    }
}

const getSingle = async (req, res) => {
    try {
        const _id = getId(req)
        if (!_id) return res.status(400).json({ status: 400, success: false, message: "_id is required" })

        const item = await HospitalModel.findById(_id)
        if (!item) return res.status(404).json({ status: 404, success: false, message: "Hospital not found" })

        return res.status(200).json({ status: 200, success: true, message: "Hospital loaded", data: item })
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message })
    }
}

const update = async (req, res) => {
    try {
        const _id = getId(req)
        const formData = req.body || {}
        if (!_id) return res.status(400).json({ status: 400, success: false, message: "_id is required" })

        const item = await HospitalModel.findById(_id)
        if (!item) return res.status(404).json({ status: 404, success: false, message: "Hospital not found" })

        if (formData.resourceId !== undefined) item.resourceId = formData.resourceId
        if (formData.hospitalName !== undefined) item.hospitalName = formData.hospitalName
        if (formData.address !== undefined) item.address = formData.address
        if (formData.contact !== undefined) item.contact = formData.contact
        if (formData.services !== undefined) item.services = formData.services
        if (formData.status !== undefined) item.status = formData.status

        const updated = await item.save()
        return res.status(200).json({ status: 200, success: true, message: "Hospital updated", data: updated })
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message })
    }
}

const deletePermanent = async (req, res) => {
    try {
        const _id = getId(req)
        if (!_id) return res.status(400).json({ status: 400, success: false, message: "_id is required" })

        const item = await HospitalModel.findByIdAndDelete(_id)
        if (!item) return res.status(404).json({ status: 404, success: false, message: "Hospital not found" })

        return res.status(200).json({ status: 200, success: true, message: "Hospital deleted permanently", data: item })
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message })
    }
}

const softDelete = async (req, res) => {
    try {
        const _id = getId(req)
        if (!_id) return res.status(400).json({ status: 400, success: false, message: "_id is required" })

        const item = await HospitalModel.findById(_id)
        if (!item) return res.status(404).json({ status: 404, success: false, message: "Hospital not found" })

        item.isDelete = true
        item.status = "Inactive"
        const saved = await item.save()
        return res.status(200).json({ status: 200, success: true, message: "Hospital closed", data: saved })
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message })
    }
}

module.exports = { add, all, getSingle, update, deletePermanent, softDelete }
