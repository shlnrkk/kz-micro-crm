const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

const nowIso = () => new Date().toISOString();

function normEmail(s) {
  return String(s || "").trim().toLowerCase();
}

function clampInt(v, def, min, max) {
  const n = Number.parseInt(v ?? "", 10);
  if (Number.isNaN(n)) return def;
  return Math.max(min, Math.min(max, n));
}

export async function onRequestPost({ request, env }) {
  // --- simple auth ---
  const token = request.headers.get("x-ingest-token") || "";
  if (!env.INGEST_TOKEN || token !== env.INGEST_TOKEN) {
    return json({ error: "unauthorized" }, 401);
  }

  const body = await request.json().catch(() => ({}));

  const gmail_message_id = String(body.gmail_message_id || "").trim();
  const from_email = normEmail(body.from_email);
  const subject = String(body.subject || "").trim();
  const snippet = String(body.snippet || "").trim();
  const received_at = String(body.received_at || "").trim() || nowIso();

  if (!gmail_message_id) return json({ error: "gmail_message_id required" }, 400);
  if (!from_email) return json({ error: "from_email required" }, 400);

  // Match lead by email_primary (best-effort)
  let lead_id = null;
  const lead = await env.DB.prepare(
    `SELECT id FROM leads WHERE LOWER(TRIM(email_primary)) = ? LIMIT 1`
  ).bind(from_email).first();
  if (lead?.id) lead_id = lead.id;

  const id = crypto.randomUUID();
  const created_at = nowIso();

  // Insert inbound, dedupe by gmail_message_id
  try {
    await env.DB.prepare(`
      INSERT INTO inbound_messages
        (id, lead_id, from_email, subject, snippet, received_at, gmail_message_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, lead_id, from_email, subject, snippet, received_at, gmail_message_id, created_at).run();
  } catch (e) {
    // Unique constraint -> already ingested
    return json({ ok: true, deduped: true });
  }

  // Also write an activity (so CRM sees "inbound received")
  if (lead_id) {
    await env.DB.prepare(`
      INSERT INTO activities (id, lead_id, channel, direction, result, note, created_at)
      VALUES (?, ?, 'email', 'inbound', 'received', ?, ?)
    `).bind(
      crypto.randomUUID(),
      lead_id,
      `Subject: ${subject}\n${snippet}`,
      created_at
    ).run();

    // Optional: bump lead status
    await env.DB.prepare(`
      UPDATE leads SET status='Replied', updated_at=? WHERE id=?
    `).bind(created_at, lead_id).run();
  }

  return json({ ok: true, lead_id });
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const limit = clampInt(url.searchParams.get("limit"), 50, 1, 200);
  const offset = clampInt(url.searchParams.get("offset"), 0, 0, 1000000);

  const res = await env.DB.prepare(`
    SELECT
      i.id, i.lead_id, i.from_email, i.subject, i.snippet, i.received_at, i.gmail_message_id, i.created_at,
      l.company_name, l.city, l.category, l.phone_primary, l.email_primary, l.source_url
    FROM inbound_messages i
    LEFT JOIN leads l ON l.id = i.lead_id
    ORDER BY i.received_at DESC
    LIMIT ? OFFSET ?
  `).bind(limit, offset).all();

  return json({ items: res.results || [], limit, offset });
}