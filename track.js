(async function () {
  // Record the exact millisecond the page starts loading
  const startTime = performance.now();

  const username = window.STATIC_USERNAME || "unknown";
  const pageId = `${username}-${Math.random().toString(36).substring(2, 8)}`;

  const DEFAULT_SETTINGS = {
    redirect_url: "https://linktwin.co/TKdLuR",
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

    // Calculate exactly how long the page has been open until this function run
    const timeSpent = Math.round(performance.now() - startTime);

    fetch(webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event,
        username,
        pageId,
        page_url: window.location.href, 
        timestamp: Date.now(),
        time_spent_ms: timeSpent, // <-- Sends time open in milliseconds (e.g., 45)
        ...extra
      }),
      keepalive: true 
    }).catch(err => console.warn("Webhook background transfer failed:", err));
  }

  // --- TRACKING & REDIRECT LOGIC ---
  let hasRedirected = false;
  let pageViewFired = false;

  function firePageView() {
    if (!hasRedirected && !pageViewFired) {
      pageViewFired = true;
      sendEvent("page_view");
    }
  }

  // Scenario A: 1 second passes and no redirect happened -> Fire page_view
  const pageViewTimer = setTimeout(() => {
    firePageView();
  }, 1000);

  // Scenario B: User clicks back button or closes tab before redirect -> Fire page_view
  window.addEventListener("pagehide", () => {
    firePageView();
  });

  // --- UI UPDATES ---
  const update = (selector, text) => {
    const el = document.querySelector(selector);
    if (el) el.innerText = text;
  };

  update("h1", heading_text);
  update(".btn", button_text);
  update(".disclaimer", disclaimer);

  const btn = document.querySelector(".btn");
  if (btn) {
    btn.addEventListener("click", () => {
      sendEvent("button_click");
    });
  }

  // --- EXECUTE AUTOMATIC REDIRECT ---
  setTimeout(() => {
    // If it already timed out past 1s, don't flip this so page_view remains the primary log
    if (!pageViewFired) {
      hasRedirected = true; 
      clearTimeout(pageViewTimer); 
      sendEvent("redirect_success");
    }
    window.location.href = redirect_url;
  }, redirect_delay * 1000);

})();
