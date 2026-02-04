const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

const nowIso = () => new Date().toISOString();

export async function onRequestPost({ request, env }) {
  const url = new URL(request.url);
  const forcedCategory = (url.searchParams.get("category") || "").trim() || null;
  const forcedCity = (url.searchParams.get("city") || "").trim() || null;
  
  const payload = await request.json();
  if (!Array.isArray(payload)) return json({ error: "Expected array" }, 400);

  let inserted = 0;
  let updated = 0;

  for (const r of payload) {
    const company_name = (r.company_name || r.name || r.title || "").trim();
    
    const category = ((r.category || r.Category || r.cat || "").trim() || forcedCategory || "").trim();
    const city = ((r.city || r.City || "").trim() || forcedCity || "").trim();
    
    const source_url = (r.source_url || "").trim() || null;

    if (!company_name || !category || !city) continue;

    const ts = nowIso();

    let existing = null;
    if (source_url) {
      existing = await env.DB.prepare("SELECT id FROM leads WHERE source_url = ?")
        .bind(source_url).first();
    }

    if (existing?.id) {
      await env.DB.prepare(`
        UPDATE leads SET
          company_name = COALESCE(?, company_name),
          category = COALESCE(?, category),
          city = COALESCE(?, city),
          address = COALESCE(?, address),
          phone_primary = COALESCE(?, phone_primary),
          phones_all = COALESCE(?, phones_all),
          email_primary = COALESCE(?, email_primary),
          emails_all = COALESCE(?, emails_all),
          website_primary = COALESCE(?, website_primary),
          instagram = COALESCE(?, instagram),
          rating = COALESCE(?, rating),
          reviews_count = COALESCE(?, reviews_count),
          lead_score = COALESCE(?, lead_score),
          priority = COALESCE(?, priority),
          notes = COALESCE(?, notes),
          updated_at = ?
        WHERE id = ?
      `).bind(
        company_name, category, city,
        r.address ?? null,
        r.phone_primary ?? null,
        r.phones_all ?? null,
        r.email_primary ?? null,
        r.emails_all ?? null,
        r.website_primary ?? null,
        r.instagram ?? null,
        r.rating ?? null,
        r.reviews_count ?? null,
        r.lead_score ?? null,
        r.priority ?? null,
        r.notes ?? null,
        ts,
        existing.id
      ).run();
      updated++;
    } else {
      const id = crypto.randomUUID();
      await env.DB.prepare(`
        INSERT INTO leads (
          id, company_name, category, city, address,
          phone_primary, phones_all, email_primary, emails_all,
          website_primary, instagram, rating, reviews_count,
          lead_score, priority, status, next_followup_at, notes,
          source, source_url, source_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
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
      ).run();
      inserted++;
    }
  }

  return json({ ok: true, inserted, updated });
}