import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'rss-proxy-middleware',
      configureServer(server) {
        server.middlewares.use('/api/rss-proxy', async (req, res) => {
          try {
            const urlObj = new URL(req.url || '', 'http://localhost');
            const targetUrl = urlObj.searchParams.get('url');
            if (!targetUrl) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Missing target url parameter' }));
              return;
            }
            const parsedTarget = new URL(targetUrl);
            const host = parsedTarget.hostname.toLowerCase();
            const allowedHosts = [
              'news.google.com',
              '123telugu.com',
              'greatandhra.com',
              'filmyfocus.com',
              'onlykollywood.com',
              'idlebrain.com',
              'weworkremotely.com'
            ];
            const isAllowed = allowedHosts.some(h => host === h || host.endsWith('.' + h));
            if (!isAllowed || !['http:', 'https:'].includes(parsedTarget.protocol)) {
              res.statusCode = 403;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Target host is not permitted by proxy policy.' }));
              return;
            }

            const fetchRes = await fetch(targetUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*'
              }
            });
            const text = await fetchRes.text();
            res.statusCode = fetchRes.status;
            res.setHeader('Content-Type', 'application/xml; charset=utf-8');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(text);
          } catch (err: unknown) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            const errMsg = err instanceof Error ? err.message : String(err);
            res.end(JSON.stringify({ error: errMsg }));
          }
        });
      }
    }
  ],
  server: {
    port: 3000,
    host: true,
  },
})
