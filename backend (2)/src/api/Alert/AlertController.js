const AlertModel = require("./Alert");
const NotificationModel = require("../Notification/Notification");
const UserModel = require("../user/user");

const getId = (req) => req.params?._id || req.body?._id || req.query?._id;

const add = async (req, res) => {
    try {
        const formData = req.body || {};
        let validation = "";

        if (!formData.title) validation += "title is required, ";
        if (!formData.disasterType) validation += "disasterType is required, ";
        if (!formData.description) validation += "description is required, ";
        if (!formData.severity) validation += "severity is required, ";
        if (!formData.affectedArea) validation += "affectedArea is required, ";

        if (validation) {
            return res.status(400).json({ status: 400, success: false, message: validation });
        }

        const alert = await AlertModel.create({
            title: formData.title,
            disasterType: formData.disasterType,
            description: formData.description,
            severity: formData.severity,
            affectedArea: formData.affectedArea,
            dateTime: formData.dateTime || Date.now(),
            image: formData.image || "",
            status: formData.status || "Active"
        });

        // Generate notifications for active users if alert is Active
        if (alert.status === "Active") {
            try {
                const users = await UserModel.find({ isDelete: false, status: "active" }).select("_id");
                const notifications = users.map(u => ({
                    userId: u._id,
                    title: `Disaster Alert: ${alert.title}`,
                    message: `${alert.disasterType} (${alert.severity} Severity) reported in ${alert.affectedArea}. ${alert.description}`,
                    type: "alert",
                    isRead: false
                }));
                if (notifications.length > 0) {
                    await NotificationModel.insertMany(notifications);
                }
            } catch (notifErr) {
                console.error("Failed to generate notifications for alert:", notifErr.message);
            }
        }

        return res.status(200).json({ status: 200, success: true, message: "Alert created successfully", data: alert });
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message });
    }
};

const all = async (req, res) => {
    try {
        const query = req.query || {};
        const filter = { isDelete: false };

        // If client is not admin (e.g. public/user route), only return Active alerts
        const isAdmin = req.token?.role === "admin" || req.token?.userType === "admin";
        if (!isAdmin) {
            filter.status = "Active";
        } else if (query.status) {
            filter.status = query.status;
        }

        if (query.severity) {
            filter.severity = query.severity;
        }
        if (query.disasterType) {
            filter.disasterType = query.disasterType;
        }

        const alerts = await AlertModel.find(filter).sort({ createdAt: -1 });
        return res.status(200).json({ status: 200, success: true, message: "Alerts loaded", data: alerts });
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message });
    }
};

const getSingle = async (req, res) => {
    try {
        const _id = getId(req);
        if (!_id) return res.status(400).json({ status: 400, success: false, message: "_id is required" });

        const alert = await AlertModel.findById(_id);
        if (!alert || alert.isDelete) return res.status(404).json({ status: 404, success: false, message: "Alert not found" });

        return res.status(200).json({ status: 200, success: true, message: "Alert loaded", data: alert });
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message });
    }
};

const update = async (req, res) => {
    try {
        const _id = getId(req);
        const formData = req.body || {};
        if (!_id) return res.status(400).json({ status: 400, success: false, message: "_id is required" });

        const alert = await AlertModel.findById(_id);
        if (!alert) return res.status(404).json({ status: 404, success: false, message: "Alert not found" });

        if (formData.title !== undefined) alert.title = formData.title;
        if (formData.disasterType !== undefined) alert.disasterType = formData.disasterType;
        if (formData.description !== undefined) alert.description = formData.description;
        if (formData.severity !== undefined) alert.severity = formData.severity;
        if (formData.affectedArea !== undefined) alert.affectedArea = formData.affectedArea;
        if (formData.dateTime !== undefined) alert.dateTime = formData.dateTime;
        if (formData.image !== undefined) alert.image = formData.image;
        if (formData.status !== undefined) alert.status = formData.status;

        const updatedAlert = await alert.save();
        return res.status(200).json({ status: 200, success: true, message: "Alert updated successfully", data: updatedAlert });
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message });
    }
};

const deletePermanent = async (req, res) => {
    try {
        const _id = getId(req);
        if (!_id) return res.status(400).json({ status: 400, success: false, message: "_id is required" });

        const deleted = await AlertModel.findByIdAndDelete(_id);
        if (!deleted) return res.status(404).json({ status: 404, success: false, message: "Alert not found" });

        return res.status(200).json({ status: 200, success: true, message: "Alert deleted successfully", data: deleted });
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message });
    }
};

const softDelete = async (req, res) => {
    try {
        const _id = getId(req);
        if (!_id) return res.status(400).json({ status: 400, success: false, message: "_id is required" });

        const alert = await AlertModel.findById(_id);
        if (!alert) return res.status(404).json({ status: 404, success: false, message: "Alert not found" });

        alert.status = alert.status === "Active" ? "Inactive" : "Active";
        const savedAlert = await alert.save();

        return res.status(200).json({ status: 200, success: true, message: `Alert status updated to ${savedAlert.status}`, data: savedAlert });
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message });
    }
};

module.exports = { add, all, getSingle, update, deletePermanent, softDelete };
