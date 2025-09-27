const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
// ... your existing imports

dotenv.config({ path: path.join(__dirname, ".env") });

const { respondToUserQuery } = require('./agent2');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// API endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message} = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Invalid request: "message" is required.' });
    }
    
    // Use your existing respondToUserQuery function
    const reply = await respondToUserQuery(message);
    
    res.json({ reply });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      reply: language === 'ja' 
        ? 'エラーが発生しました。もう一度お試しください。'
        : 'Sorry, there was an error. Please try again.'
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
