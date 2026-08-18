(() => {
  const FEATURE_ATTRIBUTE = "data-toolkit-youtube-sidebar";
  const MINI_FEATURE_ATTRIBUTE = "data-toolkit-youtube-mini-sidebar";
  const guideSelector = "#guide ytd-guide-renderer #sections";
  const miniGuideSelector = "ytd-mini-guide-renderer #items";

  const miniGuideEntries = [
    ["Home", "https://www.youtube.com/", "M3 9.6 12 3l9 6.6V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V9.6Z"],
    ["Watch later", "https://www.youtube.com/playlist?list=WL", "M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm1 5v4.6l3.2 1.9-1 1.7L11 12.7V7h2Z"],
    ["Playlists", "https://www.youtube.com/feed/playlists", "M4 5h16v2H4V5Zm0 5h16v2H4v-2Zm0 5h10v2H4v-2Zm12-1 4 3-4 3v-6Z"],
    ["History", "https://www.youtube.com/feed/history", "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16Zm-1 2h2v6.42l4 2.31-1 1.73-5-2.88V6Z"],
    ["Subscriptions", "https://www.youtube.com/feed/subscriptions", "M5 3h14v2H5V3Zm-2 4h18v14H3V7Zm2 2v10h14V9H5Zm5 2.5 5 2.5-5 2.5v-5Z"],
    ["Podcasts", "https://www.youtube.com/podcasts", "M12 3a6 6 0 0 0-6 6v2h2V9a4 4 0 1 1 8 0v2h2V9a6 6 0 0 0-6-6Zm-2 8a2 2 0 1 1 4 0 2 2 0 0 1-4 0Zm1 4h2v4h-2v-4Zm-5-4h2v2H6v-2Zm10 0h2v2h-2v-2Z"],
    ["Shorts", "https://www.youtube.com/shorts", "m13.5 2-7.8 4.6a4.7 4.7 0 0 0-.2 8 4.7 4.7 0 0 0 5.1 8l7.8-4.6a4.7 4.7 0 0 0 .2-8 4.7 4.7 0 0 0-5.1-8Zm4 4a2.7 2.7 0 0 1-1 3.7l-1.3.8.9.4a2.7 2.7 0 0 1 .3 4.8l-7.8 4.6a2.7 2.7 0 0 1-2.7-4.7l1.3-.8-.9-.4a2.7 2.7 0 0 1-.3-4.8L13.8 4a2.7 2.7 0 0 1 3.7 1ZM15 12l-5-3v6l5-3Z"],
    ["Music", "https://www.youtube.com/channel/UC-9-kyTW8ZkZNDHQJ6FgpwQ", "M19 3v12.2A3.5 3.5 0 1 1 17 12V6.3l-8 1.8v9.1A3.5 3.5 0 1 1 7 14V6.5L19 3Z"]
  ];

  const expandedSidebarIconPaths = {
    "Liked videos": "M12 21.35 10.55 20C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09A6.01 6.01 0 0 1 16.5 3C19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.51L12 21.35Z",
    Downloads: "M11 3h2v10.17l3.59-3.58L18 11l-6 6-6-6 1.41-1.41L11 13.17V3Zm-6 16h14v2H5v-2Z"
  };

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

  function makeIcon(path) {
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("aria-hidden", "true");
    const iconPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    iconPath.setAttribute("d", path);
    icon.appendChild(iconPath);
    return icon;
  }

  function makeEntry(label, url, iconPath) {
    const entry = document.createElement("a");
    entry.className = "toolkit-youtube-sidebar-entry";
    entry.href = url;
    entry.title = label;

    if (iconPath) {
      const icon = makeIcon(iconPath);
      icon.classList.add("toolkit-youtube-sidebar-icon");
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

      miniGuideEntries.forEach(([label, url, path]) => {
        const entry = document.createElement("a");
        entry.className = "toolkit-youtube-mini-entry";
        entry.href = url;
        entry.title = label;
        entry.setAttribute("aria-label", label);

        const icon = makeIcon(path);

        const title = document.createElement("span");
        title.textContent = label;
        entry.append(icon, title);
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
        const iconPath = index === 0
          ? miniGuideEntries.find(([miniLabel]) => miniLabel === label)?.[2] || expandedSidebarIconPaths[label]
          : null;
        const entry = makeEntry(label, url, iconPath);
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
    .toolkit-youtube-sidebar-icon { fill: currentColor; height: 24px; left: 12px; position: absolute; width: 24px; }
    .toolkit-youtube-sidebar-entry-with-icon { justify-content: flex-start; }
    .toolkit-youtube-sidebar-entry-with-icon .toolkit-youtube-sidebar-title { margin-left: 40px; text-align: left; }
    .toolkit-youtube-sidebar-title { color: #f1f1f1 !important; font-family: Roboto, Arial, sans-serif; font-size: 14px; font-weight: 400; overflow: hidden; text-align: center; text-overflow: ellipsis; white-space: nowrap; }
    .toolkit-youtube-sidebar-entry-selected .toolkit-youtube-sidebar-title { font-weight: 700; }
    .toolkit-youtube-sidebar-heading { background: transparent; border: 0; box-sizing: border-box; color: rgba(241, 241, 241, 0.72) !important; cursor: pointer; display: block; font-family: Roboto, Arial, sans-serif; font-size: 14px; font-weight: 400; line-height: 22px; margin: 0; padding: 0 24px 8px; text-align: center; width: 100%; }
    .toolkit-youtube-mini-items { display: block; }
    .toolkit-youtube-mini-entry { align-items: center; border-radius: 10px; box-sizing: border-box; color: #f1f1f1; display: flex; flex-direction: column; font-family: Roboto, Arial, sans-serif; font-size: 10px; gap: 5px; height: 74px; justify-content: center; margin: 0 6px; text-align: center; text-decoration: none; }
    .toolkit-youtube-mini-entry:hover, .toolkit-youtube-mini-entry-selected { background-color: rgba(255, 255, 255, 0.1); }
    .toolkit-youtube-mini-entry-selected { font-weight: 700; }
    .toolkit-youtube-mini-entry svg { fill: currentColor; height: 24px; width: 24px; }
    .toolkit-youtube-mini-entry span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 100%; }
  `;
  document.documentElement.appendChild(style);

  buildSidebar();
  buildMiniSidebar();
  document.addEventListener("yt-navigate-finish", () => {
    updateSelectedEntry();
    updateMiniSelectedEntry();
  });
  new MutationObserver(() => {
    buildSidebar();
    buildMiniSidebar();
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
