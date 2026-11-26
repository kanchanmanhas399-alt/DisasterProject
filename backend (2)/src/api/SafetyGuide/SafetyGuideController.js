const SafetyGuideModel = require("./SafetyGuide");

const getId = (req) => req.params?._id || req.body?._id || req.query?._id;

const add = async (req, res) => {
    try {
        const formData = req.body || {};
        let validation = "";

        if (!formData.disasterType) validation += "disasterType is required, ";
        if (!formData.title) validation += "title is required, ";

        if (validation) {
            return res.status(400).json({ status: 400, success: false, message: validation });
        }

        const existing = await SafetyGuideModel.findOne({ disasterType: formData.disasterType });
        if (existing) {
            return res.status(409).json({ status: 409, success: false, message: "Safety guide for this disaster type already exists" });
        }

        const item = await SafetyGuideModel.create({
            disasterType: formData.disasterType,
            title: formData.title,
            shortIntro: formData.shortIntro || "",
            beforePrecautions: Array.isArray(formData.beforePrecautions) ? formData.beforePrecautions : [],
            duringInstructions: Array.isArray(formData.duringInstructions) ? formData.duringInstructions : [],
            afterPrecautions: Array.isArray(formData.afterPrecautions) ? formData.afterPrecautions : [],
            emergencyChecklist: Array.isArray(formData.emergencyChecklist) ? formData.emergencyChecklist : [],
            preventiveMeasures: Array.isArray(formData.preventiveMeasures) ? formData.preventiveMeasures : [],
            image: formData.image || "",
            isPublished: formData.isPublished !== undefined ? formData.isPublished : true
        });

        return res.status(200).json({ status: 200, success: true, message: "Safety guide added successfully", data: item });
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message });
    }
};

const all = async (req, res) => {
    try {
        const query = req.query || {};
        const filter = { isDelete: false };

        const isAdmin = req.token?.role === "admin" || req.token?.userType === "admin";
        if (!isAdmin) {
            filter.isPublished = true;
        }

        const items = await SafetyGuideModel.find(filter).sort({ title: 1 });
        return res.status(200).json({ status: 200, success: true, message: "Safety guides loaded", data: items });
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message });
    }
};

const getSingle = async (req, res) => {
    try {
        const id = getId(req) || req.params?.disasterType;
        if (!id) return res.status(400).json({ status: 400, success: false, message: "Guideline ID or disaster type is required" });
        let item = null;
        if (/^[0-9a-fA-F]{24}$/.test(String(id))) {
            item = await SafetyGuideModel.findById(id);
        } else {
            const escapedType = String(id).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            item = await SafetyGuideModel.findOne({ disasterType: new RegExp(`^${escapedType}$`, "i"), isDelete: false });
        }

        if (!item || item.isDelete) {
            return res.status(404).json({ status: 404, success: false, message: "Safety guide not found" });
        }

        return res.status(200).json({ status: 200, success: true, message: "Safety guide loaded", data: item });
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message });
    }
};

const update = async (req, res) => {
    try {
        const _id = getId(req);
        const formData = req.body || {};
        if (!_id) return res.status(400).json({ status: 400, success: false, message: "_id is required" });

        const item = await SafetyGuideModel.findById(_id);
        if (!item || item.isDelete) return res.status(404).json({ status: 404, success: false, message: "Safety guide not found" });

        if (formData.disasterType !== undefined) item.disasterType = formData.disasterType;
        if (formData.title !== undefined) item.title = formData.title;
        if (formData.shortIntro !== undefined) item.shortIntro = formData.shortIntro;
        if (formData.beforePrecautions !== undefined) item.beforePrecautions = formData.beforePrecautions;
        if (formData.duringInstructions !== undefined) item.duringInstructions = formData.duringInstructions;
        if (formData.afterPrecautions !== undefined) item.afterPrecautions = formData.afterPrecautions;
        if (formData.emergencyChecklist !== undefined) item.emergencyChecklist = formData.emergencyChecklist;
        if (formData.preventiveMeasures !== undefined) item.preventiveMeasures = formData.preventiveMeasures;
        if (formData.image !== undefined) item.image = formData.image;
        if (formData.isPublished !== undefined) item.isPublished = formData.isPublished;

        const updated = await item.save();
        return res.status(200).json({ status: 200, success: true, message: "Safety guide updated successfully", data: updated });
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message });
    }
};

const deletePermanent = async (req, res) => {
    try {
        const _id = getId(req);
        if (!_id) return res.status(400).json({ status: 400, success: false, message: "_id is required" });

        const deleted = await SafetyGuideModel.findByIdAndDelete(_id);
        if (!deleted) return res.status(404).json({ status: 404, success: false, message: "Safety guide not found" });

        return res.status(200).json({ status: 200, success: true, message: "Safety guide deleted permanently", data: deleted });
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message });
    }
};

module.exports = { add, all, getSingle, update, deletePermanent };
