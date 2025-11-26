import { j as json } from './index-CccDCyu_.js';
import { O as OPENROUTER_AI_KEY } from './private-B7ipAEIf.js';

const KNOWLEDGE_BASE = `
Q: Can I submit multiple requests at once?
A: Yes. Most systems allow you to queue up or submit several document requests simultaneously.

Q: What types of documents are typically available?
A: Available documents usually include official records, certificates, transcripts, diplomas, and grade reports.

Q: Is stating the purpose of the request necessary?
A: Yes. You are typically required to state the purpose for your request to ensure proper processing and documentation.

Q: How do I cancel a request?
A: You can usually cancel a request through your personal dashboard or in the dedicated conversation/chat system associated with the request.

Q: What should I do if my request is rejected?
A: If your request is rejected or you submitted the wrong type, cancel the initial request (if possible) and submit a new, corrected one.

Q: How long does document processing usually take?
A: Processing times vary significantly, but standard requests typically take 3-5 working days unless otherwise notified.

Q: How can I track the status of my request?
A: You can monitor your request status in real-time on your user dashboard, notification section, or within the communication thread with the administration.

Q: What does "For Verifying" mean?
A: The admin is reviewing your request details, attached files, and payment confirmation.

Q: What does "For Processing" mean?
A: Your request has been accepted and is currently being prepared by the relevant office.

Q: What does "On Hold" mean?
A: Your request is temporarily paused, often due to an issue that requires the admin to check or verify a file or detail.

Q: What does "Released" or "Ready for Pickup" mean?
A: Your document has been finalized and is ready for collection or has been collected.

Q: When will I know the document's release date?
A: A tentative release date is usually provided once your request has been verified and moves to the "For Processing" status. This date may be subject to change.

Q: Do I need to upload any files?
A: Only if specifically requested by the system or the administrator.

Q: What if the file I need to upload is too big?
A: You should compress your file or upload a lower-resolution version, ensuring the text remains clear and readable.

Q: Can I communicate directly with the staff processing my document?
A: Direct contact is usually limited. Communication is typically managed through the official private chat or messaging system.

Q: Is the system/chatbot available 24/7?
A: System availability for basic functions and chatbot inquiries is often 24/7, though staff assistance will only be available during working hours.

Q: Are online payment options available?
A: We do not generally allow online payments for document requests. The system will typically generate a receipt or reference number which you must use to complete the payment at a designated payment center or office.

Q: What do I need to bring to claim my document?
A: You must bring the required proof of payment and request, typically the systemgenerated receipt and the physical "Paid" receipt

Q: How much is the document fee?
A: Fees vary per document type. You can view the price of the document on the document request form.
`;
async function POST({ request }) {
  try {
    const { messages } = await request.json();
    if (!messages || !Array.isArray(messages)) {
      return json({ success: false, error: "Invalid messages format" }, { status: 400 });
    }
    const systemMessage = {
      role: "system",
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
    const fullMessages = [systemMessage, ...messages];
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_AI_KEY}`,
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "SET-2 System",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "kwaipilot/kat-coder-pro:free",
        messages: fullMessages
      })
    });
    if (!response.ok) {
      throw new Error("OpenRouter API request failed");
    }
    const result = await response.json();
    const reply = result.choices[0].message.content;
    return json({ success: true, reply });
  } catch (error) {
    console.error("AI Chatbot Error:", error);
    return json({ success: false, error: error.message }, { status: 500 });
  }
}

export { POST };
//# sourceMappingURL=_server-B8QlWKdR.js.map
