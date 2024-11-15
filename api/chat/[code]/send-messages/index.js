export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code } = req.query;
    const { user, message } = req.body;

    // Initialize global chats if it doesn't exist
    if (typeof global.chats === 'undefined') {
      global.chats = {};
    }

    const chat = global.chats[code];

    if (!chat) {
      console.log('Chat not found:', code); // Debug log
      return res.status(404).json({ error: 'Chat not found' });
    }

    const userMessages = chat.messages.filter(msg => msg.user === user);

    if (userMessages.length >= 5) {
      return res.status(403).json({ error: 'Message limit reached' });
    }

    if (!message || message.length > 200) {
      return res.status(400).json({ error: 'Invalid message' });
    }

    chat.messages.push({ user, message });
    console.log('Message added to chat:', code); // Debug log
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error sending message:', error); // Debug log
    res.status(500).json({ error: 'Failed to send message' });
  }
}