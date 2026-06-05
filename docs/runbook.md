# Runbook

## Redeploy Apps Script Calendar AutoSync

1. Open the Google Apps Script project behind `VITE_APPS_SCRIPT_URL`.
2. Replace the main script with `scripts/calendar-autosync.gs`.
3. Ensure `appsscript.json` matches `scripts/appsscript.json`.
4. Confirm Script Properties contain `SA_CLIENT_EMAIL` and `SA_PRIVATE_KEY`.
5. Deploy as Web App with access set to anyone who has the URL.
6. Run `setupTriggers` once, then run `syncCalendarToTasks` manually and check logs.
7. Verify `?mode=widget&user=tit` returns JSON with `stats.streak` > 0 and `tasks`, not plain text like `Calendar Proxy is Ready!`.
8. Deploy widget infra (one-time): `npm run deploy:widget-infra` — opens public read for `tasks`, `team_members`.
9. Copy `public/widget.js` into Scriptable (parameter `tit` or `tun`). Supports small / medium / large — add all sizes in the iOS widget picker.
10. Verify Firestore read: `team_members` doc for tit/tun should return `streak` > 0 (widget reads this directly).

## Push Apps Script With Clasp

1. Enable Apps Script API at `https://script.google.com/home/usersettings`.
2. Run `npx @google/clasp login`.
3. Copy Script ID from Apps Script → Project Settings.
4. Create `.clasp.json` at repo root with `{"scriptId":"<SCRIPT_ID>","rootDir":"scripts"}`.
5. Run `npx @google/clasp push -f`.
6. In Apps Script, use Deploy → Manage deployments → Edit → New version → Deploy to keep the same Web App URL.
