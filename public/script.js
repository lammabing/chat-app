// Global variables
let socket;
let emojiPicker;
let currentUser;

// Initialize all event listeners when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const loginButton = document.getElementById('login-button');
    if (loginButton) {
        loginButton.addEventListener('click', handleLogin);
        // Add enter key support for login
        document.getElementById('password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleLogin();
            }
        });
    }

    const messageInput = document.getElementById('message-input');
    if (messageInput) {
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });

        // Add input event listener for emoji shortcode conversion
        messageInput.addEventListener('input', handleEmojiShortcodes);
    }

    const fileInput = document.getElementById('file-input');
    if (fileInput) {
        fileInput.setAttribute('accept', 'image/*,.gif');
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                uploadFile(file);
                e.target.value = '';
            }
        });
    }

    const avatarInput = document.getElementById('avatar-input');
    if (avatarInput) {
        avatarInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                uploadAvatar(file);
                e.target.value = '';
            }
        });
    }

    // Initialize emoji picker
    initializeEmojiPicker();
});

function initializeEmojiPicker() {
    // Create emoji picker element
    emojiPicker = document.createElement('emoji-picker');
    emojiPicker.classList.add('hidden');
    document.querySelector('.input-area').appendChild(emojiPicker);

    // Add emoji button
    const emojiButton = document.createElement('button');
    emojiButton.innerHTML = '😊';
    emojiButton.className = 'emoji-button';
    emojiButton.onclick = toggleEmojiPicker;

    // Insert emoji button before the file upload button
    const fileUploadBtn = document.querySelector('.file-upload-btn');
    fileUploadBtn.parentNode.insertBefore(emojiButton, fileUploadBtn);

    // Handle emoji selection
    emojiPicker.addEventListener('emoji-click', event => {
        const messageInput = document.getElementById('message-input');
        const emoji = event.detail.unicode;
        const cursorPos = messageInput.selectionStart;
        const textBefore = messageInput.value.substring(0, cursorPos);
        const textAfter = messageInput.value.substring(cursorPos);

        messageInput.value = textBefore + emoji + textAfter;
        messageInput.focus();
        messageInput.setSelectionRange(cursorPos + emoji.length, cursorPos + emoji.length);

        // Hide picker after selection
        emojiPicker.classList.add('hidden');
    });

    // Click outside to close emoji picker
    document.addEventListener('click', (e) => {
        if (!e.target.closest('emoji-picker') &&
            !e.target.classList.contains('emoji-button')) {
            emojiPicker.classList.add('hidden');
        }
    });
}

function stripHTML(htmlString) {
    return htmlString.replace(/<[^>]+>/g, '');
}

function toggleEmojiPicker() {
    emojiPicker.classList.toggle('hidden');
}

// Emoji shortcode conversion
const emojiShortcodes = {
    ':)': '😊',
    ':-)': '😊',
    ':(': '😢',
    ':-(': '😢',
    ':D': '😃',
    ':-D': '😃',
    ':P': '😛',
    ':-P': '😛',
    ';)': '😉',
    ';-)': '😉',
    ':O': '😮',
    ':-O': '😮',
    '<3': '❤️',
    '</3': '💔',
    'o/': '👋',
    '\\o': '👋',
    ':heart:': '❤️',
    ':smile:': '😊',
    ':laugh:': '😄',
    ':sad:': '😢',
    ':cry:': '😭',
    ':wink:': '😉',
    ':thumbsup:': '👍',
    ':thumbsdown:': '👎',
    ':+1:': '👍',
    ':-1:': '👎',
    ':fire:': '🔥',
    ':star:': '⭐',
    ':check:': '✅',
    ':x:': '❌'
};

function handleEmojiShortcodes(e) {
    const input = e.target;
    const text = input.value;
    let modified = false;

    // Convert emoticons and shortcodes to emojis
    for (const [code, emoji] of Object.entries(emojiShortcodes)) {
        if (text.includes(code)) {
            input.value = text.replace(new RegExp(escapeRegExp(code), 'g'), emoji);
            modified = true;
        }
    }

    // If text was modified, maintain cursor position
    if (modified) {
        const cursorPos = input.selectionStart;
        input.setSelectionRange(cursorPos, cursorPos);
    }
}

// Helper function to escape special characters in regex
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function handleLogin() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!username || !password) {
        alert('Please enter both username and password');
        return;
    }

    try {
        console.log('Attempting login for user:', username);
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        console.log('Login response status:', response.status);
        let data;
        try {
            data = await response.json();
            console.log('Login response data:', data);
        } catch (jsonError) {
            // If response is not JSON, get the raw text
            const rawText = await response.text();
            console.error('Failed to parse JSON response:', jsonError, 'Raw response:', rawText);
            alert('Unexpected server response. Please check server logs.');
            return;
        }

        if (response.ok && data.success) {
            currentUser = data.user;
            document.getElementById('login-form').classList.add('hidden');
            document.getElementById('chat-container').classList.remove('hidden');
            document.getElementById('username-display').textContent = currentUser.username;
            if (currentUser.avatar) {
                document.getElementById('user-avatar').src = currentUser.avatar;
            }
            initializeSocket(currentUser.id);
        } else {
            const errorMessage = data.error || 'Login failed';
            console.error('Login failed:', errorMessage, 'Full response:', data);
            alert(errorMessage);
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed due to a network or unexpected error. Please try again.');
    }
}

async function uploadAvatar(file) {
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
        const response = await fetch('/upload/avatar', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const data = await response.json();
            document.getElementById('user-avatar').src = data.avatar;
            currentUser.avatar = data.avatar;
            currentUser.avatarThumbnail = data.avatarThumbnail;
        } else {
            throw new Error('Avatar upload failed');
        }
    } catch (error) {
        console.error('Avatar upload error:', error);
        alert('Failed to upload avatar');
    }
}

function initializeSocket(userId) {
    socket = io({
        auth: { userId }
    });

    socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        alert('Failed to connect to chat server. Please try refreshing the page.');
    });

    socket.on('previous-messages', (messages) => {
        const messagesDiv = document.getElementById('messages');
        messagesDiv.innerHTML = ''; // Clear existing messages
        messages.forEach(message => addMessage(message, false)); // Add messages, false indicates it's not a "new" incoming message
        messagesDiv.scrollTop = 0; // Scroll to the top to show the latest of the previous messages
    });

    socket.on('chat-message', (message) => addMessage(message, true)); // true indicates it's a new incoming message
    socket.on('file-message', (message) => addMessage(message, true));

    // Handle user joined event
    socket.on('user-joined', (data) => {
        addSystemMessage(`${data.user.username} joined the chat`);
        updateUserCount(data.userCount);
    });

    // Handle user left event
    socket.on('user-left', (data) => {
        addSystemMessage(`${data.user.username} left the chat`);
        updateUserCount(data.userCount);
    });
}

// Update the user count display
function updateUserCount(count) {
    document.getElementById('user-count-number').textContent = count;
}

function addMessage(message, isNewMessage = true) {
    const messagesDiv = document.getElementById('messages');
    const messageElement = document.createElement('div');
    messageElement.className = 'message';

    // Add 'sent' or 'received' class for styling based on current user
    if (currentUser && message.userId && message.userId._id === currentUser._id) {
        messageElement.classList.add('sent');
    } else {
        messageElement.classList.add('received');
    }

    const time = new Date(message.timestamp).toLocaleTimeString();
    let content = '';

    if (message.type === 'file') {
        const isImage = /\.(jpg|jpeg|png|gif)$/i.test(message.file.name);
        if (isImage) {
            content = `
                <div class="image-preview">
                    <img src="${message.file.path}" class="thumbnail" onclick="showFullImage('${message.file.path}')" alt="${message.file.originalName}">
                    <a href="${message.file.path}" download="${message.file.originalName}">Download</a>
                </div>
            `;
        } else {
            content = `
                <div class="file-message">
                    📎 <a href="${message.file.path}" download="${message.file.originalName}">${message.file.originalName}</a>
                </div>
            `;
        }
    } else if (message.type === 'text'){
        // Sanitize the message text with DOMPurify
        const sanitizedText = DOMPurify.sanitize(message.text);
        const spokenText = stripHTML(sanitizedText);
        console.log('Message text:', message.text);
        console.log('Sanitized text:', sanitizedText);
        console.log('Spoken text for speech:', spokenText);
        content = `<div class="text">${sanitizedText} <i class="fas fa-volume-up" onclick="speakMessage('${spokenText}')"></i></div>`;
    } else { // Fallback for other types or if message.text is directly usable
        content = `<div class="text">${DOMPurify.sanitize(message.text)}</div>`;
    }

    const avatarSrc = (message.userId && message.userId.avatarThumbnail) 
        ? (message.userId.avatarThumbnail.startsWith('http') ? message.userId.avatarThumbnail : message.userId.avatarThumbnail)
        : '/uploads/avatars/default-avatar.png';


    messageElement.innerHTML = `
        <img class="avatar" src="${avatarSrc}" alt="${message.userId ? message.userId.username : 'System'}'s avatar">
        <div class="content">
            <span class="user">${message.userId ? message.userId.username : 'System'}</span>
            <span class="time">${time}</span>
            ${content}
        </div>
    `;

    messagesDiv.prepend(messageElement); // Prepend to add to the top

    // Optional: If it's a new message and you want to scroll to top only if already near top
    // This helps if the user is scrolled down reading older messages, they won't be jumped to the top.
    // if (isNewMessage && messagesDiv.scrollTop < 100) { // Or some other threshold, e.g., half the viewport height
    //     messagesDiv.scrollTop = 0;
    // }
}

function speakMessage(text) {
    console.log('Attempting to speak message:', text);
    // Check if browser supports speech synthesis
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);

        // Optional: Customize voice, rate, pitch, etc.
        // utterance.lang = 'en-US'; // Example
        window.speechSynthesis.speak(utterance);
        console.log('Speech synthesis started');
    } else {
        console.error('Browser does not support text-to-speech.');
        alert('Sorry, your browser does not support text-to-speech.');
    }
}

function showFullImage(src) {
    const modal = document.createElement('div');
    modal.className = 'image-modal';
    modal.onclick = () => document.body.removeChild(modal);

    const img = document.createElement('img');
    img.src = src;
    img.className = 'full-image';

    modal.appendChild(img);
    document.body.appendChild(modal);
}

function addSystemMessage(text) {
    const messagesDiv = document.getElementById('messages');
    const messageElement = document.createElement('div');
    messageElement.className = 'message system'; // Ensure 'system' class is for styling
    
    const contentElement = document.createElement('div');
    contentElement.textContent = text;
    messageElement.appendChild(contentElement);

    messagesDiv.prepend(messageElement); // Prepend system messages as well
}

function sendMessage() {
    const input = document.getElementById('message-input');
    const messageText = input.value.trim(); // Renamed to avoid conflict with 'message' object

    if (messageText && socket) {
        socket.emit('chat-message', { text: messageText }); // Send as an object if server expects {text: ...}
        input.value = '';
    }
}

async function uploadFile(file) {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Upload failed with no specific error message.' }));
            throw new Error(errorData.message || `Upload failed with status: ${response.status}`);
        }
        // No need to do anything with the response here if the server handles broadcasting the file message
    } catch (error) {
        console.error('Upload error:', error);
        alert(`File upload failed: ${error.message}`);
    }
}

// Make functions available globally if needed by inline HTML event handlers
window.showFullImage = showFullImage;
window.sendMessage = sendMessage;
window.speakMessage = speakMessage; // Ensure speakMessage is globally accessible if used in dynamic HTML

function addMessageToChat(message) {
    const chatContainer = document.getElementById('chat-messages');
    const messageElement = createMessageElement(message); // however you build your message DOM

    // Insert the new message at the top
    chatContainer.insertBefore(messageElement, chatContainer.firstChild);
}

function renderMessageHistory(messages) {
    const chatContainer = document.getElementById('chat-messages');
    chatContainer.innerHTML = '';
    // Render messages in the order received (newest first)
    messages.forEach(message => {
        const messageElement = createMessageElement(message);
        chatContainer.appendChild(messageElement);
    });
}
