const express = require("express");
const path = require("path");
const app = express();
require("dotenv").config();
const cors = require("cors");

const db = require("./src/config/db");
const seed = require("./src/config/seed");
seed();

const auth = require("./src/middlewares/auth");
const router = require("./src/routes/ApiRoutes");
const adminRoute = require("./src/routes/AdminRoutes");

app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api", router);
app.use("/admin", adminRoute);

app.get("/", (req, res) => {
    return res.send("DisasterGuard Emergency Response API");
});

const port = process.env.PORT || 5005;

app.listen(port, (err) => {
    if (err) {
        console.log("error in server:", err);
    } else {
        console.log("server is running on port " + port);
    }
});

module.exports = app;
