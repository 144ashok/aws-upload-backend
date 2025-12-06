const express = require("express");
const AWS = require("aws-sdk");
const multer = require("multer");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());

// S3 Configuration
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

// Multer setup (store file in memory)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// ----- UPLOAD FILE TO S3 -----
app.post("/upload", upload.single("file"), async (req, res) => {
    try {
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: Date.now() + "-" + req.file.originalname,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
        };

        const data = await s3.upload(params).promise();

        res.json({
            message: "File uploaded successfully",
            url: data.Location,
            key: data.Key
        });
    } catch (err) {
        res.status(500).send(err);
    }
});

// ----- DOWNLOAD FILE FROM S3 -----
app.get("/download/:key", async (req, res) => {
    const key = req.params.key;

    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key
    };

    try {
        const fileStream = s3.getObject(params).createReadStream();
        fileStream.pipe(res);
    } catch (err) {
        res.status(500).send(err);
    }
});

app.listen(5000, () => console.log("Server running on port 5000"));
