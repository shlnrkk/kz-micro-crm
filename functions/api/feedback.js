import { json, clampInt } from "./_utils.js";

// Feedback API endpoint for tracking email replies and responses
export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const limit = clampInt(url.searchParams.get("limit"), 20, 1, 100);
    const offset = parseInt(url.searchParams.get("offset") || "0");
    const channel = url.searchParams.get("channel") || "email";
    // Only get inbound messages (replies from recipients)
    const direction = "inbound"; 

    // Query to get inbound email activities (feedback/replies from recipients)
    const sql = `
      SELECT a.*, l.company_name, l.email_primary, l.phone_primary, l.category
      FROM activities a
      LEFT JOIN leads l ON l.id = a.lead_id
      WHERE a.channel = ?
        AND a.direction = ?
        AND a.created_at IS NOT NULL
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const res = await env.DB.prepare(sql)
      .bind(channel, direction, limit, offset)
      .all();

    // Also get counts
    const countRes = await env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM activities
      WHERE channel = ? AND direction = ?
    `).bind(channel, direction).all();

    return json({ 
      items: res.results ?? [],
      count: countRes.results[0]?.count || 0,
      limit,
      offset
    });
  } catch (error) {
    console.error("Error in feedback function:", error);
    return json({ error: error.message }, 500);
  }
}