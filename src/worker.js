const SECURITY_HEADERS = {
  'Content-Security-Policy': "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()'
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let response;
    if (!['GET', 'HEAD'].includes(request.method)) {
      response = new Response('Method not allowed', {status:405, headers:{Allow:'GET, HEAD'}});
    } else if (url.pathname === '/api/health') {
      response = Response.json({status:'ok',service:'mapframework.org',environment:'staging',productionDomainConnected:false}, {headers:{'Cache-Control':'no-store'}});
    } else if (url.pathname.startsWith('/api/')) {
      response = Response.json({error:'Not found'}, {status:404});
    } else if (url.pathname === '/robots.txt') {
      response = new Response('User-agent: *\nDisallow: /\n', {headers:{'Content-Type':'text/plain; charset=utf-8'}});
    } else {
      response = await env.ASSETS.fetch(request);
    }
    const headers = new Headers(response.headers);
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) headers.set(key, value);
    // Staging only. Remove through a reviewed release PR at domain cutover.
    headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    if (response.headers.get('content-type')?.includes('text/html')) {
      headers.set('Cache-Control', 'no-store');
    }
    return new Response(request.method === 'HEAD' ? null : response.body, { status: response.status, statusText: response.statusText, headers });
  }
};
