# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ECE:4880 Lab 3** — Portfolio website for the University of Iowa Senior Design team. Due **April 24, 2026**.

**Team:**
- Ethan Holter — CSE (Computer Science & Engineering), graduating Dec. 2026
- Jesse Meadows — ECE (Electrical & Computer Engineering), graduating Dec. 2026
- Riggen Snyder — CSE (Computer Science & Engineering), graduating Dec. 2026

**Project:** Distributed Flood Detection Network — a LoRa mesh flood detection and mapping system. Solar-powered sensor nodes measure local water levels and relay readings across a P2P mesh. A central server aggregates readings and cross-references a Digital Elevation Model (DEM) to interpolate flood extent in near-real time.

**Hosting:** Netlify (free Starter tier) — enables Netlify Forms for contact form submissions.

## Architecture

Fully static site (HTML + CSS + JavaScript). No build system or package manager. Deployed on Netlify.

### File Structure
```
index.html                    ← Team homepage (prototype-b design)
members/
  ethan.html                  ← Ethan Holter profile + contact form
  jesse.html                  ← Jesse Meadows profile + contact form
  riggen.html                 ← Riggen Snyder profile + contact form
protected/
  gate.html                   ← Password entry page
  index.html                  ← Protected content listing (session-gated)
  messages/[timestamp].html   ← Saved contact form submissions (session-gated)
assets/
  css/style.css               ← Shared styles
  js/auth.js                  ← Session check (imported by all protected pages)
scripts/
  change_password.py          ← Offline password-change tool
netlify.toml                  ← Netlify config (form handling, redirects)
```

### Security Model
- Password (`Spring2026Lab3` by default) is never stored in plaintext in any HTML/JS
- SHA-256 hash of the password is embedded in `auth.js`; comparison is done via Web Crypto API
- Protected page URLs are not linked anywhere in public HTML — only reachable after auth
- Auth state lives in `sessionStorage`: a token + timestamp written on successful login
- All protected pages import `auth.js` which checks the token and idle time on load, redirecting to `gate.html` if missing or expired
- **Session timeout: 30 minutes of idle** (reset on any page interaction)
- `change_password.py` recomputes the SHA-256 hash and rewrites it into `auth.js` offline

### Contact Form (Netlify Forms)
- Each member page has a form with `data-netlify="true"` attribute
- Netlify captures submissions automatically; a Netlify Function (`netlify/functions/save-message.js`) writes the submission as an HTML file into `protected/messages/` via the GitHub API, so it appears in the protected area
- Submissions include: sender name, message body, timestamp, which member was contacted

## Design System

All pages follow the **prototype-b** design language (`prototype-b.html` is the reference):
- **Background:** `#0d0d0d`
- **Card surfaces:** `#161616`
- **Borders:** `#2a2a2a`
- **Gold accent:** `#FFCD00`
- **Muted text:** `#666`
- **Font:** `Arial`, sans-serif; weight `900` for headings
- **Style cues:** uppercase labels with wide `letter-spacing`, large decorative numerals, sticky dark nav with a gold dot logo marker

## Phased Implementation Plan

### Phase 1 — Structure & Shared Assets
- `assets/css/style.css` — shared styles extracted from prototype-b
- `assets/js/auth.js` — session check + 30-min idle timeout logic
- `netlify.toml` — Netlify config (form handling, function routing)

### Phase 2 — Public Pages
- Refine `index.html` with real team names, project info, navigation
- `members/ethan.html`, `members/jesse.html`, `members/riggen.html` — profile pages with placeholder bios, avatar images, and contact forms

### Phase 3 — Password & Protected Area
- `protected/gate.html` — password entry UI
- `protected/index.html` — protected content listing (messages index)
- `change_password.py` — offline hash regeneration script

### Phase 4 — Contact Form → Message Storage
- Netlify Forms on each member page
- `netlify/functions/save-message.js` — serverless function that writes submissions as HTML files to `protected/messages/` via GitHub API

### Phase 5 — Polish
- Responsive layout for mobile
- Consistent navigation across all pages
- Final Black & Gold styling pass

## Lab Requirements Checklist
- [ ] Publicly hosted on Netlify
- [ ] Team homepage with links to all three member pages
- [ ] Each member page has embedded graphics (photos or AI-generated images)
- [ ] Password-protected section (default: `Spring2026Lab3`)
- [ ] No plaintext password or protected URLs in any HTML source
- [ ] Session persists across protected pages without re-prompting
- [ ] 30-minute idle session timeout
- [ ] No password-change mechanism on the site itself
- [ ] Offline password-change script (`change_password.py`)
- [ ] Contact form on each member page (Netlify Forms)
- [ ] Submissions saved as timestamped HTML pages in protected area
- [ ] Black & Gold color scheme throughout
- [ ] No official U of Iowa logos or trademarks
- [ ] Storyboard in lab report
- [ ] Website URL in lab report
- [ ] Git commit contributors in lab report
