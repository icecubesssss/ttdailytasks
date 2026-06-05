# Runbook

## Redeploy Apps Script Calendar AutoSync

1. Open the Google Apps Script project behind `VITE_APPS_SCRIPT_URL`.
2. Replace the main script with `scripts/calendar-autosync.gs`.
3. Ensure `appsscript.json` matches `scripts/appsscript.json`.
4. Confirm Script Properties contain `SA_CLIENT_EMAIL` and `SA_PRIVATE_KEY`.
5. Deploy as Web App with access set to anyone who has the URL.
6. Run `setupTriggers` once, then run `syncCalendarToTasks` manually and check logs.
7. Verify `?mode=widget&user=tit` returns JSON with `stats` and `tasks`, not plain text.
