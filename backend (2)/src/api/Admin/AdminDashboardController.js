const UserModel = require("../user/user");
const AlertModel = require("../Alert/Alert");
const EmergencyReportModel = require("../EmergencyReport/EmergencyReport");
const ResourceModel = require("../Resource/Resource");
const ShelterModel = require("../Shelter/Shelter");
const HospitalModel = require("../Hospital/Hospital");
const RescueCenterModel = require("../RescueCenter/RescueCenter");

const getStats = async (req, res) => {
    try {
        const [
            totalUsers,
            totalAlerts,
            activeAlerts,
            reports,
            sosReports,
            totalResources,
            availableResources,
            recentReports,
            recentSOS,
            latestAlerts
        ] = await Promise.all([
            UserModel.countDocuments({ isDelete: false }),
            AlertModel.countDocuments({ isDelete: false }),
            AlertModel.countDocuments({ isDelete: false, status: "Active" }),
            EmergencyReportModel.find({ isDelete: false }),
            EmergencyReportModel.find({ isDelete: false, isSOS: true }),
            ResourceModel.countDocuments({ isDelete: false }),
            ResourceModel.countDocuments({ isDelete: false, status: { $regex: /^available$/i } }),
            EmergencyReportModel.find({ isDelete: false })
                .populate("userId", "name email phone")
                .sort({ createdAt: -1 })
                .limit(6),
            EmergencyReportModel.find({ isDelete: false, isSOS: true })
                .populate("userId", "name email phone")
                .sort({ createdAt: -1 })
                .limit(5),
            AlertModel.find({ isDelete: false })
                .sort({ createdAt: -1 })
                .limit(5)
        ]);

        const totalReports = reports.length;
        const pending = reports.filter(r => r.status === "Pending").length;
        const underReview = reports.filter(r => r.status === "Under Review" || r.status === "Verified").length;
        const responding = reports.filter(r => r.status === "Responding" || r.status === "In-Progress").length;
        const resolved = reports.filter(r => r.status === "Resolved").length;

        const totalSOS = sosReports.length;
        const pendingSOS = sosReports.filter(s => s.status === "Pending").length;

        // Also account for dedicated Shelter, Hospital, RescueCenter count if needed
        const [shelterCount, hospitalCount, rescueCount] = await Promise.all([
            ShelterModel.countDocuments({ isDelete: false }),
            HospitalModel.countDocuments({ isDelete: false }),
            RescueCenterModel.countDocuments({ isDelete: false })
        ]);

        return res.status(200).json({
            status: 200,
            success: true,
            message: "Admin dashboard statistics loaded",
            data: {
                totalUsers,
                totalAlerts,
                activeAlerts,
                totalReports,
                pendingReports: pending,
                underReviewReports: underReview,
                respondingReports: responding,
                resolvedReports: resolved,
                totalSOS,
                pendingSOS,
                totalResources: Math.max(totalResources, shelterCount + hospitalCount + rescueCount),
                availableResources,
                recentReports,
                recentSOS,
                latestAlerts
            }
        });
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message });
    }
};

module.exports = { getStats };
