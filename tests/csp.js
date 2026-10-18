// The Content-Security-Policy <meta> at the top of index.html names every
// inline <script> by a SHA-256 fingerprint of its exact text, instead of
// allowing any inline script ('unsafe-inline'). That is what stops an injected
// script from running even if one ever got past escapeHtml.
//
// The catch: change ONE character inside an inline <script> - and nearly all
// of the till is inline script - and the browser refuses to run it. The till
// would open as a dead page at a stall. This test is the guard. It
// fingerprints every inline script and fails if the policy does not list
// exactly that set, plus a few checks that the policy has not been weakened.
//
//   node tests/csp.js index.html            check
//   node tests/csp.js index.html --write    rewrite script-src to match
//
// Run it (and --write when it says so) after ANY edit inside a <script>.
const fs = require('fs');
const crypto = require('crypto');

const FILE = process.argv[2] || 'index.html';
const WRITE = process.argv.includes('--write');
let failed = 0;
function check(name, ok, detail) {
  console.log((ok ? 'PASS  ' : 'FAIL  ') + name + (ok || !detail ? '' : '\n      ' + detail));
  if (!ok) failed++;
}

// What the browser fingerprints: the text between <script> and </script>,
// exactly. Line endings are made LF because that is what the repo stores and
// Pages serves (.gitattributes), whatever this checkout has on disk.
const raw = fs.readFileSync(FILE, 'utf8');
const html = raw.replace(/\r\n/g, '\n');
const INLINE = /<script(?![^>]*\bsrc\s*=)[^>]*>([\s\S]*?)<\/script>/gi;
const wanted = [];
for (const m of html.matchAll(INLINE)) {
  const h = "'sha256-" + crypto.createHash('sha256').update(m[1], 'utf8').digest('base64') + "'";
  if (!wanted.includes(h)) wanted.push(h);
}

const META = /<meta http-equiv="Content-Security-Policy" content="([^"]*)">/;
const meta = html.match(META);
check('index.html has a Content-Security-Policy <meta>', !!meta);
if (!meta) process.exit(1);
check('the policy comes before the first <script>',
  html.indexOf(meta[0]) < html.search(/<script/i));

const policy = meta[1];
const directive = (name) => ((policy.match(new RegExp('(?:^|;)\\s*' + name + '\\s([^;]*)')) || [, ''])[1])
  .trim().split(/\s+/).filter(Boolean);
const scriptSrc = directive('script-src');
const listed = scriptSrc.filter((t) => t.startsWith("'sha256-"));

check("script-src does not allow every inline script ('unsafe-inline')", !scriptSrc.includes("'unsafe-inline'"));
check("script-src does not allow eval ('unsafe-eval')", !scriptSrc.includes("'unsafe-eval'"));
check('script-src still allows the Firebase SDK', scriptSrc.includes('https://www.gstatic.com'));
check("object-src is 'none'", directive('object-src').join(' ') === "'none'");
check("base-uri is 'none'", directive('base-uri').join(' ') === "'none'");
check('no inline event-handler attributes (onclick="" etc.) in the markup',
  !/<[a-z][^>]*\son[a-z]+\s*=\s*["']/i.test(html.replace(INLINE, '')));

const missing = wanted.filter((h) => !listed.includes(h));
const stale = listed.filter((h) => !wanted.includes(h));

if ((missing.length || stale.length) && WRITE) {
  const fresh = ['script-src', "'self'", ...wanted, 'https://www.gstatic.com'].join(' ');
  const out = raw.replace(META, (all, p) =>
    all.replace(p, p.replace(/script-src[^;]*/, fresh)));
  fs.writeFileSync(FILE, out);
  console.log('WROTE script-src: ' + wanted.length + ' fingerprint(s). Run this again to check, then commit.');
  process.exit(0);
}

check('every inline script is listed in script-src', missing.length === 0,
  missing.length + ' not listed. An inline script changed. Run:  node tests/csp.js index.html --write');
check('script-src lists no fingerprint that no script uses any more', stale.length === 0,
  stale.join('\n      ') + '\n      Run:  node tests/csp.js index.html --write');

console.log('\n' + wanted.length + ' inline script(s). ' + (failed ? failed + ' failed' : 'all passed'));
process.exit(failed ? 1 : 0);
