// Runs the REAL tax-year and trading-allowance rules out of index.html (v1.66.0).
//
//   node tests/trading-allowance.js index.html
//
// WHAT THIS PROTECTS. The report tells Kay how much of the £1,000 trading
// allowance she has used, and, once over it, when she must register with
// HMRC. So the tax year must be right on its edges (5 April is the old year,
// 6 April the new), the arithmetic right to the penny, and "over" must mean
// over, not "at".
const fs = require('fs');
const vm = require('vm');

const HTML = fs.readFileSync(process.argv[2], 'utf8');
const START = '  // ---- trading allowance ----';
const END = '  // ---- end trading allowance ----';
const a = HTML.indexOf(START), b = HTML.indexOf(END);
if (a < 0 || b < 0) { console.error('could not locate the trading allowance block'); process.exit(2); }

const ctx = { console, round2: (n) => Math.round((Number(n) || 0) * 100) / 100 };
vm.createContext(ctx);
vm.runInContext(HTML.slice(a, b) + '\nthis.T = { TRADING_ALLOWANCE, taxYearOf, allowanceStatus, taxYearChoices };', ctx);
const T = ctx.T;

let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; console.log('  FAIL  ' + name + (detail ? '  -> ' + detail : '')); }
}

console.log('\nThe tax year');
{
  const y = T.taxYearOf('2026-10-14');
  check('October 2026 is in 2026–27, 6 Apr 2026 to 5 Apr 2027',
    y.from === '2026-04-06' && y.to === '2027-04-05' && y.label === '2026–27', JSON.stringify(y));
  check('5 April is the last day of the OLD year', T.taxYearOf('2027-04-05').from === '2026-04-06');
  check('6 April is the first day of the NEW year', T.taxYearOf('2027-04-06').from === '2027-04-06');
  check('January is in the year that began the April before', T.taxYearOf('2027-01-15').label === '2026–27');
  check('over the allowance in 2026–27: register by 5 October 2027', y.registerBy === '5 October 2027');
  check('the label across a century turn keeps two digits', T.taxYearOf('2099-05-01').label === '2099–00');
}

console.log('\nAgainst the £1,000 allowance');
{
  check('the allowance is £1,000', T.TRADING_ALLOWANCE === 1000);
  const u = T.allowanceStatus(412.5);
  check('under: what is left', u.state === 'under' && u.left === 587.5 && u.over === 0, JSON.stringify(u));
  check('from £800 it says getting close', T.allowanceStatus(800).state === 'near' && T.allowanceStatus(799.99).state === 'under');
  check('exactly £1,000 is NOT over', T.allowanceStatus(1000).state === 'near' && T.allowanceStatus(1000).left === 0);
  const o = T.allowanceStatus(1000.01);
  check('a penny over is over, by a penny', o.state === 'over' && o.over === 0.01 && o.left === 0, JSON.stringify(o));
  check('refunds can make it negative: nothing used, nothing over', T.allowanceStatus(-20).left === 1000 && T.allowanceStatus(-20).state === 'under');
  check('pennies are not lost to floating point', T.allowanceStatus(0.1 + 0.2).gross === 0.3);
}

console.log('\nThe tax years offered on the report (v1.67.1)');
{
  const c = T.taxYearChoices('2025-11-02', '2026-10-14');
  check('from the first sale\'s tax year to today\'s, newest first',
    c.map(t => t.label).join() === '2026–27,2025–26', JSON.stringify(c.map(t => t.label)));
  check('each runs 6 April to 5 April', c[0].from === '2026-04-06' && c[0].to === '2027-04-05' && c[1].from === '2025-04-06');
  check('nothing yet: just the current year', T.taxYearChoices('', '2026-10-14').map(t => t.label).join() === '2026–27');
  check('a first sale on 5 April belongs to the year before',
    T.taxYearChoices('2026-04-05', '2026-10-14').map(t => t.label).join() === '2026–27,2025–26');
  check('a first sale on 6 April does not add an extra year',
    T.taxYearChoices('2026-04-06', '2026-10-14').length === 1);
  check('on 5 April itself, the year ending today is the newest', T.taxYearChoices('', '2027-04-05')[0].label === '2026–27');
  check('a date in the future is ignored', T.taxYearChoices('2030-01-01', '2026-10-14').length === 1);
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
