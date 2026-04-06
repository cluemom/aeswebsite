/**
 * cms-api.js — Netlify Function
 * Handles read/write of site content via Netlify Blobs.
 *
 * GET  /.netlify/functions/cms-api?key=content   → return stored content
 * POST /.netlify/functions/cms-api               → save content
 *   body: { key: 'content'|'slots', data: {...} }
 *   header: Authorization: Bearer <CMS_TOKEN>
 */

const { getStore } = require('@netlify/blobs');

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }

  try {
    const siteID = process.env.NETLIFY_SITE_ID || process.env.SITE_ID;
    const token  = process.env.NETLIFY_TOKEN;
    const store  = getStore({ name: 'cms', siteID, token });

    // ── GET ────────────────────────────────────────────────────────────────
    if (event.httpMethod === 'GET') {
      const key  = (event.queryStringParameters || {}).key || 'content';
      const data = await store.get(key, { type: 'json' });
      return {
        statusCode: 200,
        headers: { ...CORS, 'Content-Type': 'application/json' },
        body: JSON.stringify(data || null),
      };
    }

    // ── POST ───────────────────────────────────────────────────────────────
    if (event.httpMethod === 'POST') {
      const envToken = process.env.CMS_TOKEN;
      if (envToken) {
        const authHeader = event.headers['authorization'] || event.headers['Authorization'] || '';
        const incoming   = authHeader.replace(/^Bearer\s+/i, '');
        if (incoming !== envToken) {
          return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Unauthorized' }) };
        }
      }

      const body = JSON.parse(event.body || '{}');
      const key  = body.key || 'content';
      await store.set(key, JSON.stringify(body.data));

      return {
        statusCode: 200,
        headers: { ...CORS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: true }),
      };
    }

    return { statusCode: 405, headers: CORS, body: 'Method Not Allowed' };

  } catch (err) {
    console.error('[cms-api]', err.message);
    return {
      statusCode: 503,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'storage_unavailable', message: err.message }),
    };
  }
};
