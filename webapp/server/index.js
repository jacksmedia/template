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

// Debug environment variables
console.log('=== Environment Debug ===');
console.log('HF_TOKEN type:', typeof process.env.HF_TOKEN);
console.log('HF_TOKEN value:', process.env.HF_TOKEN ? 'EXISTS (hidden for security)' : 'MISSING');
console.log('HF_TOKEN length:', process.env.HF_TOKEN ? process.env.HF_TOKEN.length : 'N/A');

// Validate token before creating client
if (!process.env.HF_TOKEN) {
  console.error('❌ HF_TOKEN is missing from environment variables');
  process.exit(1);
}

if (typeof process.env.HF_TOKEN !== 'string') {
  console.error('❌ HF_TOKEN is not a string:', typeof process.env.HF_TOKEN);
  process.exit(1);
}

if (!process.env.HF_TOKEN.startsWith('hf_')) {
  console.error('❌ HF_TOKEN does not start with hf_');
  process.exit(1);
}

console.log('✅ HF_TOKEN validation passed');

// Initialize client with fal-ai provider
const client = new InferenceClient({
  apiKey: process.env.HF_TOKEN,
  provider: "fal-ai"
});

app.use(express.json({ limit: '10mb' }));
app.use(cors());
app.use(express.static(path.join(__dirname, 'build')));

// Serve React app
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Simple test endpoint
app.get('/test', (req, res) => {
  console.log('Test endpoint hit');
  res.json({ message: 'Server is working!', timestamp: new Date().toISOString() });
});

// Health check endpoint
app.post('/health', (req, res) => {
  console.log('Health check endpoint hit');
  res.json({ status: 'ok', body: req.body });
});

// Generate image using HF Inference API with fal-ai provider
app.post('/query', async (req, res) => {
  console.log('=== /query endpoint hit ===');
  console.log('Request body:', req.body);
  
  try {
    console.log('Attempting to create image with prompt:', req.body.prompt);
    
    // Tries with just the token first (no provider) to test basic connectivity
    console.log('Testing basic HF connection...');
    const basicClient = new InferenceClient(process.env.HF_TOKEN);
    
    // Tests with simple, fast model first
    console.log('Using basic client with FLUX model...');
    const result = await basicClient.textToImage({
      model: "black-forest-labs/FLUX.1-schnell", // Faster version for testing
      inputs: req.body.prompt
    });

    console.log('HF API call successful, processing response...');
    console.log('Result type:', typeof result);
    console.log('Result constructor:', result.constructor.name);

    // Converts Blob to Buffer, then to base64
    const buffer = Buffer.from(await result.arrayBuffer());
    const base64Image = buffer.toString('base64');

    console.log('Image generated successfully, size:', base64Image.length);
    res.json({ imageData: base64Image });
    
  } catch (error) {
    console.error("Detailed error information:");
    console.error("Error message:", error.message);
    console.error("Error type:", error.constructor.name);
    console.error("Error stack:", error.stack);
    if (error.response) {
      console.error("Error response status:", error.response.status);
      console.error("Error response data:", error.response.data);
    }
    
    res.status(500).json({ 
      error: error.message,
      type: error.constructor.name,
      details: error.response?.data || 'No additional details available'
    });
  }
});

app.listen(port, () => console.log(`Server running on http://localhost:${port}`));