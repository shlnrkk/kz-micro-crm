const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

export async function onRequestGet({ env }) {
  const totals = await env.DB.prepare(`
    SELECT
      SUM(CASE WHEN channel='email' AND direction='outbound' AND result='sent' THEN 1 ELSE 0 END) AS sent,
      SUM(CASE WHEN channel='email' AND direction='outbound' AND result='failed' THEN 1 ELSE 0 END) AS failed,
      SUM(CASE WHEN channel='email' AND direction='inbound' AND result='received' THEN 1 ELSE 0 END) AS inbound
    FROM activities
  `).first();

  const daily = await env.DB.prepare(`
    SELECT
      substr(created_at, 1, 10) as day,
      SUM(CASE WHEN channel='email' AND direction='outbound' AND result='sent' THEN 1 ELSE 0 END) AS sent,
      SUM(CASE WHEN channel='email' AND direction='outbound' AND result='failed' THEN 1 ELSE 0 END) AS failed,
      SUM(CASE WHEN channel='email' AND direction='inbound' AND result='received' THEN 1 ELSE 0 END) AS inbound
    FROM activities
    WHERE created_at >= datetime('now','-14 day')
    GROUP BY day
    ORDER BY day DESC
  `).all();

  return json({
    totals: totals || { sent: 0, failed: 0, inbound: 0 },
    daily: daily.results || [],
  });
}