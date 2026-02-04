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

  const city = url.searchParams.get("city");
  const category = url.searchParams.get("category");
  const status = url.searchParams.get("status");
  const priority = url.searchParams.get("priority");
  const q = url.searchParams.get("q");

  const limit = clampInt(url.searchParams.get("limit"), 50, 1, 200);
  const offset = clampInt(url.searchParams.get("offset"), 0, 0, 1000000);

  const where = [];
  const params = [];

  if (city) { where.push("city = ?"); params.push(city); }
  if (category) { where.push("category = ?"); params.push(category); }
  if (status) { where.push("status = ?"); params.push(status); }
  if (priority) { where.push("priority = ?"); params.push(priority); }
  if (q) {
    where.push("(company_name LIKE ? OR phone_primary LIKE ? OR website_primary LIKE ?)");
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }

  let sql = "SELECT * FROM leads";
  if (where.length) sql += " WHERE " + where.join(" AND ");
  sql += " ORDER BY priority ASC, lead_score DESC, updated_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);

  const res = await env.DB.prepare(sql).bind(...params).all();
  return json({ items: res.results ?? [], limit, offset });
}