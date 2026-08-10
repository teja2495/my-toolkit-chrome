const ENGINES = [
    { id: 'google',     alias: 'ggl', name: 'Google',     homeUrl: 'https://www.google.com/',            url: 'https://www.google.com/search?q=%s',            color: '#4285F4' },
    { id: 'perplexity', alias: 'ppx', name: 'Perplexity', homeUrl: 'https://www.perplexity.ai/',        url: 'https://www.perplexity.ai/search?q=%s',          color: '#20B2AA' },
    { id: 'chatgpt',    alias: 'gpt', name: 'ChatGPT',    homeUrl: 'https://chatgpt.com/',                url: 'https://chatgpt.com/?prompt=%s',                 color: '#10a37f' },
    { id: 'claude',     alias: 'cld', name: 'Claude',     homeUrl: 'https://claude.ai/new',              url: 'https://claude.ai/new',                          color: '#D97706' },
    { id: 'gemini',     alias: 'gmi', name: 'Gemini',     homeUrl: 'https://gemini.google.com/app',      url: 'https://gemini.google.com/app',                  color: '#4893FC' },
    { id: 'youtube',    alias: 'ytb', name: 'YouTube',    homeUrl: 'https://www.youtube.com/',            url: 'https://www.youtube.com/results?search_query=%s', color: '#ff0000' },
    { id: 'aimode',     alias: 'gai', name: 'AI Mode',    homeUrl: 'https://www.google.com/',            externalUrl: 'https://www.google.com/search?q=&udm=50', url: 'https://www.google.com/search?q=%s&udm=50',     color: '#34A853' },
    { id: 'grok',       alias: 'grk', name: 'Grok',       homeUrl: 'https://grok.com/',                  url: 'https://grok.com/?q=%s',                         color: '#9ca3af' },
    { id: 'amazon',     alias: 'amz', name: 'Amazon',     homeUrl: 'https://www.amazon.com/',            url: 'https://www.amazon.com/s?k=%s',                  color: '#FF9900' },
    { id: 'maps',       alias: 'mps', name: 'Google Maps',homeUrl: 'https://maps.google.com/',           url: 'https://maps.google.com/?q=%s',                  color: '#1A73E8' },
    { id: 'reddit',     alias: 'rdt', name: 'Reddit',     homeUrl: 'https://www.reddit.com/',            url: 'https://www.reddit.com/search/?q=%s',            color: '#FF4500' },
];

const ALIAS_TO_ENGINE = new Map(ENGINES.map(engine => [engine.alias, engine]));
const ALIAS_ONLY_ENGINE_IDS = new Set(['amazon', 'maps', 'reddit']);
const VISIBLE_ENGINES = ENGINES.filter(engine => !ALIAS_ONLY_ENGINE_IDS.has(engine.id));

let currentBookmarks = [];
let selectedBookmarkIndex = -1;

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function renderBookmarks() {
    const container = document.getElementById('bookmarksResults');
    if (!container) return;
    
    if (currentBookmarks.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    container.innerHTML = currentBookmarks.map((b, idx) => `
        <a href="${b.url}" class="bookmark-item ${idx === selectedBookmarkIndex ? 'selected' : ''}" data-index="${idx}">
            <div class="bookmark-title">${escapeHtml(b.title || b.url)}</div>
            <div class="bookmark-url">${escapeHtml(b.url)}</div>
        </a>
    `).join('');
}

function clearBookmarkResults() {
    currentBookmarks = [];
    selectedBookmarkIndex = -1;
    renderBookmarks();
}


const CHATGPT_LOGO_SVG = `<svg class="engine-btn-icon" viewBox="0 0 320 320" width="20" height="20" aria-hidden="true" focusable="false"><path fill="currentColor" d="M297.06 130.97c7.26-21.79 4.76-45.66-6.85-65.48-17.46-30.4-52.56-46.04-86.84-38.68-15.25-17.18-37.16-26.95-60.13-26.81-35.04-.08-66.13 22.48-76.91 55.82-22.51 4.61-41.94 18.7-53.31 38.67-17.59 30.32-13.58 68.54 9.92 94.54-7.26 21.79-4.76 45.66 6.85 65.48 17.46 30.4 52.56 46.04 86.84 38.68 15.24 17.18 37.16 26.95 60.13 26.8 35.06.09 66.16-22.49 76.94-55.86 22.51-4.61 41.94-18.7 53.31-38.67 17.57-30.32 13.55-68.51-9.94-94.51zm-120.28 168.11c-14.03.02-27.62-4.89-38.39-13.88.49-.26 1.34-.73 1.89-1.07l63.72-36.8c3.26-1.85 5.26-5.32 5.24-9.07v-89.83l26.93 15.55c.29.14.48.42.52.74v74.39c-.04 33.08-26.83 59.9-59.91 59.97zm-128.84-55.03c-7.03-12.14-9.56-26.37-7.15-40.18.47.28 1.3.79 1.89 1.13l63.72 36.8c3.23 1.89 7.23 1.89 10.47 0l77.79-44.92v31.1c.02.32-.13.63-.38.83l-64.41 37.19c-28.69 16.52-65.33 6.7-81.92-21.95zm-16.77-139.09c7-12.16 18.05-21.46 31.21-26.29 0 .55-.03 1.52-.03 2.2v73.61c-.02 3.74 1.98 7.21 5.23 9.06l77.79 44.91-26.93 15.55c-.27.18-.61.21-.91.08l-64.42-37.22c-28.63-16.58-38.45-53.21-21.95-81.89zm221.26 51.49-77.79-44.92 26.93-15.54c.27-.18.61-.21.91-.08l64.42 37.19c28.68 16.57 38.51 53.26 21.94 81.94-7.01 12.14-18.05 21.44-31.2 26.28v-75.81c.03-3.74-1.96-7.2-5.2-9.06zm26.8-40.34c-.47-.29-1.3-.79-1.89-1.13l-63.72-36.8c-3.23-1.89-7.23-1.89-10.47 0l-77.79 44.92v-31.1c-.02-.32.13-.63.38-.83l64.41-37.16c28.69-16.55 65.37-6.7 81.91 22 6.99 12.12 9.52 26.31 7.15 40.1zm-168.51 55.43-26.94-15.55c-.29-.14-.48-.42-.52-.74v-74.39c.02-33.12 26.89-59.96 60.01-59.94 14.01 0 27.57 4.92 38.34 13.88-.49.26-1.33.73-1.89 1.07l-63.72 36.8c-3.26 1.85-5.26 5.31-5.24 9.06l-.04 89.79zm14.63-31.54 34.65-20.01 34.65 20v40.01l-34.65 20-34.65-20z"/></svg>`;

const CLAUDE_LOGO_SVG = `<svg class="engine-btn-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path fill="#D97757" d="M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z"/></svg>`;

const GEMINI_LOGO_SVG = `<svg class="engine-btn-icon" fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 65 65" width="20" height="20" aria-hidden="true" focusable="false"><mask id="geminiMask" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="65" height="65"><path d="M32.447 0c.68 0 1.273.465 1.439 1.125a38.904 38.904 0 001.999 5.905c2.152 5 5.105 9.376 8.854 13.125 3.751 3.75 8.126 6.703 13.125 8.855a38.98 38.98 0 005.906 1.999c.66.166 1.124.758 1.124 1.438 0 .68-.464 1.273-1.125 1.439a38.902 38.902 0 00-5.905 1.999c-5 2.152-9.375 5.105-13.125 8.854-3.749 3.751-6.702 8.126-8.854 13.125a38.973 38.973 0 00-2 5.906 1.485 1.485 0 01-1.438 1.124c-.68 0-1.272-.464-1.438-1.125a38.913 38.913 0 00-2-5.905c-2.151-5-5.103-9.375-8.854-13.125-3.75-3.749-8.125-6.702-13.125-8.854a38.973 38.973 0 00-5.905-2A1.485 1.485 0 010 32.448c0-.68.465-1.272 1.125-1.438a38.903 38.903 0 005.905-2c5-2.151 9.376-5.104 13.125-8.854 3.75-3.749 6.703-8.125 8.855-13.125a38.972 38.972 0 001.999-5.905A1.485 1.485 0 0132.447 0z" fill="#000"/><path d="M32.447 0c.68 0 1.273.465 1.439 1.125a38.904 38.904 0 001.999 5.905c2.152 5 5.105 9.376 8.854 13.125 3.751 3.75 8.126 6.703 13.125 8.855a38.98 38.98 0 005.906 1.999c.66.166 1.124.758 1.124 1.438 0 .68-.464 1.273-1.125 1.439a38.902 38.902 0 00-5.905 1.999c-5 2.152-9.375 5.105-13.125 8.854-3.749 3.751-6.702 8.126-8.854 13.125a38.973 38.973 0 00-2 5.906 1.485 1.485 0 01-1.438 1.124c-.68 0-1.272-.464-1.438-1.125a38.913 38.913 0 00-2-5.905c-2.151-5-5.103-9.375-8.854-13.125-3.75-3.749-8.125-6.702-13.125-8.854a38.973 38.973 0 00-5.905-2A1.485 1.485 0 010 32.448c0-.68.465-1.272 1.125-1.438a38.903 38.903 0 005.905-2c5-2.151 9.376-5.104 13.125-8.854 3.75-3.749 6.703-8.125 8.855-13.125a38.972 38.972 0 001.999-5.905A1.485 1.485 0 0132.447 0z" fill="url(#geminiPaint)"/></mask><g mask="url(#geminiMask)"><g filter="url(#geminiFilter0)"><path d="M-5.859 50.734c7.498 2.663 16.116-2.33 19.249-11.152 3.133-8.821-.406-18.131-7.904-20.794-7.498-2.663-16.116 2.33-19.25 11.151-3.132 8.822.407 18.132 7.905 20.795z" fill="#FFE432"/></g><g filter="url(#geminiFilter1)"><path d="M27.433 21.649c10.3 0 18.651-8.535 18.651-19.062 0-10.528-8.35-19.062-18.651-19.062S8.78-7.94 8.78 2.587c0 10.527 8.35 19.062 18.652 19.062z" fill="#FC413D"/></g><g filter="url(#geminiFilter2)"><path d="M20.184 82.608c10.753-.525 18.918-12.244 18.237-26.174-.68-13.93-9.95-24.797-20.703-24.271C6.965 32.689-1.2 44.407-.519 58.337c.681 13.93 9.95 24.797 20.703 24.271z" fill="#00B95C"/></g><g filter="url(#geminiFilter3)"><path d="M20.184 82.608c10.753-.525 18.918-12.244 18.237-26.174-.68-13.93-9.95-24.797-20.703-24.271C6.965 32.689-1.2 44.407-.519 58.337c.681 13.93 9.95 24.797 20.703 24.271z" fill="#00B95C"/></g><g filter="url(#geminiFilter4)"><path d="M30.954 74.181c9.014-5.485 11.427-17.976 5.389-27.9-6.038-9.925-18.241-13.524-27.256-8.04-9.015 5.486-11.428 17.977-5.39 27.902 6.04 9.924 18.242 13.523 27.257 8.038z" fill="#00B95C"/></g><g filter="url(#geminiFilter5)"><path d="M67.391 42.993c10.132 0 18.346-7.91 18.346-17.666 0-9.757-8.214-17.667-18.346-17.667s-18.346 7.91-18.346 17.667c0 9.757 8.214 17.666 18.346 17.666z" fill="#3186FF"/></g><g filter="url(#geminiFilter6)"><path d="M-13.065 40.944c9.33 7.094 22.959 4.869 30.442-4.972 7.483-9.84 5.987-23.569-3.343-30.663C4.704-1.786-8.924.439-16.408 10.28c-7.483 9.84-5.986 23.57 3.343 30.664z" fill="#FBBC04"/></g><g filter="url(#geminiFilter7)"><path d="M34.74 51.43c11.135 7.656 25.896 5.524 32.968-4.764 7.073-10.287 3.779-24.832-7.357-32.488C49.215 6.52 34.455 8.654 27.382 18.94c-7.072 10.288-3.779 24.833 7.357 32.49z" fill="#3186FF"/></g><g filter="url(#geminiFilter8)"><path d="M54.984-2.336c2.833 3.852-.808 11.34-8.131 16.727-7.324 5.387-15.557 6.631-18.39 2.78-2.833-3.853.807-11.342 8.13-16.728 7.324-5.387 15.558-6.631 18.39-2.78z" fill="#749BFF"/></g><g filter="url(#geminiFilter9)"><path d="M31.727 16.104C43.053 5.598 46.94-8.626 40.41-15.666c-6.53-7.04-21.006-4.232-32.332 6.274s-15.214 24.73-8.683 31.77c6.53 7.04 21.006 4.232 32.332-6.274z" fill="#FC413D"/></g><g filter="url(#geminiFilter10)"><path d="M8.51 53.838c6.732 4.818 14.46 5.55 17.262 1.636 2.802-3.915-.384-10.994-7.116-15.812-6.731-4.818-14.46-5.55-17.261-1.636-2.802 3.915.383 10.994 7.115 15.812z" fill="#FFEE48"/></g></g><defs><filter id="geminiFilter0" x="-19.824" y="13.152" width="39.274" height="43.217" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="2.46" result="effect1_foregroundBlur_2001_67"/></filter><filter id="geminiFilter1" x="-15.001" y="-40.257" width="84.868" height="85.688" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="11.891" result="effect1_foregroundBlur_2001_67"/></filter><filter id="geminiFilter2" x="-20.776" y="11.927" width="79.454" height="90.916" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="10.109" result="effect1_foregroundBlur_2001_67"/></filter><filter id="geminiFilter3" x="-20.776" y="11.927" width="79.454" height="90.916" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="10.109" result="effect1_foregroundBlur_2001_67"/></filter><filter id="geminiFilter4" x="-19.845" y="15.459" width="79.731" height="81.505" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="10.109" result="effect1_foregroundBlur_2001_67"/></filter><filter id="geminiFilter5" x="29.832" y="-11.552" width="75.117" height="73.758" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="9.606" result="effect1_foregroundBlur_2001_67"/></filter><filter id="geminiFilter6" x="-38.583" y="-16.253" width="78.135" height="78.758" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="8.706" result="effect1_foregroundBlur_2001_67"/></filter><filter id="geminiFilter7" x="8.107" y="-5.966" width="78.877" height="77.539" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="7.775" result="effect1_foregroundBlur_2001_67"/></filter><filter id="geminiFilter8" x="13.587" y="-18.488" width="56.272" height="51.81" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="6.957" result="effect1_foregroundBlur_2001_67"/></filter><filter id="geminiFilter9" x="-15.526" y="-31.297" width="70.856" height="69.306" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="5.876" result="effect1_foregroundBlur_2001_67"/></filter><filter id="geminiFilter10" x="-14.168" y="20.964" width="55.501" height="51.571" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="7.273" result="effect1_foregroundBlur_2001_67"/></filter><linearGradient id="geminiPaint" x1="18.447" y1="43.42" x2="52.153" y2="15.004" gradientUnits="userSpaceOnUse"><stop stop-color="#4893FC"/><stop offset=".27" stop-color="#4893FC"/><stop offset=".777" stop-color="#969DFF"/><stop offset="1" stop-color="#BD99FE"/></linearGradient></defs></svg>`;

const GROK_LOGO_SVG = `<svg class="engine-btn-icon" viewBox="0 0 48 48" width="20" height="20" aria-hidden="true" focusable="false" fill="none"><path fill="currentColor" fill-rule="nonzero" d="M18.542 30.532l15.956-11.776c.783-.576 1.902-.354 2.274.545 1.962 4.728 1.084 10.411-2.819 14.315-3.903 3.901-9.333 4.756-14.299 2.808l-5.423 2.511c7.778 5.315 17.224 4 23.125-1.903 4.682-4.679 6.131-11.058 4.775-16.812l.011.011c-1.966-8.452.482-11.829 5.501-18.735C47.759 1.332 47.88 1.166 48 1l-6.602 6.599V7.577l-22.86 22.958M15.248 33.392c-5.582-5.329-4.619-13.579.142-18.339 3.521-3.522 9.294-4.958 14.331-2.847l5.412-2.497c-.974-.704-2.224-1.46-3.659-1.994-6.478-2.666-14.238-1.34-19.505 3.922C6.904 16.701 5.31 24.488 8.045 31.133c2.044 4.965-1.307 8.48-4.682 12.023C2.164 44.411.967 45.67 0 47l15.241-13.608"/></svg>`;

const GOOGLE_LOGO_SVG = `<svg class="engine-btn-icon engine-btn-icon--google" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>`;

const AI_MODE_LOGO_HTML = '<img class="engine-btn-icon engine-btn-icon--img" src="assets/ai-mode.png" width="20" height="20" alt="" />';

const EXTERNAL_LINK_SVG = `<svg class="engine-external-icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><path fill="currentColor" d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>`;

const PERPLEXITY_LOGO_SVG = `<svg class="engine-btn-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path fill="#22B8CD" fill-rule="nonzero" d="M19.785 0v7.272H22.5V17.62h-2.935V24l-7.037-6.194v6.145h-1.091v-6.152L4.392 24v-6.465H1.5V7.188h2.884V0l7.053 6.494V.19h1.09v6.49L19.786 0zm-7.257 9.044v7.319l5.946 5.234V14.44l-5.946-5.397zm-1.099-.08l-5.946 5.398v7.235l5.946-5.234V8.965zm8.136 7.58h1.844V8.349H13.46l6.105 5.54v2.655zm-8.982-8.28H2.59v8.195h1.8v-2.576l6.192-5.62zM5.475 2.476v4.71h5.115l-5.115-4.71zm13.219 0l-5.115 4.71h5.115v-4.71z"/></svg>`;
const GOOGLE_MAPS_LOGO_SVG = `<svg class="engine-btn-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 92.3 132.3" width="20" height="20" aria-hidden="true" focusable="false"><path fill="#1a73e8" d="M60.2 2.2C55.8.8 51 0 46.1 0 32 0 19.3 6.4 10.8 16.5l21.8 18.3L60.2 2.2z"/><path fill="#ea4335" d="M10.8 16.5C4.1 24.5 0 34.9 0 46.1c0 8.7 1.7 15.7 4.6 22l28-33.3-21.8-18.3z"/><path fill="#4285f4" d="M46.2 28.5c9.8 0 17.7 7.9 17.7 17.7 0 4.3-1.6 8.3-4.2 11.4 0 0 13.9-16.6 27.5-32.7-5.6-10.8-15.3-19-27-22.7L32.6 34.8c3.3-3.8 8.1-6.3 13.6-6.3"/><path fill="#fbbc04" d="M46.2 63.8c-9.8 0-17.7-7.9-17.7-17.7 0-4.3 1.5-8.3 4.1-11.3l-28 33.3c4.8 10.6 12.8 19.2 21 29.9l34.1-40.5c-3.3 3.9-8.1 6.3-13.5 6.3"/><path fill="#34a853" d="M59.1 109.2c15.4-24.1 33.3-35 33.3-63 0-7.7-1.9-14.9-5.2-21.3L25.6 98c2.6 3.4 5.3 7.3 7.9 11.3 9.4 14.5 6.8 23.1 12.8 23.1s3.4-8.7 12.8-23.2"/></svg>`;
const YOUTUBE_LOGO_SVG = `<svg class="engine-btn-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28.57 20" width="20" height="20" aria-hidden="true" focusable="false"><g><path d="M27.9727 3.12324C27.6435 1.89323 26.6768 0.926623 25.4468 0.597366C23.2197 2.24288e-07 14.285 0 14.285 0C14.285 0 5.35042 2.24288e-07 3.12323 0.597366C1.89323 0.926623 0.926623 1.89323 0.597366 3.12324C2.24288e-07 5.35042 0 10 0 10C0 10 2.24288e-07 14.6496 0.597366 16.8768C0.926623 18.1068 1.89323 19.0734 3.12323 19.4026C5.35042 20 14.285 20 14.285 20C14.285 20 23.2197 20 25.4468 19.4026C26.6768 19.0734 27.6435 18.1068 27.9727 16.8768C28.5701 14.6496 28.5701 10 28.5701 10C28.5701 10 28.5677 5.35042 27.9727 3.12324Z" fill="#FF0000"></path><path d="M11.4253 14.2854L18.8477 10.0004L11.4253 5.71533V14.2854Z" fill="white"></path></g></svg>`;

const ENGINE_LOGO_HTML = {
    chatgpt: CHATGPT_LOGO_SVG,
    claude: CLAUDE_LOGO_SVG,
    gemini: GEMINI_LOGO_SVG,
    grok: GROK_LOGO_SVG,
    google: GOOGLE_LOGO_SVG,
    maps: GOOGLE_MAPS_LOGO_SVG,
    youtube: YOUTUBE_LOGO_SVG,
    aimode: AI_MODE_LOGO_HTML,
    perplexity: PERPLEXITY_LOGO_SVG,
};

function getEngineLogoHtml(engineId) {
    return ENGINE_LOGO_HTML[engineId] || '';
}

const STORAGE_KEY = 'selectedSearchEngine';
const ENGINE_PENDING_QUERY_HANDLERS = {
    claude: {
        storageKey: 'claudePendingPlain',
        url: 'https://claude.ai/new',
    },
    gemini: {
        storageKey: 'geminiPendingPlain',
        url: 'https://gemini.google.com/app',
    },
};

let activeEngineId = VISIBLE_ENGINES[0].id;

function getActiveEngine() {
    return ENGINES.find(e => e.id === activeEngineId) || VISIBLE_ENGINES[0];
}

function applyEngineTheme(engine) {
    document.documentElement.style.setProperty('--engine-color', engine.color);
}

function updateEnginePrefix(engine) {
    const prefix = document.getElementById('enginePrefix');
    if (!prefix) {
        return;
    }

    const name = engine?.name || '';
    prefix.title = name;
    const logoHtml = getEngineLogoHtml(engine?.id);
    if (logoHtml) {
        prefix.innerHTML = logoHtml;
    } else {
        const initial = name.trim().charAt(0).toUpperCase() || '?';
        prefix.textContent = initial;
    }
}

function homeUrlWithoutQuery(homeUrl) {
    try {
        const u = new URL(homeUrl);
        u.search = '';
        return u.href;
    } catch {
        return homeUrl;
    }
}

function renderEngines() {
    const container = document.getElementById('engineButtons');
    container.innerHTML = VISIBLE_ENGINES.map(engine => {
        const logo = getEngineLogoHtml(engine.id);
        const openUrl = engine.externalUrl || homeUrlWithoutQuery(engine.homeUrl);
        return `
        <div class="engine-cell" data-engine="${engine.id}">
            <button
                type="button"
                class="engine-btn"
                data-engine="${engine.id}"
                title="${engine.name}"
            >
                ${logo}
                <span class="engine-btn-text">${engine.name}</span>
            </button>
            <a
                class="engine-external"
                href="${openUrl}"
                title="Open ${engine.name}"
                aria-label="Open ${engine.name}"
            >${EXTERNAL_LINK_SVG}</a>
        </div>
    `;
    }).join('');

    container.querySelectorAll('.engine-btn').forEach(btn => {
        btn.addEventListener('pointerdown', (event) => {
            // Keep focus in the search input when choosing an engine.
            event.preventDefault();
        });

        btn.addEventListener('click', () => {
            const id = btn.dataset.engine;
            if (VISIBLE_ENGINES.some(eng => eng.id === id)) {
                setActiveEngine(id);
                const input = document.getElementById('searchInput');
                if (input) {
                    const query = input.value.trim();
                    if (query) {
                        const selectedEngine = ENGINES.find(engine => engine.id === id);
                        performSearch(query, selectedEngine);
                        return;
                    }
                    input.focus({ preventScroll: true });
                }
            }
        });

        const openEngineHome = (event) => {
            event.preventDefault();
            const id = btn.dataset.engine;
            const engine = ENGINES.find(e => e.id === id);
            if (engine) {
                window.location.href = engine.externalUrl || homeUrlWithoutQuery(engine.homeUrl);
            }
        };

        btn.addEventListener('contextmenu', openEngineHome);

        btn.addEventListener('auxclick', (event) => {
            if (event.button === 1) {
                openEngineHome(event);
            }
        });
    });
}

function setActiveEngine(id, persist = true) {
    const nextEngine = ENGINES.find(engine => engine.id === id) || VISIBLE_ENGINES[0];
    activeEngineId = nextEngine.id;
    renderEngines();
    applyEngineTheme(getActiveEngine());
    updateEnginePrefix(getActiveEngine());

    if (persist) {
        chrome.storage.sync.set({ [STORAGE_KEY]: activeEngineId });
    }
}

function parseAliasedQuery(rawQuery) {
    const parts = rawQuery.trim().split(/\s+/);
    if (parts.length < 2) {
        return null;
    }

    const alias = parts[parts.length - 1].toLowerCase();
    const engine = ALIAS_TO_ENGINE.get(alias);
    if (!engine) {
        return null;
    }

    const queryWithoutAlias = parts.slice(0, -1).join(' ').trim();
    if (!queryWithoutAlias) {
        return null;
    }

    return { query: queryWithoutAlias, engine };
}

function parseLeadingAlias(rawQuery) {
    const trimmedStartQuery = rawQuery.trimStart();
    if (!trimmedStartQuery) {
        return null;
    }

    const [firstPart, ...rest] = trimmedStartQuery.split(/\s+/);
    const engine = ALIAS_TO_ENGINE.get(firstPart.toLowerCase());
    if (!engine) {
        return null;
    }

    return {
        engine,
        query: rest.join(' ').trim(),
    };
}

function shouldAutoSearchOnAlias(rawQuery) {
    return Boolean(parseAliasedQuery(rawQuery));
}

async function performSearch(rawQuery, forcedEngine = null) {
    const trimmedQuery = rawQuery.trim();
    if (!trimmedQuery) {
        return;
    }

    const aliased = forcedEngine ? null : parseAliasedQuery(trimmedQuery);
    const query = aliased ? aliased.query : trimmedQuery;
    const engine = forcedEngine || (aliased ? aliased.engine : getActiveEngine());

    const pendingHandler = ENGINE_PENDING_QUERY_HANDLERS[engine.id];
    if (pendingHandler) {
        await chrome.storage.local.set({ [pendingHandler.storageKey]: query });
        window.location.href = pendingHandler.url;
        return;
    }

    const url = engine.url.replace('%s', encodeURIComponent(query));
    window.location.href = url;
}

function autoGrow(textarea) {
    textarea.style.height = 'auto';
    const maxHeight = parseFloat(getComputedStyle(textarea).maxHeight);
    const nextHeight = Number.isFinite(maxHeight)
        ? Math.min(textarea.scrollHeight, maxHeight)
        : textarea.scrollHeight;
    textarea.style.height = nextHeight + 'px';
}

function getGreeting(name) {
    const date = new Date();
    const hour = date.getHours();
    const day = date.getDay();
    const n = name ? `, ${name}` : '';

    if (Math.random() < 0.2) {
        const generics = [`Welcome${n}!`, `What's on your mind${n}?`];
        return generics[Math.floor(Math.random() * generics.length)];
    }

    const greetings = [];

    if (hour >= 5 && hour < 12) {
        greetings.push(`Good morning${n}!`);
    } else if (hour >= 12 && hour < 18) {
        greetings.push(`Good afternoon${n}!`);
    } else if (hour >= 18 && hour < 20) {
        greetings.push(`Good evening${n}!`, `Evening${n}!`);
    } else if (hour >= 23) {
        greetings.push('Hello, night owl!');
    } else {
        greetings.push(`Good night${n}!`);
    }

    if (day === 1 && hour < 16) greetings.push(`Happy Monday${n}!`);
    else if (day === 2) greetings.push(`Happy Tuesday${n}!`);
    else if (day === 5 && hour < 16) greetings.push(`Happy Friday${n}!`);
    else if (day === 5 && hour >= 16) greetings.push(`Happy Weekend${n}!`);
    else if (day === 0 || day === 6) greetings.push(`Happy Weekend${n}!`);

    return greetings[Math.floor(Math.random() * greetings.length)];
}

function renderGreeting(name) {
    const greetingText = document.getElementById('greetingText');
    if (!greetingText) {
        return;
    }
    greetingText.textContent = getGreeting(name);
}

async function loadSavedEngine() {
    try {
        const result = await chrome.storage.sync.get([STORAGE_KEY]);
        const saved = result[STORAGE_KEY];
        if (saved && ENGINES.find(e => e.id === saved)) {
            activeEngineId = saved;
        }
    } catch {
        // storage not available — use default
    }
}

function showNamePrompt(onSave) {
    const prompt = document.getElementById('namePrompt');
    const input = document.getElementById('namePromptInput');
    if (!prompt || !input) return;

    prompt.style.display = 'block';
    setTimeout(() => input.focus(), 50);

    input.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
            const name = input.value.trim();
            if (!name) return;
            try { await chrome.storage.sync.set({ userName: name }); } catch {}
            prompt.style.display = 'none';
            onSave(name);
            document.getElementById('searchInput')?.focus();
        } else if (e.key === 'Escape') {
            prompt.style.display = 'none';
            document.getElementById('searchInput')?.focus();
        }
    });
}

async function init() {
    let userName = '';
    try {
        const result = await chrome.storage.sync.get(['userName']);
        userName = result.userName || '';
    } catch {
        // storage not available — render without name
    }

    if (userName) {
        renderGreeting(userName);
    } else {
        renderGreeting('');
        showNamePrompt((name) => renderGreeting(name));
    }

    await loadSavedEngine();
    renderEngines();
    applyEngineTheme(getActiveEngine());
    updateEnginePrefix(getActiveEngine());

    const input = document.getElementById('searchInput');
    const closeOtherTabsButton = document.getElementById('closeOtherTabsButton');
    const manageExtensionsButton = document.getElementById('manageExtensionsButton');

    if (closeOtherTabsButton) {
        closeOtherTabsButton.addEventListener('click', async () => {
            try {
                await chrome.runtime.sendMessage({ action: 'closeOtherTabs' });
            } catch {
                // Ignore failures if the background worker is unavailable.
            }
        });
    }

    if (manageExtensionsButton) {
        manageExtensionsButton.addEventListener('click', () => {
            chrome.tabs.update({ url: 'chrome://extensions' });
        });
    }

    input.addEventListener('input', () => {
        autoGrow(input);
        const leadingAlias = parseLeadingAlias(input.value);
        if (leadingAlias) {
            setActiveEngine(leadingAlias.engine.id);
            input.value = leadingAlias.query;
            autoGrow(input);
            clearBookmarkResults();
            return;
        }

        if (shouldAutoSearchOnAlias(input.value)) {
            clearBookmarkResults();
            performSearch(input.value);
            return;
        }

        const val = input.value;
        if (val.trim() && chrome.bookmarks) {
            chrome.bookmarks.search(val, (results) => {
                currentBookmarks = results.filter(b => b.url).slice(0, 3);
                selectedBookmarkIndex = -1;
                renderBookmarks();
            });
        } else {
            clearBookmarkResults();
        }
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') {
            if (currentBookmarks.length > 0) {
                e.preventDefault();
                selectedBookmarkIndex = (selectedBookmarkIndex + 1) % currentBookmarks.length;
                renderBookmarks();
            }
        } else if (e.key === 'ArrowUp') {
            if (currentBookmarks.length > 0) {
                e.preventDefault();
                selectedBookmarkIndex = selectedBookmarkIndex <= 0 ? currentBookmarks.length - 1 : selectedBookmarkIndex - 1;
                renderBookmarks();
            }
        } else if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (selectedBookmarkIndex >= 0 && selectedBookmarkIndex < currentBookmarks.length) {
                window.location.href = currentBookmarks[selectedBookmarkIndex].url;
            } else {
                performSearch(input.value);
            }
        } else if (e.key === 'Tab') {
            e.preventDefault();
            const idx = VISIBLE_ENGINES.findIndex(e => e.id === activeEngineId);
            if (e.shiftKey) {
                const prev = idx === -1
                    ? VISIBLE_ENGINES[VISIBLE_ENGINES.length - 1]
                    : VISIBLE_ENGINES[(idx - 1 + VISIBLE_ENGINES.length) % VISIBLE_ENGINES.length];
                setActiveEngine(prev.id);
            } else {
                const next = idx === -1
                    ? VISIBLE_ENGINES[0]
                    : VISIBLE_ENGINES[(idx + 1) % VISIBLE_ENGINES.length];
                setActiveEngine(next.id);
            }
        }
    });

    input.focus();
}

document.addEventListener('DOMContentLoaded', init);
