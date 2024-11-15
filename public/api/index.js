const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));


let chats = {};

// Redirect root to home
app.get('/', (req, res) => {
  res.redirect('/home.html');
});

// API Routes
app.post('/api/new-chat', (req, res) => {
  console.log('New chat request received'); // Debug log
  const code = generateCode();
  chats[code] = { 
    messages: [], 
    createdAt: Date.now(),
    creatorRole: null
  };
  console.log('Created chat with code:', code); // Debug log
  res.json({ code });
});

app.get('/api/chat/:code/info', (req, res) => {
  const code = req.params.code;
  const chat = chats[code];
  
  if (chat && chat.creatorRole) {
    res.json({ creatorRole: chat.creatorRole });
  } else {
    res.status(404).json({ error: 'Chat not found or not started' });
  }
});

app.get('/api/chat/:code/messages', (req, res) => {
  const code = req.params.code;
  if (chats[code]) {
    res.json({ messages: chats[code].messages });
  } else {
    res.status(404).send('Chat not found');
  }
});

app.post('/api/chat/:code/send-message', (req, res) => {
  const code = req.params.code;
  const { user, message } = req.body;

  if (chats[code]) {
    const chat = chats[code];
    const userMessages = chat.messages.filter(msg => msg.user === user);

    if (userMessages.length < 5 && message.length <= 200) {
      chat.messages.push({ user, message });
      res.json({ success: true });
    } else {
      res.status(403).json({ error: 'Message limit reached or invalid message' });
    }
  } else {
    res.status(404).send('Chat not found');
  }
});

// Serve chat.html for chat routes
app.get('/chat/:code', (req, res) => {
  const code = req.params.code;
  const role = req.query.role;
  
  if (!chats[code]) {
    res.status(404).send('Chat not found');
    return;
  }
  
  if (!role || !['Bubu', 'Dudu'].includes(role)) {
    res.redirect('/home.html');
    return;
  }
  
  if (!chats[code].creatorRole) {
    chats[code].creatorRole = role;
  } else if (chats[code].creatorRole === role) {
    res.redirect('/home.html');
    return;
  }
  
  res.sendFile(path.join(__dirname, '../public/chat.html'));
});
  
  // Add this near your other routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

  res.sendFile(path.join(__dirname, '../public/chat.html'));
});

// Utility function to generate a unique 6-character code
function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Export the express app
module.exports = app;