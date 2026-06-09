// Solyvane API Proxy Server
// Deploy this to Render.com to keep your Anthropic API key secure

const express = require('express');
const cors = require('cors');
const app = express();

// Allow requests from any origin - fixes CORS errors
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight OPTIONS requests
app.options('*', cors());

app.use(express.json());

app.post('/api/chat', async (req, res) => {
  try {
    console.log('Request received from:', req.headers.origin || 'unknown');
    console.log('Request body:', JSON.stringify(req.body).substring(0, 200));

    // Build clean request body for Anthropic
    const anthropicBody = {
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      system: req.body.system,
      messages: req.body.messages
    };

    console.log('Sending to Anthropic:', JSON.stringify(anthropicBody).substring(0, 200));

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(anthropicBody)
    });

    const data = await response.json();
    console.log('Anthropic response status:', response.status);
    console.log('Anthropic response:', JSON.stringify(data).substring(0, 200));
    res.json(data);

  } catch (error) {
    console.error('Proxy error:', error.message);
    res.status(500).json({ error: 'Proxy error — please try again' });
  }
});

app.get('/', (req, res) => {
  res.send('Solyvane API Proxy — running');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Solyvane proxy running on port ${PORT}`);
});
