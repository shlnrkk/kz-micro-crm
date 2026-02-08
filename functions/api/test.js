export async function onRequest() {
  return new Response(JSON.stringify({ message: "Functions are working!" }), {
    headers: { "content-type": "application/json" },
  });
}