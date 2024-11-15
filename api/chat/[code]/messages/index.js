import { supabase } from '../../../../lib/supabase';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code } = req.query;

    // First check if chat exists and hasn't expired
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .select('*')
      .eq('code', code)
      .single();

    if (chatError || !chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Get messages for this chat
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_code', code)
      .order('created_at', { ascending: true });

    if (messagesError) throw messagesError;

    res.status(200).json({ messages });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
}