import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// CORS configuration - only allow your app
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like Electron apps, mobile apps, curl)
    if (!origin) return callback(null, true);
    
    // Add your production domain here if you deploy to web
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use('/api/', limiter);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'SET-2 OpenRouter Proxy Server' });
});

// Proxy endpoint for OpenRouter chat completions
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, model } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid request: messages array required' 
      });
    }

    // Use the API key from environment variable (never exposed to client)
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY_DESKTOP || process.env.OPENROUTER_API_KEY;
    
    if (!OPENROUTER_API_KEY) {
      console.error('OPENROUTER_API_KEY_DESKTOP or OPENROUTER_API_KEY not configured');
      return res.status(500).json({ 
        success: false, 
        error: 'Server configuration error' 
      });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
        'X-Title': 'SET-2 System',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'meta-llama/llama-3.2-3b-instruct:free',
        messages: messages
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenRouter API error:', errorData);
      return res.status(response.status).json({ 
        success: false, 
        error: 'OpenRouter API request failed',
        details: errorData
      });
    }

    const result = await response.json();
    res.json({ 
      success: true, 
      data: result 
    });

  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Proxy server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
