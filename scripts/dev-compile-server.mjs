import { createServer } from 'node:http';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

import { compileDocument } from './compile/tex-engine.mjs';

const PORT = Number(process.env.COMPILE_PORT) || 5174;
const LATEX_DIR = join(process.cwd(), 'latex');
const ID_RE = /^[a-zA-Z0-9_-]+$/;
const DOC_PATH_RE = /^\/api\/documents\/([^/]+)$/;

/**
 * @param {string} id
 */
function texPathForId(id) {
  if (!ID_RE.test(id)) {
    throw new Error(`Invalid document id: ${id}`);
  }
  return join(LATEX_DIR, `${id}.tex`);
}

/**
 * @param {import('node:http').ServerResponse} res
 * @param {number} status
 * @param {unknown} body
 */
function sendJson(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
  });
  res.end(JSON.stringify(body));
}

/**
 * @param {import('node:http').IncomingMessage} req
 * @returns {Promise<unknown>}
 */
function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

/**
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 */
async function handleCompile(req, res) {
  try {
    const body = await readJsonBody(req);
    const { source, filename, id } = body;
    if (typeof source !== 'string' || typeof filename !== 'string') {
      sendJson(res, 400, { error: 'source and filename required' });
      return;
    }
    const result = compileDocument({ source, filename, id });
    sendJson(res, 200, result);
  } catch (e) {
    sendJson(res, 500, { error: e.message });
  }
}

/**
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 * @param {string} id
 */
async function handleDocumentRoute(req, res, id) {
  try {
    const texPath = texPathForId(id);
    if (req.method === 'GET') {
      if (!existsSync(texPath)) {
        sendJson(res, 404, { error: 'Document not found' });
        return;
      }
      sendJson(res, 200, { id, source: readFileSync(texPath, 'utf8') });
      return;
    }
    if (req.method === 'PUT') {
      const body = await readJsonBody(req);
      if (typeof body.source !== 'string') {
        sendJson(res, 400, { error: 'source required' });
        return;
      }
      writeFileSync(texPath, body.source, 'utf8');
      sendJson(res, 200, { ok: true, id });
      return;
    }
    sendJson(res, 405, { error: 'Method not allowed' });
  } catch (e) {
    sendJson(res, 400, { error: e.message });
  }
}

/**
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 */
async function handleRequest(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);

  if (req.method === 'POST' && url.pathname === '/api/compile') {
    await handleCompile(req, res);
    return;
  }

  const docMatch = DOC_PATH_RE.exec(url.pathname);
  if (docMatch) {
    await handleDocumentRoute(req, res, decodeURIComponent(docMatch[1]));
    return;
  }

  sendJson(res, 404, { error: 'Not found' });
}

createServer(handleRequest).listen(PORT, '127.0.0.1', () => {
  console.log(`Compile server listening on http://127.0.0.1:${PORT}`);
});
