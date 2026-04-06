/**
 * cms-upload.js — Netlify Function
 * Handles image upload (POST) and serving (GET) via Netlify Blobs.
 *
 * POST /.netlify/functions/cms-upload
 *   body: { filename, type, data: base64string }
 *   header: Authorization: Bearer <CMS_TOKEN>
 *   returns: { url: '/.netlify/functions/cms-upload?key=...' }
 *
 * GET  /.netlify/functions/cms-upload?key=<key>
 *   returns: image binary with correct Content-Type
 */

const { getStore } = require('@netlify/blobs');

const CORS = {
  'Access-Control-Allow-Origin': '*',
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
    const store  = getStore({ name: 'cms-images', siteID, token });

    // ── GET: serve image ────────────────────────────────────────────────────
    if (event.httpMethod === 'GET') {
      const key = (event.queryStringParameters || {}).key;
      if (!key) return { statusCode: 400, headers: CORS, body: 'Missing key' };

      const record = await store.get(key, { type: 'json' });
      if (!record) return { statusCode: 404, headers: CORS, body: 'Image not found' };

      return {
        statusCode: 200,
        headers: {
          'Content-Type': record.type || 'image/jpeg',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
        body: record.data,
        isBase64Encoded: true,
      };
    }

    // ── POST: upload image ──────────────────────────────────────────────────
    if (event.httpMethod === 'POST') {
      const envToken = process.env.CMS_TOKEN;
      if (envToken) {
        const incoming = (event.headers['authorization'] || event.headers['Authorization'] || '')
          .replace(/^Bearer\s+/i, '');
        if (incoming !== envToken) {
          return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Unauthorized' }) };
        }
      }

      const body = JSON.parse(event.body || '{}');
      const { filename, type, data } = body;

      if (!data) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'No image data' }) };

      // Sanitise filename and create a unique key
      const safe = (filename || 'image').replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase();
      const key  = Date.now() + '-' + safe;

      await store.set(key, JSON.stringify({ type: type || 'image/jpeg', data }));

      return {
        statusCode: 200,
        headers: { ...CORS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: '/.netlify/functions/cms-upload?key=' + key }),
      };
    }

    return { statusCode: 405, headers: CORS, body: 'Method Not Allowed' };

  } catch (err) {
    console.error('[cms-upload]', err.message);
    return {
      statusCode: 503,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'storage_unavailable', message: err.message }),
    };
  }
};
