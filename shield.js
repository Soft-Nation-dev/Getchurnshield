// ==========================================
// CHURN SHIELD — INTELLIGENCE BUILD (REFACTORED)
// Webhook (Make.com): { event, email, timestamp, last_focused_field? }
//
// REFACTOR ZONES APPLIED:
//   Zone 1 — #signup is now a Silent Sentry (no timer, no video, no drawer)
//   Zone 2 — #home has two mutually exclusive states: Professor (incomplete) / Coach (complete)
//   Zone 3 — Task-page rescue timer changed to 15s; Mute Rule blocks rescue if drawer is active
//   Zone 4 — Navigation (onhashchange) never closes the video or resets the container
//
// TARGETED LOGIC FIXES (v2):
//   Fix 1 — Instant Kill Switch : completeSection now calls closeVideo() + hideDrawer() together
//   Fix 2 — Alarm Triggers      : vc-close and drawer-close both call restartWatchdog() after closing
//   Fix 3 — Mute Rule           : restartWatchdog guards now check shield-drawer.active, not isVideoActive()
// ==========================================

const zapierWebhookURL  = "https://hook.eu1.make.com/bva2khnjno8f43ldtjnsdj4l18c2g8f4";
const successWebhookURL = "https://hook.eu1.make.com/m9fssewtm2yk6i2msmjb0eylt63crgkv";


// ==========================================
// 1. SHIELD VAULT — surgical timing per phase
//
//   ZONE 1: #signup entry REMOVED intentionally.
//           The signup page is a Silent Sentry — it captures email only.
//           No timer, no trigger, no drawer, no video on this page.
//
//   ZONE 2: #home is now dual-state (see runWatchdog).
//           The vault entry below is the SHARED video/label/title resource
//           used by BOTH the Professor (Main Guide) and the Coach (Pro-Tip).
//           The `time` and `msg` fields here are legacy stubs — actual timing
//           is controlled entirely inside runWatchdog.
//
//   ZONE 3: #bvn and #link-card rescue timers set to 15 000 ms.
// ==========================================
const shieldVault = {
  // Zone 1: #signup deliberately omitted — Silent Sentry, no trigger logic.

  "#bvn": {
    time:  15000,   // Zone 3: raised to 15 s
    msg:   "Stuck on BVN? Here's a 60-second walkthrough.",
    video: "https://res.cloudinary.com/dsye3fbye/video/upload/f_auto,q_auto/v1776383440/2026-04-11-131757011_rlc2ty.mp4",
    label: "BVN_Friction",
    title: "BVN Walkthrough",
  },

  "#link-card": {
    time:  15000,   // Zone 3: raised to 15 s
    msg:   "Card not linking? Watch this quick fix.",
    video: "https://res.cloudinary.com/dsye3fbye/video/upload/f_auto,q_auto/v1776383448/2026-04-11-151934848_cctymj.mp4",
    label: "Card_Friction",
    title: "Card Linking Walkthrough",
  },

  // Zone 2: #home vault entries are the shared media resources.
  //         Two separate entries distinguish Professor vs Coach payloads.
  "#home-professor": {
    time:  5000,    // Zone 2 State A: 5 s → Main Guide
    msg:   "Need a hand? Here's a quick guide to get you set up.",
    video: "https://res.cloudinary.com/dsye3fbye/video/upload/f_auto,q_auto/v1776383449/2026-04-11-124911579_hvj9ov.mp4",
    label: "Main_Guide",
    title: "Getting Started Guide",
  },

  "#home-coach": {
    time:  3000,    // Zone 2 State B: 3 s → Pro-Tip hotspot
    msg:   "Pro-Tip Unlocked — your reward is ready.",
    video: "https://res.cloudinary.com/dsye3fbye/video/upload/f_auto,q_auto/v1776383447/2026-04-11-164015879_plsveg.mp4",
    label: "Pro_Tip_Unlocked",
    title: "Pro-Tip Unlocked",
  },

  // Legacy #home entry retained for scheduleProTip() and showProTipHotspot() references.
  "#home": {
    video: "https://res.cloudinary.com/dsye3fbye/video/upload/f_auto,q_auto/v1776383447/2026-04-11-164015879_plsveg.mp4",
    label: "Onboarding_Complete",
    title: "Pro-Tip Unlocked",
  },
};

const FRICTION_LABELS = new Set([
  "Lead_Captured",
  "BVN_Friction",
  "Card_Friction",
]);


// ==========================================
// 2. STATE & PERSISTENCE
// ==========================================
const STORAGE_KEYS = {
  email:     "churnShield.userEmail",
  lastLabel: "churnShield.lastActiveLabel",
  completed: "churnShield.completedSections",
};

let userEmail      = localStorage.getItem(STORAGE_KEYS.email)     || "unknown@user.com";
let lastActiveLabel = localStorage.getItem(STORAGE_KEYS.lastLabel) || null;

let completedSections;
try {
  completedSections = new Set(
    JSON.parse(sessionStorage.getItem(STORAGE_KEYS.completed) || "[]"),
  );
} catch (e) {
  completedSections = new Set();
}

const recentlyWatched = [];  // session list of { video, title, label, themeClass }

let watchdogTimer;            // friction trigger (cancellable)
let qualifiedViewTimer;       // 5 s playback Royalty Timer (cancellable)
let proTipTimer;              // 10 s post-completion reward (NEVER cancelled by normal flow)
let proTipPending  = false;   // true = gold hotspot is owed to the user
let lastFocusedField = "none"; // 'Leaky Bucket' analytics — last input the user touched

const isMobile = () => window.matchMedia("(max-width: 600px)").matches;

function persistCompleted() {
  try {
    sessionStorage.setItem(
      STORAGE_KEYS.completed,
      JSON.stringify([...completedSections]),
    );
  } catch (e) {}
}

// ==========================================
// Zone 3 HELPER — isVideoActive
// Returns true if the video container is currently visible (playing or paused mid-session).
// Still used by the in-flight Mute Rule checks inside runWatchdog's home/task blocks.
// NOTE: restartWatchdog itself now uses the drawer-active check (Fix 3) instead.
// ==========================================
function isVideoActive() {
  const container = document.getElementById("video-container");
  if (!container) return false;
  return !container.classList.contains("vc-hidden");
}


// ==========================================
// 3. DEBUG FEED + WEBHOOK
// ==========================================
function logSignal(msg, extras) {
  const log = document.getElementById("debug-log");
  if (!log) return;
  const d  = new Date();
  const ts =
    String(d.getHours()).padStart(2, "0")   + ":" +
    String(d.getMinutes()).padStart(2, "0") + ":" +
    String(d.getSeconds()).padStart(2, "0");
  const tag =
    extras && extras.last_focused_field
      ? ' <span style="color:#fbbf24">[' + extras.last_focused_field + "]</span>"
      : "";
  const line = document.createElement("div");
  line.className = "log-line";
  line.innerHTML = '<span class="ts">' + ts + "</span>" + msg + tag;
  log.prepend(line);
  while (log.children.length > 30) log.lastChild.remove();
}

function sendToZapier(status, extras) {
  const payload = {
    email:             userEmail,
    event:             "churn_shield_triggered",
    last_focused_field: lastFocusedField || "none",
    timestamp:         new Date().toISOString(),
  };

  logSignal(status + " · " + userEmail, {
    last_focused_field: payload.last_focused_field,
  });

  fetch(zapierWebhookURL, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(payload),
  })
    .then(response => {
      if (!response.ok) console.error("Shield Bridge Error:", response.statusText);
    })
    .catch(err => console.error("Shield Bridge Failed:", err));
}


// ==========================================
// 4. IDENTITY CAPTURE + LEAKY-BUCKET TRACKER
// ==========================================
function captureIdentity() {
  const emailField = document.getElementById("user-email");
  if (!emailField) return;
  if (userEmail && userEmail !== "unknown@user.com") {
    emailField.value = userEmail;
  }
  emailField.addEventListener("blur", () => {
    const v = emailField.value.trim();
    if (v.includes("@")) {
      userEmail = v;
      try { localStorage.setItem(STORAGE_KEYS.email, userEmail); } catch (e) {}
      sendToZapier("Identity_Captured");
    }
  });
}

// Track the last input the user touched — attached to every friction event.
function fieldIdOf(el) {
  if (!el) return null;
  return (
    el.id ||
    el.name ||
    el.getAttribute("placeholder") ||
    (el.tagName ? el.tagName.toLowerCase() : null)
  );
}

// Zone 1: focusin no longer restarts the watchdog for #signup.
//         #signup is a Silent Sentry — we only track lastFocusedField for analytics.
document.addEventListener("focusin", (e) => {
  const t = e.target;
  if (
    t &&
    (t.tagName === "INPUT" ||
     t.tagName === "TEXTAREA" ||
     t.tagName === "SELECT")
  ) {
    lastFocusedField = fieldIdOf(t);
    // Zone 1 REMOVED: was — if (currentPoint === "#signup") restartWatchdog(currentPoint)
    // #signup is now silent. No watchdog restart on focus.
  }
});

// Zone 1: input event on #signup no longer restarts the watchdog.
//         Retained as a no-op stub so the listener does not break anything downstream.
document.addEventListener("input", (e) => {
  const currentPoint = window.location.hash || "#signup";
  // Zone 1: #signup watchdog restart intentionally removed.
  // Only non-signup task pages handle watchdog restarts (see button-click handler below).
  if (currentPoint === "#signup") return;
  // (No other pages use input-based watchdog restarts — button clicks handle #bvn / #link-card.)
});


// ==========================================
// 5. SHIELD UI (drawer)
// ==========================================
function showShieldUI(pageHash) {
  const config = shieldVault[pageHash];
  if (!config) return;
  if (completedSections.has(pageHash)) return;

  const drawer = document.getElementById("shield-drawer");
  document.getElementById("shield-message").innerText = config.msg;

  drawer.dataset.video = config.video;
  drawer.dataset.label = config.label;
  drawer.dataset.title = config.title;

  drawer.classList.remove("drawer-hidden");
  drawer.classList.add("active");

  document.getElementById("recent-tab").classList.add("hidden");

  lastActiveLabel = config.label;
  try { localStorage.setItem(STORAGE_KEYS.lastLabel, lastActiveLabel); } catch (e) {}

  // Friction events carry last_focused_field for the Leaky Bucket.
  const extras = FRICTION_LABELS.has(config.label)
    ? { last_focused_field: lastFocusedField || "(none)" }
    : null;
  sendToZapier(config.label, extras);
}

function hideDrawer() {
  const drawer = document.getElementById("shield-drawer");
  drawer.classList.remove("active");
  drawer.classList.add("drawer-hidden");
}

function minimizeDrawerToTab() {
  hideDrawer();
  showRecentTab();
}


// ==========================================
// 6. RECENTLY WATCHED (session list)
// ==========================================
function addToRecentlyWatched(entry) {
  if (!entry || !entry.video) return;
  const existing = recentlyWatched.findIndex((r) => r.video === entry.video);
  if (existing !== -1) recentlyWatched.splice(existing, 1);
  recentlyWatched.unshift(entry);
  if (recentlyWatched.length > 8) recentlyWatched.length = 8;
  refreshRecentList();
  updateRecentTab();
}

function showRecentTab() {
  const tab = document.getElementById("recent-tab");
  tab.classList.remove("hidden");
  updateRecentTab();
}

function updateRecentTab() {
  const tab   = document.getElementById("recent-tab");
  const count = tab.querySelector(".recent-tab-count");
  if (count) count.textContent = String(recentlyWatched.length);
}

function refreshRecentList() {
  const list = document.getElementById("recent-list");
  if (!list) return;
  list.innerHTML = "";

  if (recentlyWatched.length === 0) {
    const empty = document.createElement("li");
    empty.className   = "recent-empty";
    empty.textContent = "No videos watched yet.";
    list.appendChild(empty);
    return;
  }

  recentlyWatched.forEach((r) => {
    const li    = document.createElement("li");
    li.className = "recent-item";

    const title       = document.createElement("span");
    title.className   = "recent-title";
    title.textContent = r.title || "Guide";

    const btn       = document.createElement("button");
    btn.className   = "recent-replay";
    btn.textContent = "Replay";
    btn.addEventListener("click", () => {
      openVideo(r.video, r.title, r.label, r.themeClass);
      hideRecentPanel();
    });

    li.appendChild(title);
    li.appendChild(btn);
    list.appendChild(li);
  });
}

function showRecentPanel() {
  refreshRecentList();
  document.getElementById("recent-panel").classList.remove("hidden");
}

function hideRecentPanel() {
  document.getElementById("recent-panel").classList.add("hidden");
}


// ==========================================
// 7. CUSTOM VIDEO PLAYER (PiP / Full toggle)
// ==========================================
function openVideo(videoUrl, title, label, themeClass) {
  if (!videoUrl) return;
  const container = document.getElementById("video-container");
  const player    = document.getElementById("churn-video");

  document.getElementById("vc-title").textContent = title || "Guide";
  player.src = videoUrl;

  container.classList.remove("vc-hidden", "vc-full", "vc-success");
  container.classList.add("vc-small");
  if (themeClass) container.classList.add(themeClass);

  addToRecentlyWatched({ video: videoUrl, title, label, themeClass });

  // Royalty Timer: 5+ seconds of playback → QUALIFIED_VIEW signal
  let qualifiedSent = false;
  clearTimeout(qualifiedViewTimer);
  const onPlay = () => {
    qualifiedViewTimer = setTimeout(() => {
      if (!qualifiedSent && !player.paused && player.currentTime >= 5) {
        qualifiedSent = true;
        sendToZapier((label || "video") + "_QUALIFIED_VIEW");
      }
    }, 5000);
  };
  player.addEventListener("play", onPlay, { once: true });

  const playPromise = player.play();
  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch(() => {});
  }
}

function closeVideo() {
  const container = document.getElementById("video-container");
  const player    = document.getElementById("churn-video");
  player.pause();
  try { player.currentTime = 0; } catch (e) {}
  container.classList.add("vc-hidden");
  container.classList.remove("vc-small", "vc-full", "vc-success");
}

function toggleVideoSize() {
  const container = document.getElementById("video-container");
  if (container.classList.contains("vc-full")) {
    container.classList.remove("vc-full");
    container.classList.add("vc-small");
  } else {
    container.classList.remove("vc-small");
    container.classList.add("vc-full");
  }
}


// ==========================================
// 8. SECTION COMPLETION + KILL SWITCH + PRO-TIP REWARD
// ==========================================
function instantKillPendingTriggers() {
  // Kills the friction watchdog + qualified-view timer.
  // Does NOT touch proTipTimer — the reward must always fire.
  clearTimeout(watchdogTimer);
  clearTimeout(qualifiedViewTimer);
}

// FIX 1 — INSTANT KILL SWITCH
// closeVideo() is now paired with hideDrawer() so neither the video nor the
// gold/blue bar can follow the user to the next page after clicking Continue.
function completeSection(hash) {
  if (!hash || completedSections.has(hash)) return;
  completedSections.add(hash);
  persistCompleted();
  instantKillPendingTriggers();
  closeVideo();   // ← Fix 1: wipe the video player immediately
  hideDrawer();   // ← Fix 1: wipe the drawer bar immediately
  sendToZapier(hash.replace("#", "") + "_SECTION_COMPLETED");

  // Reward Logic — final onboarding section completed → schedule Pro-Tip
  if (hash === "#link-card") {
    scheduleProTip();
  }
}

function scheduleProTip() {
  clearTimeout(proTipTimer); // reset only if rescheduled by another #link-card completion
  proTipTimer = setTimeout(() => {
    if (lastActiveLabel) {
      sendToZapier(lastActiveLabel + "_SUCCESS_SAVE");
      lastActiveLabel = null;
      try { localStorage.removeItem(STORAGE_KEYS.lastLabel); } catch (e) {}
    }
    proTipPending = true;
    showProTipHotspot(true);
  }, 10000);
}

// Permission-First: only show the GOLD hotspot. Video opens on user click.
function showProTipHotspot(fireSignal) {
  const config = shieldVault["#home"];
  const drawer = document.getElementById("shield-drawer");
  document.getElementById("shield-message").innerText =
    "Pro-Tip Unlocked — your reward is ready.";

  drawer.dataset.video = config.video;
  drawer.dataset.label = "Pro_Tip_Unlocked";
  drawer.dataset.title = "Pro-Tip Unlocked";
  drawer.dataset.theme = "vc-success";

  drawer.classList.remove("drawer-hidden");
  drawer.classList.add("active", "gold");
  document.getElementById("recent-tab").classList.add("hidden");

  if (fireSignal) sendToZapier("Pro_Tip_Unlocked");
}

function dismissProTipHotspot() {
  proTipPending = false;
  const drawer = document.getElementById("shield-drawer");
  drawer.classList.remove("gold");
  delete drawer.dataset.theme;
}

function killAutomation() {
  sendToZapier("Onboarding_Complete_STOP_SEQUENCE");
}


// ==========================================
// 9. WATCHDOG — page router + idle timer
//
// ZONE 2 REFACTOR: #home now routes to one of two mutually exclusive states.
//
//   State A — The Professor:
//     Condition : #bvn OR #link-card is NOT in completedSections
//     Behaviour : Wait 5 s → trigger Main Guide (shieldVault["#home-professor"])
//
//   State B — The Coach:
//     Condition : BOTH #bvn AND #link-card are in completedSections
//     Behaviour : Wait 3 s → trigger Pro-Tip hotspot (showProTipHotspot)
//
// ZONE 3 REFACTOR: Task-page rescue timers are 15 s (set in shieldVault).
//   Mute Rule (Fix 3): restartWatchdog checks shield-drawer.active instead of
//   isVideoActive() — blocks the rescue timer whenever the help bar is on screen,
//   whether or not a video is playing yet.
//
// ZONE 4 REFACTOR: runWatchdog is called by BOTH onload AND onhashchange.
//   On navigation (onhashchange), if a video is currently playing (isVideoActive),
//   we only switch the visible view — we do NOT close the video, hide the drawer,
//   or reset any video-related state.
// ==========================================

// FIX 3 — MUTE RULE
// Guard clause updated: if the help drawer is already active (visible on screen),
// do NOT start or restart the rescue timer — the user already has help available.
// This replaces the previous isVideoActive() check in both guard positions.
function restartWatchdog(currentPoint) {
  if (!shieldVault[currentPoint]) return;
  if (currentPoint === "#home") return;  // #home is routed exclusively inside runWatchdog
  if (completedSections.has(currentPoint)) return;

  // Fix 3 — Mute Rule: abort if the help bar is already on screen.
  if (document.getElementById("shield-drawer").classList.contains("active")) return;

  clearTimeout(watchdogTimer);
  watchdogTimer = setTimeout(() => {
    if ((window.location.hash || "#signup") !== currentPoint) return;

    // Fix 3 — Mute Rule: double-check at fire time; drawer may have appeared
    //          during the 15-second wait.
    if (document.getElementById("shield-drawer").classList.contains("active")) return;

    showShieldUI(currentPoint);
  }, shieldVault[currentPoint].time);
}

function runWatchdog() {
  const currentPoint = window.location.hash || "#signup";
  clearTimeout(watchdogTimer);

  // Zone 4 — Navigation Persistence:
  //   Only reset the drawer / close video on a genuine page-load (onload).
  //   On navigation (onhashchange), if a video is playing we skip the reset
  //   so the video continues uninterrupted in its current PiP or Full state.
  const videoCurrentlyPlaying = isVideoActive();

  if (!videoCurrentlyPlaying) {
    // Safe to reset drawer state — no video is competing.
    hideDrawer();
  }
  // If videoCurrentlyPlaying is true, we intentionally do NOT call hideDrawer()
  // or closeVideo() — Zone 4 guarantee: the video continues uninterrupted.

  // Always update the visible view panel (UI concern, not a video concern).
  document.querySelectorAll(".view").forEach((v) => (v.style.display = "none"));
  const activeView = document.querySelector(currentPoint);
  if (activeView) activeView.style.display = "block";

  // ── #home routing ──────────────────────────────────────────────────────────
  if (currentPoint === "#home") {

    // Success signal: fire once regardless of completion state.
    fetch(successWebhookURL, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        email:  userEmail,
        event:  "onboarding_complete",
        status: "success",
      }),
    }).catch(err => console.warn("Webhook silent fail:", err));

    killAutomation();

    // Zone 2 — Auditor: determine which state to enter.
    const tasksComplete =
      completedSections.has("#bvn") && completedSections.has("#link-card");

    if (!tasksComplete) {
      // ── State A: The Professor ────────────────────────────────────────────
      // One or more tasks are incomplete. Wait 5 s, then trigger Main Guide.
      // Mute Rule still applies: if a video starts during the wait, abort.
      watchdogTimer = setTimeout(() => {
        if ((window.location.hash || "#signup") !== "#home") return;
        if (isVideoActive()) return; // Zone 3 Mute Rule honoured here too

        const professorConfig = shieldVault["#home-professor"];
        const drawer = document.getElementById("shield-drawer");
        document.getElementById("shield-message").innerText = professorConfig.msg;
        drawer.dataset.video = professorConfig.video;
        drawer.dataset.label = professorConfig.label;
        drawer.dataset.title = professorConfig.title;
        delete drawer.dataset.theme;

        drawer.classList.remove("drawer-hidden", "gold");
        drawer.classList.add("active");
        document.getElementById("recent-tab").classList.add("hidden");

        lastActiveLabel = professorConfig.label;
        try { localStorage.setItem(STORAGE_KEYS.lastLabel, lastActiveLabel); } catch (e) {}
        sendToZapier(professorConfig.label);

      }, shieldVault["#home-professor"].time); // 5 000 ms

    } else {
      // ── State B: The Coach ────────────────────────────────────────────────
      // All tasks are complete. Wait 3 s, then surface the Pro-Tip hotspot.
      // The Coach does NOT auto-play — it shows the gold hotspot only.
      watchdogTimer = setTimeout(() => {
        if ((window.location.hash || "#signup") !== "#home") return;
        proTipPending = true;
        showProTipHotspot(true);
      }, shieldVault["#home-coach"].time); // 3 000 ms
    }

    // Persist the Gold Hotspot across navigation until the user claims it.
    if (proTipPending) {
      showProTipHotspot(false);
    }

    return; // #home handled — skip generic task-page logic below.
  }
  // ── End #home routing ──────────────────────────────────────────────────────

  // ── Task pages (#bvn, #link-card) — Zone 3: 15 s rescue timer ─────────────
  // Zone 1: #signup has no shieldVault entry, so it is silently skipped here.
  if (shieldVault[currentPoint] && !completedSections.has(currentPoint)) {
    // Zone 3 — Mute Rule: if a video is already playing (e.g. user navigated here
    //          mid-Main-Guide), do NOT start the rescue timer.
    if (!videoCurrentlyPlaying) {
      watchdogTimer = setTimeout(() => {
        if ((window.location.hash || "#signup") !== currentPoint) return;

        // Zone 3 — Mute Rule: check again at fire time.
        if (isVideoActive()) return;

        showShieldUI(currentPoint);
      }, shieldVault[currentPoint].time); // 15 000 ms
    }
  }

  // Persist the Gold Hotspot across navigation until the user claims it.
  if (proTipPending) {
    showProTipHotspot(false);
  }
}


// ==========================================
// 10. WIRING
// ==========================================

// Continue / Submit / Link → INSTANT KILL SWITCH + section complete + advance
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".continue-btn");
  if (!btn) return;

  // Instant kill switch — fires before anything else can trigger a ghost video.
  instantKillPendingTriggers();

  const section = btn.dataset.section;
  const next    = btn.dataset.next;

  if (section === "#signup") {
    const emailField = document.getElementById("user-email");
    const v = emailField ? emailField.value.trim() : "";
    if (!v.includes("@")) {
      logSignal("Email required");
      if (emailField) emailField.focus();
      return;
    }
    userEmail = v;
    try { localStorage.setItem(STORAGE_KEYS.email, userEmail); } catch (e) {}
    sendToZapier("Identity_Captured");
  }

  completeSection(section);
  if (next) window.location.hash = next;
});

// BVN / Card: button-clicks within the active view restart the watchdog.
document.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  if (btn.classList.contains("continue-btn")) return; // navigates away — handled above
  const currentPoint = window.location.hash || "#signup";
  if (currentPoint !== "#bvn" && currentPoint !== "#link-card") return;
  const view = document.querySelector(currentPoint);
  if (view && view.contains(btn)) restartWatchdog(currentPoint);
  // Fix 3 Mute Rule is enforced inside restartWatchdog — no additional guard needed here.
});


// ==========================================
// FORMAT-ERROR SHIELD
// Fires the Hotspot the moment input is provably wrong (bypasses the watchdog timer).
// Never re-fires for an already-completed section or while the same shield is on screen.
// Never auto-plays the video — user must click Watch.
// ==========================================
function fireFormatErrorShield(hash) {
  if (!shieldVault[hash]) return;
  if (completedSections.has(hash)) return;

  const drawer = document.getElementById("shield-drawer");
  const alreadyShowingSame =
    drawer.classList.contains("active") &&
    !drawer.classList.contains("gold") &&
    drawer.dataset.label === shieldVault[hash].label;
  if (alreadyShowingSame) return;

  instantKillPendingTriggers();
  showShieldUI(hash); // drawer only — user must click Watch to play
}

(function wireInputFormattingAndValidators() {
  const bvnInput  = document.getElementById("bvn-input");
  const cardInput = document.getElementById("card-input");

  // ---- Visual auto-formatters (digits-only data; spaces are cosmetic) ----
  function formatBvn(digits) {
    digits = digits.slice(0, 11);
    const parts = [];
    if (digits.length > 0) parts.push(digits.slice(0, 3));
    if (digits.length > 3) parts.push(digits.slice(3, 6));
    if (digits.length > 6) parts.push(digits.slice(6, 9));
    if (digits.length > 9) parts.push(digits.slice(9, 11));
    return parts.join(" ");
  }

  function formatCard(digits) {
    digits = digits.slice(0, 19);
    const m = digits.match(/.{1,4}/g);
    return m ? m.join(" ") : "";
  }

  // Strip non-digits, re-format, restore the cursor so it never jumps mid-typing.
  function applyFormat(input, formatter) {
    const oldVal    = input.value;
    const oldCursor = input.selectionStart ?? oldVal.length;
    const digitsBeforeCursor = oldVal.slice(0, oldCursor).replace(/\D/g, "").length;
    const allDigits = oldVal.replace(/\D/g, "");
    const newVal    = formatter(allDigits);
    if (newVal === oldVal) return;
    input.value = newVal;
    let newCursor = 0, seen = 0;
    while (newCursor < newVal.length && seen < digitsBeforeCursor) {
      if (/\d/.test(newVal[newCursor])) seen++;
      newCursor++;
    }
    try { input.setSelectionRange(newCursor, newCursor); } catch (e) {}
  }

  bvnInput.addEventListener("input",  () => applyFormat(bvnInput,  formatBvn));
  cardInput.addEventListener("input", () => applyFormat(cardInput, formatCard));

  // ---- Format-error shield (reads RAW digits so spaces don't break it) ----
  bvnInput.addEventListener("blur", () => {
    const digits = bvnInput.value.replace(/\D/g, "");
    if (digits.length > 0 && digits.length !== 11) {
      fireFormatErrorShield("#bvn");
    }
  });

  cardInput.addEventListener("blur", () => {
    const digits = cardInput.value.replace(/\D/g, "");
    if (digits.length > 0 && (digits.length < 13 || digits.length > 19)) {
      fireFormatErrorShield("#link-card");
    }
  });
})();


// Drawer: open the video (Pro-Tip carries gold theme into the player).
document.getElementById("open-shield-btn").addEventListener("click", (e) => {
  if (isMobile() && e.isTrusted !== true) return;
  const drawer  = document.getElementById("shield-drawer");
  const wasGold = drawer.classList.contains("gold");
  openVideo(
    drawer.dataset.video,
    drawer.dataset.title,
    drawer.dataset.label,
    drawer.dataset.theme || null,
  );
  if (wasGold) {
    dismissProTipHotspot();
    hideDrawer();
  }
});

// FIX 2 — ALARM TRIGGER: vc-close
// After closing the video, restart the 15 s watchdog so the Professor returns
// if the user is still stuck on the same page.
document.getElementById("vc-close").addEventListener("click", () => {
  closeVideo();
  restartWatchdog(window.location.hash || "#signup"); // ← Fix 2
});

// FIX 2 — ALARM TRIGGER: drawer-close
// After minimizing the drawer, restart the 15 s watchdog so the Professor
// can resurface if the user remains idle on the same page.
document.getElementById("drawer-close").addEventListener("click", (e) => {
  e.stopPropagation();
  minimizeDrawerToTab();
  restartWatchdog(window.location.hash || "#signup"); // ← Fix 2
});

// Recent tab → open the list panel.
document.getElementById("recent-tab").addEventListener("click", showRecentPanel);
document.getElementById("recent-tab").addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    showRecentPanel();
  }
});
document.getElementById("recent-panel-close").addEventListener("click", hideRecentPanel);

// Custom video player size toggle.
document.getElementById("vc-toggle").addEventListener("click", toggleVideoSize);

// Anti-theft: block right-click + drag on video (native controls remain fully usable).
const videoEl = document.getElementById("churn-video");
videoEl.addEventListener("contextmenu", (e) => e.preventDefault());
videoEl.addEventListener("dragstart",   (e) => e.preventDefault());

// Reset Demo — wipe all persisted state and reload from #signup.
document.getElementById("reset-demo").addEventListener("click", () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.email);
    localStorage.removeItem(STORAGE_KEYS.lastLabel);
    sessionStorage.removeItem(STORAGE_KEYS.completed);
  } catch (e) {}
  clearTimeout(watchdogTimer);
  clearTimeout(qualifiedViewTimer);
  clearTimeout(proTipTimer);
  proTipPending = false;
  window.location.hash = "#signup";
  window.location.reload();
});


// ==========================================
// BOOTUP
//
// Zone 4: window.onhashchange calls runWatchdog directly.
//         runWatchdog detects isVideoActive() at the top and skips any
//         video/drawer reset when a video is in flight.
//         closeVideo() is NEVER called from the navigation path.
// ==========================================
window.onhashchange = runWatchdog;
window.onload = () => {
  runWatchdog();
  captureIdentity();
  if (recentlyWatched.length > 0) showRecentTab();
};
