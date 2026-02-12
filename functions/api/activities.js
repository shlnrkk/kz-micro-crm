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
    const filterParams = [];

    if (channel) { where.push("a.channel = ?"); filterParams.push(channel); }
    if (direction) { where.push("a.direction = ?"); filterParams.push(direction); }
    if (result) { where.push("a.result = ?"); filterParams.push(result); }
    if (leadId) { where.push("a.lead_id = ?"); filterParams.push(leadId); }

    const whereClause = where.length ? " WHERE " + where.join(" AND ") : "";

    // Join with leads table to get company information
    const sql = `
      SELECT a.*, l.company_name, l.email_primary, l.phone_primary, l.category
      FROM activities a
      LEFT JOIN leads l ON l.id = a.lead_id
      ${whereClause}
      ORDER BY a.created_at DESC LIMIT ? OFFSET ?
    `;

    const res = await env.DB.prepare(sql).bind(...filterParams, limit, offset).all();

    // Get total count for pagination (use separate copy of params)
    const countSql = `SELECT COUNT(*) as count FROM activities a ${whereClause}`;
    const countRes = await env.DB.prepare(countSql).bind(...filterParams).all();

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