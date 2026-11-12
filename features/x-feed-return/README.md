# X feed return

When X automatically refreshes a timeline and removes or moves the post being viewed, shows **See posts that appeared before refresh** above the first post of the refreshed feed. Clicking opens a popup with the text, author handle, and permalink for the previous feed's first three posts, in feed order. Links open in new tabs. If fewer than three posts were loaded, shows those available; media-only posts show a fallback message. Images, videos, and full threads are not archived.

The first three posts are cached before refresh and retained even when X virtualizes them out of the DOM during scrolling. The central visible post is tracked for unexpected feed movement, independent of mouse position. The observer watches inserted/removed posts and virtualized cell transforms. A newer detected automatic refresh replaces the popup's previous snapshot.

Home clicks, timeline-tab clicks, and English **See new posts** / **Show new posts** buttons suppress the banner and clear existing recovery. Manual refreshes quietly replace the snapshot until the changed feed has settled for 1.5 seconds, with a maximum suppression of 15 seconds if no change is detected. Navigation and normal scrolling are also ignored. Refresh-source detection is heuristic; an automatic update during the manual settling period is suppressed too.

The banner is inserted into the new first post's cell in normal document flow. It scrolls with that post, rather than floating over the viewport. If X temporarily removes that cell, the banner reattaches when the same post renders again. The popup closes with its close button, Escape, or a click outside it. Closing the popup retains the banner; switching timeline tabs or navigating away clears both.

Previews and permalinks are kept only in memory. Browser refreshes start fresh without displaying a recovery banner from the previous page. The legacy session-storage snapshot is removed when the script loads. No network requests, external services, or new extension permissions are needed.

Detection is heuristic and depends on X's markup. It may miss a post replaced before the first scan (100 ms), ignore a refresh during active scrolling, or interpret a large layout shift as a refresh. It cannot recover content that was never loaded while the extension was running.

## Manual checks

1. Reload Toolkit at `chrome://extensions`, then refresh X. Note the first three posts.
2. Wait for X to refresh the feed on its own. Check that **See posts that appeared before refresh** appears above the first new tweet.
3. Open the banner. Check the previous three posts' text, order, and links. A link should open that post in a new tab, leaving the popup available when you return.
4. Close the popup using its close button, Escape, and the backdrop. Reopen from the banner. Dismiss the banner separately.
5. Scroll normally; check that it does not trigger recovery. Click Home, the current timeline tab, or See new posts; the feed should refresh without a banner, including intermediate loading renders.
6. After a manual refresh settles, wait for another automatic refresh. Check that recovery resumes with the manually refreshed feed's first three posts. Switch For you / Following or navigate to a post; the old banner should clear.
7. Reload the page and verify that no banner is restored from the previous page. Check a narrow window, keyboard access, long post text, and media-only posts.
