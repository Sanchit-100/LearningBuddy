let currentSessionId = null;
let isThinking = false;

document.addEventListener('DOMContentLoaded', () => {
    initializeUI();
    setupEventListeners();
});

function initializeUI() {
    // Set initial mode toggle state
    updateToggleState('ask');
}

function setupEventListeners() {
    // Mode toggle functionality
    document.querySelectorAll('.toggle-option').forEach(option => {
        option.addEventListener('click', () => {
            const mode = option.getAttribute('data-mode');
            updateToggleState(mode);
            document.getElementById(`${mode}-mode`).checked = true;
            
            // Reset session when switching away from practice mode
            if (mode !== 'practice') {
                currentSessionId = null;
            }
        });
    });
    
    // Allow Enter key to send message
    document.getElementById('user-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !isThinking) {
            sendMessage();
        }
    });
    
    // Clear input button
    document.getElementById('clear-btn').addEventListener('click', () => {
        document.getElementById('user-input').value = '';
    });
    
    // Clear chat button
    document.getElementById('clear-chat').addEventListener('click', () => {
        clearChat();
    });
}

function updateToggleState(activeMode) {
    const slider = document.querySelector('.slider');
    const options = document.querySelectorAll('.toggle-option');
    
    options.forEach(option => {
        const mode = option.getAttribute('data-mode');
        if (mode === activeMode) {
            option.classList.add('active');
            slider.style.left = option.offsetLeft + 'px';
        } else {
            option.classList.remove('active');
        }
    });
    
    // Update input placeholder based on mode
    const inputField = document.getElementById('user-input');
    inputField.placeholder = activeMode === 'ask' ? 
        'Ask a question about your documents...' : 
        'Enter a topic for practice questions...';
}

function sendMessage() {
    if (isThinking) return;
    
    const inputField = document.getElementById('user-input');
    const message = inputField.value.trim();
    if (!message) return;
    
    const chatBox = document.getElementById('chat-box');
    const mode = document.querySelector('input[name="mode"]:checked').value;
    
    // Remove welcome message if present
    const welcomeMsg = document.querySelector('.welcome-message');
    if (welcomeMsg) {
        welcomeMsg.remove();
    }
    
    // Add user message
    appendMessage('user', message);
    
    // Clear input
    inputField.value = '';
    
    // Show thinking indicator
    showThinking(true);
    
    // Prepare request data
    const requestData = {
        message: message,
        mode: mode
    };
    
    // Add session ID if answering a practice question
    if (mode === 'practice' && currentSessionId && !message.toLowerCase().startsWith("generate")) {
        requestData.message = `session:${currentSessionId} answer:${message}`;
    } else if (mode === 'practice' && !message.toLowerCase().startsWith("generate")) {
        requestData.message = `Generate practice: ${message}`;
    }
    
    // Send request to backend
    fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData)
    })
    .then(res => res.json())
    .then(data => {
        // Hide thinking indicator
        showThinking(false);
        
        // Show response
        if (data.error) {
            appendMessage('bot', data.error, true);
        } else {
            // Format quiz content if in practice mode
            if (mode === 'practice') {
                appendMessage('bot', formatQuizContent(data.response));
                
                // Store session ID if provided
                if (data.session_id) {
                    currentSessionId = data.session_id;
                    updateSessionInfo(`Active quiz session: ${data.session_id.substring(0, 8)}...`);
                }
            } else {
                appendMessage('bot', data.response);
            }
        }
        
        // Scroll to bottom
        scrollToBottom();
    })
    .catch(err => {
        showThinking(false);
        appendMessage('bot', `Error: ${err.message}`, true);
        scrollToBottom();
    });
}

function appendMessage(sender, content, isError = false) {
    const chatBox = document.getElementById('chat-box');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    // Create avatar
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    
    const icon = document.createElement('i');
    icon.className = sender === 'user' ? 'fas fa-user' : 'fas fa-robot';
    avatar.appendChild(icon);
    
    // Create message content
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    if (isError) messageContent.classList.add('error');
    
    // If content is HTML string, use it directly; otherwise, use text
    if (sender === 'bot' && (
        content.includes('quiz-question') || 
        content.includes('quiz-feedback') ||
        content.includes('Question') && content.includes('<div class="quiz-options">')
    )) {
        messageContent.innerHTML = content;
    } else if (typeof content === 'string' && content.includes('<') && content.includes('>')) {
        // Content appears to contain HTML
        messageContent.innerHTML = content;
    } else {
        // Plain text
        messageContent.textContent = content;
    }
    
    // Add components to message
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(messageContent);
    
    chatBox.appendChild(messageDiv);
    scrollToBottom();
}

function formatQuizContent(content) {
    // Check if it contains a quiz question
    if (content.includes('Question') && content.includes('A.')) {
        // Extract question number and total
        const questionMatch = content.match(/Question (\d+) of (\d+):/);
        const questionNum = questionMatch ? questionMatch[1] : '1';
        const totalQuestions = questionMatch ? questionMatch[2] : '5';
        
        // Extract the question text
        let questionText = '';
        const questionTextMatch = content.match(/Question \d+ of \d+:(.*?)(?=A\.)/s);
        if (questionTextMatch) {
            questionText = questionTextMatch[1].trim();
        }
        
        // Extract options
        const options = [];
        const optionMatches = content.matchAll(/([A-D])\. (.*?)(?=[A-D]\.|ANSWER:|$)/gs);
        for (const match of optionMatches) {
            options.push({
                letter: match[1],
                text: match[2].trim()
            });
        }
        
        // Check if it's feedback for an answer
        const isAnswerFeedback = content.includes('✅') || content.includes('❌');
        
        if (isAnswerFeedback) {
            // Extract feedback details
            const isCorrect = content.includes('✅');
            const feedbackIcon = isCorrect ? 
                '<i class="fas fa-check-circle text-success"></i>' : 
                '<i class="fas fa-times-circle text-error"></i>';
                
            const feedbackText = isCorrect ? 'Correct!' : 'Incorrect';
            
            // Extract explanation
            let explanation = '';
            if (content.includes('✅')) {
                explanation = content.split('✅ Correct!')[1];
            } else if (content.includes('❌')) {
                explanation = content.split('❌ Incorrect.')[1];
            }
            
            // Extract next question if present
            let nextQuestion = '';
            if (explanation.includes('Question')) {
                [explanation, nextQuestion] = explanation.split(/Question \d+ of \d+:/);
                nextQuestion = 'Question ' + nextQuestion;
            }
            
            // Build feedback HTML
            let feedbackHtml = `
                <div class="quiz-feedback">
                    <h3>${feedbackIcon} ${feedbackText}</h3>
                    <div class="quiz-explanation">${explanation.trim()}</div>
                </div>
            `;
            
            // If there's a next question, format and add it
            if (nextQuestion) {
                feedbackHtml += formatQuizContent(nextQuestion);
            }
            
            return feedbackHtml;
        } else {
            // This is a new question - build question HTML
            let html = `
                <div class="quiz-question">
                    <h3>Question ${questionNum} of ${totalQuestions}</h3>
                    <p>${questionText}</p>
                    <div class="quiz-options">
            `;
            
            // Add each option
            options.forEach(option => {
                html += `<div class="quiz-option" data-letter="${option.letter}">
                    <strong>${option.letter}.</strong> ${option.text}
                </div>`;
            });
            
            html += `</div></div>`;
            return html;
        }
    }
    
    return content;
}

function showThinking(isActive) {
    isThinking = isActive;
    const indicator = document.querySelector('.typing-indicator');
    
    if (isActive) {
        indicator.classList.remove('hidden');
    } else {
        indicator.classList.add('hidden');
    }
}

function updateSessionInfo(text) {
    const infoElement = document.getElementById('session-info');
    
    // Create or update info text
    let infoText = document.querySelector('.session-info-text');
    if (!infoText) {
        infoText = document.createElement('div');
        infoText.className = 'session-info-text';
        infoElement.appendChild(infoText);
    }
    
    infoText.textContent = text;
}

function clearChat() {
    const chatBox = document.getElementById('chat-box');
    chatBox.innerHTML = '';
    
    // Reset session
    currentSessionId = null;
    
    // Clear session info
    updateSessionInfo('');
    
    // Show welcome message again
    const welcomeMessage = document.createElement('div');
    welcomeMessage.className = 'welcome-message';
    welcomeMessage.innerHTML = `
        <div class="welcome-icon"><i class="fas fa-brain"></i></div>
        <h2>Welcome to Learning Buddy!</h2>
        <p>I can help you learn from your documents in two ways:</p>
        <ul>
            <li><strong>Ask questions</strong> about the content in your documents</li>
            <li><strong>Practice with quizzes</strong> generated from your documents</li>
        </ul>
        <p>Select a mode above and start learning!</p>
    `;
    chatBox.appendChild(welcomeMessage);
}

function scrollToBottom() {
    const chatBox = document.getElementById('chat-box');
    chatBox.scrollTop = chatBox.scrollHeight;
}