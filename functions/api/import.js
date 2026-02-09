import { json } from "./_utils.js";

const upsertSql = `
INSERT INTO leads (
  id, company_name, category, city, address,
  phone_primary, phones_all, email_primary, emails_all,
  website_primary, instagram, rating, reviews_count,
  lead_score, priority, status, next_followup_at, notes,
  source, source_url, source_id, created_at, updated_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(source_url) DO UPDATE SET
  company_name = excluded.company_name,
  category = excluded.category,
  city = excluded.city,
  address = excluded.address,
  phone_primary = excluded.phone_primary,
  phones_all = excluded.phones_all,
  email_primary = excluded.email_primary,
  emails_all = excluded.emails_all,
  website_primary = excluded.website_primary,
  instagram = excluded.instagram,
  rating = excluded.rating,
  reviews_count = excluded.reviews_count,
  lead_score = excluded.lead_score,
  priority = excluded.priority,
  status = excluded.status,
  next_followup_at = excluded.next_followup_at,
  notes = excluded.notes,
  source = excluded.source,
  source_id = excluded.source_id,
  updated_at = excluded.updated_at
`;

export async function onRequestPost({ request, env }) {
  const url = new URL(request.url);
  const forcedCategory = (url.searchParams.get("category") || "").trim() || null;
  const forcedCity = (url.searchParams.get("city") || "").trim() || null;

  const payload = await request.json();
  if (!Array.isArray(payload)) return json({ error: "Expected array" }, 400);

  let inserted = 0, updated = 0, skipped = 0;
  const batch = [];
  const ts = new Date().toISOString();

  for (const r of payload) {
    const company_name = (r.company_name || r.name || r.title || "").trim();
    const category = ((r.category || r.Category || r.cat || "").trim() || forcedCategory || "").trim();
    const city = ((r.city || r.City || "").trim() || forcedCity || "").trim();
    const source_url = (r.source_url || "").trim();

    if (!company_name || !category || !city || !source_url) { 
      skipped++; 
      continue; 
    }

    const id = crypto.randomUUID();

    batch.push(
      env.DB.prepare(upsertSql).bind(
        id, company_name, category, city,
        r.address ?? null,
        r.phone_primary ?? null,
        r.phones_all ?? null,
        r.email_primary ?? null,
        r.emails_all ?? null,
        r.website_primary ?? null,
        r.instagram ?? null,
        r.rating ?? null,
        r.reviews_count ?? null,
        r.lead_score ?? 0,
        r.priority ?? "C",
        r.status ?? "New",
        r.next_followup_at ?? null,
        r.notes ?? null,
        r.source ?? "2gis",
        source_url,
        r.source_id ?? null,
        ts, ts
      )
    );

    if (batch.length >= 100) {
      await env.DB.batch(batch.splice(0, batch.length));
    }
  }

  if (batch.length) await env.DB.batch(batch);
  return json({ ok: true, inserted, updated, skipped });
}