const chats = {};

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

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
    const code = generateCode();
    if (typeof global.chats === 'undefined') {
      global.chats = {};
    }
    
    global.chats[code] = { 
      messages: [], 
      createdAt: Date.now(),
      creatorRole: null
    };

    console.log('Created new chat with code:', code); // Debug log
    res.status(200).json({ code });
  } catch (error) {
    console.error('Error creating chat:', error); // Debug log
    res.status(500).json({ error: 'Failed to create chat' });
  }
}