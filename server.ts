
import express from 'express';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import cors from 'cors';
import { Buffer } from 'node:buffer';

dotenv.config(); 
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

const upload = multer({ storage: multer.memoryStorage() });

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

app.post('/ask-moa', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No image uploaded" });
        }
        const userQuestion = req.body.question || "Explain what is in this image.";

        const base64Data = req.file.buffer.toString("base64");
        
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
                parts: [
                    { text: userQuestion },
                    { inlineData: { mimeType: req.file.mimetype, data: base64Data } }
                ]
            }
        });

        const text = response.text;

        return res.json({ 
            success: true,
            answer: text 
        });

    } catch (error) {
        console.error("Error processing request:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
