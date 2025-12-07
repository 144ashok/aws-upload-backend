// const express = require("express");
// const AWS = require("aws-sdk");
// const multer = require("multer");
import multer from "multer";
import express from "express";
import cors from "cors";
// const cors = require("cors");
// require("dotenv").config();
// const { PutObjectCommand } = require("@aws-sdk/client-s3");
// const { S3Client } = require("@aws-sdk/client-s3");
import dotenv from "dotenv";
dotenv.config();
import { PutObjectCommand, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "./s3/s3.js";


const app = express();
app.use(cors());

// S3 Configuration
// const s3 = new AWS.S3({
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//     region: process.env.AWS_REGION
// });
//s3 client config


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

        const data = await s3Client.send(new PutObjectCommand(params));

        res.json({
            message: "File uploaded successfully",
            url: data.Location,
            key: params.Key
        });
    } catch (err) {
        res.status(500).send(err);
    }
});

app.get("/allDocument", async (req, res) => {

    const command = new ListObjectsV2Command({ Bucket: process.env.AWS_BUCKET_NAME });

    try {
        const data = await s3Client.send(command);

        res.json({
            message: "File Getting successfully",
            files: data.Contents || []
        });
    } catch (err) {
        console.error("Error listing files:", err);
    }
});

// ----- DOWNLOAD FILE FROM S3 -----
app.get("/download-file/:key", async (req, res) => {
    try {
        const fileKey = req.params.key; // file name in bucket

        const command = new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: fileKey,
        });

        const response = await s3Client.send(command);

        // Convert stream to Buffer
        const streamToBuffer = async (stream) =>
            await new Promise((resolve, reject) => {
                const chunks = [];
                stream.on("data", (chunk) => chunks.push(chunk));
                stream.on("end", () => resolve(Buffer.concat(chunks)));
                stream.on("error", reject);
            });

        const fileBuffer = await streamToBuffer(response.Body);

        // await writeFile("downloaded-file.pdf", fileBuffer); // Example to save file locally

        // Set download headers
        res.setHeader("Content-Type", response.ContentType || "application/octet-stream");
        res.setHeader("Content-Disposition", `attachment; filename="${fileKey}"`);

        return res.send(fileBuffer);

    } catch (error) {
        console.error("Download error:", error);
        res.status(500).json({ error: "Download failed" });
    }
});

// ----- DOWNLOAD FILE FROM S3 -----
app.get("/download/:key", async (req, res) => {
    const key = req.params.key;

    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key
    };

    const command = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET,
        Key: fileKey,
    });



    try {
        const response = await s3Client.send(command);
        fileStream.pipe(response);
    } catch (err) {
        res.status(500).send(err);
    }
});

app.listen(5000, () => console.log("Server running on port 5000"));
