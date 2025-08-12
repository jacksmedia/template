// server/index.js
import { InferenceClient } from "@huggingface/inference";
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import 'dotenv/config';

const app = express();
const port = 3001;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Environment-based rate limiting configuration
const isDevelopment = process.env.NODE_ENV !== 'production';
const RATE_LIMIT_WINDOW = isDevelopment ? 60 * 1000 : 4 * 60 * 60 * 1000; // 1 minute dev, 4 hours prod
const RATE_LIMIT_MAX = isDevelopment ? 1 : 3; // More requests allowed in dev

console.log('=== Rate Limiting Config ===');
console.log('Environment:', isDevelopment ? 'Development' : 'Production');
console.log('Window:', RATE_LIMIT_WINDOW / 1000, 'seconds');
console.log('Max requests per window:', RATE_LIMIT_MAX);

// Debug environment variables
console.log('=== Environment Debug ===');
console.log('HF_TOKEN type:', typeof process.env.HF_TOKEN);
console.log('HF_TOKEN value:', process.env.HF_TOKEN ? 'EXISTS (hidden for security)' : 'MISSING');

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

// Initialize HuggingFace client with explicit provider
const client = new InferenceClient({
  apiKey: process.env.HF_TOKEN,
  provider: "hf" // Force HuggingFace's own inference instead of auto-selection
});

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
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Use IP address for rate limiting
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  },
  // Custom handler for when limit is exceeded
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
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many API requests',
    message: 'Too many requests from this IP, please try again later.'
  }
});

app.use(express.json({ limit: '10mb' }));
app.use(cors());
app.use(express.static(path.join(__dirname, 'build')));

// Trust proxy for accurate IP addresses (important for Vercel)
app.set('trust proxy', 1);

// Apply general rate limiting to all API routes
app.use('/api', apiLimiter);

// Serve React app
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Health check endpoint (not rate limited for monitoring)
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

// Test different providers endpoint
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

// Image generation endpoint with strict rate limiting
app.post('/query', imageGenerationLimiter, async (req, res) => {
  console.log('=== /query endpoint hit ===');
  console.log('IP:', req.ip);
  console.log('Request body:', req.body);
  
  try {
    console.log('Attempting to create image with prompt:', req.body.prompt);
    
    // Validate prompt
    if (!req.body.prompt || typeof req.body.prompt !== 'string') {
      return res.status(400).json({
        error: 'Invalid prompt',
        message: 'Prompt must be a non-empty string'
      });
    }

    // Limit prompt length to prevent abuse
    if (req.body.prompt.length > 500) {
      return res.status(400).json({
        error: 'Prompt too long',
        message: 'Prompt must be 500 characters or less'
      });
    }

    console.log('Using HuggingFace Inference API...');
    
    // Try with explicit provider first, fallback to auto if needed
    let result;
    try {
      console.log('Attempting with HF provider...');
      const hfClient = new InferenceClient({
        apiKey: process.env.HF_TOKEN,
        provider: "hf"
      });
      
      result = await hfClient.textToImage({
        model: "black-forest-labs/FLUX.1-schnell",
        inputs: req.body.prompt
      });
      console.log('✅ HF provider successful');
      
    } catch (providerError) {
      console.log('⚠️ HF provider failed, trying auto-selection...');
      console.log('Provider error:', providerError.message);
      
      // Fallback to auto-selection
      const autoClient = new InferenceClient(process.env.HF_TOKEN);
      result = await autoClient.textToImage({
        model: "black-forest-labs/FLUX.1-schnell",
        inputs: req.body.prompt
      });
      console.log('✅ Auto-selection successful');
    }

    console.log('HF API call successful, processing response...');

    // Convert Blob to Buffer, then to base64
    const buffer = Buffer.from(await result.arrayBuffer());
    const base64Image = buffer.toString('base64');

    console.log('✅ Image generated successfully, size:', base64Image.length);
    
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
    
    // Don't expose internal errors in production
    const errorMessage = isDevelopment ? error.message : 'Image generation failed';
    
    res.status(500).json({ 
      error: errorMessage,
      message: 'Failed to generate image. Please try again.',
      timestamp: new Date().toISOString()
    });
  }
});

app.listen(port, () => {
  console.log('=== Server Started ===');
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📊 Rate limiting: ${RATE_LIMIT_MAX} requests per ${RATE_LIMIT_WINDOW / 1000}s`);
  console.log(`🔒 Environment: ${isDevelopment ? 'Development' : 'Production'}`);
});