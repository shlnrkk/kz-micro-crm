import { json, clampInt } from "./_utils.js";

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);

    const channel = url.searchParams.get("channel")?.trim() || "";
    const direction = url.searchParams.get("direction")?.trim() || "";
    const result = url.searchParams.get("result")?.trim() || "";
    const leadId = url.searchParams.get("lead_id")?.trim() || "";
    const limit = clampInt(url.searchParams.get("limit"), 20, 1, 100);
    const offset = clampInt(url.searchParams.get("offset"), 0, 0, Infinity);

    const where = [];
    const params = [];

    if (channel) { where.push("channel = ?"); params.push(channel); }
    if (direction) { where.push("direction = ?"); params.push(direction); }
    if (result) { where.push("result = ?"); params.push(result); }
    if (leadId) { where.push("lead_id = ?"); params.push(leadId); }

    // Join with leads table to get company information
    let sql = `
      SELECT a.*, l.company_name, l.email_primary, l.phone_primary, l.category
      FROM activities a
      LEFT JOIN leads l ON l.id = a.lead_id
    `;
    
    if (where.length) sql += " WHERE " + where.join(" AND ");
    sql += " ORDER BY a.created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const res = await env.DB.prepare(sql).bind(...params).all();
    
    // Get total count for pagination
    const countSql = "SELECT COUNT(*) as count FROM activities" + (where.length ? " WHERE " + where.join(" AND ") : "");
    const countRes = await env.DB.prepare(countSql).bind(...where.map(() => params.shift())).all();

    return json({ 
      items: res.results ?? [], 
      count: countRes.results[0]?.count || 0,
      limit, 
      offset 
    });
  } catch (e) {
    console.error("Activities fetch error:", e);
    return json({ error: e.message }, 500);
  }
}