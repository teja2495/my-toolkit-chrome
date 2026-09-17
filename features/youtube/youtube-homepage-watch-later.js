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

        const isVisible = (element) => {
            const style = window.getComputedStyle(element);
            return style.display !== 'none' && style.visibility !== 'hidden' && element.getClientRects().length > 0;
        };

        const normalizedText = (element) => (element.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();

        const clickWatchLaterInSaveDialog = (attempt = 1) => {
            const saveDialog = [...document.querySelectorAll('ytd-add-to-playlist-renderer, yt-sheet-view-model')]
                .find((dialog) => isVisible(dialog) && normalizedText(dialog).includes('watch later'));
            if (!saveDialog) {
                if (attempt < 5) setTimeout(() => clickWatchLaterInSaveDialog(attempt + 1), 200);
                return;
            }

            const watchLaterRow = [...saveDialog.querySelectorAll('ytd-playlist-add-to-option-renderer, [role="checkbox"], yt-list-item-view-model')]
                .find((item) => normalizedText(item).includes('watch later'));
            if (!watchLaterRow) {
                if (attempt < 5) setTimeout(() => clickWatchLaterInSaveDialog(attempt + 1), 200);
                return;
            }

            const checkbox = watchLaterRow.matches('[role="checkbox"]')
                ? watchLaterRow
                : watchLaterRow.querySelector('[role="checkbox"], #checkbox');
            if (!checkbox || checkbox.getAttribute('aria-checked') !== 'true') {
                (checkbox || watchLaterRow).click();
            }
        };

        // Wait for the card's visible menu, then select its save action.
        const tryClickWatchLater = (attempt = 1) => {
            const menu = [...document.querySelectorAll('ytd-menu-popup-renderer, yt-sheet-view-model, ytd-menu-renderer, [role="menu"]')]
                .find((candidate) => isVisible(candidate) && normalizedText(candidate).includes('save'));
            
            if (!menu) {
                if (attempt < 5) {
                    setTimeout(() => tryClickWatchLater(attempt + 1), 200);
                }
                return;
            }
            
            // Check that this is the active video menu, not another menu retained in the DOM.
            const menuText = normalizedText(menu);
            
            if (!menuText.includes('save to watch later') && !menuText.includes('save to playlist')) {
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
                
                if (titleSpan && normalizedText(titleSpan).includes('save to watch later')) {
                    watchLaterOption = item;
                    break;
                }
            }

            // Strategy 2: Look for the specific span with exact classes
            if (!watchLaterOption) {
                watchLaterOption = menu.querySelector('span.yt-core-attributed-string.yt-list-item-view-model__title');
                if (watchLaterOption && normalizedText(watchLaterOption).includes('save to watch later')) {
                    // Found the span, find its parent menu item
                    watchLaterOption = watchLaterOption.closest('yt-list-item-view-model[role="menuitem"]');
                }
            }

            // Strategy 3: Look for any element containing "Save to Watch later"
            if (!watchLaterOption) {
                const allElements = menu.querySelectorAll('*');
                for (let element of allElements) {
                    if (normalizedText(element).includes('save to watch later')) {
                        watchLaterOption = element.closest('yt-list-item-view-model[role="menuitem"], ytd-menu-service-item-renderer, [role="menuitem"]');
                        if (watchLaterOption) break;
                    }
                }
            }

            const saveToPlaylistOption = [...menu.querySelectorAll('yt-list-item-view-model[role="menuitem"], ytd-menu-service-item-renderer, [role="menuitem"]')]
                .find((item) => normalizedText(item).includes('save to playlist'));

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
            } else if (saveToPlaylistOption) {
                saveToPlaylistOption.click();
                clickWatchLaterInSaveDialog();
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
