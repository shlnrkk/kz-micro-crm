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
  try {
    const url = new URL(request.url);
    const limit = clampInt(url.searchParams.get("limit"), 20, 1, 200);

    // Query that ensures each business gets only one email maximum
    // This checks that the lead has never had an outbound email activity
    const sql = `
      SELECT l.*
      FROM leads l
      WHERE email_primary IS NOT NULL 
        AND TRIM(email_primary) <> ''
        AND l.status IN ('New','Qualified')
        AND NOT EXISTS (
          SELECT 1 FROM activities a
          WHERE a.lead_id = l.id
            AND a.channel = 'email'
            AND a.direction = 'outbound'
        )
      ORDER BY l.priority ASC, l.lead_score DESC, l.updated_at DESC
      LIMIT ?
    `;

    const res = await env.DB.prepare(sql).bind(limit).all();
    return json({ items: res.results ?? [] });
  } catch (error) {
    console.error("Error in queue function:", error);
    return json({ error: error.message }, 500);
  }
}