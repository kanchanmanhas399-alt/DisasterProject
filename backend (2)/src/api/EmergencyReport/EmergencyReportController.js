const EmergencyReportModel = require("./EmergencyReport");
const AssessmentModel = require("../Assessment/Assessment");
const UserModel = require("../user/user");
const NotificationModel = require("../Notification/Notification");
const { evaluateEmergencyRules, matchResourcesForIncident } = require("../../services/assessmentEngine");
const emailSender = require("../../utils/emailSender");
const DisasterEmailRecipient = require("../DisasterEmailRecipient/DisasterEmailRecipient");

const getId = (req) => req.params?._id || req.body?._id || req.query?._id;

// Format location safely to address string
const formatLocation = (loc) => {
    if (!loc) return "Unspecified";
    if (typeof loc === "string") return loc;
    if (typeof loc === "object") return loc.address || loc.city || loc.landmark || JSON.stringify(loc);
    return String(loc);
};

// 1. Submit Emergency Report (User)
const add = async (req, res) => {
    try {
        const formData = req.body || {};
        let validation = "";

        // Enforce authenticated user ID
        const userId = req.token?.id || req.token?._id;
        if (!userId) {
            return res.status(401).json({ status: 401, success: false, message: "Authentication required to submit report" });
        }

        const disasterType = formData.disasterType || formData.disasterCategory || "Other";
        const title = formData.title;
        const location = formData.location;
        const severity = formData.severity || "Medium";
        const description = formData.description;
        const affectedPeople = Math.max(0, parseInt(formData.affectedPeople, 10) || 0);

        if (!title) validation += "title is required, ";
        if (!location) validation += "location is required, ";
        if (!description) validation += "description is required, ";

        if (validation) {
            return res.status(400).json({ status: 400, success: false, message: validation });
        }

        const isSOS = Boolean(formData.isSOS);

        // Run Rule-Based Assessment
        const assessmentResult = await evaluateEmergencyRules({
            disasterType,
            location: formatLocation(location),
            severity: isSOS ? "Critical" : severity,
            description,
            affectedPeople,
            isSOS
        });

        // Match Emergency Resources
        const matchedResources = await matchResourcesForIncident({
            disasterType,
            severity: assessmentResult.priority,
            responseCategory: assessmentResult.responseCategory,
            location: formatLocation(location)
        });

        assessmentResult.matchedResources = matchedResources;

        const report = await EmergencyReportModel.create({
            userId,
            disasterId: formData.disasterId || null,
            disasterType,
            title,
            location: typeof location === "string" ? { address: location } : location,
            severity: isSOS ? "Critical" : severity,
            description,
            affectedPeople,
            dateTime: formData.dateTime || Date.now(),
            image: formData.image || "",
            isSOS,
            contactNumber: formData.contactNumber || "",
            status: "Pending",
            responseInstructions: "",
            adminNotes: "",
            statusHistory: [{
                status: "Pending",
                note: isSOS ? "Urgent SOS submitted by citizen" : "Incident report submitted by citizen",
                changedBy: userId,
                changedByName: "Citizen",
                changedAt: new Date()
            }],
            assessment: assessmentResult
        });

        // Also record in Assessment model for legacy compatibility
        try {
            await AssessmentModel.create({
                userId,
                reportId: report._id,
                title: `Assessment for ${report.title}`,
                score: assessmentResult.priority === "Critical" ? 95 : assessmentResult.priority === "High" ? 80 : assessmentResult.priority === "Medium" ? 50 : 25,
                remarks: assessmentResult.responseCategory,
                status: "approved"
            });
        } catch (e) {
            console.error("Assessment model sync note:", e.message);
        }

        // Generate confirmation notification for user
        try {
            await NotificationModel.create({
                userId,
                title: isSOS ? "SOS Request Logged" : "Emergency Report Submitted",
                message: `Your report "${report.title}" is currently Pending review. Immediate guidance: ${assessmentResult.immediateActions[0] || "Stay safe."}`,
                type: isSOS ? "sos" : "report",
                isRead: false
            });
        } catch (notifErr) {
            console.error("User notification creation note:", notifErr.message);
        }

        // Notify only admin-configured recipients. Delivery is deliberately detached
        // from the report response so SMTP outages never block citizen submissions.
        setImmediate(async () => {
            try {
                const recipients = await DisasterEmailRecipient.distinct("email", {});
                const uniqueRecipients = [...new Set(recipients.map((email) => String(email).trim().toLowerCase()).filter(Boolean))];
                if (!uniqueRecipients.length) return;

                let reporter = null;
                try { reporter = await UserModel.findById(userId).select("name email phone").lean(); } catch (_) {}
                const reportUrl = process.env.ADMIN_REPORT_BASE_URL
                    ? `${process.env.ADMIN_REPORT_BASE_URL.replace(/\/$/, "")}/admin/report-details/${report._id}`
                    : "";
                const reportedAt = new Date(report.dateTime || report.createdAt).toLocaleString();
                const locationText = formatLocation(report.location);
                const reporterPhone = reporter?.phone || report.contactNumber || "Not available";

                const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
                const severityColors = {
                    Critical: { bg: "#fdecea", text: "#b42318", border: "#f5c2c0" },
                    High: { bg: "#fff4e5", text: "#b54708", border: "#fed7aa" },
                    Medium: { bg: "#fef9c3", text: "#854d0e", border: "#fde047" },
                    Low: { bg: "#ecfdf3", text: "#027a48", border: "#abefc6" }
                };
                const sevStyle = severityColors[report.severity] || severityColors.Medium;

                const detailRows = [
                    { label: "Disaster Title", value: report.title },
                    { label: "Disaster Type", value: report.disasterType },
                    { label: "Severity Level", value: report.severity, isSeverity: true },
                    { label: "Status", value: report.status || "Pending" },
                    { label: "Location", value: locationText },
                    { label: "Reported Date & Time", value: reportedAt },
                    { label: "Affected People", value: String(report.affectedPeople ?? 0) },
                    { label: "Urgent SOS", value: report.isSOS ? "Yes (Immediate SOS)" : "No" },
                    { label: "Reporter", value: reporter?.name || "Not available" },
                    { label: "Reporter Email", value: reporter?.email || "Not available" },
                    { label: "Reporter Phone", value: reporterPhone },
                    { label: "Report ID", value: String(report._id) }
                ];

                const textLines = [
                    "DISASTER ALERT - NEW INCIDENT REPORTED",
                    "An emergency disaster report has been submitted on DisasterGuard. Please review the details below and coordinate response actions immediately.",
                    "",
                    ...detailRows.map((row) => `${row.label}: ${row.value}`),
                    `Description: ${report.description}`,
                    reportUrl ? `Admin Report Link: ${reportUrl}` : ""
                ].filter((line) => line !== "");

                const tableRowsHtml = detailRows.map((row) => {
                    const cellValue = row.isSeverity
                        ? `<span style="display:inline-block;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:700;background:${sevStyle.bg};color:${sevStyle.text};border:1px solid ${sevStyle.border};">${escapeHtml(row.value)}</span>`
                        : escapeHtml(row.value);
                    return `<tr>
                        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#4b5563;font-size:13px;font-weight:600;width:38%;vertical-align:top;">${escapeHtml(row.label)}</td>
                        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#111827;font-size:14px;vertical-align:top;">${cellValue}</td>
                    </tr>`;
                }).join("");

                const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f3f4f6;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background-color:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e5e7eb;">
          <tr>
            <td style="background-color:#991b1b;padding:20px 24px;color:#ffffff;">
              <div style="font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#fecaca;margin-bottom:4px;">DisasterGuard Emergency Notification</div>
              <h1 style="margin:0;font-size:22px;line-height:1.3;font-weight:700;">Disaster Alert: ${escapeHtml(report.disasterType)}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 24px;">
              <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#374151;">
                A new disaster report has been submitted by a citizen and requires immediate attention. Please review the incident details below and coordinate the appropriate emergency response.
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e5e7eb;border-radius:8px;border-collapse:collapse;margin-bottom:18px;">
                ${tableRowsHtml}
              </table>
              <div style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px 16px;margin-bottom:18px;">
                <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:#4b5563;margin-bottom:6px;">Description</div>
                <p style="margin:0;font-size:14px;line-height:1.6;color:#111827;white-space:pre-wrap;">${escapeHtml(report.description)}</p>
              </div>
              ${reportUrl ? `<div style="text-align:center;margin:20px 0 8px;">
                <a href="${escapeHtml(reportUrl)}" style="display:inline-block;background-color:#17324d;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:11px 22px;border-radius:6px;">View Report in Admin Portal</a>
              </div>` : ""}
            </td>
          </tr>
          <tr>
            <td style="background-color:#f9fafb;padding:14px 24px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;text-align:center;">
              This is an automated emergency alert from DisasterGuard. Please do not reply directly to this email.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

                const results = await Promise.allSettled(uniqueRecipients.map((email) => emailSender(email, {
                    subject: `New Disaster Alert - ${report.disasterType}`,
                    text: textLines.join("\n"),
                    html
                })));
                const sentCount = results.filter((r) => r.status === "fulfilled").length;
                const failedCount = results.length - sentCount;
                console.log(`Disaster alert email dispatch complete for report ${report._id}: ${sentCount} sent, ${failedCount} failed`);
            } catch (emailErr) {
                console.error("Disaster recipient notification setup failed:", emailErr.message);
            }
        });

        return res.status(200).json({
            status: 200,
            success: true,
            message: isSOS ? "Urgent SOS assistance request submitted successfully" : "Emergency report submitted successfully",
            data: report
        });
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message });
    }
};

// 2. SOS Fast Submit
const submitSOS = async (req, res) => {
    try {
        const userId = req.token?.id || req.token?._id;
        if (!userId) {
            return res.status(401).json({ status: 401, success: false, message: "Authentication required to submit SOS" });
        }

        const formData = req.body || {};
        const emergencyType = formData.emergencyType || "Critical Emergency";
        const location = formData.location || "User current location";
        const description = formData.description || "Immediate SOS assistance requested.";
        const affectedPeople = Math.max(1, parseInt(formData.affectedPeople, 10) || 1);
        const contactNumber = formData.contactNumber || "";

        req.body = {
            userId,
            title: `SOS: ${emergencyType}`,
            disasterType: emergencyType,
            location,
            severity: "Critical",
            description,
            affectedPeople,
            contactNumber,
            isSOS: true
        };

        return await add(req, res);
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message });
    }
};

// 3. Admin View All Reports (with Search & Filters)
const all = async (req, res) => {
    try {
        const query = req.query || req.body || {};
        const filter = { isDelete: false };

        if (query.status && query.status !== "All") {
            filter.status = query.status;
        }
        if (query.severity && query.severity !== "All") {
            filter.severity = query.severity;
        }
        if (query.disasterType && query.disasterType !== "All") {
            filter.disasterType = query.disasterType;
        }
        if (query.isSOS !== undefined) {
            filter.isSOS = query.isSOS === "true" || query.isSOS === true;
        }

        let searchQuery = {};
        if (query.search) {
            const regex = new RegExp(query.search, "i");
            searchQuery = {
                $or: [
                    { title: regex },
                    { disasterType: regex },
                    { "location.address": regex },
                    { description: regex }
                ]
            };
        }

        const finalFilter = { ...filter, ...searchQuery };

        const reports = await EmergencyReportModel.find(finalFilter)
            .populate("userId", "name email phone userType")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            status: 200,
            success: true,
            message: "Emergency reports loaded",
            data: reports
        });
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message });
    }
};

// 4. View Single Report Details
const getSingle = async (req, res) => {
    try {
        const _id = getId(req);
        if (!_id) return res.status(400).json({ status: 400, success: false, message: "_id is required" });

        const report = await EmergencyReportModel.findById(_id)
            .populate("userId", "name email phone userType");

        if (!report || report.isDelete) {
            return res.status(404).json({ status: 404, success: false, message: "Emergency report not found" });
        }

        // Ownership check: If normal user, verify they own this report
        const isAdmin = req.token?.role === "admin" || req.token?.userType === "admin";
        const currentUserId = String(req.token?.id || req.token?._id || "");
        let ownerId = "";
        if (report.userId) {
            ownerId = String(report.userId._id || report.userId);
        }

        if (!isAdmin && (!ownerId || currentUserId !== ownerId)) {
            return res.status(403).json({ status: 403, success: false, message: "Access denied. You cannot view another user's private report." });
        }

        return res.status(200).json({ status: 200, success: true, message: "Emergency report loaded", data: report });
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message });
    }
};

// 5. Admin Update Report (Status, Response Instructions, Admin Notes)
const update = async (req, res) => {
    try {
        const _id = getId(req);
        const formData = req.body || {};
        if (!_id) return res.status(400).json({ status: 400, success: false, message: "_id is required" });

        // Ensure only admin can modify status, instructions, notes
        const isAdmin = req.token?.role === "admin" || req.token?.userType === "admin";
        if (!isAdmin) {
            return res.status(403).json({ status: 403, success: false, message: "Access denied. Only administrators can update report status and response." });
        }

        const report = await EmergencyReportModel.findById(_id);
        if (!report || report.isDelete) {
            return res.status(404).json({ status: 404, success: false, message: "Emergency report not found" });
        }

        const oldStatus = report.status;
        const allowedStatuses = ["Pending", "Under Review", "Responding", "Resolved"];
        if (formData.status !== undefined && !allowedStatuses.includes(formData.status)) {
            return res.status(400).json({ status: 400, success: false, message: `Invalid status. Allowed values: ${allowedStatuses.join(", ")}` });
        }
        const newStatus = formData.status !== undefined ? formData.status : oldStatus;
        const statusChanged = newStatus !== oldStatus;
        const note = formData.note || `Status changed from ${oldStatus} to ${newStatus}`;

        if (formData.status !== undefined) report.status = formData.status;
        if (formData.responseInstructions !== undefined) report.responseInstructions = formData.responseInstructions;
        if (formData.adminNotes !== undefined) report.adminNotes = formData.adminNotes;
        if (formData.severity !== undefined) report.severity = formData.severity;

        // Support Administrative Assessment Priority Override (Requirement 2.2 & 6)
        if (formData.overridePriority) {
            if (!report.assessment) report.assessment = {};
            if (!report.assessment.originalPriority) {
                report.assessment.originalPriority = report.assessment.priority || report.severity;
            }
            report.assessment.isOverridden = true;
            report.assessment.overriddenPriority = formData.overridePriority;
            report.assessment.priority = formData.overridePriority;
            report.assessment.overrideReason = formData.overrideReason || "Administrative assessment override";
            report.assessment.overriddenBy = req.token?.name || "Administrator";
            report.assessment.overriddenAt = new Date();
            report.markModified('assessment');
        }

        // Record an audit entry only when the status actually changes.
        if (statusChanged) {
            report.statusHistory.push({
                status: newStatus,
                note,
                changedBy: req.token?.id || req.token?._id,
                changedByName: req.token?.name || "Administrator",
                changedAt: new Date()
            });
        }

        const updated = await report.save();

        // Notify the citizen only for a real status transition.
        if (statusChanged) try {
            await NotificationModel.create({
                userId: report.userId,
                title: `Report Status: ${report.status}`,
                message: `Your report "${report.title}" status is now "${report.status}". ${report.responseInstructions ? `Response Instructions: ${report.responseInstructions}` : ""}`,
                type: report.isSOS ? "sos" : "report",
                isRead: false
            });
        } catch (notifErr) {
            console.error("Failed to notify user:", notifErr.message);
        }

        // Email notification if configured; never delay a status-only API response on SMTP.
        if (statusChanged && ["Under Review", "Responding", "Resolved"].includes(newStatus)) {
            try {
                const targetUser = await UserModel.findById(report.userId);
                if (targetUser && targetUser.email) {
                    Promise.resolve(emailSender(targetUser.email, {
                        subject: `DisasterGuard: Report "${report.title}" is now ${newStatus}`,
                        html: `
                            <h2>Emergency Report Status Update</h2>
                            <p>Dear ${targetUser.name},</p>
                            <p>Your emergency report <strong>${report.title}</strong> has been updated to <strong>${newStatus}</strong>.</p>
                            ${report.responseInstructions ? `<p><strong>Response Instructions:</strong> ${report.responseInstructions}</p>` : ""}
                            <p>Thank you for using DisasterGuard.</p>
                        `
                    })).catch((emailErr) => console.error("Email notification note:", emailErr.message));
                }
            } catch (emailErr) {
                console.error("Email notification note:", emailErr.message);
            }
        }

        return res.status(200).json({ status: 200, success: true, message: "Emergency report updated successfully", data: updated });
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message });
    }
};

// 6. User Get Own Emergency Reports (Requirement 8)
const myReports = async (req, res) => {
    try {
        const userId = req.token?.id || req.token?._id;
        if (!userId) {
            return res.status(401).json({ status: 401, success: false, message: "Authentication required" });
        }

        const query = req.query || {};
        const filter = { userId, isDelete: false };

        if (query.status && query.status !== "All") {
            filter.status = query.status;
        }
        if (query.disasterType && query.disasterType !== "All") {
            filter.disasterType = query.disasterType;
        }

        const reports = await EmergencyReportModel.find(filter).sort({ createdAt: -1 });

        return res.status(200).json({
            status: 200,
            success: true,
            message: "User emergency history loaded",
            data: reports
        });
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message });
    }
};

// 7. User Dashboard Stats (Requirement 7)
const userDashboardStats = async (req, res) => {
    try {
        const userId = req.token?.id || req.token?._id;
        if (!userId) {
            return res.status(401).json({ status: 401, success: false, message: "Authentication required" });
        }

        const userReports = await EmergencyReportModel.find({ userId, isDelete: false });

        const totalReports = userReports.length;
        const pending = userReports.filter(r => r.status === "Pending").length;
        const underReview = userReports.filter(r => r.status === "Under Review" || r.status === "Verified").length;
        const responding = userReports.filter(r => r.status === "Responding" || r.status === "In-Progress").length;
        const resolved = userReports.filter(r => r.status === "Resolved").length;

        // Recent reports (latest 5)
        const recentReports = await EmergencyReportModel.find({ userId, isDelete: false })
            .sort({ createdAt: -1 })
            .limit(5);

        // Active alerts
        const AlertModel = require("../Alert/Alert");
        const activeAlerts = await AlertModel.find({ status: "Active", isDelete: false })
            .sort({ createdAt: -1 })
            .limit(5);
        const totalActiveAlerts = await AlertModel.countDocuments({ status: "Active", isDelete: false });

        return res.status(200).json({
            status: 200,
            success: true,
            message: "User dashboard data loaded",
            data: {
                totalReports,
                pending,
                underReview,
                responding,
                resolved,
                totalActiveAlerts,
                recentReports,
                activeAlerts
            }
        });
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message });
    }
};

// 8. Permanent Delete (Admin Only)
const deletePermanent = async (req, res) => {
    try {
        const _id = getId(req);
        if (!_id) return res.status(400).json({ status: 400, success: false, message: "_id is required" });

        const isAdmin = req.token?.role === "admin" || req.token?.userType === "admin";
        if (!isAdmin) {
            return res.status(403).json({ status: 403, success: false, message: "Access denied. Administrator privileges required." });
        }

        const deleted = await EmergencyReportModel.findByIdAndDelete(_id);
        if (!deleted) return res.status(404).json({ status: 404, success: false, message: "Emergency report not found" });

        return res.status(200).json({ status: 200, success: true, message: "Emergency report deleted permanently", data: deleted });
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message });
    }
};

// 9. Soft Delete
const softDelete = async (req, res) => {
    try {
        const _id = getId(req);
        if (!_id) return res.status(400).json({ status: 400, success: false, message: "_id is required" });

        const report = await EmergencyReportModel.findById(_id);
        if (!report) return res.status(404).json({ status: 404, success: false, message: "Emergency report not found" });

        report.isDelete = true;
        report.status = "Cancelled";
        const saved = await report.save();

        return res.status(200).json({ status: 200, success: true, message: "Emergency report cancelled", data: saved });
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message });
    }
};

module.exports = {
    add,
    submitSOS,
    all,
    getSingle,
    update,
    myReports,
    userDashboardStats,
    deletePermanent,
    softDelete
};
