const UserModel = require("./user")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

const saltRounds = 10

const add = async (req, res) => {
    try {
        const formData = req.body || {}
        let validation = ""

        if (!formData.name) validation += "name is required, "
        if (!formData.email) validation += "email is required, "
        if (!formData.password) validation += "password is required, "

        if (validation) {
            return res.status(400).json({ status: 400, success: false, message: validation })
        }

        const existingUser = await UserModel.findOne({ email: formData.email })
        if (existingUser) {
            return res.status(409).json({ status: 409, success: false, message: "Email already registered" })
        }

        const hashedPassword = await bcrypt.hash(formData.password, saltRounds)

        const userObj = new UserModel({
            name: formData.name,
            email: formData.email,
            password: hashedPassword,
            phone:formData.phone,
            userType: formData.userType || "citizen",
            status: formData.status || "active"
        })

        const userData = await userObj.save()

        return res.status(200).json({ status: 200, success: true, message: "User Added", data: userData })
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Internal Server Error", error: err.message })
    }
}

const login = async (req, res) => {
    try {
        const formData = req.body || {}
        let validation = ""

        if (!formData.email) validation += "email is required, "
        if (!formData.password) validation += "password is required, "

        if (validation) {
            return res.status(400).json({ success: false, message: validation })
        }

        const candidate = await UserModel.findOne({ email: formData.email })
        if (!candidate) {
            return res.status(404).json({ success: false, message: "No such user" })
        }

        const passwordMatch = await bcrypt.compare(formData.password, candidate.password)
        if (!passwordMatch) {
            return res.status(401).json({ status: 401, success: false, message: "Password does not match" })
        }

        const payload = {
            id: candidate._id,
            email: candidate.email,
            userType: candidate.userType,
            role: candidate.userType
        }

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1d" })

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            data: candidate
        })
    } catch (err) {
        return res.status(500).json({ success: false, message: "Internal Server Error: " + err.message })
    }
}

const all = async (req, res) => {
    try {
        const users = await UserModel.find({ isDelete: false }).sort({ createdAt: -1 })
        return res.status(200).json({
            status: 200,
            success: true,
            message: "Users loaded",
            data: users
        })
    } catch (err) {
        return res.status(500).json({ success: false, message: "Internal Server Error: " + err.message })
    }
}

const update = async (req, res) => {
    try {
        const _id = req.params?._id || req.body?._id || req.query?._id
        const formData = req.body || {}

        if (!_id) {
            return res.status(400).json({ success: false, message: "_id is required" })
        }

        const userData = await UserModel.findById(_id)
        if (!userData) {
            return res.status(404).json({ success: false, message: "User not found" })
        }

        if (formData.name !== undefined) userData.name = formData.name
        if (formData.email !== undefined) userData.email = formData.email
        if (formData.phone !== undefined) userData.phone = formData.phone
        if (formData.password !== undefined && formData.password) {
            userData.password = await bcrypt.hash(formData.password, saltRounds)
        }
        if (formData.userType !== undefined) userData.userType = formData.userType
        if (formData.status !== undefined) userData.status = formData.status

        const savedData = await userData.save()
        return res.status(200).json({ message: "User updated", success: true, status: 200, data: savedData })
    } catch (err) {
        return res.status(500).json({ success: false, message: "Internal Server Error: " + err.message })
    }
}


const getSingle = async (req, res) => {
    try {
        const _id = req.params?._id || req.body?._id || req.query?._id || (typeof req.body === 'string' ? req.body : null)

        if (!_id) {
            return res.status(400).json({
                status: 400,
                success: false,
                message: "id is required"
            })
        }

        const data = await UserModel.findById(_id)

        if (!data) {
            return res.status(404).json({
                status: 404,
                success: false,
                message: "User not found"
            })
        }

        return res.status(200).json({
            status: 200,
            success: true,
            message: "User loaded",
            data
        })
    } catch (err) {
        console.log(err);
        
        return res.status(500).json({
            status: 500,
            success: false,
            message: "internal server error: " + err.message
        })
    }
}




const deletePermanent = async (req, res) => {
    try {
        const _id = req.params?._id || req.body?._id || req.query?._id
        if (!_id) {
            return res.status(400).json({ success: false, message: "_id is required" })
        }

        const userData = await UserModel.findByIdAndDelete(_id)
        if (!userData) {
            return res.status(404).json({ success: false, message: "User not found" })
        }

        return res.status(200).json({ message: "User deleted", success: true, status: 200, data: userData })
    } catch (err) {
        return res.status(500).json({ success: false, message: "Internal Server Error: " + err.message })
    }
}

const changePassword = async (req, res) => {
    try {
        const formData = req.body || {}

        if (!formData.oldPassword) {
            return res.status(400).json({ success: false, message: "oldPassword is required" })
        }

        if (formData.newPassword !== formData.confirmPassword) {
            return res.status(400).json({ success: false, message: "New Password and Confirm password not match" })
        }

        const email = req.token?.email
        const userData = await UserModel.findOne({ email })

        if (!userData) {
            return res.status(404).json({ success: false, message: "User not found" })
        }

        const result = await bcrypt.compare(formData.oldPassword, userData.password)
        if (!result) {
            return res.status(400).json({ success: false, message: "Your Old password is incorrect" })
        }

        userData.password = await bcrypt.hash(formData.newPassword, 10)
        const savedData = await userData.save()

        return res.status(200).json({ message: "Your password has been changed", success: true, status: 200, data: savedData })
    } catch (err) {
        return res.status(500).json({ success: false, message: "Internal Server Error: " + err.message })
    }
}

const otpGen = async (req, res) => {
    try {
        const { email } = req.body
        if (!email) {
            return res.status(400).json({ status: 400, success: false, message: "email is required" })
        }

        const userData = await UserModel.findOne({ email })
        if (!userData) {
            return res.status(404).json({ status: 404, success: false, message: "User Not Found" })
        }

        const otp = Math.floor(Math.random() * 1000000)
        const expireOtp = Date.now() + 5 * 60 * 1000

        userData.otp = otp
        userData.expireOtp = expireOtp
        await userData.save()

        return res.status(200).json({ massage: "otp Genrated", success: true, status: 200, otp })
    } catch (err) {
        return res.status(500).json({ success: false, message: "Internal Server Error: " + err.message })
    }
}

const verifyOTP = async (req, res) => {
    try {
        const { email, OTP, newPassword } = req.body

        const userData = await UserModel.findOne({ email })
        if (!userData) {
            return res.status(404).json({ status: 404, success: false, message: "User Not Found" })
        }

        if (!userData.expireOtp || userData.expireOtp < Date.now()) {
            return res.status(403).json({ status: 403, success: false, message: "OTP EXP" })
        }

        if (String(userData.otp) !== String(OTP)) {
            return res.status(403).json({ status: 403, success: false, message: "OTP is Not Valid" })
        }

        const isSamePassword = await bcrypt.compare(newPassword, userData.password)
        if (isSamePassword) {
            return res.status(200).json({ massage: "New Password is same as Old password", status: 200, success: true })
        }

        userData.password = await bcrypt.hash(newPassword, 10)
        userData.otp = null
        userData.expireOtp = Date.now()
        await userData.save()

        return res.status(200).json({ massage: "You password Has been changed", status: 200, success: true })
    } catch (err) {
        return res.status(500).json({ success: false, message: "Internal Server Error: " + err.message })
    }
}

module.exports = { add, login, all, update, deletePermanent, changePassword, otpGen, verifyOTP ,getSingle}


