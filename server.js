// Solyvane API Proxy Server
// Deploy this to Render.com to keep your Anthropic API key secure
// Your API key is stored in Render's environment variables — never in this file

const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.post('/api/chat', async (req, res) => {
  try {
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
    res.json(data);

  } catch (error) {
    console.error('Proxy error:', error);
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
