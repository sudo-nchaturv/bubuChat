const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

let chats = {};  // Note: This will reset on each server restart on Vercel


// Utility function to generate a unique 6-character code
function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Serve the home page
app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

// Create a new chat
app.post('/new-chat', (req, res) => {
  const code = generateCode();
  chats[code] = { 
    messages: [], 
    createdAt: Date.now(),
    creatorRole: null  // We'll set this when the creator starts the chat
  };
  res.json({ code });
});

// Serve the chat page if it exists
app.get('/chat/:code', (req, res) => {
  const code = req.params.code;
  const role = req.query.role;
  
  if (!chats[code]) {
    res.status(404).send('Chat not found');
    return;
  }
  
  if (!role || !['Bubu', 'Dudu'].includes(role)) {
    res.redirect('/home');
    return;
  }
  
  if (!chats[code].creatorRole) {
    chats[code].creatorRole = role;
  } else if (chats[code].creatorRole === role) {
    res.redirect('/home');
    return;
  }
  
  res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

// Return messages for a chat
app.get('/chat/:code/messages', (req, res) => {
  const code = req.params.code;
  if (chats[code]) {
    res.json({ messages: chats[code].messages });
  } else {
    res.status(404).send('Chat not found');
  }
});

// Post a message to a chat
app.post('/chat/:code/send-message', (req, res) => {
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

// Automatically delete chats after 48 hours
setInterval(() => {
  const now = Date.now();
  for (const code in chats) {
    if (now - chats[code].createdAt > 48 * 60 * 60 * 1000) {
      delete chats[code];
    }
  }
}, 60 * 60 * 1000);  // Run every hour

// Add this new endpoint
app.get('/chat/:code/info', (req, res) => {
  const code = req.params.code;
  const chat = chats[code];
  
  if (chat && chat.creatorRole) {
    res.json({ creatorRole: chat.creatorRole });
  } else {
    res.status(404).json({ error: 'Chat not found or not started' });
  }
});

module.exports = app;
