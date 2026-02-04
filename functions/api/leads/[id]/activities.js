const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

const nowIso = () => new Date().toISOString();

export async function onRequestPost({ params, request, env }) {
  const lead_id = params.id;
  const body = await request.json().catch(() => ({}));

  const channel = (body.channel || "other").trim();
  const direction = (body.direction || "outbound").trim();
  const result = (body.result || "").trim() || null;
  const note = (body.note || "").trim() || null;

  const id = crypto.randomUUID();
  const ts = nowIso();

  await env.DB.prepare(`
    INSERT INTO activities (id, lead_id, channel, direction, result, note, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(id, lead_id, channel, direction, result, note, ts).run();

  return json({ ok: true, id });
}