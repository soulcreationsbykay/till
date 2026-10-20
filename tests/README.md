# Tests

The app is one HTML file with no build step, so these do not import anything. Each one
**slices the real code out of `index.html`** by its comment markers and runs that in a
Node `vm` context with the browser bits stood in for. What runs is the shipped source,
not a copy of it that can drift.

```bash
node tests/photos.js index.html
node tests/website-list.js index.html
node tests/import-items.js index.html
node tests/add-item.js index.html
node tests/tombstones.js index.html
node tests/own-photos.js index.html
node tests/read-policy.js index.html
node tests/reconcile-reads.js index.html
node tests/sales-export.js index.html
node tests/variant-names.js index.html
node tests/photo-keys.js index.html
node tests/misc-amount.js index.html
node tests/web-sold-alert.js index.html
node tests/payouts.js index.html
node tests/undo-guard.js index.html
node tests/sets.js index.html
node tests/roles.js index.html
node tests/card-recovery.js index.html
node tests/card-idempotency.js index.html
node tests/backup-reminder.js index.html
node tests/settings-backup.js index.html
node tests/web-orders.js index.html
node tests/etsy-orders.js index.html
node tests/trading-allowance.js index.html
node tests/expenses.js index.html
node tests/orders-lock.js index.html
node tests/etsy.js index.html
node tests/channel-filter.js index.html
node tests/etsy-link.js index.html
node tests/ad-words.js index.html
node tests/csp.js index.html
node tests/hid-scanner.js index.html
```

Each prints a pass/fail line per check and exits non-zero on failure.

| File | Covers | Added |
|---|---|---|
| `photos.js` | Backups keeping their photos, restores not deleting them, Remove photo still working | v1.7.1 |
| `website-list.js` | What lands on the website list, the wording, ticking off, the `webQty: 0` trap | v1.8.0 |
| `import-items.js` | Import adding only and never overwriting, the website fields and the label travelling, photo URLs being refused | v1.9.0, label v1.18.0 |
| `add-item.js` | A new item starting counted rather than sold out, the website flag and description, the label the shop needs to print, the postage size, no stray fields, and a new item kept for Etsy (never on the website too, keeping its description and postage size) | v1.12.0, label v1.18.0, postage v1.51.0, Etsy v1.55.1 |
| `tombstones.js` | The sync tidy-up: that it can only ever reach a tombstone and never a live item, and that recent deletions are kept | v1.13.0 |
| `own-photos.js` | Preferring our own copies of the photographs over SumUp's, the fallback for anything we did not archive, and the v1.5.3 escaping hole staying shut | v1.14.0 |
| `read-policy.js` | Whether a connect may read from the local cache: the team-code switch, a cleared cache, and a refusal never being read as nothing-has-changed | v1.15.0 |
| `reconcile-reads.js` | The real `reconcile()` against a fake Firestore — that the cheap path costs one read, and that it ends in **identical** shadow state to the full read | v1.15.0 |
| `sales-export.js` | All three exports, and the Miscellaneous section added to the report in v1.27.0: that each CSV is byte for byte what it always was, and that the .xlsx is a real workbook — every part it promises present, every CRC right, money a number in a pound-sign format rather than text | v1.16.0, stock take and currency v1.17.0, Label column v1.18.0 |
| `photo-keys.js` | The photo KEY the website reads instead of the photograph: the fingerprint three languages have to agree about, and that a key is never cleared just because its photo has not come back out of IndexedDB yet | v1.24.0 |
| `misc-amount.js` | A manual amount charged for something that was never stock: what the basket will accept, that a set price cannot reach it, that ringing it up moves no stock even when an item is coded `MISC`, and that the report has it in the takings but not in items sold or the supplier payouts | v1.27.0 |
| `web-sold-alert.js` | The flash that sends somebody to the shelves when a web sale arrives from another till: what raises one and what must never, the recency window that stops a reconnect replaying the shop's whole history, and being told the same order twice. From v1.31.0 also the single-till path — a web order rung through here going onto the same list, and not landing twice when it comes back round over sync | v1.30.0, single till v1.31.0 |
| `payouts.js` | The supplier payout maths, which somebody hands real money out from: the shop's own commission on top of the card and website fees, that it follows refunds down while the card fee deliberately does not, a supplier on their own terms (a zero meaning zero, not "use the shop rate"), and every part shown on the report adding up to the total | v1.34.0 |
| `undo-guard.js` | What **Undo last sale** is allowed to delete: that a card sale is refused and sent to the refund screen instead, that a refund of a card sale stays undoable because it is the only way back from one, and the wording each case gets | v1.36.0 |
| `variant-names.js` | The em dash that groups an item's colours into one card on the website: that the till splits a name exactly the way `shop-site/shop.js` does, that a hyphen is never silently promoted to a group, and that a name survives the round trip | v1.23.0 |
| `extras.js` | The second and later photographs of an item, which live ONLY on the device that took them: that the store key names the item as well as the picture (so two items photographing the same thing do not become one), that the order the shop chose survives a restart, that removing one closes the gap permanently, and that with no export ever recorded the un-exported count reports EVERY picture rather than none | v1.35.0 |
| `card-lead.js` | Which picture fronts a card on the website: that the group is read the same way the website reads it, that only one member of a card can lead it and ticking one unticks the rest, and that a lone item clears nobody else | v1.40.0 |
| `settings-backup.js` | The Settings page travelling in a backup: that the payout percentages are carried (0% commission reads as a working number, not a missing one), that the till id and the administrator PIN never are, that the team-sync details land on a blank device but cannot repoint a working till, and that the storage line never promises more than it can | v1.44.0 |
| `web-orders.js` | A website order becoming a web sale: one line per item at the price paid after offers, postage as its own misc line with its own report total (not miscellaneous, not an item sold), the lines adding up to what SumUp took, nothing personal in a sale, and items the shelf no longer had reported | v1.52.0 |
| `etsy-link.js` | What Settings → Etsy → Connection to Etsy says about the kay-etsy service's answer: never claiming a connection that is not there, "connect again" for an expired one, the shipping, processing and return profiles listed or the step that sets them up named, and a part Etsy did not answer saying so rather than reading as "none". Checked against two broken copies, both of which fail | v1.58.0 |
| `channel-filter.js` | The All / Online / Website / Etsy / Not online buttons on the stock list: that each item lands in exactly one of Website, Etsy and Not online, that Online is the website and Etsy together, that a record with both flags counts as Etsy, that an unknown choice hides nothing, and that the counts on the buttons add up. Checked against four broken copies, all of which fail | v1.56.0 |
| `etsy.js` | Items kept for Etsy: that the website photo never counts as an Etsy one so nothing is ready without a real photo, that kept for Etsy is never on the website as well, that the record's list of photo fingerprints never holds a duplicate, goes over Etsy's 10 or is left behind empty, that each photo's document names its item as well as the picture, and the Settings list. Checked against six broken copies: photos not required, the website flag kept alongside Etsy, an empty list left behind, `~` not made safe in a barcode, duplicates allowed, no limit. All six produce FAIL lines. From v1.57.0 also the Etsy title (capped at 140) and tags (13 at most, 20 characters each, reported rather than cut, duplicates and characters Etsy refuses dropped), checked against five more broken copies | v1.55.0, title and tags v1.57.0 |
| `orders-lock.js` | The orders password: nothing hidden until one is set, hidden until the right one is typed, hidden again after 5 minutes or on Lock now, a minute's wait after 5 wrong tries, only a salted hash stored, a fresh salt each time, removing it shows everything | v1.54.0 |
| `set-photos.js` | The photograph a set carries of itself: that the picture never reaches localStorage or the inside of the rule — only a fingerprint does, because `data.set` is projected whole on every catalogue rebuild — that a picture which merely has not hydrated yet is put back rather than deleted, that a deliberate Remove really removes it, and that taking a set apart takes its photograph with it | v1.39.0 |
| `sets.js` | Set prices with more than two items in them: that a rule of three or four is recognised, that **every** member has to be in the basket before it applies and the saving comes straight back off when one leaves, that the saving is split across all the members in proportion to price — which is what each maker's payout is worked out from — and that two overlapping sets resolve the same way whatever order the stock list is in | v1.38.0 |

## If a test stops finding the code

Each file names the comment markers it slices between, near the top. Moving that block
in `index.html` is fine — update the marker. A test that cannot find its block exits 2
with a message rather than silently passing.

## Worth knowing

Every suite here was checked against deliberately broken copies as well as the real
file, so each is known to actually catch the thing it describes. `read-policy.js` found
one of its own checks useless that way — it passed for the wrong reason until the case
was sharpened — which is the whole argument for doing it. A test that has never failed has
not been shown to work. `git show HEAD~1:index.html > /tmp/before.html` and run against
that.

`extras.js` was checked against six broken copies: the store keyed by the picture alone,
the order not written back, the un-exported count treating a missing stamp as "nothing
outstanding", the rebuild sorting by time instead of position, `addExtra` accepting
anything, and an emptied item left behind as an empty list. All six produce FAIL lines.

Two of them are worth knowing about. The first is the key: keyed by fingerprint only,
photographing two items with the same picture silently moves the first item's photograph
onto the second, and nothing looks wrong. The second is the count: it is the ONLY warning
that a device holds the only copy of these pictures, so a missing stamp has to mean
"everything is outstanding". Over-warning costs one needless export; under-warning costs
an afternoon's photography.

The suite also caught two faults in itself before it was believed. It looked records up by
a hand-written `code#fingerprint` key, so the broken key scheme crashed the run instead of
failing a check; and it asked `extrasItems()` whether an emptied item had been dropped,
which filters empties out and so could never tell. Both are fixed, and only then did all
six copies fail.
| `backup-reminder.js` | The weekly backup banner: that the first run starts the clock instead of nagging, that the cross snoozes for a day rather than a week, that an un-exported extra photograph can raise the banner on its own once it is a week old - because it is the only thing in the app with no second copy - and that when both are due the button still saves the backup | v1.43.0 |
| `card-idempotency.js` | The key that stops **Try the card again** taking the money twice: that an attempt whose answer never arrived keeps its key, so the retry finds the payment already at the reader instead of starting another; that an attempt which *was* answered drops it, because the payment has an id from then on; and that a key never outlives its basket - a different total, or the same total half an hour later, is a different sale | v1.45.0 |
| `card-recovery.js` | A card payment the page did not live to see the end of: that one still open is KEPT rather than forgotten, that a payment taken while the basket has since changed is never recorded automatically, that an empty basket does not count as a match, and that a payment which can no longer be asked about is reported without deciding either way | v1.42.0 |
| `roles.js` | The three access levels: that an old bare-name staff list all comes back as **administrator**, that the gate stays off until a staff PIN is set, that nobody-picked is the most restricted rather than the least, and which tabs each role may stand on | v1.41.0 |
| `csp.js` | The Content-Security-Policy `<meta>`: every inline script listed by its SHA-256 fingerprint and no stale ones, no `'unsafe-inline'` or `'unsafe-eval'` for scripts, no `onclick=""`-style attributes, and the policy sitting above the first script. **Fails after any edit inside a script tag** (BUILD_TIME included): `node tests/csp.js index.html --write` puts it right | v1.78.1 |
| `hid-scanner.js` | A Bluetooth scanner in HID mode: a fast run of keys ending in Enter or Tab is a scan, Shift between capitals does not break it, typing by hand is left alone and keeps its Enter, and a stray key earlier does not end up in front of the code | v1.79.0 |

`card-recovery.js` slices two blocks, not one: the pure decision, and `recover()`
around it with a scripted payment service standing in. The second is there because
the decision is only half of it - an id dropped when it should have been kept is a
payment nobody will ever ask about again, and no amount of testing the pure part
would catch that.

It was checked against seven broken copies: a still-open payment forgotten, an
orphan auto-recorded against a changed basket, an unconfirmable payment quietly
swallowed, a zero amount matching an empty basket, the record thrown away when the
shop is offline, being offline read as the payment being gone, and the record
forgotten every time. All seven produce FAIL lines.

The first attempt crashed on the swallowed-payment copy instead of failing - it read
`.message` off a plan that no longer had one - which is the same fault `extras.js`
had, and it takes the rest of the checks down with it. Messages are now read through
a helper that returns an empty string.

`card-idempotency.js` was checked against five broken copies: the key dropped
even when the answer was lost, the key never dropped at all, the key not tied to
the amount, the key never going stale, and the key minted but never sent. All
five produce FAIL lines.

The first is the one that costs money. Dropping the key on failure looks tidy -
the attempt is over, clear up after it - and it puts back exactly the double
charge the key exists to prevent, silently, because everything else about the
retry still works.

`backup-reminder.js` was checked against six broken copies: nagging on the very first
run, ignoring the snooze, the photographs never being able to raise the banner alone, a
picture taken yesterday being nagged about, the button pointing at Settings when a
backup was what was due, and "1 extra photographs". All six produce FAIL lines.

The one worth knowing about is the third. If the photographs can only ever be mentioned
alongside an overdue backup, then a shop that backs up diligently is the shop that never
hears about the pictures it is about to lose - the failure is invisible precisely when
everything else is being done right.
