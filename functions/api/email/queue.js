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

    // Check if required tables exist and have data
    const activitiesCount = await env.DB.prepare("SELECT COUNT(*) as count FROM activities").all();
    const dncCount = await env.DB.prepare("SELECT COUNT(*) as count FROM do_not_contact").all();
    
    console.log("Activities count:", activitiesCount.results[0].count);
    console.log("DNC count:", dncCount.results[0].count);

    // Simple query that works with existing data
    const sql = `
      SELECT id, company_name, email_primary, phone_primary, status, priority, lead_score
      FROM leads 
      WHERE email_primary IS NOT NULL 
        AND TRIM(email_primary) <> ''
        AND status IN ('New','Qualified')
      ORDER BY priority ASC, lead_score DESC, updated_at DESC
      LIMIT ?
    `;

    const res = await env.DB.prepare(sql).bind(limit).all();
    return json({ items: res.results ?? [] });
  } catch (error) {
    console.error("Error in queue function:", error);
    return json({ error: error.message }, 500);
  }
}