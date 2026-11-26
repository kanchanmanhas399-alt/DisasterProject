const ResourceModel = require("../api/Resource/Resource");
const ShelterModel = require("../api/Shelter/Shelter");
const HospitalModel = require("../api/Hospital/Hospital");
const RescueCenterModel = require("../api/RescueCenter/RescueCenter");
const SafetyGuideModel = require("../api/SafetyGuide/SafetyGuide");

/**
 * Deterministic Rule-Based Emergency Assessment Module
 * Central Decision-Support Engine for DisasterGuard
 */

// Configurable Critical Indicators in descriptions
const CRITICAL_KEYWORDS = [
    "trapped", "collapse", "casualt", "fatal", "buried", "drowning", 
    "unconscious", "explosion", "life-threat", "severe injur", "suffocat", 
    "bleeding", "crushed", "amputat", "burning building", "swept away"
];

const HIGH_PRIORITY_KEYWORDS = [
    "rising water", "smoke", "cracking", "damage", "stranded", 
    "blocked road", "structural", "spreading", "gas leak", "power line"
];

async function evaluateEmergencyRules({ disasterType, location, severity, description, affectedPeople, isSOS }) {
    const rawType = (disasterType || "Other").trim();
    const rawSev = (severity || (isSOS ? "Critical" : "Medium")).trim();
    const people = Math.max(0, parseInt(affectedPeople, 10) || 0);
    const desc = (description || "").toLowerCase();
    const loc = (typeof location === "object" ? location?.address : location) || "";

    // 1. Determine Assessment Priority
    const sevNormalized = rawSev.charAt(0).toUpperCase() + rawSev.slice(1).toLowerCase();
    let priority = "Medium";
    let priorityTriggers = [];

    if (sevNormalized === "Critical" || isSOS) {
        priority = "Critical";
        priorityTriggers.push(isSOS ? "Urgent SOS distress beacon triggered" : "User-selected Critical severity");
    } else if (sevNormalized === "High" || people >= 10 || desc.includes("trapped") || desc.includes("collapse") || desc.includes("structural")) {
        priority = "High";
        if (sevNormalized === "High") priorityTriggers.push("User-selected High severity");
        if (people >= 10) priorityTriggers.push(`Multiple individuals affected (${people} people reported)`);
        if (desc.includes("trapped")) priorityTriggers.push("Incident description indicates trapped individuals requiring rescue");
        if (desc.includes("collapse")) priorityTriggers.push("Structural collapse hazard reported");
    } else if (sevNormalized === "Medium" || people >= 1) {
        priority = "Medium";
        priorityTriggers.push(people >= 1 ? `Affected persons reported (${people})` : "Moderate situational hazard conditions");
    } else if (sevNormalized === "Low" && people === 0) {
        priority = "Low";
        priorityTriggers.push("Advisory situation without immediate structural hazard or casualties");
    }

    // Safety constraint: Critical severity must NEVER be downgraded
    if (sevNormalized === "Critical") {
        priority = "Critical";
    }

    // 2. Determine Response Category
    // Categories: Emergency Assistance, Evacuation Guidance, Medical Assistance, Rescue Assistance, Safety Information
    const categories = [];

    if (isSOS) {
        categories.push("Emergency Assistance");
        categories.push("Rescue Assistance");
    }

    const typeLower = rawType.toLowerCase();
    if (typeLower.includes("flood")) {
        categories.push("Emergency Assistance");
        categories.push("Evacuation Guidance");
        if (people >= 4 || priority === "Critical" || priority === "High" || desc.includes("trapped") || desc.includes("stranded")) {
            categories.push("Rescue Assistance");
        }
    } else if (typeLower.includes("fire")) {
        categories.push("Emergency Assistance");
        categories.push("Medical Assistance");
        if (priority === "Critical" || priority === "High") {
            categories.push("Evacuation Guidance");
        }
    } else if (typeLower.includes("earthquake")) {
        categories.push("Rescue Assistance");
        categories.push("Medical Assistance");
        categories.push("Safety Information");
    } else if (typeLower.includes("landslide")) {
        categories.push("Evacuation Guidance");
        categories.push("Rescue Assistance");
    } else if (typeLower.includes("cyclone") || typeLower.includes("storm")) {
        categories.push("Evacuation Guidance");
        categories.push("Safety Information");
        if (priority === "Critical" || priority === "High") {
            categories.push("Emergency Assistance");
        }
    } else {
        categories.push("Safety Information");
        if (priority === "Critical" || priority === "High") {
            categories.push("Emergency Assistance");
        }
    }

    // Check textual signals in description
    if (desc.includes("injur") || desc.includes("casualt") || desc.includes("burn") || desc.includes("doctor") || desc.includes("medical") || desc.includes("blood") || desc.includes("pain")) {
        if (!categories.includes("Medical Assistance")) {
            categories.push("Medical Assistance");
        }
    }
    if (desc.includes("trapped") || desc.includes("stuck") || desc.includes("stranded") || desc.includes("buried") || desc.includes("boat")) {
        if (!categories.includes("Rescue Assistance")) {
            categories.push("Rescue Assistance");
        }
    }

    const responseCategory = Array.from(new Set(categories)).join(" / ");

    // 3. Recommended Immediate Actions & Safety Guidance
    let immediateActions = [];
    let safetyGuidance = [];
    let recommendedResourceCategories = [];

    if (typeLower.includes("flood")) {
        immediateActions = [
            "Move immediately to higher ground away from rivers, drainage canals, and low-lying zones.",
            "Do not walk, swim, or drive through floodwater ('Turn Around, Don't Drown').",
            "Follow official evacuation instructions issued by local civil defense authorities.",
            "Seek official emergency assistance if people or animals are stranded or trapped."
        ];
        safetyGuidance = [
            "Disconnect electrical mains and gas supplies if safe to reach.",
            "Avoid contact with downed power lines and potentially contaminated floodwater.",
            "Keep essential survival documents, medicines, and drinking water sealed in waterproof bags."
        ];
        recommendedResourceCategories = ["Shelters", "Rescue Centers", "Emergency Support Centers"];
    } else if (typeLower.includes("earthquake")) {
        immediateActions = [
            "Drop to your hands and knees, take Cover under sturdy furniture, and Hold On until shaking stops.",
            "Stay clear of exterior windows, architectural facades, and unanchored tall furniture.",
            "If outdoors, move safely into an open area away from overhead power lines, trees, and buildings."
        ];
        safetyGuidance = [
            "Be prepared for potentially damaging aftershocks; avoid re-entering visibly cracked structures.",
            "Use interior stairs rather than elevators during any structural evacuation.",
            "Check carefully for gas odors; shut off main utility valves if leaks are suspected."
        ];
        recommendedResourceCategories = ["Hospitals", "Rescue Centers", "Emergency Support Centers"];
    } else if (typeLower.includes("fire")) {
        immediateActions = [
            "Evacuate the premises immediately using designated fire escape routes; never use elevators.",
            "Stay low beneath smoke where cooler, breathable air is concentrated.",
            "Feel interior door handles with the back of your hand before opening; do not open hot doors."
        ];
        safetyGuidance = [
            "If your clothing catches fire: Stop, Drop, and Roll immediately.",
            "Never re-enter a burning or smoke-filled structure under any circumstance.",
            "Assemble at the designated outdoor muster point and account for all individuals."
        ];
        recommendedResourceCategories = ["Hospitals", "Emergency Support Centers", "Rescue Centers"];
    } else if (typeLower.includes("landslide")) {
        immediateActions = [
            "Evacuate the projected debris path immediately and move to structurally sound high ground.",
            "Listen for unusual sounds like cracking trees, rumbling boulders, or sudden surges in mudflow.",
            "If escape is blocked, curl into a tight ball and protect your head with your arms."
        ];
        safetyGuidance = [
            "Stay away from saturated hillsides, retaining walls, and steep road embankments.",
            "Anticipate secondary mudslides following prolonged or heavy downpours."
        ];
        recommendedResourceCategories = ["Shelters", "Rescue Centers", "Hospitals"];
    } else if (typeLower.includes("cyclone") || typeLower.includes("storm")) {
        immediateActions = [
            "Remain inside an interior reinforced room away from all glass doors and exterior windows.",
            "Disconnect electrical equipment to prevent damage from severe lightning and power surges.",
            "Comply immediately with official mandatory evacuation warnings for coastal or low areas."
        ];
        safetyGuidance = [
            "Never venture outdoors during the calm 'eye' of a cyclone, as destructive winds will resume suddenly from the opposite direction.",
            "Secure outdoor furniture, tin roofing, and fixtures that can turn into dangerous airborne missiles."
        ];
        recommendedResourceCategories = ["Shelters", "Emergency Support Centers", "Hospitals"];
    } else {
        immediateActions = [
            "Prioritize immediate personal safety and assist vulnerable individuals nearby if safe to do so.",
            "Contact official emergency services (112) immediately for life-threatening situations.",
            "Avoid hazard perimeter and follow instructions from emergency personnel."
        ];
        safetyGuidance = [
            "Monitor official civil protection and public disaster management bulletins.",
            "Keep emergency contact numbers readily accessible on your mobile device."
        ];
        recommendedResourceCategories = ["Emergency Support Centers", "Hospitals", "Rescue Centers"];
    }

    if (priority === "Critical") {
        immediateActions.unshift("CRITICAL EMERGENCY: Call official national emergency services (112) immediately.");
    }

    // Connect to published Safety Guidelines if available in database
    try {
        const publishedGuide = await SafetyGuideModel.findOne({
            disasterType: { $regex: new RegExp(`^${rawType}$`, "i") },
            isPublished: true,
            isDelete: false
        });

        if (publishedGuide) {
            if (publishedGuide.duringInstructions?.length > 0) {
                safetyGuidance = Array.from(new Set([...publishedGuide.duringInstructions, ...safetyGuidance]));
            }
            if (publishedGuide.beforePrecautions?.length > 0 && priority !== "Critical") {
                safetyGuidance.push(...publishedGuide.beforePrecautions.slice(0, 2));
            }
        }
    } catch (guideErr) {
        console.error("Safety guide lookup note:", guideErr.message);
    }

    // 4. Generate Assessment Explanation
    let explanation = "";
    if (priority === "Critical") {
        explanation = `The reported ${rawType} incident is assessed as Critical priority because ${priorityTriggers.join(", ")}. Immediate protective action and emergency services notification are strongly advised.`;
    } else if (priority === "High") {
        explanation = `The reported ${rawType} incident is assessed as High priority because ${priorityTriggers.join(", ")}. Significant safety hazards require urgent mitigation, evacuation preparedness, and responder attention.`;
    } else if (priority === "Medium") {
        explanation = `The situation is assessed as Medium priority based on ${priorityTriggers.join(", ")}. It presents moderate safety considerations requiring situational vigilance and standard precautionary guidance.`;
    } else {
        explanation = `The incident is assessed as Low priority as it indicates localized conditions without casualties (${people} affected) or acute structural compromise. Basic preparedness guidance applies.`;
    }

    // Resource explanations map
    const resourceExplanations = {
        "Shelters": "Recommended for secure temporary accommodation, sanitation, and emergency supplies during evacuation.",
        "Hospitals": "Recommended for rapid medical intervention, triage, trauma stabilization, and burn care.",
        "Rescue Centers": "Recommended for watercraft deployment, debris clearance, and specialized emergency extraction.",
        "Emergency Support Centers": "Recommended for incident coordination, distribution of rations, and official civil aid."
    };

    const disclaimer = "Rule-based decision support. This automated assessment provides civil defense preparedness guidance and does not replace official emergency services. In life-threatening emergencies, immediately dial 112.";

    return {
        originalSeverity: sevNormalized,
        priority,
        responseCategory,
        explanation,
        immediateActions,
        safetyGuidance,
        recommendedResourceCategories,
        resourceExplanations,
        disclaimer,
        assessedAt: new Date(),
        isOverridden: false,
        originalPriority: null,
        overriddenPriority: null,
        overrideReason: null,
        overriddenAt: null,
        overriddenBy: null
    };
}

/**
 * Resource Matching Module (Requirement 9)
 * Connects assessment with active emergency resources.
 * Only returns resources with status Available (excludes Full, Temporarily Closed, Unavailable).
 */
async function matchResourcesForIncident({ disasterType, severity, responseCategory, location }) {
    try {
        const typeLower = (disasterType || "").toLowerCase();
        const catLower = (responseCategory || "").toLowerCase();

        const neededTypes = [];
        if (catLower.includes("medical") || typeLower.includes("fire") || typeLower.includes("earthquake")) {
            neededTypes.push("Hospital");
        }
        if (typeLower.includes("flood") || typeLower.includes("cyclone") || typeLower.includes("storm") || catLower.includes("evacuation")) {
            neededTypes.push("Shelter");
        }
        if (catLower.includes("rescue") || severity === "Critical" || typeLower.includes("landslide")) {
            neededTypes.push("Rescue Center");
        }
        neededTypes.push("Emergency Support Center");

        // Helper to format reason
        const getReason = (type) => {
            switch (type) {
                case "Hospital": return "Medical and trauma emergency care";
                case "Shelter": return "Safe evacuation accommodation and protection";
                case "Rescue Center": return "Search, extraction, and specialized rescue equipment";
                default: return "Emergency civil support and relief distribution";
            }
        };

        // Query unified Resource collection (status Available only)
        const resources = await ResourceModel.find({
            isDelete: false,
            type: { $in: neededTypes },
            status: { $regex: /^available$/i }
        }).limit(6);

        const matched = resources.map(r => ({
            _id: r._id,
            name: r.name,
            type: r.type,
            address: r.address || r.location,
            contact: r.contact,
            services: r.services || r.description,
            status: r.status,
            capacity: r.capacity,
            recommendationReason: getReason(r.type)
        }));

        // Also query dedicated Shelter, Hospital, RescueCenter models if available
        if (neededTypes.includes("Shelter")) {
            const shelters = await ShelterModel.find({ isDelete: false, status: { $regex: /^available$/i } }).limit(3);
            for (const s of shelters) {
                if (!matched.some(m => m.name === s.name)) {
                    matched.push({
                        _id: s._id,
                        name: s.name,
                        type: "Shelter",
                        address: s.address,
                        contact: s.contact,
                        services: "Temporary accommodation, shelter, clean water",
                        status: s.status,
                        capacity: s.capacity,
                        recommendationReason: getReason("Shelter")
                    });
                }
            }
        }

        if (neededTypes.includes("Hospital")) {
            const hospitals = await HospitalModel.find({ isDelete: false, status: { $regex: /^available$/i } }).limit(3);
            for (const h of hospitals) {
                if (!matched.some(m => m.name === h.hospitalName)) {
                    matched.push({
                        _id: h._id,
                        name: h.hospitalName,
                        type: "Hospital",
                        address: h.address,
                        contact: h.contact,
                        services: h.services,
                        status: h.status,
                        recommendationReason: getReason("Hospital")
                    });
                }
            }
        }

        if (neededTypes.includes("Rescue Center")) {
            const rescueCenters = await RescueCenterModel.find({ isDelete: false, status: { $regex: /^available$/i } }).limit(3);
            for (const rc of rescueCenters) {
                if (!matched.some(m => m.name === rc.centerName)) {
                    matched.push({
                        _id: rc._id,
                        name: rc.centerName,
                        type: "Rescue Center",
                        address: rc.address,
                        contact: rc.contact,
                        services: rc.services,
                        status: rc.status,
                        recommendationReason: getReason("Rescue Center")
                    });
                }
            }
        }

        return matched;
    } catch (err) {
        console.error("Error matching resources:", err.message);
        return [];
    }
}

module.exports = {
    evaluateEmergencyRules,
    matchResourcesForIncident,
    CRITICAL_KEYWORDS,
    HIGH_PRIORITY_KEYWORDS
};
