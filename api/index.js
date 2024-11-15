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

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Generate unique code
function generateCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Routes
app.post('/api/new-chat', async (req, res) => {
    try {
        console.log('Creating new chat...');
        const code = generateCode();
        
        const { error } = await supabase
            .from('chats')
            .insert([{
                code: code,
                created_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
            }]);

        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }

        console.log('Chat created with code:', code);
        res.json({ code });
    } catch (error) {
        console.error('Error creating chat:', error);
        res.status(500).json({ error: 'Failed to create chat' });
    }
});

app.get('/api/chat/:code/info', async (req, res) => {
    try {
        const { code } = req.params;
        const { data, error } = await supabase
            .from('chats')
            .select('creator_role')
            .eq('code', code)
            .single();

        if (error) throw error;
        res.json({ creatorRole: data?.creator_role });
    } catch (error) {
        console.error('Error getting chat info:', error);
        res.status(500).json({ error: 'Failed to get chat info' });
    }
});

app.get('/api/chat/:code/messages', async (req, res) => {
    try {
        const { code } = req.params;
        const { data, error } = await supabase
            .from('messages')
            .select('user_role,message,created_at')
            .eq('chat_code', code)
            .order('created_at', { ascending: true });

        if (error) throw error;
        res.json({ messages: data.map(m => ({
            user: m.user_role,
            message: m.message
        })) });
    } catch (error) {
        console.error('Error getting messages:', error);
        res.status(500).json({ error: 'Failed to get messages' });
    }
});

app.post('/api/chat/:code/send-message', async (req, res) => {
    try {
        const { code } = req.params;
        const { user, message } = req.body;

        if (!message || message.length > 200) {
            return res.status(400).json({ error: 'Invalid message' });
        }

        const { data: messages } = await supabase
            .from('messages')
            .select('id')
            .eq('chat_code', code)
            .eq('user_role', user);

        if (messages && messages.length >= 5) {
            return res.status(403).json({ error: 'Message limit reached' });
        }

        const { error } = await supabase
            .from('messages')
            .insert([{
                chat_code: code,
                user_role: user,
                message: message
            }]);

        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        console.error('Error sending message:', error);
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

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

module.exports = app;
