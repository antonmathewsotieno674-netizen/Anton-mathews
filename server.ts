import express, { Request, Response } from 'express';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import cors from 'cors';
import { Buffer } from 'node:buffer';

// 1. CONFIGURATION
dotenv.config(); // Load environment variables
const app = express();
const port = process.env.PORT || 3000;

// Enable CORS so your mobile app can talk to this server
app.use(cors());

// Configure Multer to store uploaded files in memory (RAM) temporarily
const upload = multer({ storage: multer.memoryStorage() });

// Initialize Google GenAI API
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// 3. THE API ENDPOINT
// This is where your app sends the photo and question
// POST http://localhost:3000/ask-moa
app.post('/ask-moa', upload.single('image'), async (req: Request, res: Response): Promise<any> => {
    try {
        // Check if file and question exist
        if (!req.file) {
            return res.status(400).json({ error: "No image uploaded" });
        }
        const userQuestion = req.body.question || "Explain what is in this image and solve it if it's a problem.";

        // Prepare image for AI
        const base64Data = req.file.buffer.toString("base64");
        
        // Generate content
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    {
                        text: userQuestion
                    },
                    {
                        inlineData: {
                            mimeType: req.file.mimetype,
                            data: base64Data
                        }
                    }
                ]
            }
        });

        const text = response.text;

        // Send answer back to the mobile app
        return res.json({ 
            success: true,
            answer: text 
        });

    } catch (error) {
        console.error("Error processing request:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// 4. START SERVER
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});