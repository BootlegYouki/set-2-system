<script>
	import { onMount } from 'svelte';
	import './studentChatbot.css';

	// Chatbot state
	let isOpen = $state(false);
	let messages = $state([]);
	let inputMessage = $state('');
	let isLoading = $state(false);
	let chatContainer = $state(null);
	let inputElement = $state(null);

	// Load chat from local storage on mount
	onMount(() => {
		const savedChat = localStorage.getItem('student_chatbot_history');
		if (savedChat) {
			try {
				const parsed = JSON.parse(savedChat);
				// Convert timestamp strings back to Date objects
				messages = parsed.map(msg => ({
					...msg,
					timestamp: new Date(msg.timestamp)
				}));
			} catch (e) {
				console.error('Failed to parse saved chat', e);
			}
		}
	});

	// Save chat to local storage whenever messages change
	$effect(() => {
		if (messages.length > 0) {
			localStorage.setItem('student_chatbot_history', JSON.stringify(messages));
		}
	});

	// Toggle chatbot
	function toggleChatbot() {
		isOpen = !isOpen;
		if (isOpen && messages.length === 0) {
			// Add welcome message
			messages = [{
				role: 'assistant',
				content: 'Hi! 👋 I\'m here to help you with your document requests. Feel free to ask me anything about the process, statuses, or requirements!',
				timestamp: new Date()
			}];
		}
		// Scroll to bottom when opening if there are messages
		if (isOpen) {
			setTimeout(scrollToBottom, 100);
		}
	}

	// Send message
	async function sendMessage() {
		if (!inputMessage.trim() || isLoading) return;

		const userMessage = inputMessage.trim();
		inputMessage = '';

		// Add user message to chat
		messages = [...messages, {
			role: 'user',
			content: userMessage,
			timestamp: new Date()
		}];

		// Scroll to bottom
		setTimeout(scrollToBottom, 100);

		// Set loading state
		isLoading = true;

		try {
			// Prepare messages for API (only role and content)
			const apiMessages = messages
				.filter(msg => msg.role !== 'system')
				.map(msg => ({
					role: msg.role,
					content: msg.content
				}));

			const response = await fetch('/api/ai-chatbot', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ messages: apiMessages })
			});

			const data = await response.json();

			if (data.success) {
				// Add assistant response
				messages = [...messages, {
					role: 'assistant',
					content: data.reply,
					timestamp: new Date()
				}];
			} else {
				// Add error message
				messages = [...messages, {
					role: 'assistant',
					content: 'Sorry, I encountered an error. Please try again later.',
					timestamp: new Date()
				}];
			}
		} catch (error) {
			console.error('Chatbot error:', error);
			messages = [...messages, {
				role: 'assistant',
				content: 'Sorry, I couldn\'t connect to the server. Please check your connection and try again.',
				timestamp: new Date()
			}];
		} finally {
			isLoading = false;
			setTimeout(() => {
				scrollToBottom();
				if (inputElement) inputElement.focus();
			}, 100);
		}
	}

	// Handle Enter key
	function handleKeyPress(event) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			sendMessage();
		}
	}

	// Scroll to bottom of chat
	function scrollToBottom() {
		if (chatContainer) {
			chatContainer.scrollTop = chatContainer.scrollHeight;
		}
	}

	// Format timestamp
	function formatTime(date) {
		return date.toLocaleTimeString('en-US', { 
			hour: '2-digit', 
			minute: '2-digit' 
		});
	}

	// Suggested questions
	const suggestedQuestions = [
		'Is there a free document request?',
		'How do I pay for my request?',
		'Can I cancel my request?'
	];

	function askSuggested(question) {
		inputMessage = question;
		sendMessage();
	}
	// Reset chat
	function resetChat() {
		localStorage.removeItem('student_chatbot_history');
		messages = [{
			role: 'assistant',
			content: 'Hi! I\'m here to help you with your document requests. Feel free to ask me anything about the process, statuses, or requirements!',
			timestamp: new Date()
		}];
	}
</script>

<!-- Chatbot Toggle Button -->
<button class="sc-toggle" onclick={toggleChatbot} class:open={isOpen}>
	<span class="material-symbols-outlined">
		{isOpen ? 'close' : 'chat'}
	</span>
	{#if !isOpen}
		<span class="sc-badge">AI</span>
	{/if}
</button>

<!-- Chatbot Window -->
{#if isOpen}
	<div class="sc-window">
		<!-- Header -->
		<div class="sc-header">
			<div class="sc-header-content">
				<span class="material-symbols-outlined">smart_toy</span>
				<div>
					<h3>Document Assistant</h3>
					<p>Ask me anything!</p>
				</div>
			</div>
			<div class="sc-header-actions">
        <button class="sc-header-btn" onclick={resetChat} title="New Conversation">
					<span class="material-symbols-outlined">add_comment</span>
				</button>
				<button class="sc-header-btn" onclick={toggleChatbot} title="Minimize">
					<span class="material-symbols-outlined">expand_more</span>
				</button>
			</div>
		</div>

		<!-- Messages Container -->
		<div class="sc-messages" bind:this={chatContainer}>
			{#each messages as message}
				<div class="sc-message {message.role}">
					<div class="sc-message-content">
						<div class="sc-message-bubble">
							{message.content}
						</div>
						<div class="sc-message-time">{formatTime(message.timestamp)}</div>
					</div>
				</div>
			{/each}

			{#if isLoading}
				<div class="sc-message assistant">
					<div class="sc-message-content">
						<div class="sc-message-bubble typing">
							<div class="sc-typing-indicator">
								<span></span>
								<span></span>
								<span></span>
							</div>
						</div>
					</div>
				</div>
			{/if}

			{#if messages.length === 1}
				<div class="sc-suggestions">
					<p class="sc-suggestions-title">Try asking:</p>
					{#each suggestedQuestions as question}
						<button class="sc-suggestion-btn" onclick={() => askSuggested(question)}>
							{question}
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Input Area -->
		<div class="sc-input-area">
			<textarea
				bind:this={inputElement}
				bind:value={inputMessage}
				onkeypress={handleKeyPress}
				placeholder="Type your question..."
				rows="1"
				disabled={isLoading}
			></textarea>
			<button 
				class="sc-send-btn" 
				onclick={sendMessage} 
				disabled={!inputMessage.trim() || isLoading}
			>
				<span class="material-symbols-outlined">send</span>
			</button>
		</div>
	</div>
{/if}
