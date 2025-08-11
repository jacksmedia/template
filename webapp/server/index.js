// server/index.js
import { InferenceClient } from "@huggingface/inference";
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import 'dotenv/config';

const app = express();
const port = 3001;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initializes client with fal-ai provider
const client = new InferenceClient({
  apiKey: process.env.HF_TOKEN,
  provider: "fal-ai"
});

app.use(express.json({ limit: '10mb' }));
app.use(cors());
app.use(express.static(path.join(__dirname, 'build')));

// Serves React app
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Generates image using HF Inference API with fal-ai provider
app.post('/query', async (req, res) => {
  try {
    console.log('Received prompt:', req.body.prompt);
    
    // Uses base FLUX model
    const result = await client.textToImage({
      model: "black-forest-labs/FLUX.1-dev",
      inputs: req.body.prompt
    });

    // Converts Blob to Buffer, then to base64
    const buffer = Buffer.from(await result.arrayBuffer());
    const base64Image = buffer.toString('base64');

    console.log('Image generated successfully');
    res.json({ imageData: base64Image });
    
  } catch (error) {
    console.error("Error querying HuggingFace via fal-ai:", error);
    res.status(500).json({ 
      error: error.message,
      details: error.response?.data || 'Unknown error, no details available'
    });
  }
});

app.listen(port, () => console.log(`Server running on http://localhost:${port}`));