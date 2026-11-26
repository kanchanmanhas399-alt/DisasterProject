const adminRoute = require("express").Router();
const auth = require("../middlewares/auth");
const adminAuth = require("../middlewares/adminAuth");

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
const adminDashboardController = require("../api/Admin/AdminDashboardController");
const { upload, uploadController } = require("../utils/uploader");
const emailRecipientController = require("../api/DisasterEmailRecipient/DisasterEmailRecipientController");

// Enforce both authentication and administrator authorization
adminRoute.use(auth);
adminRoute.use(adminAuth);

// --- Disaster email recipients (admin-only; auth + adminAuth applied above) ---
adminRoute.get("/disaster-email-recipients", emailRecipientController.all);
adminRoute.post("/disaster-email-recipients", emailRecipientController.add);
adminRoute.put("/disaster-email-recipients/:_id", emailRecipientController.update);
adminRoute.delete("/disaster-email-recipients/:_id", emailRecipientController.remove);

// --- Admin Dashboard Stats ---
adminRoute.get("/dashboard-stats", adminDashboardController.getStats);

// --- User Management ---
adminRoute.get("/user/all", userController.all);
adminRoute.put("/user/update/:_id", userController.update);
adminRoute.post("/user/update", userController.update);
adminRoute.post("/user/delete", userController.deletePermanent);
adminRoute.delete("/user/delete/:_id", userController.deletePermanent);
adminRoute.delete("/user/update/:_id", userController.deletePermanent);
adminRoute.post("/user/single", userController.getSingle);
adminRoute.get("/user/:_id", userController.getSingle);

// --- Emergency Reports Management ---
adminRoute.post("/emergency-reportAll", emergencyReportController.all);
adminRoute.get("/emergency-reportAll", emergencyReportController.all);
adminRoute.get("/emergency-report", emergencyReportController.all);
adminRoute.post("/emergency-report", emergencyReportController.add);
adminRoute.get("/emergency-report/:_id", emergencyReportController.getSingle);
adminRoute.put("/emergency-report/:_id", emergencyReportController.update);
adminRoute.patch("/emergency-report/:_id/status", emergencyReportController.update);
adminRoute.delete("/emergency-report/:_id", emergencyReportController.deletePermanent);
adminRoute.patch("/emergency-report/soft-delete/:_id", emergencyReportController.softDelete);

// --- Alerts Management ---
adminRoute.post("/alert", alertController.add);
adminRoute.get("/alert", alertController.all);
adminRoute.get("/alert/:_id", alertController.getSingle);
adminRoute.put("/alert/:_id", alertController.update);
adminRoute.delete("/alert/:_id", alertController.deletePermanent);
adminRoute.patch("/alert/soft-delete/:_id", alertController.softDelete);

// --- Resource Management ---
adminRoute.post("/resource", resourceController.add);
adminRoute.get("/resource", resourceController.all);
adminRoute.get("/resource/:_id", resourceController.getSingle);
adminRoute.put("/resource/:_id", resourceController.update);
adminRoute.delete("/resource/:_id", resourceController.deletePermanent);
adminRoute.patch("/resource/soft-delete/:_id", resourceController.softDelete);

// --- Resource Requests Management ---
adminRoute.get("/resource-request", resourceRequestController.adminGetAll);
adminRoute.put("/resource-request/:_id", resourceRequestController.adminUpdateStatus);
adminRoute.delete("/resource-request/:_id", resourceRequestController.adminDelete);

// --- Safety Guide Management ---
adminRoute.post("/safety", safetyGuideController.add);
adminRoute.get("/safety", safetyGuideController.all);
adminRoute.get("/safety/:_id", safetyGuideController.getSingle);
adminRoute.put("/safety/:_id", safetyGuideController.update);
adminRoute.delete("/safety/:_id", safetyGuideController.deletePermanent);

// --- Disaster Category & Categories ---
adminRoute.post("/disaster-category", disasterCategoryController.add);
adminRoute.get("/disaster-category", disasterCategoryController.all);
adminRoute.get("/disaster-category/:_id", disasterCategoryController.getSingle);
adminRoute.put("/disaster-category/:_id", disasterCategoryController.update);
adminRoute.delete("/disaster-category/:_id", disasterCategoryController.deletePermanent);
adminRoute.patch("/disaster-category/soft-delete/:_id", disasterCategoryController.softDelete);

adminRoute.post("/category", categoryController.add);
adminRoute.get("/category", categoryController.all);
adminRoute.get("/category/:_id", categoryController.getSingle);
adminRoute.put("/category/:_id", categoryController.update);
adminRoute.delete("/category/:_id", categoryController.deletePermanent);
adminRoute.patch("/category/soft-delete/:_id", categoryController.softDelete);

// --- Legacy Shelters, Hospitals, Rescue Centers, Disasters ---
adminRoute.post("/shelter", shelterController.add);
adminRoute.get("/shelter", shelterController.all);
adminRoute.get("/shelter/:_id", shelterController.getSingle);
adminRoute.put("/shelter/:_id", shelterController.update);
adminRoute.delete("/shelter/:_id", shelterController.deletePermanent);
adminRoute.patch("/shelter/soft-delete/:_id", shelterController.softDelete);

adminRoute.post("/hospital", hospitalController.add);
adminRoute.get("/hospital", hospitalController.all);
adminRoute.get("/hospital/:_id", hospitalController.getSingle);
adminRoute.put("/hospital/:_id", hospitalController.update);
adminRoute.delete("/hospital/:_id", hospitalController.deletePermanent);
adminRoute.patch("/hospital/soft-delete/:_id", hospitalController.softDelete);

adminRoute.post("/rescue-center", rescueCenterController.add);
adminRoute.get("/rescue-center", rescueCenterController.all);
adminRoute.get("/rescue-center/:_id", rescueCenterController.getSingle);
adminRoute.put("/rescue-center/:_id", rescueCenterController.update);
adminRoute.delete("/rescue-center/:_id", rescueCenterController.deletePermanent);
adminRoute.patch("/rescue-center/soft-delete/:_id", rescueCenterController.softDelete);

adminRoute.post("/disaster", disasterController.add);
adminRoute.get("/disaster", disasterController.all);
adminRoute.get("/disaster/:_id", disasterController.getSingle);
adminRoute.put("/disaster/:_id", disasterController.update);
adminRoute.delete("/disaster/:_id", disasterController.deletePermanent);
adminRoute.patch("/disaster/soft-delete/:_id", disasterController.softDelete);

// --- Notifications Admin ---
adminRoute.post("/notification", notificationController.add);
adminRoute.get("/notification", notificationController.all);
adminRoute.get("/notification/:_id", notificationController.getSingle);
adminRoute.put("/notification/:_id", notificationController.update);
adminRoute.delete("/notification/:_id", notificationController.deletePermanent);
adminRoute.patch("/notification/soft-delete/:_id", notificationController.softDelete);

// --- Assessment Admin ---
adminRoute.post("/assessment", assessmentController.add);
adminRoute.get("/assessment", assessmentController.all);
adminRoute.get("/assessment/:_id", assessmentController.getSingle);
adminRoute.put("/assessment/:_id", assessmentController.update);
adminRoute.delete("/assessment/:_id", assessmentController.deletePermanent);
adminRoute.patch("/assessment/soft-delete/:_id", assessmentController.softDelete);

// --- Upload Admin ---
adminRoute.post("/upload", upload.single("image"), uploadController);

module.exports = adminRoute;
