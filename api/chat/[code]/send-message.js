if (typeof global.chats === 'undefined') {
    global.chats = {};
  }
  
  export default function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    const { code } = req.query;
    const { user, message } = req.body;
    const chat = global.chats[code];
  
    if (chat) {
      const userMessages = chat.messages.filter(msg => msg.user === user);
  
      if (userMessages.length < 5 && message.length <= 200) {
        chat.messages.push({ user, message });
        res.json({ success: true });
      } else {
        res.status(403).json({ error: 'Message limit reached or invalid message' });
      }
    } else {
      res.status(404).json({ error: 'Chat not found' });
    }
  }