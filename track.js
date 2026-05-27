(async function () {
  const username = window.STATIC_USERNAME || "unknown";
  const pageId = `${username}-${Math.random().toString(36).substring(2, 8)}`;

  const DEFAULT_SETTINGS = {
    redirect_url: "https://www.amazon.com?&linkCode=ll2&tag=pt-bestproductshere1-20&linkId=aa47f3c03dee548c0689ae05999d6cfb&language=en_US&ref_=as_li_ss_tl",
    redirect_delay: 0.001,
    webhook_url: null,
    heading_text: "Taking you to the product...",
    button_text: "View on Amazon",
    disclaimer: "We may earn a small commission at no extra cost to you."
  };

  async function loadSettings() {
    try {
      const res = await fetch("https://bestproductshere.github.io/tracker/settings.js");
      const text = await res.text();
      eval(text); // Defines `window.TRACKER_SETTINGS`
      if (typeof window.TRACKER_SETTINGS !== "object") throw new Error("Invalid settings.js");
      return { ...DEFAULT_SETTINGS, ...window.TRACKER_SETTINGS };
    } catch (err) {
      console.warn("Falling back to default settings:", err.message);
      return DEFAULT_SETTINGS;
    }
  }

  const settings = await loadSettings();
  const {
    redirect_url,
    redirect_delay,
    webhook_url,
    heading_text,
    button_text,
    disclaimer
  } = settings;

  function sendEvent(event, extra = {}) {
    if (!webhook_url) return;

    fetch(webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event,
        username,
        pageId,
        page_url: window.location.href, 
        timestamp: Date.now(),
        ...extra
      }),
      keepalive: true 
    }).catch(err => console.warn("Webhook background transfer failed:", err));
  }

  // 1. FIRE PAGE VIEW IMMEDIATELY 
  // This ensures you know they landed on your GitHub page, even if they exit quickly.
  sendEvent("page_view");

  // Modify HTML content if elements exist
  const update = (selector, text) => {
    const el = document.querySelector(selector);
    if (el) el.innerText = text;
  };

  update("h1", heading_text);
  update(".btn", button_text);
  update(".disclaimer", disclaimer);

  // Track manual clicks
  const btn = document.querySelector(".btn");
  if (btn) {
    btn.addEventListener("click", () => {
      sendEvent("button_click");
    });
  }

  // 2. HANDLE AUTOMATIC REDIRECT
  setTimeout(() => {
    sendEvent("redirect_success");
    window.location.href = redirect_url;
  }, redirect_delay * 1000);
})();
