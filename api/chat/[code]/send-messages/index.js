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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code } = req.query;
    const { user: user_role, message } = req.body;

    // Check message length
    if (!message || message.length > 200) {
      return res.status(400).json({ error: 'Invalid message length' });
    }

    // Check if chat exists and hasn't expired
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .select('*')
      .eq('code', code)
      .single();

    if (chatError || !chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Check message limit
    const { data: messageCount, error: countError } = await supabase
      .from('messages')
      .select('id', { count: 'exact' })
      .eq('chat_code', code)
      .eq('user_role', user_role);

    if (countError) throw countError;

    if (messageCount.length >= 5) {
      return res.status(403).json({ error: 'Message limit reached' });
    }

    // Insert message
    const { error: insertError } = await supabase
      .from('messages')
      .insert([{ chat_code: code, user_role, message }]);

    if (insertError) throw insertError;

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
}