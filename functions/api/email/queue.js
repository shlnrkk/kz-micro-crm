const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

function clampInt(v, def, min, max) {
  const n = Number.parseInt(v ?? "", 10);
  if (Number.isNaN(n)) return def;
  return Math.max(min, Math.min(max, n));
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const limit = clampInt(url.searchParams.get("limit"), 20, 1, 200);

  const sql = `
    SELECT l.*
    FROM leads l
    LEFT JOIN activities a
      ON a.lead_id = l.id
     AND a.channel = 'email'
     AND a.direction = 'outbound'
    WHERE l.email_primary IS NOT NULL
      AND TRIM(l.email_primary) <> ''
      AND a.id IS NULL
      AND l.status IN ('New','Qualified')
      AND NOT EXISTS (
        SELECT 1 FROM do_not_contact d
        WHERE (d.email IS NOT NULL AND d.email = l.email_primary)
           OR (d.phone IS NOT NULL AND d.phone = l.phone_primary)
      )
    ORDER BY l.priority ASC, l.lead_score DESC, l.updated_at DESC
    LIMIT ?
  `;

  const res = await env.DB.prepare(sql).bind(limit).all();
  return json({ items: res.results ?? [] });
}