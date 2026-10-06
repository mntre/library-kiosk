# Fix Verification Summary

All bugs addressed in iteration 1. Build verified with `npm run build` — exits clean.

| Bug | Severity | Status | Files Changed | Notes |
|-----|----------|--------|---------------|-------|
| BUG-001 | CRITICAL | ✅ Fixed | `vite.config.js` | Proxy target changed from `:5002` → `:5000` |
| BUG-002 | CRITICAL | ✅ Fixed | `database/migrations/001_create_tables.sql` | Added `last_name TEXT`, `first_name TEXT`, `middle_name TEXT` to both `students` and `attendance_logs` tables |
| BUG-003 | CRITICAL | ✅ Fixed | `.env` (created) | Copied from `.env.example` with placeholder values so server can start |
| BUG-004 | CRITICAL | ✅ Fixed | `server/server.js`, `server/routes/admin.js`, `src/components/AdminLogin.jsx`, `src/components/AdminDashboard.jsx` | JWT auth middleware added; login issues signed 8h token; dashboard attaches token via axios interceptor; logout clears token |
| BUG-005 | MEDIUM | ✅ Fixed | `server/routes/attendance.js` | Clock-in now checks for existing active session; returns HTTP 409 if duplicate |
| BUG-006 | MEDIUM | ✅ Fixed | `src/components/KioskScreen.jsx` | Non-404 errors in student GET are now re-thrown instead of silently swallowed |
| BUG-007 | MEDIUM | ✅ Fixed | `server/routes/admin.js` | `education_level` and `strand` added to logs SELECT query |
| BUG-008 | MEDIUM | ✅ Fixed | `src/components/AdminDashboard.jsx` | `logsPageInitialized` ref prevents double `loadLogs()` call on initial tab switch |
| BUG-009 | MEDIUM | ✅ Fixed | `server/routes/admin.js` | Stats `today` comparisons now use `setHours(0,0,0,0)` local midnight (consistent with `attendance.js`) |
| BUG-010 | N/A | ✅ Non-bug | — | Confirmed false alarm — `fmtDur` receives seconds and divides by 60 correctly |
| BUG-011 | LOW | ✅ Fixed | `server/routes/admin.js` | Login uses `.maybeSingle()` so unknown username returns 401 (not 500); same fix applied to `close-session` |
| BUG-012 | LOW | ✅ Fixed | `server/routes/attendance.js`, `server/routes/students.js`, `server/routes/programs.js` | Required-field guards added to POST/PUT routes; return HTTP 400 with descriptive message |
| BUG-013 | LOW | ✅ Fixed | `tailwind.config.js` | Content path corrected from `"./index.html"` → `"./src/index.html"` |
| BUG-014 | LOW | ✅ Noted | `src/components/AdminDashboard.jsx` | Added comment noting 500-row client-side aggregation limit and TODO for server-side GROUP BY |
| BUG-015 | LOW | ✅ Fixed | `.env.example` | Unused legacy variables commented out with `# UNUSED` markers; setup instructions added |
| BUG-016 | LOW | ✅ Fixed | `database/migrations/002_seed_data.sql` | Seed data updated to include `education_level`, `strand`; aligned with actual college/senior-high split |

## Build Verification

```
✓ 92 modules transformed.
../dist/index.html       0.49 kB │ gzip:  0.33 kB
../dist/assets/*.css    11.97 kB │ gzip:  3.48 kB
../dist/assets/*.js    262.16 kB │ gzip: 82.60 kB
✓ built in 2.18s
```

## New Dependency

`jsonwebtoken@9.0.2` added to `dependencies` in `package.json` (required for BUG-004 JWT auth).
