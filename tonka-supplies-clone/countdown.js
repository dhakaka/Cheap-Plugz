// countdown.js
(function () {
    const bannerHTML = `
        <div class="countdown-banner hidden" id="global-countdown-banner">
            <div class="countdown-content">
                <div class="countdown-title" id="cd-title">EVENT STARTING IN</div>
                <div class="countdown-timer">
                    <div class="time-block" style="align-items: flex-start;">
                        <span class="time-value" id="cd-days">00</span>
                        <span class="time-label" style="text-align:left;">BE READY<br>DAYS</span>
                    </div>
                    <span class="time-colon">:</span>
                    <div class="time-block">
                        <span class="time-value" id="cd-hours">00</span>
                        <span class="time-label">HOURS</span>
                    </div>
                    <span class="time-colon">:</span>
                    <div class="time-block">
                        <span class="time-value" id="cd-mins">00</span>
                        <span class="time-label">MINS</span>
                    </div>
                    <span class="time-colon">:</span>
                    <div class="time-block">
                        <span class="time-value" id="cd-secs">00</span>
                        <span class="time-label">SECS</span>
                    </div>
                </div>
                <div class="countdown-btn-wrapper">
                    <button class="countdown-btn" onclick="handleGetNotified()">GET NOTIFIED</button>
                </div>
            </div>
        </div>
    `;

    document.addEventListener('DOMContentLoaded', () => {
        // Only inject if not in admin
        if (!window.location.pathname.includes('admin.html')) {
            document.body.insertAdjacentHTML('afterbegin', bannerHTML);
            initCountdown();
        }
    });

    function initCountdown() {
        const configStr = localStorage.getItem('tonka_countdown_config');
        if (!configStr) return;

        const config = JSON.parse(configStr);
        if (!config.active) return;

        const banner = document.getElementById('global-countdown-banner');
        if (!banner) return;

        banner.classList.remove('hidden');
        document.getElementById('cd-title').innerText = config.title;

        const targetDate = new Date(config.endTime).getTime();

        const updateTimer = setInterval(() => {
            const now = new Date().getTime();
            const distance = targetDate - now;

            if (distance < 0) {
                // Trigger automated emails if configured and not yet sent
                if (config.autoEmail && !config.emailsSent) {
                    config.emailsSent = true;
                    // Persist immediately to prevent multiple rapid-fires across tabs
                    localStorage.setItem('tonka_countdown_config', JSON.stringify(config));

                    const notifiedStr = localStorage.getItem('tonka_notified_emails');
                    const notified = notifiedStr ? JSON.parse(notifiedStr) : [];

                    if (notified.length > 0) {
                        const outboxStr = localStorage.getItem('tonka_outbox');
                        const outbox = outboxStr ? JSON.parse(outboxStr) : [];

                        outbox.push({
                            timestamp: new Date().toISOString(),
                            type: 'Countdown Auto-Email',
                            subject: config.emailSubject || `Event: ${config.title}`,
                            body: config.emailBody || '',
                            recipients: notified
                        });
                        localStorage.setItem('tonka_outbox', JSON.stringify(outbox));
                        console.log(`[Auto-Email] Simulated sending email "${config.emailSubject}" to ${notified.length} opted-in customers.`);
                    }
                }

                clearInterval(updateTimer);
                document.getElementById('cd-days').innerText = "00";
                document.getElementById('cd-hours').innerText = "00";
                document.getElementById('cd-mins').innerText = "00";
                document.getElementById('cd-secs').innerText = "00";
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            document.getElementById('cd-days').innerText = days.toString().padStart(2, '0');
            document.getElementById('cd-hours').innerText = hours.toString().padStart(2, '0');
            document.getElementById('cd-mins').innerText = minutes.toString().padStart(2, '0');
            document.getElementById('cd-secs').innerText = seconds.toString().padStart(2, '0');
        }, 1000);
    }

    window.handleGetNotified = function () {
        const email = localStorage.getItem('current_customer_email');
        if (!email) {
            // Need to sign in. Pass a query param to know where to redirect after auth.
            window.location.href = 'login.html?redirect=notified';
        } else {
            // Already signed in
            window.location.href = 'notified.html';
        }
    }
})();
