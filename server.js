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

    const body = { ...req.body };

    // MODEL CONTROL: if the ANTHROPIC_MODEL environment variable is set on
    // Render, it overrides whatever model name the website pages send. That
    // lets us switch models (e.g. when Anthropic retires one) by changing a
    // single setting here instead of editing and re-uploading every page.
    // If the variable is NOT set, behavior is exactly as before (the page's
    // own model name is used), so removing the variable is an instant rollback.
    if (process.env.ANTHROPIC_MODEL) {
      body.model = process.env.ANTHROPIC_MODEL;
    }

    // SONNET 5.x COMPATIBILITY. These models "think" before answering by
    // default, which (a) puts a thinking block BEFORE the text in the reply
    // (the pages read the first block as the answer) and (b) counts thinking
    // tokens against max_tokens. Our pages need plain, fast answers, so we
    // turn up-front thinking off with the setting Sonnet 5.5 accepts for that
    // ("between_tools"), and give max_tokens extra headroom because the newer
    // models use roughly 30% more tokens for the same text.
    if (typeof body.model === 'string' && body.model.startsWith('claude-sonnet-5-5')) {
      if (!body.thinking) {
        body.thinking = { type: 'between_tools' };
      }
      if (typeof body.max_tokens === 'number') {
        body.max_tokens = Math.ceil(body.max_tokens * 1.4);
      }
    }

    // Enable prompt caching on the system prompt. Every council page sends
    // the same large, unchanging system prompt (all persona instructions)
    // on every request — caching it means Anthropic reuses that processed
    // block instead of reprocessing it from scratch each time, at a 90%
    // discount on the cached portion for any request that hits the cache
    // within the 5-minute window. This only transforms plain-string system
    // prompts — if a request ever sends something else, it passes through
    // unchanged rather than risk breaking it.
    if (typeof body.system === 'string') {
      body.system = [
        {
          type: 'text',
          text: body.system,
          cache_control: { type: 'ephemeral' }
        }
      ];
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    // Safety net for any model: keep only the plain-text parts of the reply so
    // the pages' "first block is the answer" logic always finds text.
    if (data && Array.isArray(data.content)) {
      const textBlocks = data.content.filter(b => b && b.type === 'text');
      if (textBlocks.length > 0) {
        data.content = textBlocks;
      }
    }
    console.log('Anthropic response status:', response.status, 'model:', body.model);
    if (data.usage) {
      console.log('Token usage:', JSON.stringify(data.usage));
    }
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
