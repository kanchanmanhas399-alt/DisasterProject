const DisasterCategoryModel = require("./DisasterCategory")

const getId = (req) => req.params?._id || req.body?._id || req.query?._id

const add = async (req, res) => {
    try {
        const formData = req.body || {}
        let validation = ""

        if (!formData.name) validation += "name is required, "
        if (!formData.description) validation += "description is required, "
        if (!formData.imageIcon) validation += "imageIcon is required, "

        if (validation) {
            return res.status(400).json({ status: 400, success: false, message: validation })
        }

        const existing = await DisasterCategoryModel.findOne({ name: formData.name })
        if (existing) {
            return res.status(409).json({ status: 409, success: false, message: "Disaster category already exists" })
        }

        const item = await DisasterCategoryModel.create({
            name: formData.name,
            description: formData.description,
            imageIcon: formData.imageIcon,
            status: formData.status || "active"
        })

        return res.status(200).json({ status: 200, success: true, message: "Disaster category added", data: item })
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message })
    }
}

const all = async (req, res) => {
    try {
        const filter = req.query || req.body || {}
        const items = await DisasterCategoryModel.find(filter).sort({ createdAt: -1 })
        return res.status(200).json({ status: 200, success: true, message: "Disaster categories loaded", data: items })
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message })
    }
}

const getSingle = async (req, res) => {
    try {
        const _id = getId(req)
        if (!_id) return res.status(400).json({ status: 400, success: false, message: "_id is required" })

        const item = await DisasterCategoryModel.findById(_id)
        if (!item) return res.status(404).json({ status: 404, success: false, message: "Disaster category not found" })

        return res.status(200).json({ status: 200, success: true, message: "Disaster category loaded", data: item })
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message })
    }
}

const update = async (req, res) => {
    try {
        const _id = getId(req)
        const formData = req.body || {}
        if (!_id) return res.status(400).json({ status: 400, success: false, message: "_id is required" })

        const item = await DisasterCategoryModel.findById(_id)
        if (!item) return res.status(404).json({ status: 404, success: false, message: "Disaster category not found" })

        if (formData.name !== undefined) item.name = formData.name
        if (formData.description !== undefined) item.description = formData.description
        if (formData.imageIcon !== undefined) item.imageIcon = formData.imageIcon
        if (formData.status !== undefined) item.status = formData.status

        const updatedItem = await item.save()
        return res.status(200).json({ status: 200, success: true, message: "Disaster category updated", data: updatedItem })
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message })
    }
}

const deletePermanent = async (req, res) => {
    try {
        const _id = getId(req)
        if (!_id) return res.status(400).json({ status: 400, success: false, message: "_id is required" })

        const deleted = await DisasterCategoryModel.findByIdAndDelete(_id)
        if (!deleted) return res.status(404).json({ status: 404, success: false, message: "Disaster category not found" })

        return res.status(200).json({ status: 200, success: true, message: "Disaster category deleted permanently", data: deleted })
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message })
    }
}

const softDelete = async (req, res) => {
    try {
        const _id = getId(req)
        if (!_id) return res.status(400).json({ status: 400, success: false, message: "_id is required" })

        const item = await DisasterCategoryModel.findById(_id)
        if (!item) return res.status(404).json({ status: 404, success: false, message: "Disaster category not found" })

        item.status = "inactive"
        const savedItem = await item.save()

        return res.status(200).json({ status: 200, success: true, message: "Disaster category disabled", data: savedItem })
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message })
    }
}

module.exports = { add, all, getSingle, update, deletePermanent, softDelete }
