// Domain Blocker Content Script
class DomainBlockerContent {
    constructor() {
        this.blockedDomains = [];
        this.isEnabled = true;
        this.overlayId = 'domain-blocker-countdown-overlay';
        this.countdownInterval = null;
        this.init();
    }
    
    async init() {
        // Load settings and blocked domains
        await this.loadSettings();
        await this.loadBlockedDomains();
        
        // Listen for messages from popup
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.action === 'updateDomainBlocking') {
                this.loadSettings().then(() => {
                    this.loadBlockedDomains().then(() => {
                        this.checkCurrentPage();
                    });
                });
            }
        });
        
        // Check current page on load
        this.checkCurrentPage();
    }
    
    async loadSettings() {
        return new Promise((resolve) => {
            chrome.storage.sync.get(['domainBlockerEnabled'], (result) => {
                this.isEnabled = result.domainBlockerEnabled !== false;
                resolve();
            });
        });
    }
    
    async loadBlockedDomains() {
        return new Promise((resolve) => {
            chrome.storage.sync.get(['blockedDomains'], (result) => {
                this.blockedDomains = result.blockedDomains || [];
                resolve();
            });
        });
    }
    
    checkCurrentPage() {
        if (!this.isEnabled) {
            this.removeCountdownOverlay();
            return;
        }
        
        const currentDomain = window.location.hostname;
        
        // Check if current domain is blocked
        const isBlocked = this.blockedDomains.some(blockedDomain => {
            return this.matchesDomain(currentDomain, blockedDomain);
        });
        
        if (isBlocked) {
            this.showCountdownOverlay(10);
        } else {
            this.removeCountdownOverlay();
        }
    }
    
    matchesDomain(currentDomain, blockedDomain) {
        // Remove www. prefix for comparison
        const cleanCurrent = currentDomain.replace(/^www\./, '');
        const cleanBlocked = blockedDomain.replace(/^www\./, '');
        
        return cleanCurrent === cleanBlocked || cleanCurrent.endsWith('.' + cleanBlocked);
    }
    
    showCountdownOverlay(durationInSeconds) {
        if (document.getElementById(this.overlayId)) {
            return;
        }

        const overlay = document.createElement('div');
        overlay.id = this.overlayId;
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.zIndex = '2147483647';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.background = 'rgba(0, 0, 0, 0.55)';
        const backdrop = 'blur(36px) saturate(160%)';
        overlay.style.backdropFilter = backdrop;
        overlay.style.webkitBackdropFilter = backdrop;
        overlay.style.color = '#111827';
        overlay.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

        const container = document.createElement('div');
        container.style.textAlign = 'center';
        container.style.width = 'min(92vw, 580px)';
        container.style.minHeight = '320px';
        container.style.boxSizing = 'border-box';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.alignItems = 'center';
        container.style.justifyContent = 'center';
        container.style.padding = '44px 40px';
        container.style.borderRadius = '16px';
        container.style.background = '#ffffff';
        container.style.border = '1px solid #e5e7eb';
        container.style.boxShadow = '0 24px 60px rgba(0, 0, 0, 0.35)';

        const title = document.createElement('h1');
        title.textContent = 'Website Blocked';
        title.style.margin = '0 0 14px 0';
        title.style.fontSize = '30px';
        title.style.fontWeight = '600';
        title.style.color = '#111827';

        const message = document.createElement('p');
        message.textContent = 'This page will unlock shortly.';
        message.style.margin = '0 0 20px 0';
        message.style.fontSize = '17px';
        message.style.color = '#374151';

        const timer = document.createElement('div');
        timer.style.fontSize = '64px';
        timer.style.fontWeight = '700';
        timer.style.marginBottom = '28px';
        timer.style.lineHeight = '1';
        timer.style.color = '#111827';

        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Cancel';
        cancelButton.style.background = 'transparent';
        cancelButton.style.color = '#111827';
        cancelButton.style.border = '1px solid #d1d5db';
        cancelButton.style.borderRadius = '8px';
        cancelButton.style.padding = '12px 28px';
        cancelButton.style.fontSize = '15px';
        cancelButton.style.fontWeight = '600';
        cancelButton.style.cursor = 'pointer';
        cancelButton.style.transition = 'background 0.2s ease, border-color 0.2s ease, color 0.2s ease';
        cancelButton.addEventListener('mouseenter', () => {
            cancelButton.style.background = '#f9fafb';
            cancelButton.style.borderColor = '#9ca3af';
        });
        cancelButton.addEventListener('mouseleave', () => {
            cancelButton.style.background = 'transparent';
            cancelButton.style.borderColor = '#d1d5db';
        });
        cancelButton.addEventListener('click', () => {
            chrome.runtime.sendMessage({ action: 'closeCurrentTab' });
        });

        let secondsLeft = durationInSeconds;
        timer.textContent = String(secondsLeft);

        container.appendChild(title);
        container.appendChild(message);
        container.appendChild(timer);
        container.appendChild(cancelButton);
        overlay.appendChild(container);
        document.documentElement.appendChild(overlay);

        this.countdownInterval = window.setInterval(() => {
            secondsLeft -= 1;
            if (secondsLeft <= 0) {
                this.removeCountdownOverlay();
                return;
            }

            timer.textContent = String(secondsLeft);
        }, 1000);
    }

    removeCountdownOverlay() {
        if (this.countdownInterval) {
            window.clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }

        const overlay = document.getElementById(this.overlayId);
        if (overlay) {
            overlay.remove();
        }
    }
}

// Initialize domain blocker
if (typeof chrome !== 'undefined' && chrome.storage) {
    new DomainBlockerContent();
}
