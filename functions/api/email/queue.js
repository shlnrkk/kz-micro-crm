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
    // Simple test query first
    const testRes = await env.DB.prepare("SELECT COUNT(*) as count FROM leads").all();
    console.log("Leads count:", testRes);
    
    return json({ message: "Function working", leadsCount: testRes.results[0].count });
  } catch (error) {
    console.error("Error:", error);
    return json({ error: error.message }, 500);
  }
}