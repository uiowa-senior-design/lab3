/**
 * auth.js — Session management for password-protected content.
 *
 * How it works:
 *  - On login (gate.html): user's input is SHA-256 hashed and compared to
 *    PASSWORD_HASH. On match, a session token + timestamp are written to
 *    sessionStorage.
 *  - On every protected page: checkAuth() verifies the token exists and that
 *    the last-active timestamp is within IDLE_TIMEOUT_MS. Any user interaction
 *    resets the idle clock. Expired or missing sessions redirect to gate.html.
 *
 * To change the password offline, run:  python3 scripts/change_password.py
 * That script rewrites PASSWORD_HASH below without touching anything else.
 */

// ── CONFIG ────────────────────────────────────────────────────────────────────

// SHA-256 hash of "Spring2026Lab3"
// DO NOT store the plaintext password here or anywhere in the codebase.
const PASSWORD_HASH = "b3c5c6a3d8e1f2a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8";
// ↑ placeholder — change_password.py will overwrite this line

const SESSION_KEY      = "dfdn_session";
const LAST_ACTIVE_KEY  = "dfdn_last_active";
const IDLE_TIMEOUT_MS  = 30 * 60 * 1000; // 30 minutes
const GATE_PATH        = "/protected/gate.html";

// ── HASHING ───────────────────────────────────────────────────────────────────

/**
 * Returns the hex SHA-256 digest of a string using the Web Crypto API.
 * @param {string} message
 * @returns {Promise<string>}
 */
async function sha256(message) {
  const encoder = new TextEncoder();
  const data     = encoder.encode(message);
  const hashBuf  = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuf))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

// ── SESSION ───────────────────────────────────────────────────────────────────

function _writeSession() {
  sessionStorage.setItem(SESSION_KEY,     "authenticated");
  sessionStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
}

function _clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(LAST_ACTIVE_KEY);
}

function _isSessionValid() {
  if (sessionStorage.getItem(SESSION_KEY) !== "authenticated") return false;
  const last = parseInt(sessionStorage.getItem(LAST_ACTIVE_KEY) || "0", 10);
  return (Date.now() - last) < IDLE_TIMEOUT_MS;
}

function _touchSession() {
  if (sessionStorage.getItem(SESSION_KEY) === "authenticated") {
    sessionStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
  }
}

// ── PUBLIC API ────────────────────────────────────────────────────────────────

/**
 * Attempt login with a plaintext password.
 * Returns true on success (and writes session), false on failure.
 * @param {string} plaintext
 * @returns {Promise<boolean>}
 */
async function login(plaintext) {
  const hash = await sha256(plaintext);
  if (hash === PASSWORD_HASH) {
    _writeSession();
    return true;
  }
  return false;
}

/**
 * Call at the top of every protected page.
 * Redirects to gate.html if the session is missing or expired.
 */
function checkAuth() {
  if (!_isSessionValid()) {
    _clearSession();
    window.location.replace(GATE_PATH);
  }
}

/**
 * Explicitly log out and redirect to gate.
 */
function logout() {
  _clearSession();
  window.location.replace(GATE_PATH);
}

// ── IDLE RESET ────────────────────────────────────────────────────────────────
// Resets the idle clock on any meaningful user interaction.
["click", "keydown", "scroll", "mousemove", "touchstart"].forEach(evt => {
  document.addEventListener(evt, _touchSession, { passive: true });
});
