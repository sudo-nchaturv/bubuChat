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
        console.log('Supabase URL:', supabaseUrl);
        console.log('Supabase key exists:', !!supabaseKey);
        
        if (!supabase) {
            throw new Error('Supabase client not initialized');
        }

        const code = generateCode();
        console.log('Generated code:', code);

        // Test the chats table exists
        const { data: testData, error: testError } = await supabase
            .from('chats')
            .select('code')
            .limit(1);
            
        if (testError) {
            console.error('Error testing chats table:', testError);
            throw new Error('Failed to access chats table');
        }

        // Insert new chat
        const { data, error } = await supabase
            .from('chats')
            .insert([{
                code: code,
                created_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
            }])
            .select();

        if (error) {
            console.error('Error inserting chat:', error);
            throw error;
        }

        console.log('Chat created successfully:', code);
        res.json({ code });
    } catch (error) {
        console.error('Error in /api/new-chat:', error);
        res.status(500).json({ 
            error: 'Failed to create chat',
            message: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
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

// Add this debug route to test Supabase connection
app.get('/api/test-connection', async (req, res) => {
    try {
        console.log('Testing Supabase connection...');
        console.log('Supabase URL:', supabaseUrl);
        console.log('Supabase key exists:', !!supabaseKey);
        
        const { data, error } = await supabase
            .from('chats')
            .select('code')
            .limit(1);
            
        if (error) throw error;
        
        res.json({ success: true, message: 'Connection successful' });
    } catch (error) {
        console.error('Connection test failed:', error);
        res.status(500).json({ error: 'Connection test failed', details: error.message });
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
