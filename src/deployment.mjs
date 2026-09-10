// Keep metadata and host policy tied to the owner-approved public origin.
export const PRODUCTION_ORIGIN = 'https://mapframework.org';
export const PRODUCTION_HOST = 'mapframework.org';
export const REDIRECT_HOST = 'www.mapframework.org';
export const productionRobots = `User-agent: *\nAllow: /\n\nSitemap: ${PRODUCTION_ORIGIN}/sitemap.xml\n`;
export const previewRobots = 'User-agent: *\nDisallow: /\n';

export function isProductionRequest(url, env) {
  return env.SITE_ENV === 'production' && url.origin === PRODUCTION_ORIGIN;
}
