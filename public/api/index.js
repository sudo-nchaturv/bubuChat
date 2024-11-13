const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

let chats = {};

// Redirect root to home
app.get('/', (req, res) => {
  res.redirect('/home.html');
});

// Update all your routes to include /api prefix
app.post('/api/new-chat', (req, res) => {
  const code = generateCode();
  chats[code] = { 
    messages: [], 
    createdAt: Date.now(),
    creatorRole: null
  };
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

// Keep your utility functions
function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Export the express app
module.exports = app;