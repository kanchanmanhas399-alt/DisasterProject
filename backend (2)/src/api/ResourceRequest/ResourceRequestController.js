const ResourceRequestModel = require("./ResourceRequest");
const NotificationModel = require("../Notification/Notification");

const create = async (req, res) => {
    try {
        const userId = req.token?.id || req.token?._id || null;
        const {
            resourceId,
            resourceName,
            resourceType,
            resourceReference,
            resourceAddress,
            resourceContact,
            userName,
            userEmail,
            userPhone,
            notes
        } = req.body || {};

        if (!resourceName || !userName || !userEmail) {
            return res.status(400).json({
                status: 400,
                success: false,
                message: "resourceName, userName, and userEmail are required"
            });
        }

        const requestDoc = await ResourceRequestModel.create({
            userId,
            resourceId: resourceId || null,
            resourceName,
            resourceType: resourceType || 'Shelter',
            resourceReference: resourceReference || '',
            resourceAddress: resourceAddress || '',
            resourceContact: resourceContact || '',
            userName,
            userEmail,
            userPhone: userPhone || '',
            notes: notes || '',
            status: 'Pending'
        });

        // If the request was made by an authenticated user, create a confirmation notification
        if (userId) {
            try {
                await NotificationModel.create({
                    userId,
                    title: `Resource Request Logged: ${resourceName}`,
                    message: `Your connect request for ${resourceName} has been submitted and is currently Pending review.`,
                    type: 'resource'
                });
            } catch (err) {
                console.error("Failed to push user notification:", err.message);
            }
        }

        return res.status(200).json({
            status: 200,
            success: true,
            message: "Request successfully recorded",
            data: requestDoc
        });
    } catch (err) {
        return res.status(500).json({
            status: 500,
            success: false,
            message: "Failed to record resource request",
            error: err.message
        });
    }
};

const myRequests = async (req, res) => {
    try {
        const userId = req.token?.id || req.token?._id;
        const userEmail = req.token?.email;

        const orFilters = [];
        if (userId) orFilters.push({ userId });
        if (userEmail) orFilters.push({ userEmail });

        if (orFilters.length === 0) {
            return res.status(401).json({
                status: 401,
                success: false,
                message: "Authentication required to view your requests"
            });
        }

        const items = await ResourceRequestModel.find({
            $or: orFilters,
            isDelete: false
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            status: 200,
            success: true,
            message: "My resource requests retrieved",
            data: items
        });
    } catch (err) {
        return res.status(500).json({
            status: 500,
            success: false,
            message: "Failed to retrieve your requests",
            error: err.message
        });
    }
};

// Admin endpoints
const adminGetAll = async (req, res) => {
    try {
        const filter = { isDelete: false };
        if (req.query?.status) {
            filter.status = req.query.status;
        }
        if (req.query?.resourceType) {
            filter.resourceType = req.query.resourceType;
        }

        const items = await ResourceRequestModel.find(filter).sort({ createdAt: -1 });

        return res.status(200).json({
            status: 200,
            success: true,
            message: "All resource requests loaded",
            data: items
        });
    } catch (err) {
        return res.status(500).json({
            status: 500,
            success: false,
            message: "Failed to load requests",
            error: err.message
        });
    }
};

const adminUpdateStatus = async (req, res) => {
    try {
        const id = req.params?._id || req.body?._id;
        const { status, adminNotes } = req.body || {};

        if (!status) {
            return res.status(400).json({
                status: 400,
                success: false,
                message: "Status is required"
            });
        }

        const updated = await ResourceRequestModel.findByIdAndUpdate(
            id,
            { status, adminNotes: adminNotes || '' },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({
                status: 404,
                success: false,
                message: "Request record not found"
            });
        }

        // Notify the user of status update
        if (updated.userId) {
            try {
                await NotificationModel.create({
                    userId: updated.userId,
                    title: `Resource Request ${status}`,
                    message: `Your request for "${updated.resourceName}" is now marked as ${status}.${adminNotes ? ' Note: ' + adminNotes : ''}`,
                    type: 'resource'
                });
            } catch (notifyErr) {
                console.error("Failed to notify user:", notifyErr.message);
            }
        }

        return res.status(200).json({
            status: 200,
            success: true,
            message: `Request status updated to ${status}`,
            data: updated
        });
    } catch (err) {
        return res.status(500).json({
            status: 500,
            success: false,
            message: "Failed to update request",
            error: err.message
        });
    }
};

const adminDelete = async (req, res) => {
    try {
        const id = req.params?._id || req.body?._id;
        const deleted = await ResourceRequestModel.findByIdAndUpdate(
            id,
            { isDelete: true },
            { new: true }
        );

        if (!deleted) {
            return res.status(404).json({
                status: 404,
                success: false,
                message: "Request record not found"
            });
        }

        return res.status(200).json({
            status: 200,
            success: true,
            message: "Request deleted successfully"
        });
    } catch (err) {
        return res.status(500).json({
            status: 500,
            success: false,
            message: "Failed to delete request",
            error: err.message
        });
    }
};

module.exports = {
    create,
    myRequests,
    adminGetAll,
    adminUpdateStatus,
    adminDelete
};
