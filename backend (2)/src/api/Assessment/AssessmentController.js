const AssessmentModel = require("./Assessment")

const getId = (req) => req.params?._id || req.body?._id || req.query?._id

const add = async (req, res) => {
    try {
        const formData = req.body || {}
        let validation = ""

        if (!formData.userId) validation += "userId is required, "
        if (!formData.reportId) validation += "reportId is required, "
        if (!formData.title) validation += "title is required, "
        if (!formData.score && formData.score !== 0) validation += "score is required, "

        if (validation) {
            return res.status(400).json({ status: 400, success: false, message: validation })
        }

        const item = await AssessmentModel.create({
            userId: formData.userId,
            reportId: formData.reportId,
            title: formData.title,
            score: formData.score,
            remarks: formData.remarks || "",
            status: formData.status || "pending"
        })

        return res.status(200).json({ status: 200, success: true, message: "Assessment added", data: item })
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message })
    }
}

const all = async (req, res) => {
    try {
        const filter = req.query || req.body || {}
        const items = await AssessmentModel.find(filter).sort({ createdAt: -1 })
        return res.status(200).json({ status: 200, success: true, message: "Assessments loaded", data: items })
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message })
    }
}

const getSingle = async (req, res) => {
    try {
        const _id = getId(req)
        if (!_id) return res.status(400).json({ status: 400, success: false, message: "_id is required" })

        const item = await AssessmentModel.findById(_id)
        if (!item) return res.status(404).json({ status: 404, success: false, message: "Assessment not found" })

        return res.status(200).json({ status: 200, success: true, message: "Assessment loaded", data: item })
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message })
    }
}

const update = async (req, res) => {
    try {
        const _id = getId(req)
        const formData = req.body || {}
        if (!_id) return res.status(400).json({ status: 400, success: false, message: "_id is required" })

        const item = await AssessmentModel.findById(_id)
        if (!item) return res.status(404).json({ status: 404, success: false, message: "Assessment not found" })

        if (formData.userId !== undefined) item.userId = formData.userId
        if (formData.reportId !== undefined) item.reportId = formData.reportId
        if (formData.title !== undefined) item.title = formData.title
        if (formData.score !== undefined) item.score = formData.score
        if (formData.remarks !== undefined) item.remarks = formData.remarks
        if (formData.status !== undefined) item.status = formData.status

        const updated = await item.save()
        return res.status(200).json({ status: 200, success: true, message: "Assessment updated", data: updated })
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message })
    }
}

const deletePermanent = async (req, res) => {
    try {
        const _id = getId(req)
        if (!_id) return res.status(400).json({ status: 400, success: false, message: "_id is required" })

        const deleted = await AssessmentModel.findByIdAndDelete(_id)
        if (!deleted) return res.status(404).json({ status: 404, success: false, message: "Assessment not found" })

        return res.status(200).json({ status: 200, success: true, message: "Assessment deleted permanently", data: deleted })
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message })
    }
}

const softDelete = async (req, res) => {
    try {
        const _id = getId(req)
        if (!_id) return res.status(400).json({ status: 400, success: false, message: "_id is required" })

        const item = await AssessmentModel.findById(_id)
        if (!item) return res.status(404).json({ status: 404, success: false, message: "Assessment not found" })

        item.isDelete = true
        item.status = "rejected"
        const saved = await item.save()

        return res.status(200).json({ status: 200, success: true, message: "Assessment disabled", data: saved })
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message })
    }
}

module.exports = { add, all, getSingle, update, deletePermanent, softDelete }
