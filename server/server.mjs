// Eracker server: serves the built app (dist/) and a read-only snapshot of an Actual budget.
// Start with `npm start` from the repository root (reads .env).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import * as api from '@actual-app/api';

const {
  ACTUAL_SERVER_URL, ACTUAL_PASSWORD, ACTUAL_SYNC_ID,
  ERACKER_HOST = '127.0.0.1',
  ERACKER_PORT = '5007',
} = process.env;

for (const [name, value] of Object.entries({ ACTUAL_SERVER_URL, ACTUAL_PASSWORD, ACTUAL_SYNC_ID })) {
  if (!value) {
    console.error(`Missing ${name}. Copy .env.example to .env and fill it in.`);
    process.exit(1);
  }
}

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const DIST = path.join(ROOT, 'dist');
const CACHE = path.join(ROOT, '.cache');
const SYNC_INTERVAL_MS = 60_000;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

// ---------- budget snapshot ----------

async function readBudget() {
  const accounts = await api.getAccounts();
  const groups = await api.getCategoryGroups();
  const payees = await api.getPayees();

  const accountName = Object.fromEntries(accounts.map(a => [a.id, a.name]));
  const categories = groups.flatMap(g => (g.categories ?? []).map(c => ({
    id: c.id, name: c.name, group: g.name, isIncome: !!c.is_income,
  })));
  const categoryName = Object.fromEntries(categories.map(c => [c.id, c.name]));
  const payeeById = Object.fromEntries(payees.map(p => [p.id, p]));

  const txns = [];
  for (const a of accounts) {
    for (const t of await api.getTransactions(a.id, '1900-01-01', '2999-12-31')) {
      // split transactions are listed as their parts
      for (const part of t.subtransactions?.length ? t.subtransactions : [t]) {
        const payee = payeeById[part.payee ?? t.payee];
        const transferAccount = payee?.transfer_acct ?? null;
        txns.push({
          id: part.id,
          date: t.date,
          account: a.id,
          payee: transferAccount ? `Transfer: ${accountName[transferAccount] ?? ''}` : payee?.name ?? '',
          notes: part.notes ?? t.notes ?? '',
          category: categoryName[part.category] ?? '',
          amount: part.amount,
          cleared: !!t.cleared,
          transferAccount,
        });
      }
    }
  }

  return {
    accounts: accounts.map(a => ({ id: a.id, name: a.name, off: !!a.offbudget, closed: !!a.closed })),
    categories,
    txns,
    updatedAt: new Date().toISOString(),
  };
}

const encode = body => ({ body, gzip: zlib.gzipSync(body) });

let snapshot = null; // { body, gzip } of the JSON
let syncedAt = 0;
let syncing = null;

async function getSnapshot(force) {
  if (!force && Date.now() - syncedAt < SYNC_INTERVAL_MS) return snapshot;
  syncing ??= (async () => {
    try {
      await api.sync();
      snapshot = encode(Buffer.from(JSON.stringify(await readBudget())));
      syncedAt = Date.now();
    } catch (err) {
      console.error('Sync with Actual failed, serving the last snapshot:', err.message);
    } finally {
      syncing = null;
    }
  })();
  await syncing;
  return snapshot;
}

// ---------- static files (small enough to keep compressed in memory) ----------

const files = new Map();
if (fs.existsSync(DIST)) {
  for (const file of fs.readdirSync(DIST, { recursive: true })) {
    const full = path.join(DIST, file);
    if (!fs.statSync(full).isFile()) continue;
    files.set(`/${file.split(path.sep).join('/')}`, {
      ...encode(fs.readFileSync(full)),
      type: TYPES[path.extname(file)] ?? 'application/octet-stream',
      // hashed assets never change; index.html must always be revalidated
      cache: file === 'index.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
    });
  }
}
if (!files.has('/index.html')) {
  console.error('dist/ is missing. Run `npm run build` first.');
  process.exit(1);
}

function send(req, res, { body, gzip }, headers) {
  const useGzip = /\bgzip\b/.test(req.headers['accept-encoding'] ?? '');
  res.writeHead(200, { ...headers, Vary: 'Accept-Encoding', ...(useGzip && { 'Content-Encoding': 'gzip' }) });
  res.end(useGzip ? gzip : body);
}

const server = http.createServer(async (req, res) => {
  if (req.method !== 'GET') return res.writeHead(405).end();
  const url = new URL(req.url, 'http://localhost');

  if (url.pathname === '/api/data') {
    const data = await getSnapshot(url.searchParams.has('refresh'));
    return send(req, res, data, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  }

  // anything else is a file from dist/, or the app itself
  const file = files.get(url.pathname) ?? files.get('/index.html');
  send(req, res, file, { 'Content-Type': file.type, 'Cache-Control': file.cache });
});

// ---------- start ----------

fs.rmSync(CACHE, { recursive: true, force: true });
fs.mkdirSync(CACHE, { recursive: true });
await api.init({ dataDir: CACHE, serverURL: ACTUAL_SERVER_URL, password: ACTUAL_PASSWORD });
await api.downloadBudget(ACTUAL_SYNC_ID);
snapshot = encode(Buffer.from(JSON.stringify(await readBudget())));
syncedAt = Date.now();

server.listen(Number(ERACKER_PORT), ERACKER_HOST, () => {
  console.log(`Eracker running on http://${ERACKER_HOST}:${ERACKER_PORT}`);
});

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, async () => {
    server.close();
    await api.shutdown();
    process.exit(0);
  });
}
