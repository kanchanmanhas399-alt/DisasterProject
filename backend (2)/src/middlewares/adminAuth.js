const adminAuth = async (req, res, next) => {
    const role = req.token?.role || req.token?.userType;
    if (role !== "admin") {
        return res.status(403).json({
            status: 403,
            success: false,
            message: "Access denied. Administrator privileges required."
        });
    }
    next();
};

module.exports = adminAuth;
