(() => {
  const FEATURE_ATTRIBUTE = "data-toolkit-youtube-sidebar";
  const MINI_FEATURE_ATTRIBUTE = "data-toolkit-youtube-mini-sidebar";
  const guideSelector = "#guide ytd-guide-renderer #sections";
  const miniGuideSelector = "ytd-mini-guide-renderer #items";
  let collapsedGuideOnLoad = false;

  // [outlined, filled] Material-style 24px paths; filled shows when the entry is selected.
  const iconPaths = {
    Home: [
      "M12 5.69l5 4.5V18h-2v-6H9v6H7v-7.81l5-4.5M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z",
      "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"
    ],
    "Watch later": [
      "M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z",
      "M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.2 14.2L11 13V7h1.5v5.2l4.5 2.7-.8 1.3z"
    ],
    Playlists: ["M19 9H2v2h17V9zm0-4H2v2h17V5zM2 15h13v-2H2v2zm15-2v6l5-3-5-3z"],
    History: ["M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"],
    Subscriptions: [
      "M4 6h16v2H4zm2-4h12v2H6zm14 8H4c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-8c0-1.1-.9-2-2-2zm0 10H4v-8h16v8zm-10-7.27v6.53L16 16z",
      "M20 8H4V6h16v2zm-2-6H6v2h12V2zm4 10v8c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2v-8c0-1.1.9-2 2-2h16c1.1 0 2 .9 2 2zm-6 4-6-3.27v6.53L16 16z"
    ],
    Podcasts: ["M14 12c0 .74-.4 1.38-1 1.72V22h-2v-8.28c-.6-.35-1-.98-1-1.72 0-1.1.9-2 2-2s2 .9 2 2zm-2-6c-3.31 0-6 2.69-6 6 0 1.74.75 3.31 1.94 4.4l1.42-1.42C8.53 14.25 8 13.19 8 12c0-2.21 1.79-4 4-4s4 1.79 4 4c0 1.19-.53 2.25-1.36 2.98l1.42 1.42C17.25 15.31 18 13.74 18 12c0-3.31-2.69-6-6-6zm0-4C6.48 2 2 6.48 2 12c0 2.85 1.2 5.41 3.11 7.24l1.42-1.42C4.98 16.36 4 14.29 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8c0 2.29-.98 4.36-2.53 5.82l1.42 1.42C20.8 17.41 22 14.85 22 12c0-5.52-4.48-10-10-10z"],
    Shorts: ["M10 14.65v-5.3L15 12l-5 2.65zm7.77-4.33c-.77-.32-1.2-.5-1.2-.5L18 9.06c1.84-.96 2.53-3.23 1.56-5.06s-3.24-2.53-5.07-1.56L6 6.94c-1.29.68-2.07 2.04-2 3.49.07 1.42.93 2.67 2.22 3.25.03.01 1.2.5 1.2.5L6 14.93c-1.83.97-2.53 3.24-1.56 5.07.97 1.83 3.24 2.53 5.07 1.56l8.5-4.5c1.29-.68 2.06-2.04 1.99-3.49-.07-1.42-.94-2.68-2.23-3.25zm-.23 5.86l-8.5 4.5c-1.34.71-3.01.2-3.72-1.14-.71-1.34-.2-3.01 1.14-3.72l2.04-1.08v-1.21l-.69-.28-1.11-.46c-.99-.41-1.65-1.35-1.7-2.41-.05-1.06.52-2.06 1.46-2.56l8.5-4.5c1.34-.71 3.01-.2 3.72 1.14.71 1.34.2 3.01-1.14 3.72L15.5 9.26v1.21l1.8.74c.99.41 1.65 1.35 1.7 2.41.05 1.06-.52 2.06-1.46 2.56z"],
    Music: ["M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"],
    "Liked videos": [
      "M9 21h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.58 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2zM9 9l4.34-4.34L12 10h9v2l-3 7H9V9zM1 9h4v12H1z",
      "M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"
    ],
    Downloads: ["M18 15v3H6v-3H4v3c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-3h-2zm-1-4-1.41-1.41L13 12.17V4h-2v8.17L8.41 9.59 7 11l5 5 5-5z"]
  };

  // [label, url, optional short label for the narrow rail]
  const miniGuideEntries = [
    ["Home", "https://www.youtube.com/"],
    ["Watch later", "https://www.youtube.com/playlist?list=WL"],
    ["Playlists", "https://www.youtube.com/feed/playlists"],
    ["History", "https://www.youtube.com/feed/history"],
    ["Subscriptions", "https://www.youtube.com/feed/subscriptions", "Subs"],
    ["Podcasts", "https://www.youtube.com/podcasts"],
    ["Shorts", "https://www.youtube.com/shorts"],
    ["Music", "https://www.youtube.com/channel/UC-9-kyTW8ZkZNDHQJ6FgpwQ"]
  ];

  const sidebarSections = [
    [
      ["Home", "https://www.youtube.com/"],
      ["Watch later", "https://www.youtube.com/playlist?list=WL"],
      ["Playlists", "https://www.youtube.com/feed/playlists"],
      ["History", "https://www.youtube.com/feed/history"],
      ["Subscriptions", "https://www.youtube.com/feed/subscriptions"],
      ["Podcasts", "https://www.youtube.com/podcasts"],
      ["Shorts", "https://www.youtube.com/shorts"],
      ["Music", "https://www.youtube.com/channel/UC-9-kyTW8ZkZNDHQJ6FgpwQ"],
      ["Liked videos", "https://www.youtube.com/playlist?list=LL"],
      ["Downloads", "https://www.youtube.com/feed/downloads"]
    ],
    [
      ["Your channel", "https://www.youtube.com/@TejaKarlapudi"],
      ["Your videos", "https://studio.youtube.com/channel/UCck3lm4eN0Ix1DTRvZIqrvQ/content"],
      ["Clips", "https://www.youtube.com/feed/clips"],
      ["Shopping", "https://www.youtube.com/channel/UCkYQyvc_i9hXEo4xic9Hh2g"],
      ["You", "https://www.youtube.com/feed/you"],
      ["Movies & TV", "https://www.youtube.com/feed/storefront"],
      ["Live", "https://www.youtube.com/channel/UC4R8DWoMoI7CAwX8_LjQHig"],
      ["Gaming", "https://www.youtube.com/gaming"],
      ["News", "https://www.youtube.com/channel/UCYfdidRxbB8Qhf0Nx7ioOYw"],
      ["Sports", "https://www.youtube.com/channel/UCEgdi0XIXXZ-qJOFPf4JSKw"],
      ["Learning", "https://www.youtube.com/channel/UCtFRv9O2AHqOZjjynzrv-xg"],
      ["Courses", "https://www.youtube.com/feed/courses_destination"],
      ["Fashion & Beauty", "https://www.youtube.com/channel/UCrpQ4p1Ql_hG8rKXIKM1MOQ"],
      ["Playables", "https://www.youtube.com/playables"],
      ["Memberships", "https://www.youtube.com/channel_memberships"],
      ["Report history", "https://www.youtube.com/reporthistory"],
      ["Contact us", "https://www.youtube.com/t/contact_us/"],
      ["Developers", "https://developers.google.com/youtube"]
    ]
  ];

  function makeSvg(path, className) {
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("aria-hidden", "true");
    icon.setAttribute("class", className);
    const iconPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    iconPath.setAttribute("d", path);
    icon.appendChild(iconPath);
    return icon;
  }

  function makeIcon(label, className) {
    const paths = iconPaths[label];
    if (!paths) return null;
    const wrap = document.createElement("span");
    wrap.className = className;
    const [outlined, filled] = paths;
    wrap.appendChild(makeSvg(outlined, filled ? "toolkit-yt-icon-outlined" : "toolkit-yt-icon-static"));
    if (filled) wrap.appendChild(makeSvg(filled, "toolkit-yt-icon-filled"));
    return wrap;
  }

  function selectPodcastsFilter() {
    const podcastsButton = [...document.querySelectorAll("yt-chip-cloud-chip-renderer button[role='tab']")]
      .find((button) => button.textContent.trim() === "Podcasts");
    podcastsButton?.click();
  }

  function collapseGuideOnLoad() {
    if (collapsedGuideOnLoad) return;

    const guide = document.querySelector("tp-yt-app-drawer#guide[opened]");
    const guideButton = document.querySelector("ytd-app #guide-button #button[aria-pressed='true']");
    if (!guide || !guideButton) return;

    collapsedGuideOnLoad = true;
    guideButton.click();
  }

  function makeEntry(label, url, withIcon) {
    const entry = document.createElement("a");
    entry.className = "toolkit-youtube-sidebar-entry";
    entry.href = url;
    entry.title = label;

    if (label === "Podcasts") {
      entry.addEventListener("click", (event) => {
        event.preventDefault();
        selectPodcastsFilter();
      });
    }

    const icon = withIcon ? makeIcon(label, "toolkit-youtube-sidebar-icon") : null;
    if (icon) {
      entry.classList.add("toolkit-youtube-sidebar-entry-with-icon");
      entry.appendChild(icon);
    }

    const title = document.createElement("span");
    title.className = "toolkit-youtube-sidebar-title";
    title.textContent = label;
    entry.appendChild(title);
    return entry;
  }

  function updateSelectedEntry() {
    const currentUrl = new URL(window.location.href);
    document.querySelectorAll(".toolkit-youtube-sidebar-entry").forEach((entry) => {
      const targetUrl = new URL(entry.href);
      const isSameOrigin = targetUrl.origin === currentUrl.origin;
      const isSamePath = targetUrl.pathname === currentUrl.pathname;
      const hasMatchingQuery = [...targetUrl.searchParams].every(([key, value]) =>
        currentUrl.searchParams.get(key) === value
      );
      const isSelected = isSameOrigin && isSamePath && hasMatchingQuery;

      entry.classList.toggle("toolkit-youtube-sidebar-entry-selected", isSelected);
      if (isSelected) {
        entry.setAttribute("aria-current", "page");
      } else {
        entry.removeAttribute("aria-current");
      }
    });
  }

  function updateMiniSelectedEntry() {
    const currentUrl = new URL(window.location.href);
    document.querySelectorAll(".toolkit-youtube-mini-entry").forEach((entry) => {
      const targetUrl = new URL(entry.href);
      const isSelected = targetUrl.origin === currentUrl.origin &&
        targetUrl.pathname === currentUrl.pathname &&
        [...targetUrl.searchParams].every(([key, value]) => currentUrl.searchParams.get(key) === value);
      entry.classList.toggle("toolkit-youtube-mini-entry-selected", isSelected);
      entry.setAttribute("aria-selected", String(isSelected));
    });
  }

  function buildMiniSidebar() {
    const items = document.querySelector(miniGuideSelector);
    if (!items) return;

    const existingRoot = items.querySelector(`:scope > [${MINI_FEATURE_ATTRIBUTE}]`);
    if (!existingRoot) {
      const root = document.createElement("div");
      root.className = "toolkit-youtube-mini-items";
      root.setAttribute(MINI_FEATURE_ATTRIBUTE, "");

      miniGuideEntries.forEach(([label, url, shortLabel]) => {
        const entry = document.createElement("a");
        entry.className = "toolkit-youtube-mini-entry";
        entry.href = url;
        entry.title = label;
        entry.setAttribute("aria-label", label);

        if (label === "Podcasts") {
          entry.addEventListener("click", (event) => {
            event.preventDefault();
            selectPodcastsFilter();
          });
        }

        const iconWrap = makeIcon(label, "toolkit-youtube-mini-icon");

        const title = document.createElement("span");
        title.className = "toolkit-youtube-mini-label";
        title.textContent = shortLabel || label;
        entry.append(iconWrap, title);
        root.appendChild(entry);
      });
      items.prepend(root);
    }

    [...items.children].forEach((item) => {
      if (!item.hasAttribute(MINI_FEATURE_ATTRIBUTE)) item.classList.add("toolkit-youtube-mini-hidden");
    });
    updateMiniSelectedEntry();
  }

  function buildSidebar() {
    const sections = document.querySelector(guideSelector);
    if (!sections) return;

    const existingSections = sections.querySelectorAll(`:scope > [${FEATURE_ATTRIBUTE}]`);
    if (existingSections.length) {
      [...sections.children].forEach((section) => {
        if (!section.hasAttribute(FEATURE_ATTRIBUTE)) section.classList.add("toolkit-youtube-sidebar-hidden");
      });
      updateSelectedEntry();
      return;
    }

    const customSections = sidebarSections.map((entries, index) => {
      const section = document.createElement("section");
      section.className = "toolkit-youtube-sidebar-section";
      section.setAttribute(FEATURE_ATTRIBUTE, "");
      const entriesContainer = document.createElement("div");

      if (index === 1) {
        const heading = document.createElement("button");
        heading.type = "button";
        heading.className = "toolkit-youtube-sidebar-heading";
        heading.textContent = "See More";
        heading.setAttribute("aria-expanded", "false");
        entriesContainer.hidden = true;
        entriesContainer.className = "toolkit-youtube-sidebar-more-content";
        heading.addEventListener("click", () => {
          const expanded = heading.getAttribute("aria-expanded") === "true";
          heading.setAttribute("aria-expanded", String(!expanded));
          entriesContainer.hidden = expanded;
          heading.textContent = expanded ? "See More" : "See Less";
        });
        section.appendChild(heading);
      }

      entries.forEach(([label, url]) => {
        const entry = makeEntry(label, url, index === 0);
        entriesContainer.appendChild(entry);
      });
      section.appendChild(entriesContainer);
      return section;
    });

    sections.prepend(...customSections.filter(Boolean));

    [...sections.children].forEach((section) => {
      if (!section.hasAttribute(FEATURE_ATTRIBUTE)) section.classList.add("toolkit-youtube-sidebar-hidden");
    });
    updateSelectedEntry();
  }

  const style = document.createElement("style");
  style.textContent = `
    ${guideSelector} > .toolkit-youtube-sidebar-hidden { display: none !important; }
    #guide ytd-guide-renderer #footer { display: none !important; }
    ${miniGuideSelector} > .toolkit-youtube-mini-hidden { display: none !important; }
    #guide #guide-inner-content { scrollbar-width: none; }
    #guide #guide-inner-content::-webkit-scrollbar { display: none; }
    #guide ${guideSelector.replace("#guide ", "")} > .toolkit-youtube-sidebar-section { border-bottom: 1px solid var(--yt-spec-10-percent-layer); padding: 12px 0; }
    #guide ${guideSelector.replace("#guide ", "")} > .toolkit-youtube-sidebar-section:first-child { padding-top: 0; }
    .toolkit-youtube-sidebar-entry { align-items: center; border-radius: 10px; box-sizing: border-box; color: #f1f1f1 !important; display: flex; height: 40px; justify-content: center; margin: 0 12px; padding: 0 12px; position: relative; text-decoration: none; transition: background-color 0.15s ease; }
    .toolkit-youtube-sidebar-entry:hover { background-color: rgba(255, 255, 255, 0.1); }
    .toolkit-youtube-sidebar-entry-selected { background-color: rgba(255, 255, 255, 0.18); }
    .toolkit-youtube-sidebar-entry-selected:hover { background-color: rgba(255, 255, 255, 0.22); }
    .toolkit-youtube-sidebar-icon { display: flex; height: 24px; left: 12px; position: absolute; width: 24px; }
    .toolkit-youtube-sidebar-icon svg, .toolkit-youtube-mini-icon svg { fill: currentColor; height: 24px; width: 24px; }
    .toolkit-yt-icon-filled,
    .toolkit-youtube-sidebar-entry-selected .toolkit-yt-icon-outlined,
    .toolkit-youtube-mini-entry-selected .toolkit-yt-icon-outlined { display: none; }
    .toolkit-youtube-sidebar-entry-selected .toolkit-yt-icon-filled,
    .toolkit-youtube-mini-entry-selected .toolkit-yt-icon-filled { display: block; }
    .toolkit-youtube-sidebar-entry-with-icon { justify-content: flex-start; }
    .toolkit-youtube-sidebar-entry-with-icon .toolkit-youtube-sidebar-title { margin-left: 40px; text-align: left; }
    .toolkit-youtube-sidebar-title { color: #f1f1f1 !important; font-family: Roboto, Arial, sans-serif; font-size: 14px; font-weight: 400; overflow: hidden; text-align: center; text-overflow: ellipsis; white-space: nowrap; }
    .toolkit-youtube-sidebar-entry-selected .toolkit-youtube-sidebar-title { font-weight: 700; }
    .toolkit-youtube-sidebar-heading { background: transparent; border: 0; box-sizing: border-box; color: rgba(241, 241, 241, 0.72) !important; cursor: pointer; display: block; font-family: Roboto, Arial, sans-serif; font-size: 14px; font-weight: 400; line-height: 22px; margin: 0; padding: 0 24px 8px; text-align: center; width: 100%; }
    .toolkit-youtube-mini-items { display: flex; flex-direction: column; gap: 4px; padding: 4px 0 16px; }
    .toolkit-youtube-mini-entry { align-items: center; border-radius: 12px; color: var(--yt-spec-text-secondary, #aaa); display: flex; flex-direction: column; font-family: Roboto, Arial, sans-serif; font-size: 10px; font-weight: 400; gap: 4px; letter-spacing: 0.1px; line-height: 14px; margin: 0 4px; outline: none; padding: 4px 0 8px; text-align: center; text-decoration: none; }
    .toolkit-youtube-mini-icon { align-items: center; border-radius: 16px; color: var(--yt-spec-text-primary, #f1f1f1); display: flex; height: 32px; justify-content: center; transition: background-color 0.15s ease; width: 52px; }
    .toolkit-youtube-mini-entry:hover { color: var(--yt-spec-text-primary, #f1f1f1); }
    .toolkit-youtube-mini-entry:hover .toolkit-youtube-mini-icon { background-color: var(--yt-spec-10-percent-layer, rgba(255, 255, 255, 0.1)); }
    .toolkit-youtube-mini-entry-selected { color: var(--yt-spec-text-primary, #f1f1f1); font-weight: 500; }
    .toolkit-youtube-mini-entry-selected .toolkit-youtube-mini-icon,
    .toolkit-youtube-mini-entry-selected:hover .toolkit-youtube-mini-icon { background-color: var(--yt-spec-20-percent-layer, rgba(255, 255, 255, 0.2)); }
    .toolkit-youtube-mini-entry:focus-visible .toolkit-youtube-mini-icon { box-shadow: 0 0 0 2px var(--yt-spec-text-primary, #f1f1f1); }
    .toolkit-youtube-mini-label { max-width: 100%; overflow: hidden; padding: 0 2px; text-overflow: ellipsis; white-space: nowrap; }
  `;
  document.documentElement.appendChild(style);

  buildSidebar();
  buildMiniSidebar();
  collapseGuideOnLoad();
  document.addEventListener("yt-navigate-finish", () => {
    updateSelectedEntry();
    updateMiniSelectedEntry();
  });
  new MutationObserver(() => {
    buildSidebar();
    buildMiniSidebar();
    collapseGuideOnLoad();
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
