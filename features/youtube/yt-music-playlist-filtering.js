// YouTube Playlist Filter - Hide specific playlists from "Playlists" chip and default view
(function() {
    'use strict';
    
    // Playlists to hide when "Playlists" chip is selected or no chip is selected
    const PLAYLISTS_TO_HIDE = [
        'Liked videos', 
        'Saved Supermix', 
        'Workout',
        'Current', 
        'Indian',
        'Peace', 
        'Feel Good', 
        'Dance', 
        'Meditate'
    ];
    
    let filteringInProgress = false;
    let lastActiveChip = null;
    
    // Function to get playlist title from element
    function getPlaylistTitle(playlistElement) {
        // Try multiple selectors to find the title
        const titleSelectors = [
            'h3[title]',
            '.yt-lockup-metadata-view-model-wiz__title span',
            '.yt-core-attributed-string[role="text"]'
        ];
        
        for (const selector of titleSelectors) {
            const titleElement = playlistElement.querySelector(selector);
            if (titleElement) {
                const title = titleElement.getAttribute('title') || 
                             titleElement.textContent || 
                             titleElement.innerText;
                if (title && title.trim()) {
                    return title.trim();
                }
            }
        }
        return '';
    }
    
    // Function to check if playlist should be hidden
    function shouldHidePlaylist(title) {
        return PLAYLISTS_TO_HIDE.some(hiddenName => 
            title.toLowerCase().includes(hiddenName.toLowerCase())
        );
    }
    
    // Function to get currently active chip
    function getActiveChip() {
        const activeChip = document.querySelector('chip-bar-view-model button[aria-selected="true"]');
        return activeChip ? activeChip.textContent.trim() : null;
    }
    
    // Main filtering function
    function applyPlaylistFilter() {
        if (filteringInProgress) return;
        
        const activeChipText = getActiveChip();
        
        // Only apply filtering for "Playlists" chip or when no chip is selected
        if (activeChipText !== 'Playlists' && activeChipText !== null) {
            return;
        }
        
        filteringInProgress = true;
        
        const playlistElements = document.querySelectorAll('ytd-rich-item-renderer');
        let hiddenCount = 0;
        
        playlistElements.forEach(playlist => {
            const title = getPlaylistTitle(playlist);
            if (title && shouldHidePlaylist(title)) {
                playlist.style.display = 'none';
                playlist.setAttribute('data-playlist-filter-hidden', 'true');
                hiddenCount++;
            } else if (playlist.hasAttribute('data-playlist-filter-hidden')) {
                playlist.style.display = '';
                playlist.removeAttribute('data-playlist-filter-hidden');
            }
        });
        
        console.log(`YouTube Playlist Filter: Hidden ${hiddenCount} playlists for "${activeChipText || 'no chip'}"`);
        filteringInProgress = false;
    }
    
    // Persistent filter application with retries
    function applyFilterWithRetries(maxRetries = 10, currentRetry = 1) {
        applyPlaylistFilter();
        
        // For Playlists chip, retry multiple times to ensure our filtering sticks
        const activeChip = getActiveChip();
        if (activeChip === 'Playlists' && currentRetry < maxRetries) {
            setTimeout(() => {
                applyFilterWithRetries(maxRetries, currentRetry + 1);
            }, 50 * currentRetry); // Increasing delay: 50ms, 100ms, 150ms, etc.
        }
    }
    
    // Function to handle chip state changes
    function handleChipChange() {
        const currentActiveChip = getActiveChip();
        
        // Only process if the active chip actually changed
        if (currentActiveChip !== lastActiveChip) {
            lastActiveChip = currentActiveChip;
            
            // Small delay to let YouTube's filtering happen first
            setTimeout(() => {
                applyFilterWithRetries();
            }, 100);
        }
    }
    
    // Setup mutation observer to watch for chip changes
    function createChipObserver() {
        const chipContainer = document.querySelector('chip-bar-view-model[role="tablist"]');
        if (!chipContainer) return null;
        
        const observer = new MutationObserver((mutations) => {
            let chipChanged = false;
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && 
                    mutation.attributeName === 'aria-selected' &&
                    mutation.target.matches('chip-bar-view-model button')) {
                    chipChanged = true;
                }
            });
            
            if (chipChanged) {
                handleChipChange();
            }
        });
        
        observer.observe(chipContainer, {
            attributes: true,
            attributeFilter: ['aria-selected'],
            subtree: true
        });
        
        return observer;
    }
    
    // Setup mutation observer to watch for playlist changes
    function createPlaylistObserver() {
        const playlistContainer = document.querySelector('#contents');
        if (!playlistContainer) return null;
        
        const observer = new MutationObserver((mutations) => {
            let playlistsChanged = false;
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' || 
                    (mutation.type === 'attributes' && mutation.attributeName === 'style')) {
                    playlistsChanged = true;
                }
            });
            
            if (playlistsChanged && !filteringInProgress) {
                setTimeout(() => {
                    applyPlaylistFilter();
                }, 50);
            }
        });
        
        observer.observe(playlistContainer, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style']
        });
        
        return observer;
    }
    
    // Function to initialize all observers and apply initial filter
    function initialize() {
        console.log('YouTube Playlist Filter: Initializing...');
        
        // Wait for both chips and playlists to be available
        const checkForContent = () => {
            const playlists = document.querySelectorAll('ytd-rich-item-renderer');
            const chips = document.querySelector('chip-bar-view-model[role="tablist"]');
            
            if (playlists.length > 0 && chips) {
                // Create observers
                createChipObserver();
                createPlaylistObserver();
                
                // Set initial state
                lastActiveChip = getActiveChip();
                
                // Apply initial filter
                setTimeout(() => {
                    applyFilterWithRetries();
                }, 200);
                
                console.log('YouTube Playlist Filter: Successfully initialized!');
            } else {
                console.log('YouTube Playlist Filter: Waiting for content to load...');
                setTimeout(checkForContent, 1000);
            }
        };
        
        checkForContent();
    }
    
    // Handle YouTube's single-page app navigation
    let lastUrl = location.href;
    const urlObserver = new MutationObserver(() => {
        const currentUrl = location.href;
        if (currentUrl !== lastUrl) {
            lastUrl = currentUrl;
            filteringInProgress = false;
            lastActiveChip = null;
            
            // Re-initialize when navigating to playlists page
            if (currentUrl.includes('/playlist') || currentUrl.includes('/@') || 
                currentUrl.includes('/channel') || currentUrl.includes('/c/')) {
                setTimeout(initialize, 2000);
            }
        }
    });
    
    // Start URL monitoring
    urlObserver.observe(document, { subtree: true, childList: true });
    
    // Initial setup based on document ready state
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
    // Backup initialization
    window.addEventListener('load', () => {
        setTimeout(initialize, 1000);
    });
    
    console.log('YouTube Playlist Filter: Script loaded successfully');
})();