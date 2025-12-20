# Operations Runbook

## Monitoring and Error Logging
- Use a single APM tool (Sentry or LogRocket) for client and server errors.
- Route alerts to a shared ops channel (Slack or email).
- Track key metrics: error rate, latency, 5xx, and DB timeouts.

## Backup and Recovery
- Nightly DB backups with a 7-day retention window.
- Weekly full backup stored offsite.
- Recovery drill at least once per quarter.

## Incident Response
- Triage within 30 minutes for P0 issues.
- Roll back via last known good release tag.
- Postmortem within 72 hours.
