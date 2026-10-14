// Runs the REAL expense and net-profit rules out of index.html (v1.67.0).
//
//   node tests/expenses.js index.html
//
// WHAT THIS PROTECTS. Net profit is a figure Kay may act on, and may one day
// put on a tax return. So: an expense must be complete and sane before it is
// kept; two tills editing the same expense must end with the later change
// everywhere, and a deleted one must stay deleted; only the period's expenses
// count, deleted ones never; and net profit must be gross income less the
// card fees (on card SALES, as in payouts), website fees, Etsy's card fees and
// the expenses, to the penny.
const fs = require('fs');
const vm = require('vm');

const HTML = fs.readFileSync(process.argv[2], 'utf8');
function slice(start, end, what) {
  const a = HTML.indexOf(start), b = HTML.indexOf(end);
  if (a < 0 || b < 0 || b < a) { console.error('could not locate ' + what); process.exit(2); }
  return HTML.slice(a, b);
}
const EXP = slice('  // ---- expenses ----', '  // ---- end expenses ----', 'the expenses block');
const Z = slice('  function zFigures(fromStr, toStr, maker){', '  /* ---- Supplier payouts', 'zFigures');

const ctx = {
  console,
  round2: (n) => Math.round((Number(n) || 0) * 100) / 100,
  sales: [],
  lineQty: (s) => (s.qty != null) ? (Number(s.qty) || 0) : 1,
  lineNet: (s) => (s.net != null) ? (Number(s.net) || 0) : (Number(s.price) || 0),
  lineTxn: (s) => s.txn || s.id,
  localDateStr: (d) => d.toISOString().slice(0, 10),
  makerKeyOf: (s) => String(s.maker || '').trim() || '—',
};
vm.createContext(ctx);
vm.runInContext(EXP + Z + '\nthis.T = { EXPENSE_CATS, cleanExpense, mergeExpenses, expensesIn, profitFigures, zFigures };', ctx);
const T = ctx.T;

let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; console.log('  FAIL  ' + name + (detail ? '  -> ' + detail : '')); }
}
const throwsLike = (fn, re) => { try { fn(); return false; } catch (e) { return re.test(e.message); } };
const raw = (o) => Object.assign({ id: 'Eabc123', date: '2026-10-14', what: '  Crochet   yarn ', cat: 'materials', amount: '12.499' }, o || {});

console.log('\nAn expense is complete and sane before it is kept');
{
  const e = T.cleanExpense(raw(), 1000);
  check('tidied: words trimmed and spaced, pennies rounded', e.what === 'Crochet yarn' && e.amount === 12.5, JSON.stringify(e));
  check('stamped with when it changed', e.updatedAt === 1000);
  check('no date, refused', throwsLike(() => T.cleanExpense(raw({ date: '' }), 1), /date/));
  check('a date that is not a date, refused', throwsLike(() => T.cleanExpense(raw({ date: '2026-02-31x' }), 1), /date/));
  check('nothing said, refused', throwsLike(() => T.cleanExpense(raw({ what: '   ' }), 1), /what it was for/));
  check('nothing paid, refused', throwsLike(() => T.cleanExpense(raw({ amount: '0' }), 1), /how much/));
  check('a negative, refused', throwsLike(() => T.cleanExpense(raw({ amount: '-5' }), 1), /how much/));
  check('an absurd amount, refused', throwsLike(() => T.cleanExpense(raw({ amount: '250000' }), 1), /looks wrong/));
  check('an unknown kind becomes Other', T.cleanExpense(raw({ cat: 'yachts' }), 1).cat === 'other');
  check('an id that could be a path, refused', throwsLike(() => T.cleanExpense(raw({ id: '../x' }), 1), /id/));
  check('every kind has a label, and Etsy fees are one', T.EXPENSE_CATS.every(c => c.key && c.label) && T.EXPENSE_CATS.some(c => c.key === 'etsy'));
}

console.log('\nTwo tills: the later change wins, a deletion stays');
{
  const a = { id: 'E1', date: '2026-10-01', what: 'Yarn', cat: 'materials', amount: 10, updatedAt: 100 };
  const b = { id: 'E2', date: '2026-10-05', what: 'Stamps', cat: 'postage', amount: 6, updatedAt: 100 };
  const newer = Object.assign({}, a, { amount: 12, updatedAt: 200 });
  let m = T.mergeExpenses([a, b], [newer]);
  check('a newer change from another till is taken', m.changed && m.list.find(e => e.id === 'E1').amount === 12);
  m = T.mergeExpenses([newer, b], [a]);
  check('an older copy arriving late does not undo it', !m.changed && m.list.find(e => e.id === 'E1').amount === 12);
  const gone = Object.assign({}, b, { deleted: true, updatedAt: 300 });
  m = T.mergeExpenses([a, b], [gone]);
  check('a deletion from another till is taken', m.list.find(e => e.id === 'E2').deleted === true);
  m = T.mergeExpenses([a, gone], [b]);
  check('and the old copy cannot bring it back', m.list.find(e => e.id === 'E2').deleted === true && !m.changed);
  check('newest date first', T.mergeExpenses([a, b], []).list[0].id === 'E2');
  check('nothing new, nothing changed', T.mergeExpenses([a, b], [a]).changed === false);
}

console.log('\nOnly the period\'s expenses, never deleted ones');
{
  const list = [
    { id: '1', date: '2026-04-05', amount: 5, cat: 'other' },
    { id: '2', date: '2026-04-06', amount: 7, cat: 'other' },
    { id: '3', date: '2026-10-14', amount: 9, cat: 'other', deleted: true },
    { id: '4', date: '2027-04-05', amount: 11, cat: 'other' },
  ];
  const got = T.expensesIn(list, '2026-04-06', '2027-04-05').map(e => e.id).join();
  check('both ends included, deleted left out', got === '2,4', got);
}

console.log('\nNet profit, to the penny');
{
  const day = '2026-10-14';
  const at = day + 'T11:00:00.000Z';
  ctx.sales = [
    { id: 'a', txn: 'T1', pay: 'card', kind: 'sale', qty: 1, price: 100, net: 100, at },
    { id: 'b', txn: 'T2', pay: 'card', kind: 'refund', qty: -1, price: 20, net: -20, at },
    { id: 'c', txn: 'T3', pay: 'cash', kind: 'sale', qty: 1, price: 50, net: 50, at },
    { id: 'd', txn: 'T4', pay: 'web', kind: 'sale', qty: 1, price: 40, net: 40, at },
    { id: 'e', txn: 'T5', pay: 'etsy', kind: 'sale', qty: 1, price: 30, net: 30, at, etsyRef: '9', etsyFee: 1.5 },
  ];
  const f = T.zFigures(day, day);
  check('card SALES are counted for the fee, refunds not netted off', f.cardSales === 100 && f.webSales === 40, JSON.stringify([f.cardSales, f.webSales]));
  const exp = [
    { id: '1', date: day, what: 'Yarn', cat: 'materials', amount: 10.25 },
    { id: '2', date: day, what: 'Stamps', cat: 'postage', amount: 4.6 },
    { id: '3', date: day, what: 'Old', cat: 'postage', amount: 99, deleted: true },
  ];
  const p = T.profitFigures(f, exp, { card: 1.69, web: 2.5 });
  check('gross income is the takings: 100 − 20 + 50 + 40 + 30', p.gross === 200, p.gross);
  check('card fees: 1.69% of £100 of card sales', p.cardFees === 1.69, p.cardFees);
  check('website fees: 2.5% of £40', p.webFees === 1, p.webFees);
  check('Etsy\'s card fee as recorded', p.etsyFees === 1.5);
  check('expenses added up, the deleted one left out', p.expenses === 14.85 && p.byCat.materials === 10.25 && p.byCat.postage === 4.6, JSON.stringify(p.byCat));
  check('net profit = 200 − 1.69 − 1 − 1.5 − 14.85 = 180.96', p.net === 180.96, p.net);
  const loss = T.profitFigures({ net: 10 }, [{ amount: 25, cat: 'stall' }], { card: 1.69, web: 2.5 });
  check('a loss is a negative, not hidden', loss.net === -15, loss.net);
  check('nothing at all is nothing', T.profitFigures({ net: 0 }, [], { card: 1.69, web: 2.5 }).net === 0);
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
