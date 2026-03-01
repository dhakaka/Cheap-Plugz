(function () {
    // Inject HTML Structure
    const chatbotHTML = `
        <div class="chatbot-wrapper" id="chatbot-wrapper">
            <div class="chatbot-window" id="chatbot-window">
                <div class="chatbot-header">
                    <h3><i data-feather="cpu" style="width:18px; height:18px; color:#00ff00;"></i> Cheap Plugz AI</h3>
                    <button class="chatbot-close" id="chatbot-close-btn" title="Close Chat">
                        <i data-feather="chevron-down" style="width:20px; height:20px;"></i>
                    </button>
                </div>
                <div class="chatbot-messages" id="chatbot-messages">
                    <div class="chat-bubble ai">
                        Hi there! I'm the Cheap Plugz AI assistant. How can I help you today?
                        <div class="chatbot-prompts" id="chatbot-initial-prompts">
                            <button class="chat-prompt-btn" onclick="window.chatbotPrompt('track')">Tracking & Order Status</button>
                            <button class="chat-prompt-btn" onclick="window.chatbotPrompt('legit')">Is This Site Legit?</button>
                            <button class="chat-prompt-btn" onclick="window.chatbotPrompt('shipping')">How long does shipping take?</button>
                        </div>
                    </div>
                </div>
                <div class="chatbot-input-area">
                    <input type="text" class="chatbot-input" id="chatbot-input" placeholder="Type a message..." autocomplete="off">
                    <button class="chatbot-send-btn" id="chatbot-send-btn">
                        <i data-feather="send" style="width:18px; height:18px;"></i>
                    </button>
                </div>
            </div>
            <button class="chatbot-toggle-btn" id="chatbot-toggle-btn" title="Chat with AI">
                <i data-feather="message-circle" style="width:28px; height:28px;"></i>
            </button>
        </div>
    `;

    // Append to body on DOMContentLoaded
    document.addEventListener('DOMContentLoaded', () => {
        document.body.insertAdjacentHTML('beforeend', chatbotHTML);

        // Re-init feather icons if available
        if (window.feather) {
            feather.replace();
        }

        const toggleBtn = document.getElementById('chatbot-toggle-btn');
        const closeBtn = document.getElementById('chatbot-close-btn');
        const windowEl = document.getElementById('chatbot-window');
        const sendBtn = document.getElementById('chatbot-send-btn');
        const inputEl = document.getElementById('chatbot-input');
        const messagesEl = document.getElementById('chatbot-messages');

        let chatState = 'IDLE'; // IDLE, WAITING_FOR_ORDER, WAITING_FOR_STATE

        // Toggle UI
        toggleBtn.addEventListener('click', () => {
            windowEl.classList.toggle('open');
            if (windowEl.classList.contains('open')) {
                inputEl.focus();
            }
        });

        closeBtn.addEventListener('click', () => {
            windowEl.classList.remove('open');
        });

        // Helper to add messages
        function appendMessage(sender, text, htmlExtras = '') {
            const bubble = document.createElement('div');
            bubble.className = `chat-bubble ${sender}`;
            bubble.innerHTML = text + htmlExtras;
            messagesEl.appendChild(bubble);
            // Scroll to bottom
            messagesEl.scrollTop = messagesEl.scrollHeight;
        }

        // Handle predefined prompts
        window.chatbotPrompt = function (type) {
            document.getElementById('chatbot-initial-prompts').style.display = 'none'; // hide initial prompts

            if (type === 'track') {
                appendMessage('user', 'How can I track my order?');
                setTimeout(() => {
                    appendMessage('ai', 'What is your Order Number?');
                    chatState = 'WAITING_FOR_ORDER';
                    inputEl.focus();
                }, 500);
            } else if (type === 'legit') {
                appendMessage('user', 'Is This Site Legit?');
                setTimeout(() => {
                    appendMessage('ai', 'This website is indeed legit, please check out the reviews or look below and see reviews from customers.',
                        `<br><button onclick="document.getElementById('nav-reviews-btn')?.click();" style="margin-top:8px; background:#fff; color:#000; border:none; padding:6px 12px; border-radius:4px; font-size:0.8rem; cursor:pointer;">View Store Reviews</button>`);
                    chatState = 'IDLE';
                }, 500);
            } else if (type === 'shipping') {
                appendMessage('user', 'How long does shipping take?');
                setTimeout(() => {
                    const statesDropdown = `
                        <select class="chatbot-state-select" onchange="window.chatbotSelectState(this)">
                            <option value="">-- Select Your State --</option>
                            <option value="AL">Alabama</option><option value="AK">Alaska</option><option value="AZ">Arizona</option><option value="AR">Arkansas</option><option value="CA">California</option><option value="CO">Colorado</option><option value="CT">Connecticut</option><option value="DE">Delaware</option><option value="FL">Florida</option><option value="GA">Georgia</option><option value="HI">Hawaii</option><option value="ID">Idaho</option><option value="IL">Illinois</option><option value="IN">Indiana</option><option value="IA">Iowa</option><option value="KS">Kansas</option><option value="KY">Kentucky</option><option value="LA">Louisiana</option><option value="ME">Maine</option><option value="MD">Maryland</option><option value="MA">Massachusetts</option><option value="MI">Michigan</option><option value="MN">Minnesota</option><option value="MS">Mississippi</option><option value="MO">Missouri</option><option value="MT">Montana</option><option value="NE">Nebraska</option><option value="NV">Nevada</option><option value="NH">New Hampshire</option><option value="NJ">New Jersey</option><option value="NM">New Mexico</option><option value="NY">New York</option><option value="NC">North Carolina</option><option value="ND">North Dakota</option><option value="OH">Ohio</option><option value="OK">Oklahoma</option><option value="OR">Oregon</option><option value="PA">Pennsylvania</option><option value="RI">Rhode Island</option><option value="SC">South Carolina</option><option value="SD">South Dakota</option><option value="TN">Tennessee</option><option value="TX">Texas</option><option value="UT">Utah</option><option value="VT">Vermont</option><option value="VA">Virginia</option><option value="WA">Washington</option><option value="WV">West Virginia</option><option value="WI">Wisconsin</option><option value="WY">Wyoming</option>
                        </select>
                    `;
                    appendMessage('ai', 'Shipping typically takes 1-5 days. Provide your state and I can estimate:', statesDropdown);
                    chatState = 'WAITING_FOR_STATE';
                }, 500);
            }
        };

        window.chatbotSelectState = function (selectEl) {
            if (!selectEl.value) return;
            const stateName = selectEl.options[selectEl.selectedIndex].text;
            appendMessage('user', `My state is ${stateName}`);

            // Disable the select to prevent double choosing
            selectEl.disabled = true;

            setTimeout(() => {
                appendMessage('ai', `I Estimate 5 Days this includes 1 day to be able to ship this item although this is not guarantee.<br><br><span style="color:#ff5555; font-weight:bold;">SYSTEM NOTIFICATION - SHIPPING TIMES ARE DELAYED DUE TO SEVERE WINTER STORM.</span>`);
                chatState = 'IDLE';
            }, 600);
        };

        // Handle Text Input Submission
        function handleSend() {
            const text = inputEl.value.trim();
            if (!text) return;

            appendMessage('user', text);
            inputEl.value = '';

            setTimeout(() => {
                if (chatState === 'WAITING_FOR_ORDER') {
                    // Extract numbers from input just in case they say "Order #1234"
                    const orderIdStr = text.replace(/[^0-9]/g, '');

                    if (orderIdStr) {
                        let orders = localStorage.getItem('tonka_orders');
                        orders = orders ? JSON.parse(orders) : [];
                        const orderInfo = orders.find(o => o.id == orderIdStr);

                        if (orderInfo && orderInfo.trackingNumber) {
                            appendMessage('ai', `Please Track Your Order using this Tracking Number: <span style="color:#00ff00; font-weight:bold;">${orderInfo.trackingNumber}</span>`);
                        } else if (orderInfo) {
                            appendMessage('ai', `I found order #${orderIdStr}, but there is no tracking number assigned to it yet. Please check back later!`);
                        } else {
                            appendMessage('ai', `I'm sorry, I couldn't find an order matching #${orderIdStr}. Please ensure you typed it correctly.`);
                        }
                    } else {
                        appendMessage('ai', `I couldn't detect an order number in your message. Please provide just the numbers.`);
                    }

                    chatState = 'IDLE';
                } else {
                    // 1. Check Custom AI Prompts from Admin
                    let customPrompts = JSON.parse(localStorage.getItem('tonka_ai_prompts') || '[]');
                    let matchedPrompt = customPrompts.find(p => text.toLowerCase().includes(p.trigger.toLowerCase()));

                    if (matchedPrompt) {
                        let finalHtml = matchedPrompt.response;

                        if (matchedPrompt.productId) {
                            let products = JSON.parse(localStorage.getItem('tonka_products') || '[]');
                            let prod = products.find(pr => String(pr.id) === String(matchedPrompt.productId));
                            if (prod) {
                                let dispPrice = prod.salePrice || prod.originalPrice || 0;
                                finalHtml += `
                                    <div style="margin-top: 12px; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">
                                        <img src="${prod.image}" alt="${prod.title}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 4px; margin-bottom: 8px;">
                                        <div style="font-weight: 600; margin-bottom: 4px; color: #fff; font-size: 0.9rem;">${prod.title}</div>
                                        <div style="color: var(--primary-color); font-weight: 700; margin-bottom: 12px;">$${Number(dispPrice).toFixed(2)}</div>
                                        <a href="product.html?id=${prod.id}" style="display: block; text-align: center; background: #fff; color: #000; padding: 8px; border-radius: 4px; text-decoration: none; font-weight: bold; font-size: 0.9rem;">View Product</a>
                                    </div>
                                `;
                            }
                        }

                        if (matchedPrompt.linkUrl) {
                            let linkText = matchedPrompt.linkText || 'Visit Link';
                            finalHtml += `
                                <div style="margin-top: 12px;">
                                    <a href="${matchedPrompt.linkUrl}" target="_blank" style="display: block; text-align: center; background: #270082; margin-top: 8px; color: #fff; padding: 10px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 0.9rem;">${linkText}</a>
                                </div>
                            `;
                        }

                        appendMessage('ai', finalHtml);
                    } else {
                        // 2. Fallback response for literally anything else
                        appendMessage('ai', `Sorry, I am not able to understand your request. Please contact support via our <a href="contact.html">Contact Form</a> for your questions.`);
                    }
                }
            }, 500);
        }

        sendBtn.addEventListener('click', handleSend);
        inputEl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSend();
            }
        });

    });
})();
