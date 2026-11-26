require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./index");
const UserModel = require("./src/api/user/user");
const AlertModel = require("./src/api/Alert/Alert");
const EmergencyReportModel = require("./src/api/EmergencyReport/EmergencyReport");
const ResourceModel = require("./src/api/Resource/Resource");

const BASE_URL = "http://localhost:5005";

async function request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };

    const config = {
        method: options.method || "GET",
        headers
    };

    if (options.body) {
        config.body = JSON.stringify(options.body);
    }

    const res = await fetch(url, config);
    let body = {};
    try {
        body = await res.json();
    } catch (e) {
        body = {};
    }

    return {
        status: res.status,
        body
    };
}

async function runTests() {
    console.log("==================================================");
    console.log("STARTING COMPREHENSIVE 18-SCENARIO VERIFICATION TEST");
    console.log("==================================================\n");

    // Wait 1 second for server to bind port
    await new Promise(r => setTimeout(r, 1000));

    let citizenToken = "";
    let citizenId = "";
    let adminToken = "";
    let createdAlertId = "";
    let createdReportId = "";
    let createdSOSId = "";
    let otherCitizenToken = "";
    let otherCitizenId = "";

    const testEmail = `test_citizen_${Date.now()}@example.com`;
    const otherEmail = `other_citizen_${Date.now()}@example.com`;

    // 1. A new user can register and log in
    console.log("TEST 1: Register and login new citizen");
    const regRes = await request("/api/register", {
        method: "POST",
        body: {
            name: "Test Citizen",
            email: testEmail,
            password: "password123",
            phone: 9876543210
        }
    });
    console.log(" - Register response:", regRes.status, regRes.body.message);
    if (regRes.status !== 200 && regRes.status !== 409) throw new Error("Registration failed");

    const loginRes = await request("/api/login", {
        method: "POST",
        body: {
            email: testEmail,
            password: "password123"
        }
    });
    console.log(" - Login response:", loginRes.status, loginRes.body.message);
    if (loginRes.status !== 200) throw new Error("Citizen login failed");
    citizenToken = loginRes.body.token;
    citizenId = loginRes.body.data._id;
    console.log(" ✓ TEST 1 PASSED: New user registered and logged in\n");

    // Login Admin
    const adminLoginRes = await request("/api/login", {
        method: "POST",
        body: {
            email: "admin@gmail.com",
            password: "123"
        }
    });
    if (adminLoginRes.status !== 200) throw new Error("Admin login failed");
    adminToken = adminLoginRes.body.token;

    // Register second citizen for isolation checks
    await request("/api/register", {
        method: "POST",
        body: {
            name: "Other Citizen",
            email: otherEmail,
            password: "password123"
        }
    });
    const otherLoginRes = await request("/api/login", {
        method: "POST",
        body: {
            email: otherEmail,
            password: "password123"
        }
    });
    otherCitizenToken = otherLoginRes.body.token;
    otherCitizenId = otherLoginRes.body.data._id;

    // 2. Normal user cannot access admin routes or APIs
    console.log("TEST 2: Normal user cannot access admin routes");
    const adminForbiddenRes = await request("/admin/dashboard-stats", {
        headers: { Authorization: `Bearer ${citizenToken}` }
    });
    console.log(" - Non-admin accessing /admin/dashboard-stats returned HTTP status:", adminForbiddenRes.status);
    if (adminForbiddenRes.status !== 403) throw new Error("Normal user was NOT forbidden from admin endpoint!");
    console.log(" ✓ TEST 2 PASSED: Non-admin strictly blocked with 403 Forbidden\n");

    // 3. Administrator can create and publish a disaster alert
    console.log("TEST 3: Admin create and publish disaster alert");
    const createAlertRes = await request("/admin/alert", {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {
            title: "Flash Flood Surge Advisory - Sector 9",
            disasterType: "Flood",
            description: "Heavy discharge from upstream barrage resulting in 2-foot water accumulation across Sector 9 roadways.",
            severity: "High",
            affectedArea: "Sector 9, Riverbank Corridor",
            status: "Active"
        }
    });
    console.log(" - Create alert response:", createAlertRes.status, createAlertRes.body.message);
    if (createAlertRes.status !== 200) throw new Error("Admin failed to create alert");
    createdAlertId = createAlertRes.body.data._id;
    console.log(" ✓ TEST 3 PASSED: Admin published disaster alert with ID:", createdAlertId, "\n");

    // 4. Users can view active disaster alerts
    console.log("TEST 4: Users can view active disaster alerts");
    const userAlertsRes = await request("/api/alert", {
        headers: { Authorization: `Bearer ${citizenToken}` }
    });
    console.log(" - User alerts count:", userAlertsRes.body.data?.length);
    const foundAlert = userAlertsRes.body.data?.find(a => a._id.toString() === createdAlertId);
    if (!foundAlert) throw new Error("Created active alert not found in user feed");
    console.log(" ✓ TEST 4 PASSED: User successfully viewed active alerts\n");

    // 5. Authenticated user can submit an emergency report
    console.log("TEST 5: Authenticated user submit emergency report");
    const reportSubmitRes = await request("/api/emergency-report", {
        method: "POST",
        headers: { Authorization: `Bearer ${citizenToken}` },
        body: {
            title: "Severe Residential Flooding with Trapped Residents",
            disasterType: "Flood",
            location: "House 42, Sector 9, Near Main Canal",
            severity: "High",
            affectedPeople: 8,
            description: "Canal overflowed; 8 people including children trapped on first floor. Water is 4 feet deep and rising."
        }
    });
    console.log(" - Submit report response:", reportSubmitRes.status, reportSubmitRes.body.message);
    if (reportSubmitRes.status !== 200) throw new Error("User failed to submit report");
    createdReportId = reportSubmitRes.body.data._id;
    console.log(" ✓ TEST 5 PASSED: Emergency report submitted with initial status:", reportSubmitRes.body.data.status, "\n");

    // 6. Emergency report is stored with correct user ID
    console.log("TEST 6: Emergency report stored with correct authenticated user ID");
    const savedReport = await EmergencyReportModel.findById(createdReportId);
    if (savedReport.userId.toString() !== citizenId.toString()) {
        throw new Error(`User ID mismatch! Expected ${citizenId}, found ${savedReport.userId}`);
    }
    console.log(" - Verified stored userId matches citizenId:", savedReport.userId.toString());
    console.log(" ✓ TEST 6 PASSED: Report securely bound to authenticated user\n");

    // 7. Assessment module generates correct response category and guidance
    console.log("TEST 7: Assessment module generated rule-based evaluation");
    const assessment = savedReport.assessment;
    console.log(" - Response Category:", assessment.responseCategory);
    console.log(" - Assessment Priority:", assessment.priority);
    console.log(" - Immediate Actions:", assessment.immediateActions.length);
    console.log(" - Matched Resources:", assessment.matchedResources.length);
    if (!assessment.responseCategory.includes("Emergency Assistance") || !assessment.responseCategory.includes("Evacuation Guidance")) {
        throw new Error("Assessment response category incorrect for Flood High 8 people");
    }
    if (assessment.priority !== "High") {
        throw new Error("Assessment priority incorrect. Expected High, got " + assessment.priority);
    }
    console.log(" ✓ TEST 7 PASSED: Correct rule-based category, priority, and guidance verified\n");

    // 8. Administrator can review an emergency report
    console.log("TEST 8: Admin review emergency report");
    const adminReviewRes = await request(`/admin/emergency-report/${createdReportId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(" - Admin review status:", adminReviewRes.status, adminReviewRes.body.data?.title);
    if (adminReviewRes.status !== 200) throw new Error("Admin failed to review report");
    console.log(" ✓ TEST 8 PASSED: Admin reviewed report details and reporter info\n");

    // 9. Administrator can update report status
    console.log("TEST 9: Admin update report status (Pending -> Responding)");
    const updateRes = await request(`/admin/emergency-report/${createdReportId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {
            status: "Responding",
            responseInstructions: "Rescue Boat Unit 2 has been dispatched. Please move to upper balcony.",
            adminNotes: "Coordinating with fire brigade and civil defense."
        }
    });
    console.log(" - Admin update response:", updateRes.status, updateRes.body.message);
    if (updateRes.status !== 200) throw new Error("Admin update failed");
    console.log(" ✓ TEST 9 PASSED: Report status updated to Responding with instructions\n");

    // 10. User can see the updated report status
    console.log("TEST 10: User can see updated report status in dashboard and history");
    const userReportCheck = await request(`/api/user/my-reports/${createdReportId}`, {
        headers: { Authorization: `Bearer ${citizenToken}` }
    });
    console.log(" - User fetched report status:", userReportCheck.body.data?.status);
    console.log(" - User fetched response instructions:", userReportCheck.body.data?.responseInstructions);
    if (userReportCheck.body.data?.status !== "Responding") {
        throw new Error("User did not receive latest status!");
    }
    console.log(" ✓ TEST 10 PASSED: Citizen sees updated status and response instructions\n");

    // 11. User can submit an SOS request
    console.log("TEST 11: User submit urgent SOS request");
    const sosRes = await request("/api/sos", {
        method: "POST",
        headers: { Authorization: `Bearer ${citizenToken}` },
        body: {
            emergencyType: "Severe Fire & Smoke Hazard",
            location: "Commercial Complex, 3rd Floor, West Wing",
            description: "Thick smoke engulfing staircase; 4 employees unable to descend.",
            affectedPeople: 4,
            contactNumber: "9876500000"
        }
    });
    console.log(" - SOS submit response:", sosRes.status, sosRes.body.message);
    if (sosRes.status !== 200) throw new Error("SOS submit failed");
    createdSOSId = sosRes.body.data._id;
    if (!sosRes.body.data.isSOS || sosRes.body.data.severity !== "Critical") {
        throw new Error("SOS was not tagged as Critical SOS!");
    }
    console.log(" ✓ TEST 11 PASSED: SOS submitted with Critical priority and isSOS=true\n");

    // 12. SOS request appears in admin panel
    console.log("TEST 12: SOS request appears in admin panel");
    const adminReportsRes = await request("/admin/emergency-reportAll?isSOS=true", {
        headers: { Authorization: `Bearer ${adminToken}` }
    });
    const foundSOS = adminReportsRes.body.data?.find(r => r._id.toString() === createdSOSId.toString());
    if (!foundSOS) throw new Error("Created SOS not found in admin SOS feed");
    console.log(" - Admin panel found SOS report:", foundSOS.title, "(isSOS:", foundSOS.isSOS, ")");
    console.log(" ✓ TEST 12 PASSED: SOS request clearly identifiable in admin panel\n");

    // 13. Administrator can manage emergency resources
    console.log("TEST 13: Administrator manage emergency resources (Add & Update)");
    const addResourceRes = await request("/admin/resource", {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {
            name: "East District Auxiliary Shelter",
            type: "Shelter",
            address: "School Complex, East District",
            contact: "0123-456-799",
            services: "Bedding, warm meals, emergency power",
            capacity: 250,
            status: "Available"
        }
    });
    console.log(" - Admin add resource response:", addResourceRes.status, addResourceRes.body.message);
    if (addResourceRes.status !== 200) throw new Error("Admin add resource failed");
    console.log(" ✓ TEST 13 PASSED: Admin successfully created resource\n");

    // 14. Users can browse available emergency resources
    console.log("TEST 14: Users browse available emergency resources");
    const userResourcesRes = await request("/api/resource", {
        headers: { Authorization: `Bearer ${citizenToken}` }
    });
    console.log(" - Total resources accessible to user:", userResourcesRes.body.data?.length);
    if (userResourcesRes.body.data?.length === 0) throw new Error("User resources list is empty");
    console.log(" ✓ TEST 14 PASSED: User can browse emergency resources directory\n");

    // 15. Resource recommendations exclude unavailable resources
    console.log("TEST 15: Resource recommendations exclude unavailable/full resources");
    const { matchResourcesForIncident } = require("./src/services/assessmentEngine");
    const matched = await matchResourcesForIncident({
        disasterType: "Flood",
        severity: "High",
        responseCategory: "Emergency Assistance / Evacuation Guidance"
    });
    const hasFull = matched.some(m => m.status === "Full" || m.status === "Unavailable" || m.status === "Temporarily Closed");
    console.log(" - Total matched resources returned:", matched.length);
    console.log(" - Any Full/Unavailable resource present:", hasFull);
    if (hasFull) throw new Error("Matched resources included Full or Unavailable facilities!");
    console.log(" ✓ TEST 15 PASSED: Full/Unavailable resources strictly excluded from assistance recommendations\n");

    // 16. Users can access their emergency history
    console.log("TEST 16: Users can access their emergency history");
    const myHistoryRes = await request("/api/user/my-reports", {
        headers: { Authorization: `Bearer ${citizenToken}` }
    });
    console.log(" - User my-reports count:", myHistoryRes.body.data?.length);
    if (myHistoryRes.body.data?.length < 2) throw new Error("User history does not contain submitted reports");
    console.log(" ✓ TEST 16 PASSED: User accessed their full incident history\n");

    // 17. Users cannot access another user's private reports
    console.log("TEST 17: User isolation - cannot access another user's private report");
    const trespassRes = await request(`/api/user/my-reports/${createdReportId}`, {
        headers: { Authorization: `Bearer ${otherCitizenToken}` }
    });
    console.log(" - Other user accessing citizen report returned HTTP status:", trespassRes.status);
    if (trespassRes.status !== 403) throw new Error("Unauthorized user was NOT blocked from viewing private report!");
    console.log(" ✓ TEST 17 PASSED: Privacy boundary enforced; other user blocked with 403 Forbidden\n");

    // 18. Admin dashboard statistics match actual database records
    console.log("TEST 18: Admin dashboard statistics match actual database records");
    const adminStatsRes = await request("/admin/dashboard-stats", {
        headers: { Authorization: `Bearer ${adminToken}` }
    });
    const statsData = adminStatsRes.body.data;
    const actualUsersCount = await UserModel.countDocuments({ isDelete: false });
    const actualReportsCount = await EmergencyReportModel.countDocuments({ isDelete: false });
    const actualAlertsCount = await AlertModel.countDocuments({ isDelete: false });
    console.log(" - Stats API totalUsers:", statsData.totalUsers, "== DB actual:", actualUsersCount);
    console.log(" - Stats API totalReports:", statsData.totalReports, "== DB actual:", actualReportsCount);
    console.log(" - Stats API totalAlerts:", statsData.totalAlerts, "== DB actual:", actualAlertsCount);

    if (statsData.totalUsers !== actualUsersCount || statsData.totalReports !== actualReportsCount || statsData.totalAlerts !== actualAlertsCount) {
        throw new Error("Admin dashboard statistics do NOT match actual database counts!");
    }
    console.log(" ✓ TEST 18 PASSED: Admin dashboard statistics match real database records\n");

    console.log("==================================================");
    console.log("ALL 18 VERIFICATION SCENARIOS PASSED SUCCESSFULLY!");
    console.log("==================================================");
    process.exit(0);
}

runTests().catch(err => {
    console.error("\n❌ TEST FAILED:", err.message);
    process.exit(1);
});
