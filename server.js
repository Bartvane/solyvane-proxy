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

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    console.log('Anthropic response status:', response.status);
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
