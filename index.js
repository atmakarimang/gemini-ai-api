const express = require('express');
const dotenv = require('dotenv');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');
const { text } = require('stream/consumers');

dotenv.config();
const app = express();
app.use(express.json());

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const model = async (contents) => await genAI.models.generateContent({
  model: 'models/gemini-2.0-flash',
  contents
});

const upload = multer({ dest: 'uploads/' });

const imageToGenerativePart = (filePath) => ({
    inlineData: {
      data: fs.readFileSync(filePath).toString('base64'),
      mimeType: 'image/png',
    },
})

app.post('/generate-from-text', async (req, res) => {
    const { prompt } = req.body;
    
    try {
        const result = await model(prompt);
        res.json({output: result.text});
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate content' });
    }
});

app.post('/generate-from-image', upload.single('image'), async (req, res) => {
    const prompt = req.body.prompt || 'Gambar apakah ini?';
    
    const image = imageToGenerativePart(req.file.path);
    
    try {
        const result = await model([prompt, image]);
        res.json({ output: result.text });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        fs.unlinkSync(filePath);
    }

});

app.post('/generate-from-audio', upload.single('audio'), async (req, res) => {
    const audioBuffer = fs.readFileSync(req.file.path);
    const audioBase64 = audioBuffer.toString('base64');
    
    const audioPart = {
        inlineData: {
            data: audioBase64,
            mimeType: req.file.mimetype,
        },
    };
    
    try {
        const result = await model([
            'Transcribe this audio to text:',
            audioPart
        ]);
        res.json({ output: result.text });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        fs.unlinkSync(filePath);
    }
});

app.post('/generate-from-document', upload.single('document'), async (req, res) => {
    const filePath = req.file.path;
    const buffer = fs.readFileSync(filePath);
    const fileBase64 = buffer.toString('base64');
    const mimeType = req.file.mimetype;
    
    try {
        documentPart = {
            inlineData: {
                data: fileBase64,
                mimeType: mimeType,
            },
        };
        
        const result = await model([
            'Analisa dokumen ini, intinya apa, pakai bahasa indo:',
            documentPart
        ]);
        res.json({ output: result.text });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        fs.unlinkSync(filePath);
    }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});