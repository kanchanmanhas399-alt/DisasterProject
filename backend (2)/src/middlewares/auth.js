const jwt = require("jsonwebtoken");

const auth = async (req, res, next) => {
    try {
        let token = req.headers?.["authorization"] || req.headers?.["Authorization"];

        if (token) {
            if (typeof token === "string" && token.startsWith("Bearer ")) {
                token = token.slice(7).trim();
            }

            const user = jwt.verify(token, process.env.JWT_SECRET);
            req.token = user;
            req.user = user;
            next();
        } else {
            return res.status(401).json({ status: 401, success: false, message: "No token provided" });
        }
    } catch (err) {
        return res.status(403).json({ status: 403, success: false, message: "Invalid or expired token", error: err.message });
    }
};

module.exports = auth;
