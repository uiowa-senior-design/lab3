/**
 * submission-created.js
 *
 * Netlify automatically invokes this function for every form submission
 * captured by Netlify Forms (any form with data-netlify="true").
 *
 * What it does:
 *  1. Parses the submission payload (name, email, message, member, timestamp).
 *  2. Generates a timestamped HTML file for the message.
 *  3. Writes that file to protected/messages/<filename> via the GitHub API.
 *  4. Fetches the current protected/messages/index.json, appends the new
 *     message metadata, and writes it back — so the protected inbox updates.
 *
 * Required environment variables (set in Netlify dashboard):
 *   GITHUB_TOKEN  — personal access token with `repo` scope
 *   GITHUB_REPO   — repository in "owner/name" format, e.g. "uiowa-senior-design/lab3"
 */

const GITHUB_API  = "https://api.github.com";
const BRANCH      = "master";

// ── Helpers ───────────────────────────────────────────────────────────────────

function toBase64(str) {
  return Buffer.from(str, "utf-8").toString("base64");
}

function fromBase64(str) {
  return Buffer.from(str, "base64").toString("utf-8");
}

function escHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Pad a number to 2 digits */
function pad(n) { return String(n).padStart(2, "0"); }

/** Generate a filename like msg-20260417-143022-a3f2.html */
function makeFilename(date) {
  const y   = date.getUTCFullYear();
  const mo  = pad(date.getUTCMonth() + 1);
  const d   = pad(date.getUTCDate());
  const h   = pad(date.getUTCHours());
  const min = pad(date.getUTCMinutes());
  const s   = pad(date.getUTCSeconds());
  const rnd = Math.floor(Math.random() * 0xffff).toString(16).padStart(4, "0");
  return `msg-${y}${mo}${d}-${h}${min}${s}-${rnd}.html`;
}

/** GitHub API GET — returns parsed JSON */
async function ghGet(path, token) {
  const res = await fetch(`${GITHUB_API}${path}`, {
    headers: {
      Authorization: `token ${token}`,
      Accept:        "application/vnd.github+json",
      "User-Agent":  "flood-detection-netlify-fn",
    },
  });
  if (!res.ok && res.status !== 404) {
    throw new Error(`GitHub GET ${path} → ${res.status}: ${await res.text()}`);
  }
  return res.status === 404 ? null : res.json();
}

/** GitHub API PUT (create or update a file) */
async function ghPut(path, token, message, content, sha) {
  const body = { message, content: toBase64(content), branch: BRANCH };
  if (sha) body.sha = sha;

  const res = await fetch(`${GITHUB_API}${path}`, {
    method:  "PUT",
    headers: {
      Authorization: `token ${token}`,
      Accept:        "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent":  "flood-detection-netlify-fn",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`GitHub PUT ${path} → ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

// ── Message HTML template ─────────────────────────────────────────────────────

function buildMessageHtml({ name, email, message, member, timestamp, filename }) {
  const date = new Date(timestamp);
  const displayDate = date.toLocaleString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "numeric", minute: "2-digit", timeZoneName: "short",
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Message from ${escHtml(name)} — Protected</title>
  <link rel="stylesheet" href="../../assets/css/style.css">
  <meta name="robots" content="noindex, nofollow">
</head>
<body>

  <nav class="nav">
    <a href="../../index.html" class="nav-logo">
      <span class="dot"></span>
      <span class="name">Flood Detection Network</span>
    </a>
    <ul class="nav-links">
      <li><a href="../../index.html">Home</a></li>
      <li><a href="../index.html">&#8592; Inbox</a></li>
      <li><a href="#" onclick="logout(); return false;" style="color: #555;">Log Out</a></li>
    </ul>
  </nav>

  <section style="padding: 4rem 3rem 2rem; max-width: 800px; margin: 0 auto;">
    <div style="margin-bottom: 2rem;">
      <a href="../index.html" style="font-size: 0.78rem; color: var(--text-muted); letter-spacing: 0.08em; text-transform: uppercase; text-decoration: none;">
        &#8592; Back to Inbox
      </a>
    </div>

    <div class="tag" style="margin-bottom: 1.5rem;">Protected Message</div>

    <div style="background: var(--surface); border: 1px solid var(--border); border-top: 3px solid var(--gold); padding: 2.5rem;">

      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: 1px solid var(--border);">
        <div>
          <h1 style="font-size: 1.4rem; font-weight: 900; color: white;">${escHtml(name)}</h1>
          ${email ? `<div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">${escHtml(email)}</div>` : ""}
          <div style="font-size: 0.75rem; color: var(--gold); text-transform: uppercase; letter-spacing: 0.08em; margin-top: 0.4rem;">
            To: ${escHtml(member)}
          </div>
        </div>
        <div style="font-size: 0.78rem; color: var(--text-muted); text-align: right; line-height: 1.6;">
          ${escHtml(displayDate)}
        </div>
      </div>

      <!-- Body -->
      <div style="font-size: 0.95rem; color: var(--text); line-height: 1.85; white-space: pre-wrap;">${escHtml(message)}</div>

    </div>
  </section>

  <footer class="footer">
    &copy; 2026 ECE:4880 Senior Design &mdash; University of Iowa
  </footer>

  <script src="../../assets/js/auth.js"></script>
  <script>checkAuth();</script>
</body>
</html>`;
}

// ── Main handler ──────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  const token = process.env.GITHUB_TOKEN;
  const repo  = process.env.GITHUB_REPO;

  if (!token || !repo) {
    console.error("Missing GITHUB_TOKEN or GITHUB_REPO env vars.");
    return { statusCode: 500 };
  }

  // Netlify sends the form payload as JSON in event.body
  let payload;
  try {
    payload = JSON.parse(event.body).payload;
  } catch (err) {
    console.error("Failed to parse event body:", err);
    return { statusCode: 400 };
  }

  const data = payload.data ?? {};
  const name    = (data.name    || "").trim();
  const email   = (data.email   || "").trim();
  const message = (data.message || "").trim();
  const member  = (data.member  || "").trim();
  const timestamp = payload.created_at || new Date().toISOString();

  if (!name || !message || !member) {
    console.error("Missing required fields in submission:", payload.data);
    return { statusCode: 400 };
  }

  const date     = new Date(timestamp);
  const filename = makeFilename(date);
  const repoPath = `/repos/${repo}/contents`;

  // ── 1. Write the message HTML file ────────────────────────────────────────
  const messageHtml = buildMessageHtml({ name, email, message, member, timestamp, filename });

  await ghPut(
    `${repoPath}/protected/messages/${filename}`,
    token,
    `Add message from ${name} to ${member}`,
    messageHtml,
    null // new file — no SHA
  );

  console.log(`Created message file: protected/messages/${filename}`);

  // ── 2. Update index.json ──────────────────────────────────────────────────
  const indexPath = `${repoPath}/protected/messages/index.json`;
  const existing  = await ghGet(indexPath, token);

  let entries = [];
  let indexSha = null;

  if (existing) {
    indexSha = existing.sha;
    try {
      entries = JSON.parse(fromBase64(existing.content));
      if (!Array.isArray(entries)) {
        console.warn("index.json was not an array — starting fresh");
        entries = [];
      }
    } catch (parseErr) {
      console.error("Failed to parse existing index.json — refusing to overwrite:", parseErr);
      // Still return 200 to Netlify since the message HTML was already written.
      // The index will be out of sync but no data is lost — the HTML file exists.
      return { statusCode: 200, body: "Message saved but index.json update skipped due to parse error" };
    }
  }

  // Build a short preview (first 120 chars of message, stripped of newlines)
  const preview = message.replace(/\s+/g, " ").trim().slice(0, 120);

  entries.push({ filename, name, email: email ?? "", member, timestamp, preview });

  await ghPut(
    indexPath,
    token,
    `Update messages index (${filename})`,
    JSON.stringify(entries, null, 2),
    indexSha
  );

  console.log(`Updated index.json (${entries.length} total messages)`);

  return { statusCode: 200 };
};
