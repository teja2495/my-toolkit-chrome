// YouTube Watch Later Title Click Extension
// Adds Watch Later functionality to video title clicks

(function() {
    'use strict';

    // Configuration
    const OBSERVER_CONFIG = { childList: true, subtree: true };
    
    // Track processed elements to avoid duplicates
    const processedElements = new WeakSet();

    // Function to add watch later functionality to video title
    function addWatchLaterToTitle(videoCard) {
        if (processedElements.has(videoCard)) return;
        processedElements.add(videoCard);

        // Find the video title link
        const titleLink = videoCard.querySelector('.yt-lockup-metadata-view-model__title, h3 a, .ytd-video-meta-block a');
        if (!titleLink) return;

        // Check if we've already added the functionality
        if (titleLink.dataset.watchLaterAdded) return;
        titleLink.dataset.watchLaterAdded = 'true';

        // Store original href
        const originalHref = titleLink.href;

        // Add hover effect to make title blue
        titleLink.style.transition = 'color 0.2s ease';
        titleLink.addEventListener('mouseenter', () => {
            titleLink.style.color = '#3ea6ff';
        });
        titleLink.addEventListener('mouseleave', () => {
            titleLink.style.color = '';
        });

        // Add click handler to the title
        titleLink.addEventListener('click', (e) => {
            // Check if Ctrl/Cmd key is pressed (for opening in new tab)
            if (e.ctrlKey || e.metaKey) {
                return; // Let the default behavior happen
            }

            // Check if middle mouse button or right click
            if (e.button === 1 || e.button === 2) {
                return; // Let the default behavior happen
            }

            // Prevent default navigation and stop all propagation
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            // Add to watch later (no navigation)
            handleWatchLaterClick(videoCard);
            
            // Return false to ensure no navigation
            return false;
        }, true); // Use capture phase to intercept before other handlers
    }

    // Function to handle watch later button click
    function handleWatchLaterClick(videoCard) {
        // Find the three-dot menu button - try multiple selectors
        let menuButton = videoCard.querySelector('.yt-lockup-metadata-view-model__menu-button button');
        
        if (!menuButton) {
            // Try alternative selectors
            menuButton = videoCard.querySelector('button[aria-label="More actions"]');
        }
        
        if (!menuButton) {
            // Try finding any button with three dots icon
            const buttons = videoCard.querySelectorAll('button');
            for (let button of buttons) {
                const icon = button.querySelector('svg path[d*="M12 4a2 2 0 100 4 2 2 0 000-4Zm0 6a2 2 0 100 4 2 2 0 000-4Zm0 6a2 2 0 100 4 2 2 0 000-4Z"]');
                if (icon) {
                    menuButton = button;
                    break;
                }
            }
        }
        
        if (!menuButton) {
            return;
        }

        // Click the menu button
        menuButton.click();

        // Wait for menu to appear and then click "Save to Watch Later"
        const tryClickWatchLater = (attempt = 1) => {
            // Try multiple selectors for the menu - prioritize the correct menu
            let menu = document.querySelector('ytd-menu-popup-renderer');
            if (!menu) {
                menu = document.querySelector('yt-sheet-view-model');
            }
            if (!menu) {
                menu = document.querySelector('ytd-menu-renderer');
            }
            if (!menu) {
                menu = document.querySelector('[role="menu"]');
            }
            
            if (!menu) {
                if (attempt < 5) {
                    setTimeout(() => tryClickWatchLater(attempt + 1), 200);
                }
                return;
            }
            
            // Check if this is the right menu by looking for video-specific options
            const menuText = menu.textContent || '';
            
            if (!menuText.includes('Save to Watch later') && !menuText.includes('Add to queue')) {
                if (attempt < 5) {
                    setTimeout(() => tryClickWatchLater(attempt + 1), 200);
                }
                return;
            }

            // Try multiple strategies to find the "Save to Watch later" option
            let watchLaterOption = null;

            // Strategy 1: Look for the yt-list-item-view-model containing "Save to Watch later"
            const listItems = menu.querySelectorAll('yt-list-item-view-model[role="menuitem"]');
            
            for (let i = 0; i < listItems.length; i++) {
                const item = listItems[i];
                const titleSpan = item.querySelector('span.yt-core-attributed-string.yt-list-item-view-model__title');
                
                if (titleSpan && titleSpan.textContent.includes('Save to Watch later')) {
                    watchLaterOption = item;
                    break;
                }
            }

            // Strategy 2: Look for the specific span with exact classes
            if (!watchLaterOption) {
                watchLaterOption = menu.querySelector('span.yt-core-attributed-string.yt-list-item-view-model__title');
                if (watchLaterOption && watchLaterOption.textContent.includes('Save to Watch later')) {
                    // Found the span, find its parent menu item
                    watchLaterOption = watchLaterOption.closest('yt-list-item-view-model[role="menuitem"]');
                }
            }

            // Strategy 3: Look for any element containing "Save to Watch later"
            if (!watchLaterOption) {
                const allElements = menu.querySelectorAll('*');
                for (let element of allElements) {
                    if (element.textContent && element.textContent.includes('Save to Watch later')) {
                        watchLaterOption = element.closest('yt-list-item-view-model[role="menuitem"]');
                        if (watchLaterOption) break;
                    }
                }
            }

            if (watchLaterOption) {
                // Try multiple click methods
                try {
                    watchLaterOption.click();
                } catch (e) {
                    // Try mouse events as fallback
                    watchLaterOption.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
                    watchLaterOption.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
                    watchLaterOption.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
                }
            } else {
                // Try again after a short delay
                if (attempt < 5) {
                    setTimeout(() => tryClickWatchLater(attempt + 1), 200);
                }
            }
        };

        // Start trying to click with multiple attempts
        setTimeout(() => tryClickWatchLater(), 300);
    }

    // Function to process all video cards on the page
    function processVideoCards() {
        const videoCards = document.querySelectorAll('ytd-rich-item-renderer, ytd-video-renderer, ytd-compact-video-renderer');
        videoCards.forEach(card => {
            if (card.querySelector('.yt-lockup-metadata-view-model__title, h3 a, .ytd-video-meta-block a')) {
                addWatchLaterToTitle(card);
            }
        });
    }

    // Initialize the extension
    function init() {
        // Process existing video cards
        processVideoCards();

        // Set up observer for dynamically loaded content
        const observer = new MutationObserver((mutations) => {
            let shouldProcess = false;
            
            mutations.forEach(mutation => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Check if new video cards were added
                            if (node.matches && (
                                node.matches('ytd-rich-item-renderer') ||
                                node.matches('ytd-video-renderer') ||
                                node.matches('ytd-compact-video-renderer') ||
                                node.querySelector('ytd-rich-item-renderer, ytd-video-renderer, ytd-compact-video-renderer')
                            )) {
                                shouldProcess = true;
                            }
                        }
                    });
                }
            });

            if (shouldProcess) {
                // Debounce processing to avoid excessive calls
                clearTimeout(init.processTimeout);
                init.processTimeout = setTimeout(processVideoCards, 100);
            }
        });

        // Start observing
        observer.observe(document.body, OBSERVER_CONFIG);

        // Also process on scroll (for infinite scroll)
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(processVideoCards, 200);
        });
    }

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Re-initialize on navigation (for SPA behavior)
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            setTimeout(init, 1000); // Wait for page to load
        }
    }).observe(document, { subtree: true, childList: true });

})();
