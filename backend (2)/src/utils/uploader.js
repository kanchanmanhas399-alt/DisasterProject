const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { uploadImg } = require('./helper');

const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const handleImageUpload = async (fileBuffer, originalname = "upload.jpg") => {
    // 1. Try Cloudinary first
    try {
        const cloudinaryUrl = await uploadImg(fileBuffer);
        if (cloudinaryUrl) return cloudinaryUrl;
    } catch (cloudErr) {
        // Fallback to local storage if Cloudinary fails (e.g. network/sandbox restriction)
        console.log("Cloudinary upload failed or offline, saving locally:", cloudErr.message);
    }

    // 2. Local file fallback
    const ext = path.extname(originalname) || ".jpg";
    const filename = `dg-${Date.now()}-${Math.floor(Math.random() * 10000)}${ext}`;
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, fileBuffer);
    return `/uploads/${filename}`;
};

const uploadController = async (req, res) => {
    try {
        if (!req.file) {
            // Check if base64 data URL was sent in body
            if (req.body?.image && req.body.image.startsWith("data:image")) {
                const matches = req.body.image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                if (matches && matches.length === 3) {
                    const ext = matches[1].split("/")[1] || "png";
                    const buffer = Buffer.from(matches[2], 'base64');
                    const url = await handleImageUpload(buffer, `image.${ext}`);
                    return res.status(200).json({ status: 200, success: true, message: "Image uploaded", url });
                }
            }
            return res.status(400).json({ status: 400, success: false, message: "No file provided" });
        }

        const url = await handleImageUpload(req.file.buffer, req.file.originalname);
        return res.status(200).json({ status: 200, success: true, message: "Image uploaded successfully", url });
    } catch (err) {
        return res.status(500).json({ status: 500, success: false, message: "Image upload failed", error: err.message });
    }
};

module.exports = {
    upload,
    uploadController,
    handleImageUpload
};
