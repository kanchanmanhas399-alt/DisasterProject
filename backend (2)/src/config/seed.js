const UserModel = require("../api/user/user");
const DisasterCategoryModel = require("../api/DisasterCategory/DisasterCategory");
const SafetyGuideModel = require("../api/SafetyGuide/SafetyGuide");
const ResourceModel = require("../api/Resource/Resource");
const ShelterModel = require("../api/Shelter/Shelter");
const HospitalModel = require("../api/Hospital/Hospital");
const RescueCenterModel = require("../api/RescueCenter/RescueCenter");
const AlertModel = require("../api/Alert/Alert");
const bcrypt = require('bcrypt');

const saltRounds = 10;

const seed = async () => {
    try {
        // 1. Seed Admin User
        const existingAdmin = await UserModel.findOne({ email: "admin@gmail.com" });
        if (!existingAdmin) {
            const hashedPassword = await bcrypt.hash("123", saltRounds);
            await UserModel.create({
                name: "System Administrator",
                email: "admin@gmail.com",
                password: hashedPassword,
                phone: 9876543210,
                userType: "admin",
                status: "active"
            });
            console.log("Admin seeded: admin@gmail.com / 123");
        }

        // 2. Seed Default Citizen User
        const existingCitizen = await UserModel.findOne({ email: "citizen@gmail.com" });
        if (!existingCitizen) {
            const hashedPassword = await bcrypt.hash("123", saltRounds);
            await UserModel.create({
                name: "Rahul Sharma",
                email: "citizen@gmail.com",
                password: hashedPassword,
                phone: 9812345678,
                userType: "citizen",
                status: "active"
            });
            console.log("Citizen seeded: citizen@gmail.com / 123");
        }

        // 3. Seed Default Disaster Categories
        const categories = [
            { name: "Flood", description: "Inundation of normally dry land by rising bodies of water or excessive rainfall.", imageIcon: "flood.png" },
            { name: "Earthquake", description: "Sudden violent shaking of the ground resulting from subterranean movements.", imageIcon: "earthquake.png" },
            { name: "Fire", description: "Rapid oxidation of combustible material releasing heat, light, and smoke.", imageIcon: "fire.png" },
            { name: "Landslide", description: "Collapse of a mass of earth or rock from a mountain or cliff.", imageIcon: "landslide.png" },
            { name: "Cyclone", description: "Intense rotating storm system with strong winds and severe storm surges.", imageIcon: "cyclone.png" },
            { name: "Storm", description: "Severe atmospheric disturbance with heavy precipitation, thunder, and wind.", imageIcon: "storm.png" },
            { name: "Other", description: "Other general or composite emergency situations requiring response.", imageIcon: "warning.png" }
        ];

        for (const cat of categories) {
            const exists = await DisasterCategoryModel.findOne({ name: cat.name });
            if (!exists) {
                await DisasterCategoryModel.create(cat);
            }
        }

        // 4. Seed Safety Guidelines
        const safetyGuides = [
            {
                disasterType: "Flood",
                title: "Flood Safety & Preparedness Guidelines",
                shortIntro: "Floods are among the most common and destructive hazards. Knowing what actions to take before, during, and after can save lives.",
                beforePrecautions: [
                    "Elevate electrical switches, water heaters, and furnace controls above projected flood levels.",
                    "Keep emergency survival kits packed with non-perishable food, water, flashlight, and first aid.",
                    "Install check valves in plumbing to prevent floodwater backflow into drains."
                ],
                duringInstructions: [
                    "Move immediately to higher ground when flood alerts or evacuation notices are issued.",
                    "Never walk, swim, or drive through moving water ('Turn Around, Don't Drown').",
                    "Avoid touching electrical equipment if you are wet or standing in puddles."
                ],
                afterPrecautions: [
                    "Wait for official clearance from civil authorities before re-entering buildings.",
                    "Boil or purify tap water until declared safe by municipal health departments.",
                    "Discard all food items that have come into contact with floodwaters."
                ],
                emergencyChecklist: [
                    "3-day drinking water supply (3 liters per person per day)",
                    "Waterproof container for identification documents and property records",
                    "Battery-powered emergency weather radio",
                    "Sturdy rubber boots and protective work gloves",
                    "Prescription medications and essential hygiene items"
                ],
                preventiveMeasures: [
                    "Clear community storm drains and gutters of seasonal debris.",
                    "Participate in local watershed conservation and flood barrier programs."
                ]
            },
            {
                disasterType: "Earthquake",
                title: "Earthquake Response & Seismic Safety Guidelines",
                shortIntro: "Earthquakes strike without warning. Immediate, disciplined personal protection is essential.",
                beforePrecautions: [
                    "Anchor heavy overhead bookcases, water heaters, and hanging light fixtures to wall studs.",
                    "Identify safe interior spots in every room: under sturdy desks, tables, or against interior walls.",
                    "Know where and how to shut off main gas valves and electric circuit breakers."
                ],
                duringInstructions: [
                    "Drop to hands and knees, take Cover under sturdy furniture, and Hold On firmly.",
                    "Stay away from exterior glass windows, architectural facades, and unanchored mirrors.",
                    "If outdoors, move into an open area away from overhead power lines, tall buildings, and trees."
                ],
                afterPrecautions: [
                    "Expect and prepare for significant aftershocks.",
                    "Inspect your structure for structural cracks and fire or gas hazards.",
                    "Use stairs instead of elevators when exiting damaged structures."
                ],
                emergencyChecklist: [
                    "Multi-purpose tool and adjustable wrench to turn off gas and water valves",
                    "Heavy-duty work gloves and protective dust masks (N95)",
                    "Sturdy closed-toe shoes kept beside your bed",
                    "Emergency whistle to signal rescue teams if trapped"
                ],
                preventiveMeasures: [
                    "Schedule professional seismic retrofitting for older residential foundations."
                ]
            },
            {
                disasterType: "Fire",
                title: "Structure & Wildfire Emergency Guidelines",
                shortIntro: "Fires spread rapidly within minutes. Rapid evacuation and smoke avoidance are critical.",
                beforePrecautions: [
                    "Test residential smoke alarms monthly and replace batteries twice a year.",
                    "Establish and practice two emergency exit pathways from every room.",
                    "Keep multipurpose ABC fire extinguishers charged and easily accessible."
                ],
                duringInstructions: [
                    "Evacuate immediately via the nearest safe exit; never delay to gather valuables.",
                    "Crawl low under smoke where air is cooler and cleaner.",
                    "Feel door handles before opening; if hot, keep closed and use an alternate exit route.",
                    "If clothing catches fire: Stop, Drop, and Roll immediately."
                ],
                afterPrecautions: [
                    "Never re-enter a burned building until designated safe by fire department officials.",
                    "Discard food, beverages, and medicine exposed to heat, smoke, or fire-extinguishing chemicals."
                ],
                emergencyChecklist: [
                    "Portable smoke escape masks or wet cotton cloths",
                    "Fire-retardant emergency blanket",
                    "Emergency contact list of local fire brigade and burn centers"
                ],
                preventiveMeasures: [
                    "Store flammable liquids in approved containers away from living quarters."
                ]
            },
            {
                disasterType: "Landslide",
                title: "Landslide & Debris Flow Precautions",
                shortIntro: "Landslides frequently follow intense rainfall or seismic tremors on steep slopes.",
                beforePrecautions: [
                    "Plant ground cover on slopes and build retaining walls where appropriate.",
                    "Consult geotechnical experts to inspect property showing signs of shifting soil or cracks."
                ],
                duringInstructions: [
                    "Quickly move away from the path of the slide or debris torrent toward stable ridge lines.",
                    "Listen for sounds of rumbling boulders, cracking trees, or sudden changes in stream turbidity."
                ],
                afterPrecautions: [
                    "Stay clear of the slide perimeter as secondary landslides and mudflows may follow.",
                    "Report damaged utility lines and blocked roadways to civil defense."
                ],
                emergencyChecklist: [
                    "Flashlight with extra batteries",
                    "First aid trauma kit",
                    "Battery-operated radio"
                ],
                preventiveMeasures: [
                    "Ensure stormwater runoff is safely channeled away from slope crests."
                ]
            },
            {
                disasterType: "Cyclone",
                title: "Cyclone & Tropical Storm Safety Guidelines",
                shortIntro: "Cyclones generate catastrophic storm surges, violent gale winds, and severe inundation.",
                beforePrecautions: [
                    "Trim dead tree branches that could fall on roofing or power lines.",
                    "Board up or shutter exterior windows and secure loose corrugated iron sheets."
                ],
                duringInstructions: [
                    "Take shelter in an interior windowless room on the lowest structural level.",
                    "Never leave your shelter during the eye of the cyclone; winds resume suddenly from the reverse direction."
                ],
                afterPrecautions: [
                    "Beware of fallen live electric cables in puddles.",
                    "Follow official bulletins before returning to low-lying coastal tracts."
                ],
                emergencyChecklist: [
                    "Emergency radio",
                    "Matches or lighters in waterproof bags",
                    "Ample supply of drinking water and non-perishable canned food"
                ],
                preventiveMeasures: [
                    "Adhere strictly to official meteorological cyclone warnings and evacuation advisories."
                ]
            },
            {
                disasterType: "Storm",
                title: "Severe Storm & Lightning Protection",
                shortIntro: "Thunderstorms bring dangerous lightning, flash flooding, and damaging hail.",
                beforePrecautions: [
                    "Unplug expensive computers, televisions, and electronic devices before storms strike."
                ],
                duringInstructions: [
                    "Remember the 30/30 rule: When thunder roars, go indoors.",
                    "Avoid open fields, hilltops, metal fences, and lone tall trees during electrical storms."
                ],
                afterPrecautions: [
                    "Check premises for fallen electrical wires and tree limbs."
                ],
                emergencyChecklist: [
                    "Battery-powered lanterns and flashlights",
                    "Fully charged power banks for mobile phones"
                ],
                preventiveMeasures: [
                    "Install surge protectors and lightning arrestors on residential structures."
                ]
            },
            {
                disasterType: "Other",
                title: "General Emergency Preparedness & Civil Protection",
                shortIntro: "General safety and resilience guidance for unspecified and composite emergencies.",
                beforePrecautions: [
                    "Maintain an updated family emergency communication plan with an out-of-town contact point."
                ],
                duringInstructions: [
                    "Remain calm, assess immediate threats, and contact emergency line 112 when life is endangered."
                ],
                afterPrecautions: [
                    "Verify safety of neighbors, children, elderly persons, and pets."
                ],
                emergencyChecklist: [
                    "First aid medical kit",
                    "Emergency cash in small denominations",
                    "Copies of government identification documents"
                ],
                preventiveMeasures: [
                    "Participate in regular community civil defense and emergency drills."
                ]
            }
        ];

        for (const guide of safetyGuides) {
            const exists = await SafetyGuideModel.findOne({ disasterType: guide.disasterType });
            if (!exists) {
                await SafetyGuideModel.create(guide);
            }
        }

        // 5. Seed Emergency Resources
        const resources = [
            {
                resourceId: "SH-01",
                name: "District Central Community Shelter",
                type: "Shelter",
                description: "Spacious multi-purpose municipal hall equipped with emergency cots, clean sanitation, and generator backup.",
                address: "Main Road, Central Ward, Sector 4",
                location: "Central Ward",
                contact: "0123-456-700",
                services: "Emergency accommodation, hot meals, drinking water, basic sanitation",
                capacity: 350,
                status: "Available"
            },
            {
                resourceId: "SH-02",
                name: "North Zone High School Evacuation Shelter",
                type: "Shelter",
                description: "Reinforced public facility designated for temporary residential evacuation.",
                address: "Ring Road, North Zone",
                location: "North Zone",
                contact: "0123-456-705",
                services: "Temporary shelter, bedding, family welfare station",
                capacity: 200,
                status: "Available"
            },
            {
                resourceId: "HO-01",
                name: "City General Hospital & Trauma Center",
                type: "Hospital",
                description: "Full-service tertiary healthcare institution equipped with 24/7 trauma emergency and surgical suites.",
                address: "Civil Lines, Medical Enclave, City Centre",
                location: "City Centre",
                contact: "0123-456-701",
                services: "Emergency trauma, ICU, burn unit, pathology, 24/7 pharmacy",
                capacity: 150,
                status: "Available"
            },
            {
                resourceId: "HO-02",
                name: "Metro Emergency Clinic",
                type: "Hospital",
                description: "Urgent care clinic focused on outpatient stabilization and minor surgical care.",
                address: "Station Road, East District",
                location: "East District",
                contact: "0123-456-712",
                services: "Outpatient emergency, triage, first-aid, ambulance base",
                capacity: 40,
                status: "Available"
            },
            {
                resourceId: "RC-01",
                name: "Regional Disaster Rescue & Evacuation Unit",
                type: "Rescue Center",
                description: "Specialized rapid rescue base housing amphibious boats, cutting equipment, and canine search teams.",
                address: "Industrial Area, Bypass Road, North Zone",
                location: "North Zone",
                contact: "0123-456-702",
                services: "Search and rescue, flood boat evacuation, collapsed building extrication",
                capacity: 60,
                status: "Available"
            },
            {
                resourceId: "SC-01",
                name: "Metropolitan Civil Defense Support Center",
                type: "Emergency Support Center",
                description: "Centralized command support coordinating emergency communications, relief rations, and volunteer dispatch.",
                address: "Civic Complex, Town Hall Square",
                location: "Town Hall",
                contact: "0123-456-708",
                services: "Relief packet distribution, communication relay, missing persons helpline",
                capacity: 500,
                status: "Available"
            },
            {
                resourceId: "SH-03",
                name: "Riverside Relief Camp (Capacity Reached)",
                type: "Shelter",
                description: "Temporary shelter camp currently operating at peak capacity.",
                address: "Old Bridge Road, Riverbank Zone",
                location: "Riverbank Zone",
                contact: "0123-456-720",
                services: "Shelter, sanitation",
                capacity: 100,
                status: "Full" // Demonstrates proper filtering of unavailable resources
            }
        ];

        for (const resItem of resources) {
            const exists = await ResourceModel.findOne({ resourceId: resItem.resourceId });
            if (!exists) {
                await ResourceModel.create(resItem);
            }
        }

        // Also sync dedicated Shelter, Hospital, RescueCenter models
        const shelterCount = await ShelterModel.countDocuments();
        if (shelterCount === 0) {
            await ShelterModel.create([
                { resourceId: "SH-01", name: "District Central Community Shelter", address: "Main Road, Central Ward, Sector 4", contact: "0123-456-700", capacity: 350, status: "Available" },
                { resourceId: "SH-02", name: "North Zone High School Evacuation Shelter", address: "Ring Road, North Zone", contact: "0123-456-705", capacity: 200, status: "Available" }
            ]);
        }

        const hospitalCount = await HospitalModel.countDocuments();
        if (hospitalCount === 0) {
            await HospitalModel.create([
                { resourceId: "HO-01", hospitalName: "City General Hospital & Trauma Center", address: "Civil Lines, Medical Enclave, City Centre", contact: "0123-456-701", services: "Emergency trauma, ICU, 24/7 surgery", status: "Available" },
                { resourceId: "HO-02", hospitalName: "Metro Emergency Clinic", address: "Station Road, East District", contact: "0123-456-712", services: "Outpatient emergency, triage, first-aid", status: "Available" }
            ]);
        }

        const rescueCount = await RescueCenterModel.countDocuments();
        if (rescueCount === 0) {
            await RescueCenterModel.create([
                { resourceId: "RC-01", centerName: "Regional Disaster Rescue & Evacuation Unit", address: "Industrial Area, Bypass Road, North Zone", contact: "0123-456-702", services: "Search and rescue, flood boat evacuation", status: "Available" }
            ]);
        }

        // 6. Seed Sample Active Disaster Alerts
        const alertCount = await AlertModel.countDocuments();
        if (alertCount === 0) {
            await AlertModel.create([
                {
                    title: "Flash Flood Warning - Lowland Riverine Sector",
                    disasterType: "Flood",
                    description: "Continuous heavy rainfall has caused water levels in the northern canal to exceed warning thresholds. Residents in low-lying sections must prepare for evacuation.",
                    severity: "Critical",
                    affectedArea: "North Zone, Canal Corridor",
                    dateTime: new Date(),
                    status: "Active"
                },
                {
                    title: "Severe Thunderstorm & Gale Wind Advisory",
                    disasterType: "Storm",
                    description: "Strong convective squall line forecast with wind gusts reaching 65 km/h. Secure loose outdoor fixtures and avoid parking under aged trees.",
                    severity: "High",
                    affectedArea: "Metropolitan District",
                    dateTime: new Date(Date.now() - 3600000),
                    status: "Active"
                },
                {
                    title: "Seismic Tremor Preparedness Notice",
                    disasterType: "Earthquake",
                    description: "Minor geological tremors registered in neighboring hills. Review structural emergency exit routes and emergency kit readiness.",
                    severity: "Medium",
                    affectedArea: "Eastern Ridge & Foothills",
                    dateTime: new Date(Date.now() - 7200000),
                    status: "Active"
                }
            ]);
        }

        console.log("Database seeded successfully with initial master data.");
    } catch (err) {
        console.error("Seeding error:", err);
    }
};

module.exports = seed;
