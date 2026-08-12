// Promptly - Nemotron 3 Ultra Chat Application

const API_BASE = window.PROMPTLY_API_BASE || 'http://localhost:8000';
let currentChatId = null;
let chats = JSON.parse(localStorage.getItem('promptly_chats')) || [];
let isStreaming = false;

const elements = {
    sidebar: document.getElementById('sidebar'),
    mobileMenuBtn: document.getElementById('mobileMenuBtn'),
    overlay: document.getElementById('overlay'),
    newChatBtn: document.getElementById('newChatBtn'),
    clearAllBtn: document.getElementById('clearAllBtn'),
    chatList: document.getElementById('chatList'),
    currentChatTitle: document.getElementById('currentChatTitle'),
    modelBadge: document.getElementById('modelBadge'),
    deleteChatBtn: document.getElementById('deleteChatBtn'),
    chatContainer: document.getElementById('chatContainer'),
    welcomeScreen: document.getElementById('welcomeScreen'),
    messages: document.getElementById('messages'),
    typingIndicator: document.getElementById('typingIndicator'),
    inputForm: document.getElementById('inputForm'),
    messageInput: document.getElementById('messageInput'),
    sendBtn: document.getElementById('sendBtn'),
    attachBtn: document.getElementById('attachBtn'),
    themeToggle: document.getElementById('themeToggle'),
    toastContainer: document.getElementById('toastContainer'),
    exampleBtns: document.querySelectorAll('.example-btn'),
};

function init() {
    loadTheme();
    renderChatList();
    setupEventListeners();
    autoResizeTextarea();
    checkBackendHealth();
}

function loadTheme() {
    const theme = localStorage.getItem('promptly_theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
}

function saveTheme(theme) {
    localStorage.setItem('promptly_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
}

function setupEventListeners() {
    elements.mobileMenuBtn.addEventListener('click', toggleSidebar);
    elements.overlay.addEventListener('click', closeSidebar);
    elements.newChatBtn.addEventListener('click', createNewChat);
    elements.clearAllBtn.addEventListener('click', clearAllChats);
    elements.deleteChatBtn.addEventListener('click', deleteCurrentChat);
    elements.inputForm.addEventListener('submit', handleSubmit);
    elements.messageInput.addEventListener('input', () => {
        autoResizeTextarea();
        elements.sendBtn.disabled = !elements.messageInput.value.trim() || isStreaming;
    });
    elements.messageInput.addEventListener('keydown', handleKeydown);
    elements.themeToggle.addEventListener('click', toggleTheme);
    elements.exampleBtns.forEach(btn => {
        btn.addEventListener('click', () => useExamplePrompt(btn.dataset.prompt));
    });
}

async function checkBackendHealth() {
    try {
        const response = await fetch(`${API_BASE}/health`);
        const data = await response.json();
        if (data.model) {
            elements.modelBadge.textContent = data.model.replace('nvidia/', '').replace('-550b-a55b', '');
        }
    } catch (error) {
        showToast('Backend not connected. Start the server.', 'error');
    }
}

function toggleSidebar() {
    elements.sidebar.classList.toggle('open');
    elements.overlay.classList.toggle('visible');
}

function closeSidebar() {
    elements.sidebar.classList.remove('open');
    elements.overlay.classList.remove('visible');
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    saveTheme(newTheme);
}

function createNewChat() {
    currentChatId = Date.now().toString();
    chats.unshift({
        id: currentChatId,
        title: 'New Chat',
        messages: [],
        createdAt: new Date().toISOString(),
    });
    saveChats();
    renderChatList();
    selectChat(currentChatId);
    closeSidebar();
}

function selectChat(chatId) {
    currentChatId = chatId;
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return;

    elements.currentChatTitle.textContent = chat.title || 'New Chat';
    elements.deleteChatBtn.disabled = false;
    renderMessages(chat.messages);
    elements.welcomeScreen.style.display = 'none';
    elements.messages.style.display = 'flex';
    elements.typingIndicator.style.display = 'none';

    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.toggle('active', item.dataset.chatId === chatId);
    });
    closeSidebar();
}

function deleteCurrentChat() {
    if (!currentChatId) return;
    chats = chats.filter(c => c.id !== currentChatId);
    saveChats();
    renderChatList();
    if (chats.length > 0) {
        selectChat(chats[0].id);
    } else {
        resetToWelcome();
    }
}

function clearAllChats() {
    if (confirm('Are you sure you want to clear all chats?')) {
        chats = [];
        saveChats();
        renderChatList();
        resetToWelcome();
    }
}

function resetToWelcome() {
    currentChatId = null;
    elements.currentChatTitle.textContent = 'New Chat';
    elements.deleteChatBtn.disabled = true;
    elements.welcomeScreen.style.display = 'flex';
    elements.messages.style.display = 'none';
    elements.messages.innerHTML = '';
}

function renderChatList() {
    elements.chatList.innerHTML = '';
    chats.forEach(chat => {
        const item = document.createElement('button');
        item.className = 'chat-item' + (chat.id === currentChatId ? ' active' : '');
        item.dataset.chatId = chat.id;
        item.innerHTML = `
            <span class="chat-item-title">${escapeHtml(chat.title || 'New Chat')}</span>
            <div class="chat-item-actions">
                <button class="chat-item-icon-btn delete-chat" aria-label="Delete chat">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
        `;
        item.addEventListener('click', (e) => {
            if (!e.target.closest('.delete-chat')) {
                selectChat(chat.id);
            }
        });
        item.querySelector('.delete-chat').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteChat(chat.id);
        });
        elements.chatList.appendChild(item);
    });
}

function deleteChat(chatId) {
    chats = chats.filter(c => c.id !== chatId);
    saveChats();
    renderChatList();
    if (currentChatId === chatId) {
        if (chats.length > 0) {
            selectChat(chats[0].id);
        } else {
            resetToWelcome();
        }
    }
}

function saveChats() {
    localStorage.setItem('promptly_chats', JSON.stringify(chats));
}

function renderMessages(messages) {
    elements.messages.innerHTML = '';
    messages.forEach(msg => {
        appendMessage(msg.role, msg.content, false);
    });
    scrollToBottom();
}

function appendMessage(role, content, animate = true) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    if (animate) {
        messageDiv.style.animation = 'fadeInUp 0.3s ease forwards';
    }

    const avatarIcon = role === 'user'
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formattedContent = formatMessage(content);

    messageDiv.innerHTML = `
        <div class="message-avatar">${avatarIcon}</div>
        <div class="message-content">
            <div class="message-header">
                <span class="message-role">${role === 'user' ? 'You' : 'Nemotron 3 Ultra'}</span>
                <span class="message-time">${time}</span>
            </div>
            <div class="message-text">${formattedContent}</div>
            <div class="message-actions">
                <button class="message-action-btn copy-btn" aria-label="Copy message">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    Copy
                </button>
                ${role === 'assistant' ? `
                <button class="message-action-btn regenerate-btn" aria-label="Regenerate response">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="1 4 1 10 7 10"></polyline>
                        <polyline points="23 20 23 14 17 14"></polyline>
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                    </svg>
                    Regenerate
                </button>` : ''}
            </div>
        </div>
    `;

    messageDiv.querySelector('.copy-btn').addEventListener('click', () => copyToClipboard(content));
    if (role === 'assistant') {
        messageDiv.querySelector('.regenerate-btn').addEventListener('click', () => regenerateResponse(messageDiv));
    }

    elements.messages.appendChild(messageDiv);
    scrollToBottom();
}

function formatMessage(content) {
    return content
        .replace(/&/g, '&')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
        .replace(/\n/g, '<br>');
}

function showTypingIndicator() {
    elements.typingIndicator.classList.add('visible');
    scrollToBottom();
}

function hideTypingIndicator() {
    elements.typingIndicator.classList.remove('visible');
}

async function handleSubmit(e) {
    e.preventDefault();
    const content = elements.messageInput.value.trim();
    if (!content || isStreaming) return;

    if (!currentChatId) {
        createNewChat();
    }

    elements.messageInput.value = '';
    autoResizeTextarea();
    appendMessage('user', content);
    showTypingIndicator();
    isStreaming = true;
    elements.sendBtn.disabled = true;

    try {
        await sendMessageStream(content);
    } catch (error) {
        hideTypingIndicator();
        showToast('Failed to send message: ' + error.message, 'error');
        isStreaming = false;
        elements.sendBtn.disabled = false;
    }
}

async function sendMessageStream(content) {
    const chat = chats.find(c => c.id === currentChatId);
    const messages = [
        ...chat.messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: content }
    ];

    const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            messages: messages,
            temperature: 0.7,
            top_p: 0.95,
            max_tokens: 4096,
            stream: true
        })
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let assistantContent = '';
    let assistantMessageDiv = null;

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                    const parsed = JSON.parse(data);
                    if (parsed.error) {
                        throw new Error(parsed.error);
                    }
                    if (parsed.content) {
                        assistantContent += parsed.content;
                        if (!assistantMessageDiv) {
                            hideTypingIndicator();
                            assistantMessageDiv = createStreamingMessage(assistantContent);
                        } else {
                            updateStreamingMessage(assistantMessageDiv, assistantContent);
                        }
                    }
                } catch (e) {
                    // Ignore parse errors for incomplete chunks
                }
            }
        }
    }

    if (assistantMessageDiv) {
        finalizeStreamingMessage(assistantMessageDiv, assistantContent);
    } else if (assistantContent) {
        hideTypingIndicator();
        appendMessage('assistant', assistantContent);
    }

    chat.messages.push({ role: 'user', content: content });
    chat.messages.push({ role: 'assistant', content: assistantContent });
    if (chat.messages.length === 2) {
        chat.title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
    }
    saveChats();
    renderChatList();

    isStreaming = false;
    elements.sendBtn.disabled = false;
    elements.messageInput.focus();
}

function createStreamingMessage(content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message assistant streaming';
    messageDiv.innerHTML = `
        <div class="message-avatar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
        </div>
        <div class="message-content">
            <div class="message-header">
                <span class="message-role">Nemotron 3 Ultra</span>
                <span class="message-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div class="message-text">${formatMessage(content)}</div>
        </div>
    `;
    elements.messages.appendChild(messageDiv);
    scrollToBottom();
    return messageDiv;
}

function updateStreamingMessage(messageDiv, content) {
    const textDiv = messageDiv.querySelector('.message-text');
    textDiv.innerHTML = formatMessage(content);
    scrollToBottom();
}

function finalizeStreamingMessage(messageDiv, content) {
    messageDiv.classList.remove('streaming');
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'message-actions';
    actionsDiv.innerHTML = `
        <button class="message-action-btn copy-btn" aria-label="Copy message">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            Copy
        </button>
        <button class="message-action-btn regenerate-btn" aria-label="Regenerate response">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="1 4 1 10 7 10"></polyline>
                <polyline points="23 20 23 14 17 14"></polyline>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            Regenerate
        </button>
    `;
    actionsDiv.querySelector('.copy-btn').addEventListener('click', () => copyToClipboard(content));
    actionsDiv.querySelector('.regenerate-btn').addEventListener('click', () => regenerateResponse(messageDiv));
    messageDiv.querySelector('.message-content').appendChild(actionsDiv);
}

async function regenerateResponse(messageDiv) {
    const chat = chats.find(c => c.id === currentChatId);
    if (!chat || chat.messages.length < 1) return;

    const lastUserMsg = [...chat.messages].reverse().find(m => m.role === 'user');
    if (!lastUserMsg) return;

    messageDiv.remove();
    showTypingIndicator();
    isStreaming = true;
    elements.sendBtn.disabled = true;

    chat.messages = chat.messages.filter(m => m !== lastUserMsg || m.role !== 'assistant');
    saveChats();

    try {
        await sendMessageStream(lastUserMsg.content);
    } catch (error) {
        hideTypingIndicator();
        showToast('Failed to regenerate: ' + error.message, 'error');
        isStreaming = false;
        elements.sendBtn.disabled = false;
    }
}

function handleKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        elements.inputForm.dispatchEvent(new Event('submit'));
    }
}

function autoResizeTextarea() {
    elements.messageInput.style.height = 'auto';
    elements.messageInput.style.height = Math.min(elements.messageInput.scrollHeight, 200) + 'px';
}

function useExamplePrompt(prompt) {
    elements.messageInput.value = prompt;
    autoResizeTextarea();
    elements.messageInput.focus();
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard', 'success');
    }).catch(() => {
        showToast('Failed to copy', 'error');
    });
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('removing');
        toast.addEventListener('animationend', () => toast.remove());
    }, 3000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function scrollToBottom() {
    elements.chatContainer.scrollTop = elements.chatContainer.scrollHeight;
}

document.addEventListener('DOMContentLoaded', init);