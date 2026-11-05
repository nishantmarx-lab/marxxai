#!/usr/bin/env python3
"""Push Xperiyo leads for a listing to Kylas CRM.

Sent status is kept in the `crm_lead_sync` table (created automatically) in the
same Xperiyo database, so each lead is sent at most once. Failed sends are
retried on the next run (up to MAX_ATTEMPTS).

Env vars:
  DB_URL        jdbc:postgresql://host:5432/xperiyo?sslmode=require  (jdbc: prefix ok)
  DB_USER, DB_PASSWORD
  KYLAS_API_KEY api key for Kylas (sent as `api-key` header)
  KYLAS_OWNER_ID (default 73493)
  LISTING_SLUG  (default grid-games-corporate-team-building)
  DRY_RUN=1     print payloads without sending
"""
import json, os, re, sys, urllib.request, urllib.error
from datetime import date, datetime

import psycopg2
import psycopg2.extras

LISTING_SLUG = os.environ.get("LISTING_SLUG", "grid-games-corporate-team-building")
OWNER_ID = int(os.environ.get("KYLAS_OWNER_ID", "73493"))
API_KEY = os.environ["KYLAS_API_KEY"]
KYLAS_URL = "https://api.kylas.io/v1/leads/"
MAX_ATTEMPTS = int(os.environ.get("MAX_ATTEMPTS", "5"))
DRY_RUN = os.environ.get("DRY_RUN") == "1"


def connect():
    url = os.environ["DB_URL"].removeprefix("jdbc:")
    return psycopg2.connect(url, user=os.environ["DB_USER"], password=os.environ["DB_PASSWORD"])


def pick(lead, *names):
    """Return first non-empty column among candidate names."""
    for n in names:
        v = lead.get(n)
        if v not in (None, ""):
            return v
    return None


def build_payload(lead):
    full = pick(lead, "name", "full_name", "customer_name", "contact_name") or ""
    first = pick(lead, "first_name")
    last = pick(lead, "last_name")
    if not first:
        parts = str(full).strip().split(" ", 1)
        first = parts[0] or "Unknown"
        last = last or (parts[1] if len(parts) > 1 else ".")
    phone = re.sub(r"\D", "", str(pick(lead, "phone", "phone_number", "mobile", "whatsapp") or ""))
    if len(phone) > 10 and phone.startswith("91"):
        phone = phone[2:]
    email = pick(lead, "email", "email_address")
    event_date = pick(lead, "event_date", "preferred_date", "date")
    if isinstance(event_date, (date, datetime)):
        event_date = event_date.strftime("%d-%m-%Y")
    participants = pick(lead, "participants", "group_size", "guests", "pax", "headcount", "expected_participants")

    payload = {
        "ownerId": OWNER_ID,
        "firstName": str(first),
        "lastName": str(last or "."),
        "city": pick(lead, "city", "location"),
        "companyName": pick(lead, "company_name", "company", "organization"),
        "companyWebsite": None,
        "customFieldValues": {},
    }
    if phone:
        payload["phoneNumbers"] = [{"type": "MOBILE", "code": "IN", "primary": True, "value": phone}]
    if email:
        payload["emails"] = [{"type": "OFFICE", "value": str(email), "primary": True}]
    if participants is not None:
        payload["customFieldValues"]["cfExpectedParticipants"] = str(participants)
    if event_date:
        payload["customFieldValues"]["cfExpectedEventDates"] = str(event_date)
    return payload


def send(payload):
    req = urllib.request.Request(
        KYLAS_URL,
        data=json.dumps(payload).encode(),
        method="POST",
        headers={"Accept": "application/json", "Content-Type": "application/json", "api-key": API_KEY},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, r.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()


def main():
    conn = connect()
    conn.autocommit = True
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS crm_lead_sync (
            lead_id      TEXT PRIMARY KEY,
            listing_slug TEXT,
            status       TEXT NOT NULL,          -- 'sent' | 'failed'
            crm_lead_id  TEXT,
            attempts     INT  NOT NULL DEFAULT 0,
            last_error   TEXT,
            sent_at      TIMESTAMPTZ,
            updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
        )""")
    cur.execute("""
        SELECT l.* FROM leads l
        LEFT JOIN crm_lead_sync s ON s.lead_id = l.id::text
        WHERE l.listing_slug = %s
          AND (s.lead_id IS NULL OR (s.status = 'failed' AND s.attempts < %s))
        ORDER BY l.created_at""", (LISTING_SLUG, MAX_ATTEMPTS))
    leads = cur.fetchall()
    print(f"{len(leads)} lead(s) to send for {LISTING_SLUG}")

    ok = fail = 0
    for lead in leads:
        lid = str(lead["id"])
        payload = build_payload(lead)
        if DRY_RUN:
            print(lid, json.dumps(payload))
            continue
        code, body = send(payload)
        if 200 <= code < 300:
            try:
                crm_id = str(json.loads(body).get("id"))
            except Exception:
                crm_id = None
            status, err = "sent", None
            ok += 1
        else:
            crm_id, status, err = None, "failed", f"HTTP {code}: {body[:500]}"
            fail += 1
            print(f"lead {lid} failed: {err}", file=sys.stderr)
        cur.execute("""
            INSERT INTO crm_lead_sync (lead_id, listing_slug, status, crm_lead_id, attempts, last_error, sent_at)
            VALUES (%s, %s, %s, %s, 1, %s, CASE WHEN %s = 'sent' THEN now() END)
            ON CONFLICT (lead_id) DO UPDATE SET
              status = EXCLUDED.status, crm_lead_id = EXCLUDED.crm_lead_id,
              attempts = crm_lead_sync.attempts + 1, last_error = EXCLUDED.last_error,
              sent_at = EXCLUDED.sent_at, updated_at = now()""",
            (lid, LISTING_SLUG, status, crm_id, err, status))
    print(f"sent={ok} failed={fail}")
    conn.close()


if __name__ == "__main__":
    main()
