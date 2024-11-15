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
    
    if (chat && chat.creatorRole) {
      console.log('Returning info for chat:', code); // Debug log
      res.status(200).json({ creatorRole: chat.creatorRole });
    } else {
      console.log('Chat not found or not started:', code); // Debug log
      res.status(404).json({ error: 'Chat not found or not started' });
    }
  } catch (error) {
    console.error('Error getting chat info:', error); // Debug log
    res.status(500).json({ error: 'Failed to get chat info' });
  }
}