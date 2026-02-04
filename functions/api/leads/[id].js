const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

const nowIso = () => new Date().toISOString();

export async function onRequestGet({ params, env }) {
  const id = params.id;
  const lead = await env.DB.prepare("SELECT * FROM leads WHERE id = ?").bind(id).first();
  if (!lead) return json({ error: "Not found" }, 404);

  const acts = await env.DB.prepare(
    "SELECT * FROM activities WHERE lead_id = ? ORDER BY created_at DESC LIMIT 50"
  ).bind(id).all();

  return json({ lead, activities: acts.results ?? [] });
}

export async function onRequestPatch({ params, request, env }) {
  const id = params.id;
  const body = await request.json().catch(() => ({}));
  const ts = nowIso();

  const status = body.status ?? null;
  const priority = body.priority ?? null;
  const next_followup_at = body.next_followup_at ?? null;
  const notes = body.notes ?? null;

  await env.DB.prepare(`
    UPDATE leads SET
      status = COALESCE(?, status),
      priority = COALESCE(?, priority),
      next_followup_at = COALESCE(?, next_followup_at),
      notes = COALESCE(?, notes),
      updated_at = ?
    WHERE id = ?
  `).bind(status, priority, next_followup_at, notes, ts, id).run();

  const updated = await env.DB.prepare("SELECT * FROM leads WHERE id = ?").bind(id).first();
  return json({ ok: true, lead: updated });
}