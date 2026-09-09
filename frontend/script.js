document.addEventListener('DOMContentLoaded', () => {
    // Opening Animation Logic
    const introContainer = document.getElementById('intro-container');
    const gavelContainer = document.getElementById('gavel-container');
    const gavel = document.getElementById('gavel');
    const impact = document.getElementById('impact');
    const splitLeft = document.getElementById('split-left');
    const splitRight = document.getElementById('split-right');
    const splitLine = document.getElementById('split-line');

    // Step 2 → Gavel appears & strikes
    setTimeout(() => {
        if (gavelContainer) gavelContainer.classList.add('show');
        if (gavel) gavel.classList.add('strike');

        setTimeout(() => {
            if (impact) impact.classList.add('show');
        }, 500);
    }, 1500);

    // Step 3 → Screen split
    setTimeout(() => {
        if (splitLeft) splitLeft.classList.add('show');
        if (splitRight) splitRight.classList.add('show');
        if (splitLine) splitLine.classList.add('show');
    }, 2200);

    // Step 4 → Hide intro container after revelation
    setTimeout(() => {
        if (introContainer) introContainer.classList.add('hidden');
    }, 3000);

    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const messageList = document.getElementById('message-list');
    const welcomeScreen = document.getElementById('welcome-screen');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    const newChatBtn = document.getElementById('new-chat-btn');
    const backBtn = document.getElementById('back-btn');
    const inputContainer = document.getElementById('input-container');
    const suggestionCards = document.querySelectorAll('.suggestion-card');
    const voiceBtn = document.getElementById('voice-btn');

    // Speech Recognition Setup
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;
    let isListening = false;

    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-IN'; // Set to Indian English for better accuracy

        recognition.onstart = () => {
            isListening = true;
            voiceBtn.classList.add('listening');
            voiceBtn.title = "Stop listening";
        };

        recognition.onend = () => {
            isListening = false;
            voiceBtn.classList.remove('listening');
            voiceBtn.title = "Voice input";
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            isListening = false;
            voiceBtn.classList.remove('listening');
        };

        recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            // Append final transcript for performance, or just update with everything
            // To ensure it "goes and writing" simultaneously, we update with current known text
            if (finalTranscript || interimTranscript) {
                // If it's a new final part, we can append it if we want persistent dictation
                // But usually, real-time feedback means showing what's heard so far.
                chatInput.value += finalTranscript;
                
                // For interim, we might want to show it without making it permanent yet
                // However, the request is "whenever i m speaking simultaneously it goes and writing"
                // Simple implementation:
                if (interimTranscript) {
                    // We don't want to double-append, so we manage a base text
                    // For simplicity in this UI, we'll just append final results
                }
                
                // Trigger auto-resize and button state
                chatInput.dispatchEvent(new Event('input'));
            }
        };
        
        // Better onresult for real-time writing:
        let lastFinalText = '';
        recognition.onresult = (event) => {
            let transcript = '';
            for (let i = 0; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            chatInput.value = transcript;
            chatInput.style.height = 'auto';
            chatInput.style.height = (chatInput.scrollHeight) + 'px';
            sendBtn.disabled = chatInput.value.trim().length === 0;
        };
    }

    if (voiceBtn) {
        voiceBtn.addEventListener('click', () => {
            if (!SpeechRecognition) {
                alert("Speech recognition is not supported in this browser.");
                return;
            }

            if (isListening) {
                recognition.stop();
            } else {
                recognition.start();
            }
        });
    }

    // Auto-resize textarea
    chatInput.addEventListener('input', () => {
        chatInput.style.height = 'auto';
        chatInput.style.height = (chatInput.scrollHeight) + 'px';

        // Enable/disable send button
        if (chatInput.value.trim().length > 0) {
            sendBtn.disabled = false;
        } else {
            sendBtn.disabled = true;
        }
    });

    // Handle send button click
    sendBtn.addEventListener('click', () => {
        sendMessage();
    });

    // Handle Enter key (Shift+Enter for newline)
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Sidebar Toggle
    sidebarToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = sidebar.classList.toggle('open');
        sidebarToggle.setAttribute('aria-expanded', isOpen);
    });

    // Close sidebar when clicking outside
    document.addEventListener('click', (e) => {
        if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== sidebarToggle) {
            sidebar.classList.remove('open');
            sidebarToggle.setAttribute('aria-expanded', 'false');
        }
    });

    // Prevent closing when clicking inside sidebar
    sidebar.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // Back Button Handler
    backBtn.addEventListener('click', () => {
        exitChatMode();
    });

    function enterChatMode() {
        welcomeScreen.classList.add('hidden');
        backBtn.classList.remove('hidden');
        chatInput.focus();
    }

    function exitChatMode() {
        // Clear message list
        messageList.innerHTML = '';
        // Reset welcome screen visibility and display
        welcomeScreen.classList.remove('hidden');
        welcomeScreen.style.display = 'flex'; // Ensure flex display is restored
        // Hide chat UI
        backBtn.classList.add('hidden');
        // Reset input field
        chatInput.value = '';
        chatInput.style.height = 'auto';
        sendBtn.disabled = true;
    }

    // New Chat Button Handler
    newChatBtn.addEventListener('click', () => {
        // Clear message list
        messageList.innerHTML = '';
        // Exit chat mode to show welcome screen
        exitChatMode();
        // Reset input
        chatInput.value = '';
        chatInput.style.height = 'auto';
        sendBtn.disabled = true;
        // Close sidebar on mobile if open
        sidebar.classList.remove('open');
        sidebarToggle.setAttribute('aria-expanded', 'false');
    });

    // Suggestion cards click handler
    suggestionCards.forEach(card => {
        const handleActivation = () => {
            enterChatMode();
            const prompt = card.getAttribute('data-prompt');
            chatInput.value = prompt;
            chatInput.style.height = 'auto';
            chatInput.style.height = (chatInput.scrollHeight) + 'px';
            sendBtn.disabled = false;
            sendMessage();
        };

        card.addEventListener('click', handleActivation);

        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleActivation();
            }
        });
    });

    async function sendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;

        // Transition from welcome screen if needed
        if (!welcomeScreen.classList.contains('hidden')) {
            enterChatMode();
        }

        // Add user message
        addMessage(text, 'user');

        // Clear input
        chatInput.value = '';
        chatInput.style.height = 'auto';
        sendBtn.disabled = true;

        // Show typing indicator or "Thinking..." message
        const typingMessageId = 'typing-' + Date.now();
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message ai typing-indicator';
        typingDiv.id = typingMessageId;
        typingDiv.innerHTML = `
            <img src="https://img.icons8.com/ios-filled/50/0b57d0/scales.png" alt="LawPro AI assistant" class="message-avatar" style="padding: 4px; border: 1px solid #dde3ea;">
            <div class="message-content"><em>LawPro is thinking...</em></div>
        `;
        messageList.appendChild(typingDiv);
        scrollToBottom();

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: text }),
            });

            if (!response.ok) {
                throw new Error('Backend server error');
            }

            const data = await response.json();
            
            // Remove typing indicator
            const indicator = document.getElementById(typingMessageId);
            if (indicator) indicator.remove();

            addMessage(data.response, 'ai', true);
        } catch (error) {
            console.error('Error:', error);
            // Remove typing indicator
            const indicator = document.getElementById(typingMessageId);
            if (indicator) indicator.remove();
            
            addMessage("I'm sorry, I'm having trouble connecting to the LawPro server right now. Please make sure the backend is running.", 'ai');
        }
    }

    function addMessage(text, sender, isTyping = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;

        const avatarUrl = sender === 'user'
            ? 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aditi'
            : 'https://img.icons8.com/ios-filled/50/0b57d0/scales.png'; // Mock AI icon

        messageDiv.innerHTML = `
            <img src="${avatarUrl}" alt="${sender === 'user' ? 'Your avatar' : 'LawPro AI assistant'}" class="message-avatar" ${sender === 'ai' ? 'style="padding: 4px; border: 1px solid #dde3ea;"' : ''}>
            <div class="message-content" role="log" aria-live="polite"></div>
        `;

        messageList.appendChild(messageDiv);
        const contentDiv = messageDiv.querySelector('.message-content');
        const formattedText = formatText(text);

        if (isTyping && sender === 'ai') {
            typeEffect(contentDiv, formattedText);
        } else {
            contentDiv.innerHTML = formattedText;
            scrollToBottom();
        }
    }

    function typeEffect(element, html) {
        let i = 0;
        let currentHtml = '';
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const nodes = Array.from(tempDiv.childNodes);

        let nodeIndex = 0;
        let charIndex = 0;

        function type() {
            if (nodeIndex < nodes.length) {
                const currentNode = nodes[nodeIndex];

                if (currentNode.nodeType === Node.TEXT_NODE) {
                    if (charIndex < currentNode.textContent.length) {
                        element.innerHTML += currentNode.textContent.charAt(charIndex);
                        charIndex++;
                        scrollToBottom();
                        setTimeout(type, 15);
                    } else {
                        nodeIndex++;
                        charIndex = 0;
                        type();
                    }
                } else {
                    // It's an element node (like <strong>)
                    const clone = currentNode.cloneNode(false);
                    element.appendChild(clone);
                    typeNodeContent(currentNode, clone, () => {
                        nodeIndex++;
                        type();
                    });
                }
            }
        }

        function typeNodeContent(sourceNode, targetNode, callback) {
            let innerText = sourceNode.textContent;
            let innerI = 0;

            function typeInner() {
                if (innerI < innerText.length) {
                    targetNode.textContent += innerText.charAt(innerI);
                    innerI++;
                    scrollToBottom();
                    setTimeout(typeInner, 15);
                } else {
                    callback();
                }
            }
            typeInner();
        }

        type();
    }

    function scrollToBottom() {
        const chatContainer = document.querySelector('.chat-container');
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function formatText(text) {
        if (!text) return '';
        
        let html = text;
        
        // Escape basic HTML
        html = html.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        
        // Format the 5 specific sections to be bold and colorful
        const sections = [
            "1. SUMMARY:", "2. NEXT STEPS:", "3. VIOLATIONS:", 
            "4. EXPLANATION:", "5. CASE STUDY/ANALOGY:", "4. Explanation:"
        ];
        
        sections.forEach(section => {
            // we use regex to replace it case insensitively
            const regex = new RegExp(`(${section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
            html = html.replace(regex, '<br><strong style="color: #0b57d0; font-size: 1.1em; display: inline-block; margin-top: 10px; margin-bottom: 5px;">$1</strong>');
        });

        // Convert bold markdown elements ** text **
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Convert newlines to breaks
        html = html.replace(/\n(;?)/g, '<br>');

        // Bold constitutional articles and sections
        html = html.replace(/(Article\s+\d+[a-zA-Z\(\)]*)/gi, '<strong>$1</strong>');
        html = html.replace(/(Section\s+\d+[a-zA-Z\(\)]*)/gi, '<strong>$1</strong>');

        // Clean up leading breaks if any
        if (html.startsWith('<br>')) {
            html = html.substring(4);
        }

        return html;
    }

    // Mock logic removed - integrated with backend
});
