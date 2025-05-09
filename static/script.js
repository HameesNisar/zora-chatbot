// Run when page loads
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('messageForm');
    const input = document.getElementById('messageInput');
    const chatbox = document.getElementById('chatbox');

    // Handle message sending
    form.addEventListener('submit', e => {
        e.preventDefault();
        
        // Get user message
        const message = input.value.trim();
        if (!message) {
            alert('Please enter a message.');
            return;
        }
        
        // Show user message
        showMessage(message, 'user-message');
        
        // Clear input
        input.value = '';
        
        // Send to backend and show response
        fetch('/get', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ msg: message })
        })
        .then(res => res.json())
        .then(data => showMessage(data.reply, 'bot-message'))
        .catch(() => alert('Error connecting to chatbot.'));
    });

    // Add a message to the chat
    function showMessage(text, type) {
        const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
        
        const msg = document.createElement('div');
        msg.className = 'message ' + type;
        msg.innerHTML = text + ' <span class="message-time">' + time + '</span>';
        
        chatbox.appendChild(msg);
        chatbox.scrollTop = chatbox.scrollHeight;
    }
});