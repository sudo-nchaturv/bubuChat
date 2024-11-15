const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Generate unique code
function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Create new chat
app.post('/api/new-chat', async (req, res) => {
  try {
    const code = generateCode();
    
    const { error } = await supabase
      .from('chats')
      .insert([{ code }]);

    if (error) throw error;

    res.json({ code });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to create chat' });
  }
});

// Get chat info
app.get('/api/chat/:code/info', async (req, res) => {
  try {
    const { code } = req.params;
    
    const { data: chat, error } = await supabase
      .from('chats')
      .select('*')
      .eq('code', code)
      .single();

    if (error) throw error;
    
    if (chat) {
      res.json({ creatorRole: chat.creator_role });
    } else {
      res.status(404).json({ error: 'Chat not found' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to get chat info' });
  }
});

// Get messages
app.get('/api/chat/:code/messages', async (req, res) => {
  try {
    const { code } = req.params;

    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .select('*')
      .eq('code', code)
      .single();

    if (chatError || !chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_code', code)
      .order('created_at', { ascending: true });

    if (messagesError) throw messagesError;

    res.json({ messages: messages.map(m => ({
      user: m.user_role,
      message: m.message
    })) });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// Send message
app.post('/api/chat/:code/send-message', async (req, res) => {
  try {
    const { code } = req.params;
    const { user, message } = req.body;

    if (!message || message.length > 200) {
      return res.status(400).json({ error: 'Invalid message length' });
    }

    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .select('*')
      .eq('code', code)
      .single();

    if (chatError || !chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const { data: messageCount, error: countError } = await supabase
      .from('messages')
      .select('id', { count: 'exact' })
      .eq('chat_code', code)
      .eq('user_role', user);

    if (countError) throw countError;

    if (messageCount.length >= 5) {
      return res.status(403).json({ error: 'Message limit reached' });
    }

    const { error: insertError } = await supabase
      .from('messages')
      .insert([{ 
        chat_code: code, 
        user_role: user, 
        message 
      }]);

    if (insertError) throw insertError;

    res.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Serve static files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/home.html'));
});

app.get('/chat/:code', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/chat.html'));
});

// Export the express app
module.exports = app;
