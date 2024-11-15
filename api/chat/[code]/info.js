if (typeof global.chats === 'undefined') {
    global.chats = {};
  }
  
  export default function handler(req, res) {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    const { code } = req.query;
    const chat = global.chats[code];
    
    if (chat && chat.creatorRole) {
      res.json({ creatorRole: chat.creatorRole });
    } else {
      res.status(404).json({ error: 'Chat not found or not started' });
    }
  }