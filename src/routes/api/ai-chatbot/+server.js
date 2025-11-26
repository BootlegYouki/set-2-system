import { json } from '@sveltejs/kit';
import { PROXY_SERVER_URL } from '$lib/config/proxy.js';
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

		// Call the proxy server instead of OpenRouter directly
		const response = await fetch(`${PROXY_SERVER_URL}/api/chat`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				model: 'kwaipilot/kat-coder-pro:free',
				messages: fullMessages
			})
		});

		if (!response.ok) {
			throw new Error('Proxy API request failed');
		}

		const result = await response.json();
		if (!result.success) {
			throw new Error(result.error || 'API request failed');
		}
		const reply = result.data.choices[0].message.content;    return json({ success: true, reply });
  } catch (error) {
    console.error('AI Chatbot Error:', error);
    return json({ success: false, error: error.message }, { status: 500 });
  }
}
