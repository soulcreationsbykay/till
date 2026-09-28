// Runs the REAL front-page tick helpers out of index.html.
//
//   node tests/front-tick.js index.html
//
// WHAT THIS PROTECTS. Kay ticks one item per category - "Use this photo for
// Crochet on the website's front page" - and the website shows that item's
// photograph in the Crochet section. Two ticks in one category would leave the
// website choosing between them, and the one it did not choose would look
// broken. So ticking one has to untick the rest, and "the rest" has to be read
// the way shop-worker reads a category: the SECOND level of the folder, folded
// to lowercase with a final "s" dropped.
const fs = require('fs');
const vm = require('vm');

const HTML = fs.readFileSync(process.argv[2], 'utf8');
const START = '  // WHICH PHOTOGRAPH FRONTS A CATEGORY';
const END = "  // Keep every item's key agreeing with its photo.";
const a = HTML.indexOf(START), b = HTML.indexOf(END);
if (a < 0 || b < 0 || b < a) { console.error('could not locate the front-tick block'); process.exit(2); }
const SRC = HTML.slice(a, b);

const ctx = {
  normFolder: s => String(s || '').split('/').map(p => p.trim()).filter(Boolean).join('/'),
  items: {},
  console,
};
vm.createContext(ctx);
vm.runInContext(SRC + '\nthis.T = { webCategoryOfFolder, webCategoryKey, clearCategoryFront };', ctx);
const T = ctx.T;

let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; console.log('  FAIL  ' + name + (detail ? '  -> ' + detail : '')); }
}

console.log('\nReading the category out of a folder');
{
  check('the second level is the category', T.webCategoryOfFolder('Kay/Crochet') === 'Crochet');
  check('a third level does not change it', T.webCategoryOfFolder('Kay/Jewellery/Earrings') === 'Jewellery');
  check('a maker on its own has none', T.webCategoryOfFolder('Kay') === '');
  check('stray spaces and slashes are tidied', T.webCategoryOfFolder(' Kay / Crochet /') === 'Crochet');
  check('"Special offer" and "Special Offers" are one shelf',
    T.webCategoryKey('Kay/Special offer') === T.webCategoryKey('Kay/Special Offers'));
}

console.log('\nOne tick per category');
{
  ctx.items = {
    'KA-001': { folder: 'Kay/Crochet', front: 1 },
    'KA-002': { folder: 'Kay/Crochet' },
    'KA-003': { folder: 'Kay/Jewellery/Earrings', front: 1 },
    'KA-004': { folder: 'Kay/Special offer', front: 1 },
    'KA-005': { folder: 'Kay/Special Offers', front: 1 },
  };
  vm.runInContext('items = this.items', ctx);
  ctx.items['KA-002'].front = 1;
  T.clearCategoryFront('KA-002');
  check('ticking one unticks the other in its category', !ctx.items['KA-001'].front);
  check('and keeps its own', ctx.items['KA-002'].front === 1);
  check('another category is left alone', ctx.items['KA-003'].front === 1);

  T.clearCategoryFront('KA-005');
  check('a spelling difference is still the same category', !ctx.items['KA-004'].front);
  check('the one just ticked stays', ctx.items['KA-005'].front === 1);

  ctx.items['KA-006'] = { folder: 'Kay', front: 1 };
  T.clearCategoryFront('KA-006');
  check('an item with no category unticks nothing', ctx.items['KA-002'].front === 1 && ctx.items['KA-003'].front === 1);
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
