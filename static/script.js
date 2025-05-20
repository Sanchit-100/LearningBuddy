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
            
            // Handle mode-specific actions
            if (mode === 'recommendations') {
                fetchRecommendations();
            } else if (mode !== 'practice') {
                currentSessionId = null;
            }
        });
    });

    document.getElementById('send-to-slack').addEventListener('click', () => {
        sendReportToSlack();
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
    
    options.forEach((option, index) => {
        const mode = option.getAttribute('data-mode');
        if (mode === activeMode) {
            option.classList.add('active');
            // Position the slider (33.33% width for each option)
            slider.style.left = (index * 33.33) + '%';
        } else {
            option.classList.remove('active');
        }
    });
    
    // Update input placeholder based on mode
    const inputField = document.getElementById('user-input');
    if (activeMode === 'ask') {
        inputField.placeholder = 'Ask a question about your documents...';
    } else if (activeMode === 'practice') {
        inputField.placeholder = 'Enter a topic for practice questions...';
    } else if (activeMode === 'recommendations') {
        inputField.placeholder = 'Search topics...';
    }
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
        content.includes('Question') && content.includes('<div class="quiz-options">') ||
        content.includes('recommendations-container')
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
    
    // Add quiz option click handlers if this is a quiz question
    if (sender === 'bot' && content.includes('quiz-option')) {
        setTimeout(() => {
            const options = messageDiv.querySelectorAll('.quiz-option');
            options.forEach(option => {
                option.addEventListener('click', function() {
                    const letter = this.getAttribute('data-letter');
                    document.getElementById('user-input').value = letter;
                    sendMessage();
                });
            });
        }, 100);
    }
    
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
            
            html += `</div>
                <div class="quiz-tip">Click an option or type the letter to answer</div>
            </div>`;
            return html;
        }
    }
    
    return content;
}

function fetchRecommendations() {
    showThinking(true);
    
    fetch("/recommendations")
        .then(res => res.json())
        .then(data => {
            showThinking(false);
            displayRecommendations(data.topics);
        })
        .catch(err => {
            showThinking(false);
            appendMessage('bot', `Error loading recommendations: ${err.message}`, true);
        });
}

function displayRecommendations(topics) {
    // Clear chat and remove welcome message
    const chatBox = document.getElementById('chat-box');
    const welcomeMsg = document.querySelector('.welcome-message');
    if (welcomeMsg) {
        welcomeMsg.remove();
    }
    
    let content = '';
    
    if (topics.length === 0) {
        content = `
            <div class="recommendations-container">
                <div class="recommendations-header">
                    <i class="fas fa-lightbulb"></i>
                    <h3>Learning Recommendations</h3>
                </div>
                <div class="no-data">
                    <p>Practice more to get personalized learning recommendations.</p>
                    <p>Switch to "Practice Quiz" mode to get started!</p>
                </div>
            </div>
        `;
    } else {
        content = `
            <div class="recommendations-container">
                <div class="recommendations-header">
                    <i class="fas fa-lightbulb"></i>
                    <h3>Learning Recommendations</h3>
                    <p>Based on your practice performance, here are topics to focus on:</p>
                </div>
                <div class="topics-list">
        `;
        
        // Add topics sorted by performance (worst first)
        topics.forEach((topic, index) => {
            const performanceClass = topic.accuracy < 50 ? 'poor' : 
                                    topic.accuracy < 75 ? 'average' : 'good';
            
            content += `
                <div class="topic-item ${performanceClass}">
                    <div class="topic-rank">${index + 1}</div>
                    <div class="topic-details">
                        <h4>${topic.topic}</h4>
                        <div class="stats">
                            <span>${topic.correct_count} correct</span>
                            <span>${topic.incorrect_count} incorrect</span>
                            <span class="accuracy">Accuracy: ${topic.accuracy}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress" style="width: ${topic.accuracy}%"></div>
                        </div>
                    </div>
                    <button class="practice-topic" data-topic="${topic.topic}">Practice</button>
                </div>
            `;
        });
        
        content += `
                </div>
            </div>
        `;
    }
    
    // Add the recommendations to the chat
    appendMessage('bot', content);
    
    // Add click handlers to practice buttons
    setTimeout(() => {
        document.querySelectorAll('.practice-topic').forEach(button => {
            button.addEventListener('click', function() {
                const topic = this.getAttribute('data-topic');
                document.getElementById('user-input').value = topic;
                // Switch to practice mode
                updateToggleState('practice');
                document.getElementById('practice-mode').checked = true;
                // Send the message
                sendMessage();
            });
        });
    }, 100);
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
        <p>I can help you learn from your documents in three ways:</p>
        <ul>
            <li><strong>Ask questions</strong> about the content in your documents</li>
            <li><strong>Practice with quizzes</strong> generated from your documents</li>
            <li><strong>Get recommendations</strong> for topics to improve on</li>
        </ul>
        <p>Select a mode above and start learning!</p>
    `;
    chatBox.appendChild(welcomeMessage);
}

function scrollToBottom() {
    const chatBox = document.getElementById('chat-box');
    chatBox.scrollTop = chatBox.scrollHeight;
}

function sendReportToSlack() {
    // Check if there's an active session
    if (!currentSessionId) {
        appendMessage('bot', 'No active session to report. Complete a practice quiz first.');
        return;
    }
    
    // Create modal for entering Slack details
    const modal = document.createElement('div');
    modal.className = 'slack-modal';
    modal.innerHTML = `
        <div class="slack-modal-content">
            <h3><i class="fab fa-slack"></i> Send Report to Slack</h3>
            <div class="form-group">
                <label for="user-name">Your Name:</label>
                <input type="text" id="user-name" placeholder="John Doe">
            </div>
            <div class="form-group">
                <label for="slack-channel">Slack Channel: <small>(optional)</small></label>
                <input type="text" id="slack-channel" placeholder="learning-buddy-reports">
            </div>
            <div class="modal-actions">
                <button id="cancel-report" class="modal-button cancel">Cancel</button>
                <button id="submit-report" class="modal-button submit">Send Report</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners
    document.getElementById('cancel-report').addEventListener('click', () => {
        modal.remove();
    });
    
    document.getElementById('submit-report').addEventListener('click', () => {
        const userName = document.getElementById('user-name').value;
        const slackChannel = document.getElementById('slack-channel').value;
        
        // Show loading
        document.getElementById('submit-report').textContent = 'Sending...';
        document.getElementById('submit-report').disabled = true;
        
        // Send report
        fetch("/send_report", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                session_id: currentSessionId,
                channel: slackChannel || undefined,
                user_name: userName || 'Anonymous'
            })
        })
        .then(res => res.json())
        .then(data => {
            modal.remove();
            if (data.success) {
                appendMessage('bot', `
                    <div class="report-success">
                        <h3><i class="fas fa-check-circle"></i> Report Sent!</h3>
                        <p>Your learning session report has been sent to Slack.</p>
                    </div>
                `);
            } else {
                appendMessage('bot', `
                    <div class="report-error">
                        <h3><i class="fas fa-exclamation-circle"></i> Unable to Send Report</h3>
                        <p>${data.message}</p>
                    </div>
                `);
            }
        })
        .catch(err => {
            modal.remove();
            appendMessage('bot', `Error sending report: ${err.message}`, true);
        });
    });
}