// Runs the REAL "where an item sells" rules out of index.html.
//
//   node tests/channel-filter.js index.html
//
// WHAT THIS PROTECTS. The row of buttons under the stock list's search box -
// All, Online, Website, Etsy, Not online - narrows the list to where each item
// sells. A wrong answer here quietly hides stock: an Etsy item missing from
// "Online", or a website item turning up under "Not online", is exactly the
// kind of thing nobody notices until it matters. And the counts on the buttons
// have to agree with what each one actually shows.
const fs = require('fs');
const vm = require('vm');

const HTML = fs.readFileSync(process.argv[2], 'utf8');
const START = '  // WHERE AN ITEM SELLS (v1.56.0)';
const END = '  // WHERE AN ITEM SELLS: END';
const a = HTML.indexOf(START), b = HTML.indexOf(END);
if (a < 0 || b < 0 || b < a) { console.error('could not locate the channel block'); process.exit(2); }
const SRC = HTML.slice(a, b);

const ctx = { console };
vm.createContext(ctx);
vm.runInContext(SRC + '\nthis.T = { CHANNELS, channelOf, inChannel, channelCounts };', ctx);
const T = ctx.T;

let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; console.log('  FAIL  ' + name + (detail ? '  -> ' + detail : '')); }
}

const web = { name: 'Scarf', web: 1 };
const etsy = { name: 'Bag', etsy: 1 };
const stall = { name: 'Brooch' };
const both = { name: 'Odd one', web: 1, etsy: 1 };   // the till never makes this, but a record could hold it

console.log('\nWhere one item sells');
{
  check('a website item is website', T.channelOf(web) === 'web');
  check('an Etsy item is Etsy', T.channelOf(etsy) === 'etsy');
  check('neither is not online', T.channelOf(stall) === 'none');
  check('both ticked counts as Etsy, as everywhere else', T.channelOf(both) === 'etsy');
  check('the website flag as text still counts', T.channelOf({ web: '1' }) === 'web');
  check('a missing item is not online, not a crash', T.channelOf(undefined) === 'none');
}

console.log('\nWhat each button shows');
{
  const show = key => [web, etsy, stall, both].filter(it => T.inChannel(it, key)).map(it => it.name).join(',');
  check('All shows everything', show('all') === 'Scarf,Bag,Brooch,Odd one');
  check('Online shows website and Etsy items', show('online') === 'Scarf,Bag,Odd one');
  check('Website shows only website items', show('web') === 'Scarf');
  check('Etsy shows only Etsy items', show('etsy') === 'Bag,Odd one');
  check('Not online shows only stall items', show('none') === 'Brooch');
  check('an unknown choice hides nothing', show('rubbish') === 'Scarf,Bag,Brooch,Odd one');
  check('Website, Etsy and Not online never overlap and miss nothing',
    [web, etsy, stall, both].every(it => ['web', 'etsy', 'none'].filter(k => T.inChannel(it, k)).length === 1));
}

console.log('\nThe counts on the buttons');
{
  const n = T.channelCounts([web, etsy, stall, both, { name: 'Another scarf', web: 1 }]);
  check('All counts every item', n.all === 5, JSON.stringify(n));
  check('Online is Website plus Etsy', n.online === n.web + n.etsy && n.online === 4, JSON.stringify(n));
  check('Website, Etsy and Not online add up to All', n.web + n.etsy + n.none === n.all, JSON.stringify(n));
  check('each count is right', n.web === 2 && n.etsy === 2 && n.none === 1, JSON.stringify(n));
  const z = T.channelCounts([]);
  check('no items is all zeros, not blanks', T.CHANNELS.every(ch => z[ch.key] === 0));
  check('there is a count for every button', T.CHANNELS.every(ch => typeof n[ch.key] === 'number'));
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
