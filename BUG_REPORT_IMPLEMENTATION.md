# Bug Report & Hardware Acceleration Notice - Implementation Summary

## Overview
This implementation adds two key features to the Ten-K Farkle game:
1. **Hardware Acceleration Notice** - A modal that appears when users first join a game
2. **Bug Report Page** - A dedicated page for users to submit bug reports

---

## 1. Hardware Acceleration Notice

### Location
- Added to `public/index.html` (lines 349-364)
- Logic added to `public/client.js` (lines 1029-1040)

### Features
- ⚡ Displays a prominent modal with performance notice
- Shows automatically when a user joins a game room for the first time
- Message: "If the game is lagging/buggy/running badly, please turn hardware acceleration on for the best experience."
- Stores user acknowledgment in localStorage to prevent repeated displays
- Premium design with gradient accents and smooth animations

### User Flow
1. User selects a room and joins
2. After 1 second delay, the modal appears (if not seen before)
3. User clicks "Got It!" button
4. Modal is hidden and won't show again (stored in localStorage)

---

## 2. Bug Report System

### New Files Created

#### `public/bug-report.html`
A premium, standalone bug report page with:
- **User Information Display**
  - Automatically fills username from localStorage
  - Shows Discord avatar if authenticated
  - Username field is READ-ONLY (cannot be changed)
  - Displays current account information

- **Report Form Fields**
  - **Problem Title** (required) - Brief description (max 100 chars)
  - **Detailed Description** (required) - Full bug explanation
  - **How to Reproduce / When it Triggers** (required) - Steps or conditions
  - **Severity** (dropdown) - Low, Medium, High, Critical

- **Submission**
  - Sends to `/api/bug-report` endpoint
  - Includes timestamp and user agent
  - Shows success message on submission
  - Premium UI with glassmorphism and aurora effects

### Backend Integration

#### `server.js` (lines 226-249)
Added endpoint: `POST /api/bug-report`
- Accepts bug report data
- Logs to console with structured format
- Returns success/error response
- Ready to extend with database storage (commented)

### Access
- Link added to footer of main page: "🐛 Report a Bug"
- Direct URL: `/bug-report.html`

---

## Design Features

Both features follow the game's premium aesthetic:
- ✨ Glassmorphism effects with backdrop blur
- 🎨 Gradient accents (cyan/purple theme)
- 🌊 Aurora background animations
- 💫 Smooth transitions and micro-animations
- 📱 Fully responsive design
- 🎯 High-contrast, accessible typography

---

## Technical Details

### Storage
- `localStorage.getItem('hw-accel-notice-seen')` - Hardware acceleration notice acknowledgment
- `localStorage.getItem('farkle-username')` - Username for bug reports
- `localStorage.getItem('farkle_user_data')` - Discord user data (if authenticated)

### API Endpoints
- `POST /api/bug-report` - Submit bug reports

### Security
- Username field is disabled in HTML to prevent tampering
- User ID is included for authenticated users
- Server-side validation can be added as needed

---

## Future Enhancements (Optional)

1. **Database Integration**
   - Create `bug_reports` table in database
   - Store all bug reports with timestamps
   - Admin dashboard to view/manage reports

2. **Email Notifications**
   - Send email to admins when new bugs are reported
   - Auto-response to user confirming receipt

3. **Status Tracking**
   - Allow users to check status of their reports
   - Mark reports as: Open, In Progress, Resolved, Closed

4. **Screenshot Upload**
   - Allow users to attach screenshots
   - Store in cloud storage or local filesystem

---

## Testing Checklist

- [x] Hardware acceleration modal appears on first room join
- [x] Modal doesn't appear on subsequent joins
- [x] Bug report page loads correctly
- [x] Username is auto-filled and read-only
- [x] Discord avatar displays if authenticated
- [x] Form validation works (required fields)
- [x] Server endpoint receives and logs bug reports
- [x] Success message displays after submission
- [x] Footer link to bug report page works
- [x] Responsive design on mobile devices

---

## Files Modified

1. `public/index.html` - Added hardware acceleration modal + bug report link
2. `public/client.js` - Added logic to show modal on first join
3. `public/bug-report.html` - New file (bug report page)
4. `server.js` - Added bug report API endpoint

---

## Usage Instructions

### For Users
1. **Hardware Acceleration Notice**: Will appear automatically when joining a game
2. **Bug Reports**: Click "🐛 Report a Bug" in the footer or visit `/bug-report.html`

### For Developers
To view bug reports, check server console:
```
[BUG REPORT] {
  username: 'PlayerName',
  userId: 'discord_id',
  problem: 'Brief description',
  severity: 'medium',
  timestamp: '2026-02-03T05:51:40.123Z'
}
```

To add database storage, uncomment and implement the database call in `server.js` (line 241).

---

## Notes

- Hardware acceleration notice uses localStorage, so clearing browser data will show it again
- Bug reports are currently logged to console only (ready for database integration)
- All styling matches the game's premium aesthetic with consistent branding
- Forms include proper validation and error handling
