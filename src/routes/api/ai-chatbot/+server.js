import { json } from '@sveltejs/kit';
import { OPENROUTER_AI_KEY } from '$env/static/private';
import { KNOWLEDGE_BASE } from './knowledge-base.js';

export async function POST({ request }) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return json({ success: false, error: 'Invalid messages format' }, { status: 400 });
    }

    // Prepare the system message with knowledge base
    const systemMessage = {
      role: 'system',
      content: `You are a helpful assistant for a student document request system. Use the following knowledge base to answer questions accurately and concisely:

${KNOWLEDGE_BASE}

Guidelines:
- Be friendly, professional, and concise
- Answer based on the knowledge base provided
- If a question is not covered in the knowledge base, politely say you don't have that specific information
- Keep responses brief and to the point (2-3 sentences max unless more detail is needed)
- Use a conversational tone
- If asked about specific request details, remind them to check their dashboard or request history`
    };

    // Combine system message with user messages
    const fullMessages = [systemMessage, ...messages];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_AI_KEY}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'SET-2 System',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'kwaipilot/kat-coder-pro:free',
        messages: fullMessages
      })
    });

    if (!response.ok) {
      throw new Error('OpenRouter API request failed');
    }

    const result = await response.json();
    const reply = result.choices[0].message.content;

    return json({ success: true, reply });
  } catch (error) {
    console.error('AI Chatbot Error:', error);
    return json({ success: false, error: error.message }, { status: 500 });
  }
}
