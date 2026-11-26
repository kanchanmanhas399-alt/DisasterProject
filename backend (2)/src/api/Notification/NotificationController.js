const NotificationModel = require("./Notification");

const getId = (req) => req.params?._id || req.body?._id || req.query?._id;

const add = async (req, res) => {
    try {
        const formData = req.body || {};
        let validation = "";

        if (!formData.userId) validation += "userId is required, ";
        if (!formData.title) validation += "title is required, ";
        if (!formData.message) validation += "message is required, ";

        if (validation) {
            return res.status(400).json({ status: 400, success: false, message: validation });
        }

        const item = await NotificationModel.create({
            userId: formData.userId,
            title: formData.title,
            message: formData.message,
            type: formData.type || "system",
            isRead: formData.isRead || false,
            status: formData.status || "active"
        });

        return res.status(200).json({ status: 200, success: true, message: "Notification added", data: item });
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message });
    }
};

const all = async (req, res) => {
    try {
        const filter = req.query || req.body || {};
        const items = await NotificationModel.find({ ...filter, isDelete: false }).sort({ createdAt: -1 });
        return res.status(200).json({ status: 200, success: true, message: "Notifications loaded", data: items });
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message });
    }
};

const myNotifications = async (req, res) => {
    try {
        const userId = req.token?.id || req.token?._id;
        if (!userId) {
            return res.status(401).json({ status: 401, success: false, message: "Authentication required" });
        }

        const items = await NotificationModel.find({ userId, isDelete: false }).sort({ createdAt: -1 }).limit(30);
        const unreadCount = await NotificationModel.countDocuments({ userId, isRead: false, isDelete: false });

        return res.status(200).json({
            status: 200,
            success: true,
            message: "User notifications loaded",
            data: items,
            unreadCount
        });
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message });
    }
};

const markAsRead = async (req, res) => {
    try {
        const _id = getId(req);
        if (!_id) return res.status(400).json({ status: 400, success: false, message: "_id is required" });

        const item = await NotificationModel.findById(_id);
        if (!item) return res.status(404).json({ status: 404, success: false, message: "Notification not found" });

        item.isRead = true;
        await item.save();

        return res.status(200).json({ status: 200, success: true, message: "Notification marked as read", data: item });
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message });
    }
};

const markAllAsRead = async (req, res) => {
    try {
        const userId = req.token?.id || req.token?._id;
        if (!userId) return res.status(401).json({ status: 401, success: false, message: "Authentication required" });

        await NotificationModel.updateMany({ userId, isRead: false }, { isRead: true });

        return res.status(200).json({ status: 200, success: true, message: "All notifications marked as read" });
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message });
    }
};

const getSingle = async (req, res) => {
    try {
        const _id = getId(req);
        if (!_id) return res.status(400).json({ status: 400, success: false, message: "_id is required" });

        const item = await NotificationModel.findById(_id);
        if (!item) return res.status(404).json({ status: 404, success: false, message: "Notification not found" });

        return res.status(200).json({ status: 200, success: true, message: "Notification loaded", data: item });
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message });
    }
};

const update = async (req, res) => {
    try {
        const _id = getId(req);
        const formData = req.body || {};
        if (!_id) return res.status(400).json({ status: 400, success: false, message: "_id is required" });

        const item = await NotificationModel.findById(_id);
        if (!item) return res.status(404).json({ status: 404, success: false, message: "Notification not found" });

        if (formData.title !== undefined) item.title = formData.title;
        if (formData.message !== undefined) item.message = formData.message;
        if (formData.type !== undefined) item.type = formData.type;
        if (formData.isRead !== undefined) item.isRead = formData.isRead;
        if (formData.status !== undefined) item.status = formData.status;

        const updated = await item.save();
        return res.status(200).json({ status: 200, success: true, message: "Notification updated", data: updated });
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message });
    }
};

const deletePermanent = async (req, res) => {
    try {
        const _id = getId(req);
        if (!_id) return res.status(400).json({ status: 400, success: false, message: "_id is required" });

        const deleted = await NotificationModel.findByIdAndDelete(_id);
        if (!deleted) return res.status(404).json({ status: 404, success: false, message: "Notification not found" });

        return res.status(200).json({ status: 200, success: true, message: "Notification deleted permanently", data: deleted });
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message });
    }
};

const softDelete = async (req, res) => {
    try {
        const _id = getId(req);
        if (!_id) return res.status(400).json({ status: 400, success: false, message: "_id is required" });

        const item = await NotificationModel.findById(_id);
        if (!item) return res.status(404).json({ status: 404, success: false, message: "Notification not found" });

        item.isRead = true;
        item.status = "inactive";
        const saved = await item.save();

        return res.status(200).json({ status: 200, success: true, message: "Notification disabled", data: saved });
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message });
    }
};

module.exports = {
    add,
    all,
    myNotifications,
    markAsRead,
    markAllAsRead,
    getSingle,
    update,
    deletePermanent,
    softDelete
};
