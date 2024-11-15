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

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code } = req.query;
    
    // Initialize global chats if it doesn't exist
    if (typeof global.chats === 'undefined') {
      global.chats = {};
    }

    const chat = global.chats[code];

    if (chat) {
      console.log('Returning messages for chat:', code); // Debug log
      res.status(200).json({ messages: chat.messages });
    } else {
      console.log('Chat not found:', code); // Debug log
      res.status(404).json({ error: 'Chat not found' });
    }
  } catch (error) {
    console.error('Error getting messages:', error); // Debug log
    res.status(500).json({ error: 'Failed to get messages' });
  }
}