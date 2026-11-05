# Xperiyo → Kylas lead sync

Sends leads from `leads` (filtered by `listing_slug`, default `grid-games-corporate-team-building`)
to Kylas CRM. Send status is stored in the `crm_lead_sync` table (auto-created), so each lead
is sent once; failures retry on later runs up to 5 times.

Check status: `SELECT status, count(*) FROM crm_lead_sync GROUP BY 1;`

## Schedule (every 10 min)
GitHub Actions: `.github/workflows/crm-lead-sync.yml`. Add repo secrets
`DB_URL`, `DB_USER`, `DB_PASSWORD`, `KYLAS_API_KEY`.
(GitHub cron is best-effort and can lag; the RDS security group must allow GitHub runner IPs.)

Or any server with crontab:
```
*/10 * * * * cd /path/scripts/crm-sync && DB_URL=... DB_USER=... DB_PASSWORD=... KYLAS_API_KEY=... python3 sync_leads_to_kylas.py >> sync.log 2>&1
```
Test first with `DRY_RUN=1`.
