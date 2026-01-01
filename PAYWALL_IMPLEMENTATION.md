# Photon Paywall Implementation Plan

## Overview
Gate access to the photo editor behind an email signup form. Users submit email → stored in Google Sheets → get access to editor.

---

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Landing Page   │───▶│  Email Signup    │───▶│  Photo Editor   │
│  (Public)       │    │  + Google Sheets │    │  (Gated)        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │  Google Sheets   │
                       │  (Email Log)     │
                       └──────────────────┘
```

---

## Implementation Options

### Option A: Simple Client-Side Gating (Fastest)
**Pros:** Quick to implement, no backend needed
**Cons:** Not truly secure (can be bypassed by tech-savvy users)

1. User submits email → Sent to Google Sheets
2. Store `hasAccess: true` in localStorage
3. App checks localStorage before showing editor
4. Users without access see waitlist signup

**Best for:** Pre-launch waitlist, soft gating

### Option B: Token-Based Access (More Secure)
**Pros:** Harder to bypass, verified emails
**Cons:** Requires backend/serverless function

1. User submits email → Google Apps Script generates unique token
2. Token stored in Google Sheets alongside email
3. Token saved to user's browser (cookie/localStorage)
4. App validates token against sheet on load

**Best for:** Beta access, real gating

### Option C: Full Auth (Most Secure)
**Pros:** Real authentication, password protection
**Cons:** Most complex, users need to remember password

1. Integrate Supabase/Firebase Auth
2. Email/password signup
3. Real session management

**Best for:** Paid product, sensitive data

---

## Recommended: Option A (Quick Launch)

Since you're building a waitlist/early access flow, let's implement **Option A** with enhancement:

### Flow:
1. **First Visit:** User sees landing page with email form
2. **After Signup:**
   - Email sent to Google Sheets
   - `photon_access` set in localStorage
   - User redirected to editor
3. **Return Visit:** Check localStorage, show editor directly

---

## Implementation Steps

### Step 1: Google Apps Script Setup
Already created - see GOOGLE_SHEETS_SETUP.md

### Step 2: Update App.tsx Access Control
Add access checking logic to main app

### Step 3: Modify WelcomeScreen
Form already added - needs to set localStorage after success

### Step 4: Create Gating Logic
Check access before showing editor views

---

## Code Changes Needed

### A. WelcomeScreen.tsx (Email Form)
- After successful submit, set `localStorage.setItem('photon_access', 'true')`
- Call `onSignup()` to transition to app

### B. App.tsx (Access Control)
- Check `localStorage.getItem('photon_access')` on load
- If no access, show WelcomeScreen
- If has access, show full app

### C. Optional: Access Token (More Secure)
- Generate unique token on submit
- Store both in sheet and localStorage
- Validate token periodically

---

## Google Sheet Structure

| A (Email) | B (Timestamp) | C (Source) | D (Token) |
|-----------|---------------|------------|-----------|
| user@example.com | 2024-01-01T... | hero_waitlist | abc123... |

---

## Next Steps

1. ✅ Google Sheet created
2. ⏳ Add Google Apps Script to sheet
3. ⏳ Deploy script as web app
4. ⏳ Add script URL to WelcomeScreen.tsx
5. ⏳ Update app to grant access after signup

Ready to implement? Just say "go" and I'll set it up!
