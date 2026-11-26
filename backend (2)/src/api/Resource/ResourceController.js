const ResourceModel = require("./Resource");
const ShelterModel = require("../Shelter/Shelter");
const HospitalModel = require("../Hospital/Hospital");
const RescueCenterModel = require("../RescueCenter/RescueCenter");

const getId = (req) => req.params?._id || req.body?._id || req.query?._id;

const normalizeType = (t) => {
    if (!t) return "Emergency Support Center";
    const lower = t.toLowerCase();
    if (lower.includes("shelter")) return "Shelter";
    if (lower.includes("hospital")) return "Hospital";
    if (lower.includes("rescue")) return "Rescue Center";
    if (lower.includes("support")) return "Emergency Support Center";
    return t;
};

const add = async (req, res) => {
    try {
        const formData = req.body || {};
        let validation = "";

        if (!formData.name) validation += "name is required, ";
        if (!formData.type) validation += "type is required, ";
        if (!formData.contact) validation += "contact is required, ";

        if (validation) {
            return res.status(400).json({ status: 400, success: false, message: validation });
        }

        const normalizedType = normalizeType(formData.type);
        const count = await ResourceModel.countDocuments({ type: normalizedType });
        const prefix = normalizedType === "Shelter" ? "SH" : normalizedType === "Hospital" ? "HO" : normalizedType === "Rescue Center" ? "RC" : "SC";
        const autoResourceId = formData.resourceId || `${prefix}-${String(count + 1).padStart(2, "0")}`;

        const item = await ResourceModel.create({
            userId: req.token?.id || req.token?._id || null,
            resourceId: autoResourceId,
            name: formData.name,
            type: normalizedType,
            description: formData.description || "",
            address: formData.address || formData.location || "",
            location: formData.location || formData.address || "",
            contact: formData.contact,
            services: formData.services || "",
            capacity: parseInt(formData.capacity, 10) || 0,
            status: formData.status || "Available",
            image: formData.image || ""
        });

        // Sync with specific legacy models if applicable
        if (normalizedType === "Shelter") {
            try {
                await ShelterModel.create({
                    resourceId: autoResourceId,
                    name: item.name,
                    address: item.address,
                    contact: item.contact,
                    capacity: item.capacity,
                    status: item.status
                });
            } catch (e) {}
        } else if (normalizedType === "Hospital") {
            try {
                await HospitalModel.create({
                    resourceId: autoResourceId,
                    hospitalName: item.name,
                    address: item.address,
                    contact: item.contact,
                    services: item.services,
                    status: item.status
                });
            } catch (e) {}
        } else if (normalizedType === "Rescue Center") {
            try {
                await RescueCenterModel.create({
                    resourceId: autoResourceId,
                    centerName: item.name,
                    address: item.address,
                    contact: item.contact,
                    services: item.services,
                    status: item.status
                });
            } catch (e) {}
        }

        return res.status(200).json({ status: 200, success: true, message: "Emergency resource added successfully", data: item });
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message });
    }
};

const all = async (req, res) => {
    try {
        const query = req.query || req.body || {};
        const filter = { isDelete: false };

        if (query.type && query.type !== "All") {
            filter.type = normalizeType(query.type);
        }
        if (query.status && query.status !== "All") {
            filter.status = query.status;
        }

        let searchQuery = {};
        if (query.search) {
            const regex = new RegExp(query.search, "i");
            searchQuery = {
                $or: [
                    { name: regex },
                    { resourceId: regex },
                    { address: regex },
                    { location: regex },
                    { services: regex },
                    { description: regex }
                ]
            };
        }

        const items = await ResourceModel.find({ ...filter, ...searchQuery }).sort({ createdAt: -1 });

        return res.status(200).json({ status: 200, success: true, message: "Resources loaded", data: items });
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message });
    }
};

const getSingle = async (req, res) => {
    try {
        const _id = getId(req);
        if (!_id) return res.status(400).json({ status: 400, success: false, message: "_id is required" });

        const item = await ResourceModel.findById(_id);
        if (!item || item.isDelete) return res.status(404).json({ status: 404, success: false, message: "Resource not found" });

        return res.status(200).json({ status: 200, success: true, message: "Resource loaded", data: item });
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message });
    }
};

const update = async (req, res) => {
    try {
        const _id = getId(req);
        const formData = req.body || {};
        if (!_id) return res.status(400).json({ status: 400, success: false, message: "_id is required" });

        const item = await ResourceModel.findById(_id);
        if (!item || item.isDelete) return res.status(404).json({ status: 404, success: false, message: "Resource not found" });

        if (formData.name !== undefined) item.name = formData.name;
        if (formData.type !== undefined) item.type = normalizeType(formData.type);
        if (formData.resourceId !== undefined) item.resourceId = formData.resourceId;
        if (formData.description !== undefined) item.description = formData.description;
        if (formData.address !== undefined) item.address = formData.address;
        if (formData.location !== undefined) item.location = formData.location;
        if (formData.contact !== undefined) item.contact = formData.contact;
        if (formData.services !== undefined) item.services = formData.services;
        if (formData.capacity !== undefined) item.capacity = parseInt(formData.capacity, 10) || 0;
        if (formData.status !== undefined) item.status = formData.status;
        if (formData.image !== undefined) item.image = formData.image;

        const updated = await item.save();
        return res.status(200).json({ status: 200, success: true, message: "Resource updated successfully", data: updated });
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message });
    }
};

const deletePermanent = async (req, res) => {
    try {
        const _id = getId(req);
        if (!_id) return res.status(400).json({ status: 400, success: false, message: "_id is required" });

        const deleted = await ResourceModel.findByIdAndDelete(_id);
        if (!deleted) return res.status(404).json({ status: 404, success: false, message: "Resource not found" });

        return res.status(200).json({ status: 200, success: true, message: "Resource deleted permanently", data: deleted });
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message });
    }
};

const softDelete = async (req, res) => {
    try {
        const _id = getId(req);
        if (!_id) return res.status(400).json({ status: 400, success: false, message: "_id is required" });

        const item = await ResourceModel.findById(_id);
        if (!item) return res.status(404).json({ status: 404, success: false, message: "Resource not found" });

        item.isDelete = true;
        const saved = await item.save();

        return res.status(200).json({ status: 200, success: true, message: "Resource disabled", data: saved });
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message });
    }
};

module.exports = { add, all, getSingle, update, deletePermanent, softDelete };
