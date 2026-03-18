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

    function sendMessage() {
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

        // Mock AI response
        setTimeout(() => {
            const response = getMockResponse(text);
            addMessage(response, 'ai', true); // Pass true to enable typing
        }, 1000);
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
        // Simple mock bolding for constitutional articles
        return text.replace(/(Article \d+)/g, '<strong>$1</strong>');
    }

    function getMockResponse(input) {
        const lowerInput = input.toLowerCase().trim();

        // --- 1. Basic Greetings & Variations ---
        const greetingRegex = /^(h[ei]+y*|hello+|namaste+|hola+|g'day|morning|afternoon|evening|good\s+(morning|afternoon|evening))\b/i;
        if (greetingRegex.test(lowerInput)) {
            return "Hello! I am your <strong>LawPro</strong> assistant. How can I help you explore the Indian Constitution today?";
        }

        // --- 2. "How are you?" Intent ---
        if (lowerInput.match(/\b(how\s+are\s+you|how\s+r\s+u|hows\s+it\s+going|how\s+are\s+u)\b/i)) {
            return "I'm functioning perfectly and ready to help you understand the laws of the land! How are you doing? Is there a specific Article or legal concept you'd like to discuss?";
        }

        // --- 3. Gratitude & Acknowledgments ---
        if (lowerInput.match(/\b(thank|thanks|thx|tysm|thank\s+you)\b/i)) {
            return "You're very welcome! I'm glad I could help. Feel free to ask if you have more questions about the Constitution of India.";
        }

        if (lowerInput.match(/\b(ok|okay|got\s+it|understood|i\s+see|its\s+ok|no\s+problem)\b/i)) {
            return "Great! Let me know whenever you're ready to explore another part of the Constitution, like Fundamental Rights or the Amendment process.";
        }

        // --- 4. Farewells & Exit ---
        if (lowerInput.match(/\b(bye|goodnight|good\s+night|see\s+ya|catch\s+you\s+later|exit)\b/i)) {
            return "Goodbye! It was a pleasure assisting you. The Constitution of India is always here to protect your rights. Have a wonderful day/night!";
        }

        // --- 5. Constitutional Queries (Existing) ---
        if (lowerInput.includes('article 21')) {
            return "<strong>Article 21</strong> of the Indian Constitution states: \"No person shall be deprived of his life or personal liberty except according to procedure established by law.\" This is one of the most significant fundamental rights, often expanded by the Supreme Court to include the right to privacy, right to a clean environment, and right to dignity.";
        } else if (lowerInput.includes('fundamental rights')) {
            return "Fundamental Rights are enshrined in <strong>Part III</strong> of the Constitution (Articles 12 to 35). There are currently six categories: \n\n1. Right to Equality\n2. Right to Freedom\n3. Right against Exploitation\n4. Right to Freedom of Religion\n5. Cultural and Educational Rights\n6. Right to Constitutional Remedies.";
        } else if (lowerInput.includes('directive principles')) {
            return "The <strong>Directive Principles of State Policy (DPSP)</strong> are listed in Part IV (Articles 36-51). They are guidelines for the Government of India to keep in mind while framing laws and policies, aiming for sound social and economic conditions.";
        } else if (lowerInput.includes('amendments')) {
            return "The process for amending the Constitution is described in <strong>Article 368</strong>. There are three types: \n1. Simple Majority\n2. Special Majority\n3. Special Majority plus ratification by half of the State Legislatures.";
        } else {
            return "That's an interesting query! While I didn't recognize a specific command, I'm specialized in the <strong>Indian Constitution</strong>. Would you like to know about Fundamental Rights, the Preamble, or perhaps a specific Article?";
        }
    }
});
