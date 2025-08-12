// server/index.js
import { InferenceClient } from "@huggingface/inference";
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import 'dotenv/config';
// import { stat } from "fs";

const app = express();
const port = 3001;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Rate limiting tied to app's environment
const isDevelopment = process.env.NODE_ENV !== 'production';
const RATE_LIMIT_WINDOW = isDevelopment ? 60 * 1000 : 4 * 60 * 60 * 1000 // 1m in dev; 4hrs in prod
const RATE_LIMIT_MAX = isDevelopment ? 1 : 2 // 1 req per window in dev; 2 in prod

console.log('=== Rate Limiting Config ===');
console.log('Environment:', isDevelopment ? 'Development' : 'Production');
console.log('Window:', RATE_LIMIT_WINDOW / 1000, 'seconds');
console.log('Max requests per window:', RATE_LIMIT_MAX);


// Initialize client with fal-ai provider
const client = new InferenceClient({
  apiKey: process.env.HF_TOKEN,
  provider: "hf" // Opt for HuggingFace, NOT auto selection of 3rd parties
});

////////////////////////////////////////////////
// Rate limiting middleware for image generation
const imageGenerationLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW,
  max: RATE_LIMIT_MAX,
  message: {
    error: 'Too many image generation requests',
    message: `You can only generate ${RATE_LIMIT_MAX} images per ${isDevelopment ? 'minute' : '4 hours'}. Please try again later.`,
    retryAfter: Math.ceil(RATE_LIMIT_WINDOW / 1000),
    resetTime: new Date(Date.now() + RATE_LIMIT_WINDOW).toISOString()
  },
  standardHeaders: true, // Returns rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disables the `X-RateLimit-*` headers
  // Uses IP address for rate limiting 🧐
  keyGenerator: (req) => {
    return req.ip || req.socket.remoteAddress;
  },
  // Custom handler, when limit is exceeded
  handler: (req, res) => {
    console.log(`❌ Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many requests',
      message: `Rate limit exceeded. You can make ${RATE_LIMIT_MAX} requests per ${isDevelopment ? 'minute' : '4 hours'}.`,
      retryAfter: Math.ceil(RATE_LIMIT_WINDOW / 1000),
      resetTime: new Date(Date.now() + RATE_LIMIT_WINDOW).toISOString()
    });
  }
});

// General API rate limiter (more lenient for non-generation endpoints)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1, // Limits each IP to 1 request per windowMs
  message: {
    error: 'Too many API requests',
    message: 'Too many requests from this IP, please try again later.'
  }
});
//////////////////////////////////////////////// end middleware

// Main server configs
app.use(express.json({ limit: '10mb' }));
app.use(cors());
app.use(express.static(path.join(__dirname, 'build')));

// Deployed server configs
app.set('trust proxy', 1);
app.use('/api', apiLimiter);

// Serve React app
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Health check endpoint (not rate limited)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: isDevelopment ? 'development' : 'production',
    rateLimits: {
      imageGeneration: {
        windowMs: RATE_LIMIT_WINDOW,
        maxRequests: RATE_LIMIT_MAX
      }
    }
  });
});


// Rate limit status endpoint
app.get('/api/rate-limit-status', apiLimiter, (req, res) => {
  res.json({
    message: 'Rate limit status',
    limits: {
      imageGeneration: {
        windowSeconds: RATE_LIMIT_WINDOW / 1000,
        maxRequests: RATE_LIMIT_MAX,
        environment: isDevelopment ? 'development' : 'production'
      },
      api: {
        windowSeconds: 15 * 60,
        maxRequests: 100
      }
    }
  });
});


// Tests different providers' endpoints
app.post('/api/test-providers', apiLimiter, async (req, res) => {
  const providers = ['hf', 'fal-ai'];
  const results = {};
  
  for (const provider of providers) {
    try {
      console.log(`Testing provider: ${provider}`);
      const testClient = new InferenceClient({
        apiKey: process.env.HF_TOKEN,
        provider: provider
      });
      
      // Quick test with a simple prompt
      await testClient.textToImage({
        model: "black-forest-labs/FLUX.1-schnell",
        inputs: "test image"
      });
      
      results[provider] = { status: 'working', error: null };
      console.log(`✅ Provider ${provider} working`);
      
    } catch (error) {
      results[provider] = { 
        status: 'failed', 
        error: error.message,
        type: error.constructor.name 
      };
      console.log(`❌ Provider ${provider} failed:`, error.message);
    }
  }
  
  res.json({
    message: 'Provider test results',
    results: results,
    timestamp: new Date().toISOString()
  });
});







// Image gen query with rate limiting logic
app.post('/query', imageGenerationLimiter, async (req, res) => {
  console.log('=== /query endpoint hit ===');
  console.log('IP:', req.ip);
  console.log('Request body:', req.body);
  
  try {
    console.log('Attempting to create image with prompt:', req.body.prompt);
        
    // Prompt validation
    if (!req.body.prompt || typeof req.body.prompt !== 'string') {
      return res.status(400).json({
        error: 'Invalid prompt',
        message: 'Prompt must be a text string'
      });
    }

    // Limits prompt size for many reasons
    if (req.body.prompt.length > 500) {
      return res.status(400).json({
        error: 'Prompt too long',
        message: 'Prompt cannot be longer than 500 characters'
      });
    }

    console.log('Using HuggingFace Inference API to run FLUX model...');
    const result = await client.textToImage({
      model: "black-forest-labs/FLUX.1-schnell", // vs default FLUX
      inputs: req.body.prompt
    });

    console.log('HF API call successful, processing response...');

    // Converts Blob to Buffer, then to base64
    const buffer = Buffer.from(await result.arrayBuffer());
    const base64Image = buffer.toString('base64');

    console.log('Image generated successfully, size:', base64Image.length);
    
    res.json({
      imageData: base64Image,
      meta: {
        model: "black-forest-labs/FLUX.1-schnell",
        timestamp: new Date().toISOString(),
        promptLength: req.body.prompt.length
      }
    });
    
  } catch (error) {
    console.error("❌ Detailed error information:");
    console.error("Error message:", error.message);
    console.error("Error type:", error.constructor.name);
    
    // Won't expose internal errors in production
    const errorMessage = isDevelopment ? error.message : 'Image generation failed';
    
    res.status(500).json({ 
      error: errorMessage,
      message: 'Failed to generate image. Please try again.',
      timestamp: new Date().toISOString()
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log(`📊 Rate limiting: ${RATE_LIMIT_MAX} requests per ${RATE_LIMIT_WINDOW / 1000}s`);
  console.log(`🔒 Environment: ${isDevelopment ? 'Development' : 'Production'}`);
});