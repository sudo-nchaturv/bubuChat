if (typeof global.chats === 'undefined') {
    global.chats = {};
  }
  
  export default function handler(req, res) {
    const { code } = req.query;
    const role = req.query.role;
    
    if (!global.chats[code]) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    
    if (!role || !['Bubu', 'Dudu'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    if (!global.chats[code].creatorRole) {
      global.chats[code].creatorRole = role;
    } else if (global.chats[code].creatorRole === role) {
      return res.status(400).json({ error: 'Role already taken' });
    }
    
    res.json({ success: true });
  }