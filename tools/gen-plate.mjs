#!/usr/bin/env node
// Generate still plates with the OpenAI Images API (gpt-image-2), with a budget guard and a cost log.
//   node gen-plate.mjs <jobs.json> [job-id ...]     (no ids = every job whose output doesn't exist yet)
// jobs.json: [{ id, output (relative to plates/), size "1920x1088", quality "medium"|"high", prompt, refs?: [paths] }]
// Key: the OPENAI_API_KEY environment variable (never printed or written).
// Log: plates/usage.jsonl (one "request" line before each call, one "result" line after), cost from returned usage.
import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import path from 'node:path';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const PLATES = path.resolve(HERE, '../plates');
const LOG = path.join(PLATES, 'usage.jsonl');
const BUDGET = +(process.env.PLATE_BUDGET_USD || 4.0);   // USD cap for the whole run
const RATES = { text_input: 5, image_input: 8, image_output: 30 };   // USD per 1M tokens, gpt-image-2 (developers.openai.com/api/docs/pricing, as recorded 2026-10-19)
const RESERVE = { low: 0.15, medium: 0.4, high: 0.9 };

const key = (process.env.OPENAI_API_KEY || '').trim();
if (!key) { console.error('set OPENAI_API_KEY'); process.exit(1); }
const rows = () => (existsSync(LOG) ? readFileSync(LOG, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse) : []);
const spent = () => { const r = rows(); const done = new Set(r.filter(x => x.event === 'result').map(x => x.call_id));
  return r.filter(x => x.event === 'result').reduce((s, x) => s + (x.cost_usd || 0), 0) + r.filter(x => x.event === 'request' && !done.has(x.call_id)).reduce((s, x) => s + x.reserved_usd, 0); };
const log = o => appendFileSync(LOG, JSON.stringify(o) + '\n');
const cost = u => { const d = u?.input_tokens_details || {}; if (d.image_tokens == null || d.text_tokens == null || u.output_tokens == null) return null;
  return (d.text_tokens * RATES.text_input + d.image_tokens * RATES.image_input + u.output_tokens * RATES.image_output) / 1e6; };

const [jobsFile, ...ids] = process.argv.slice(2);
const jobs = JSON.parse(readFileSync(path.resolve(jobsFile), 'utf8')).filter(j => (ids.length ? ids.includes(j.id) : !existsSync(path.join(PLATES, j.output))));
for (const job of jobs) {
  const out = path.join(PLATES, job.output);
  const q = job.quality || 'medium', reserve = RESERVE[q];
  if (spent() + reserve > BUDGET) { console.error(`BUDGET: ${spent().toFixed(3)} + ${reserve} > ${BUDGET}; stopping before ${job.id}`); process.exit(3); }
  const call_id = randomUUID(), endpoint = job.refs?.length ? '/v1/images/edits' : '/v1/images/generations';
  const base = { call_id, job_id: job.id, model: 'gpt-image-2', size: job.size, quality: q, endpoint, output: job.output, refs: job.refs || [], timestamp: new Date().toISOString() };
  log({ ...base, event: 'request', reserved_usd: reserve, prompt_sha256: createHash('sha256').update(job.prompt).digest('hex') });
  console.log(`REQUEST ${job.id} ${job.size} ${q}`);
  const t0 = Date.now();
  let res, data;
  try {
    if (job.refs?.length) {
      const fd = new FormData();
      for (const [k, v] of Object.entries({ model: 'gpt-image-2', prompt: job.prompt, n: '1', size: job.size, quality: q, output_format: 'png' })) fd.append(k, v);
      for (const r of job.refs) fd.append('image[]', new Blob([readFileSync(path.resolve(PLATES, r))], { type: 'image/png' }), path.basename(r));
      res = await fetch('https://api.openai.com' + endpoint, { method: 'POST', headers: { Authorization: 'Bearer ' + key }, body: fd });
    } else {
      res = await fetch('https://api.openai.com' + endpoint, { method: 'POST', headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gpt-image-2', prompt: job.prompt, n: 1, size: job.size, quality: q, output_format: 'png' }) });
    }
    data = await res.json();
  } catch (e) { console.error('Uncertain API outcome; reservation kept in the log, no retry.'); process.exit(2); }
  if (!res.ok) {
    const msg = String(data?.error?.message || 'API error').split(key).join('[REDACTED]');
    log({ ...base, event: 'result', status: res.status, cost_usd: 0, error: msg });
    console.error(`FAILED ${job.id} ${res.status}: ${msg}`); continue;
  }
  const raw = Buffer.from(data.data[0].b64_json, 'base64');
  mkdirSync(path.dirname(out), { recursive: true }); writeFileSync(out, raw);
  const c = cost(data.usage);
  log({ ...base, event: 'result', status: res.status, usage: data.usage, cost_usd: c ?? reserve, cost_exact: c != null, rates_usd_per_million: RATES,
    elapsed_s: +((Date.now() - t0) / 1000).toFixed(1), request_id: res.headers.get('x-request-id'), output_sha256: createHash('sha256').update(raw).digest('hex') });
  console.log(`SAVED ${job.output} $${(c ?? reserve).toFixed(4)} · total $${spent().toFixed(4)}`);
}
console.log(`spent so far: $${spent().toFixed(4)} of $${BUDGET}`);
