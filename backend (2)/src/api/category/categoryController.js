
const categoryModel = require("./categoryModel")

const getId = (req) => req.params?._id || req.body?._id || req.query?._id

const add = async (req, res) => {
    try {
        const formData = req.body || {}
        let validation = ""

        if (!formData.name) validation += "name is required, "
        if (!formData.description) validation += "description is required, "

        if (validation) {
            return res.status(400).json({
                status: 400,
                success: false,
                message: validation
            })
        }

        const existingCategory = await categoryModel.findOne({ name: formData.name })
        if (existingCategory) {
            return res.status(409).json({
                status: 409,
                success: false,
                message: "name already registered"
            })
        }

        const count = await categoryModel.countDocuments({})
        const categoryObj = new categoryModel({
            name: formData.name,
            description: formData.description,
            image: formData.image || null,
            autoId: `cat-${count + 1}`
        })

        const categoryData = await categoryObj.save()

        return res.status(200).json({
            status: 200,
            success: true,
            message: "category Added",
            data: categoryData
        })
    } catch (err) {
        return res.status(500).json({
            status: 500,
            success: false,
            message: "internal server error"
        })
    }
}

const all = async (req, res) => {
    try {
        const formData = req.query || req.body || {}
        const categories = await categoryModel.find(formData).sort({ createdAt: -1 })

        return res.status(200).json({
            status: 200,
            success: true,
            message: "Categories Loaded",
            data: categories
        })
    } catch (err) {
        console.log(err);
        
        return res.status(500).json({
            status: 500,
            success: false,
            message: "internal server error"
        })
    }
}

const getSingle = async (req, res) => {
    try {
        const _id = getId(req)

        if (!_id) {
            return res.status(400).json({
                status: 400,
                success: false,
                message: "id is required"
            })
        }

        const data = await categoryModel.findById(_id)

        if (!data) {
            return res.status(404).json({
                status: 404,
                success: false,
                message: "Category not found"
            })
        }

        return res.status(200).json({
            status: 200,
            success: true,
            message: "Category loaded",
            data
        })
    } catch (err) {
        return res.status(500).json({
            status: 500,
            success: false,
            message: "internal server error"
        })
    }
}

const update = async (req, res) => {
    try {
        const _id = getId(req)
        const formData = req.body || {}

        if (!_id) {
            return res.status(400).json({
                status: 400,
                success: false,
                message: "_id is required"
            })
        }

        const category = await categoryModel.findById(_id)
        if (!category) {
            return res.status(404).json({
                status: 404,
                success: false,
                message: "Category Not Found"
            })
        }

        if (formData.name !== undefined) category.name = formData.name
        if (formData.description !== undefined) category.description = formData.description
        if (formData.image !== undefined) category.image = formData.image
        if (formData.status !== undefined) category.status = formData.status

        const updatedCategory = await category.save()

        return res.status(200).json({
            status: 200,
            success: true,
            message: "Category Updated",
            data: updatedCategory
        })
    } catch (err) {
        return res.status(500).json({
            status: 500,
            success: false,
            message: "Internal Server Error",
            error: err.message
        })
    }
}

const deletePermanent = async (req, res) => {
    try {
        const _id = getId(req)

        if (!_id) {
            return res.status(400).json({
                status: 400,
                success: false,
                message: "_id is required"
            })
        }

        const category = await categoryModel.findById(_id)
        if (!category) {
            return res.status(404).json({
                status: 404,
                success: false,
                message: "No such Category found"
            })
        }

        const deleted = await categoryModel.findByIdAndDelete(_id)

        return res.status(200).json({
            status: 200,
            success: true,
            message: "Category deleted permanently",
            data: deleted
        })
    } catch (err) {
        return res.status(500).json({
            status: 500,
            success: false,
            message: "Internal Server Error",
            error: err.message
        })
    }
}

const softDelete = async (req, res) => {
    try {
        const _id = getId(req)

        if (!_id) {
            return res.status(400).json({
                status: 400,
                success: false,
                message: "_id is required"
            })
        }

        const category = await categoryModel.findById(_id)
        if (!category) {
            return res.status(404).json({
                status: 404,
                success: false,
                message: "No such category"
            })
        }

        category.isDelete = true
        category.status = false

        const savedCategory = await category.save()

        return res.status(200).json({
            status: 200,
            success: true,
            message: "Category Deleted",
            data: savedCategory
        })
    } catch (err) {
        return res.status(500).json({
            status: 500,
            success: false,
            message: "Internal Server Error",
            error: err.message
        })
    }
}

module.exports = { add, all, getSingle, update, deletePermanent, softDelete }
