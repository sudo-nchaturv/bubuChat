// Initialize global chats object if it doesn't exist
if (typeof global.chats === 'undefined') {
    global.chats = {};
  }
  
  function generateCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  
  export default function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    const code = generateCode();
    global.chats[code] = { 
      messages: [], 
      createdAt: Date.now(),
      creatorRole: null
    };
  
    res.status(200).json({ code });
  }