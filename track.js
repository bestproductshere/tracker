(async function () {
  const username = window.STATIC_USERNAME || "unknown";
  const pageId = `${username}-${Math.random().toString(36).substring(2, 8)}`;

  const DEFAULT_SETTINGS = {
    redirect_url: "https://www.amazon.com?&linkCode=ll2&tag=kymedia0bf-20&linkId=3569bd7745cb65d8e06c805b8464e776&language=en_US&ref_=as_li_ss_tl",
    redirect_delay: 2,
    webhook_url: null,
    heading_text: "Taking you to the product...",
    button_text: "View on Amazon",
    disclaimer: "We may earn a small commission at no extra cost to you."
  };

  async function loadSettings() {
    try {
      const res = await fetch("https://bestproductshere.github.io/tracker/settings.js");
      const text = await res.text();
      eval(text); // This should define `window.TRACKER_SETTINGS`
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

  // Send visitor data
  function sendEvent(event, extra = {}) {
    if (!webhook_url) return;
    fetch("https://ipapi.co/json/")
      .then(res => res.json())
      .then(location => {
        fetch(webhook_url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event,
            username,
            pageId,
            page_url: window.location.href, // ✅ Adds the full GitHub Page URL
            location,
            timestamp: Date.now(),
            ...extra
          })
        });
      });
  }

  sendEvent("page_view");

  // Modify content if it's a full HTML page (optional - for your custom pages)
  const update = (selector, text) => {
    const el = document.querySelector(selector);
    if (el) el.innerText = text;
  };

  update("h1", heading_text);
  update(".btn", button_text);
  update(".disclaimer", disclaimer);

  const btn = document.querySelector(".btn");
  if (btn) {
    btn.addEventListener("click", () => sendEvent("button_click"));
  }

  // Redirect after delay
  setTimeout(() => {
    sendEvent("redirect_success");
    window.location.href = redirect_url;
  }, redirect_delay * 1000);
})();
