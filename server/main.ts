Deno.serve((_) => {
  return new Response("Hello from Philopoiesis!", {
    headers: { "Content-Type": "text/plain" },
  });
});
