addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  // Example: return a simple response
  return new Response('Hello from Cloudflare Worker!', { status: 200 });
}