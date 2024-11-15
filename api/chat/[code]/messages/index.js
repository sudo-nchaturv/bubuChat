if (typeof global.chats === 'undefined') {
    global.chats = {};
  }
  
  export default function handler(req, res) {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    const { code } = req.query;
    const chat = global.chats[code];
  
    if (chat) {
      res.json({ messages: chat.messages });
    } else {
      res.status(404).json({ error: 'Chat not found' });
    }
  }