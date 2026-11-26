const router = require("express").Router();
const auth = require("../middlewares/auth");

const userController = require("../api/user/UserController");
const categoryController = require("../api/category/categoryController");
const alertController = require("../api/Alert/AlertController");
const disasterCategoryController = require("../api/DisasterCategory/DisasterCategoryController");
const emergencyReportController = require("../api/EmergencyReport/EmergencyReportController");
const notificationController = require("../api/Notification/NotificationController");
const resourceController = require("../api/Resource/ResourceController");
const assessmentController = require("../api/Assessment/AssessmentController");
const disasterController = require("../api/Disaster/DisasterController");
const hospitalController = require("../api/Hospital/HospitalController");
const rescueCenterController = require("../api/RescueCenter/RescueCenterController");
const shelterController = require("../api/Shelter/ShelterController");
const safetyGuideController = require("../api/SafetyGuide/SafetyGuideController");
const resourceRequestController = require("../api/ResourceRequest/ResourceRequestController");
const { upload, uploadController } = require("../utils/uploader");

// --- Auth & User ---
router.post("/register", userController.add);
router.post("/login", userController.login);
router.post("/change-password", auth, userController.changePassword);
router.post("/otp-generate", userController.otpGen);
router.post("/verify-otp", userController.verifyOTP);
router.get("/user/profile", auth, (req, res) => {
    req.body = { _id: req.token?.id || req.token?._id };
    return userController.getSingle(req, res);
});
router.get("/user/dashboard", auth, emergencyReportController.userDashboardStats);
router.get("/user/my-reports", auth, emergencyReportController.myReports);
router.get("/user/my-reports/:_id", auth, emergencyReportController.getSingle);

// --- Emergency Reports & SOS ---
router.post("/emergency-report", auth, emergencyReportController.add);
router.post("/emergency-reportAll", auth, emergencyReportController.all);
router.get("/emergency-report/:_id", auth, emergencyReportController.getSingle);
router.post("/sos", auth, emergencyReportController.submitSOS);

// --- Alerts ---
router.get("/alert", alertController.all);
router.get("/alert/:_id", alertController.getSingle);

// --- Resources ---
router.get("/resource", resourceController.all);
router.get("/resource/:_id", resourceController.getSingle);
router.get("/shelter", shelterController.all);
router.get("/hospital", hospitalController.all);
router.get("/rescue-center", rescueCenterController.all);
router.post("/resource-request", auth, resourceRequestController.create);
router.get("/user/my-resource-requests", auth, resourceRequestController.myRequests);

// --- Safety Guidelines ---
router.get("/safety", safetyGuideController.all);
router.get("/safety/:disasterType", safetyGuideController.getSingle);

// --- Categories ---
router.get("/disaster-category", disasterCategoryController.all);
router.post("/disaster-category", auth, disasterCategoryController.add);
router.get("/categoryall", categoryController.all);
router.post("/categoryall", categoryController.all);

// --- Notifications ---
router.get("/notification/my", auth, notificationController.myNotifications);
router.patch("/notification/read/:_id", auth, notificationController.markAsRead);
router.patch("/notification/read-all", auth, notificationController.markAllAsRead);

// --- Upload ---
router.post("/upload", auth, upload.single("image"), uploadController);

module.exports = router;
