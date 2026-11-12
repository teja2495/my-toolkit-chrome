# X feed return

Remembers the post around the middle of the viewport on X/Twitter timelines, independent of mouse position. If the feed unexpectedly removes that post or shifts it substantially, a dismissible banner offers: **Go back to the post you previously looked at**.

Clicking returns to the post's previous position when it is still rendered. If X has discarded it, clicking opens its permalink in the same tab. This recovers the post, not X's previous feed ordering. The first lost post stays available until the banner is used, dismissed, or the user navigates away.

Normal wheel, touch, keyboard, and scrollbar scrolling are ignored. Timeline tab changes and navigation reset tracking. A short-lived permalink in per-tab session storage also allows recovery after a reload within five minutes. No tweet text is stored and no requests or new permissions are needed.

Home and selected timeline-tab clicks capture the reading target before X handles the refresh, preserving it through intermediate renders for up to 15 seconds. Passive DOM updates preserve the original position rather than continually replacing it. The observer watches X's virtualized cell transforms as well as inserted/removed posts. Promoted posts without timestamps use their analytics permalink when available.

Detection is heuristic: it depends on X's tweet markup, may miss a post replaced before the first scan (100 ms), and may interpret a large layout shift as a feed jump. Changes during active scrolling are intentionally ignored. It does not recover posts from before the extension was loaded.

## Manual checks

1. Reload Toolkit at `chrome://extensions`, then refresh X.
2. On Home, scroll until a recognizable post is near the middle of the window, then stop for two seconds. Click the Home navigation icon again to refresh/jump to the top. If the old post moves away or disappears, check that the banner appears and returns to that exact post. Ordinary Home clicks do not suppress detection; a temporarily missing timeline tab bar also preserves the remembered post.
3. When a jump leaves the post loaded farther down, click the banner and check that it scrolls back.
4. Scroll with wheel, keyboard, touch, and scrollbar; normal scrolling should not show the banner.
5. Dismiss with the close button or Escape. Switch between For you / Following or open a post; the old banner should clear.
6. Pause on a post, reload the page, and check recovery when X shows a different post. Check keyboard focus and a narrow window.
