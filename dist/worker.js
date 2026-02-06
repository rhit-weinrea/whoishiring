addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  // Proxy to your FastAPI backend
  const backendUrl = 'https://whoishiring.abby-weinreb.workers.dev'; // Or your deployed backend URL
  const url = new URL(request.url);
  url.hostname = backendUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
  url.port = '8000'; // Set port if needed

  // Forward request to backend
  const response = await fetch(`${backendUrl}${url.pathname}${url.search}`, {
    method: request.method,
    headers: request.headers,
    body: request.method !== 'GET' && request.method !== 'HEAD' ? await request.text() : undefined,
  });

  return response;
}