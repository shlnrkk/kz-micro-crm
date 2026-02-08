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
    // Test if activities table exists
    const activitiesTest = await env.DB.prepare("SELECT COUNT(*) as count FROM activities").all();
    console.log("Activities count:", activitiesTest);
    
    // Test if do_not_contact table exists
    const dncTest = await env.DB.prepare("SELECT COUNT(*) as count FROM do_not_contact").all();
    console.log("DNC count:", dncTest);
    
    return json({ 
      message: "Tables exist", 
      activitiesCount: activitiesTest.results[0].count,
      dncCount: dncTest.results[0].count
    });
  } catch (error) {
    console.error("Error:", error);
    return json({ error: error.message }, 500);
  }
}