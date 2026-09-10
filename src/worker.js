import {PRODUCTION_ORIGIN, PRODUCTION_HOST, REDIRECT_HOST, isProductionRequest, productionRobots, previewRobots} from './deployment.mjs';

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
    const production = isProductionRequest(url, env);
    let response;
    if (!['GET', 'HEAD'].includes(request.method)) {
      response = new Response('Method not allowed', {status:405, headers:{Allow:'GET, HEAD'}});
    } else if (env.SITE_ENV === 'production' && [PRODUCTION_HOST, REDIRECT_HOST].includes(url.hostname) && !production) {
      // Construct against a fixed origin; never trust forwarded-host headers.
      const target = new URL(PRODUCTION_ORIGIN);
      target.pathname = url.pathname;
      target.search = url.search;
      response = Response.redirect(target.href, 308);
    } else if (url.pathname === '/api/health') {
      response = Response.json({status:'ok',service:'mapframework.org',environment:env.SITE_ENV || 'staging',canonicalHost:production}, {headers:{'Cache-Control':'no-store'}});
    } else if (url.pathname.startsWith('/api/')) {
      response = Response.json({error:'Not found'}, {status:404});
    } else if (url.pathname === '/robots.txt') {
      response = new Response(production ? productionRobots : previewRobots, {headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});
    } else {
      response = await env.ASSETS.fetch(request);
    }
    const headers = new Headers(response.headers);
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) headers.set(key, value);
    // Production content is indexable only on the exact HTTPS canonical host.
    // Preview hosts, APIs, and errors retain exclusion regardless of environment.
    if (!production || url.pathname.startsWith('/api/') || response.status >= 400) {
      headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    } else {
      headers.delete('X-Robots-Tag');
    }
    if (response.headers.get('content-type')?.includes('text/html')) {
      headers.set('Cache-Control', 'no-store');
    }
    return new Response(request.method === 'HEAD' ? null : response.body, { status: response.status, statusText: response.statusText, headers });
  }
};
