# The MannaFish Hub package (draft for Ken, 18 Nov)

A Hub is a place that gives the free decals to the people who walk in. A sponsor pays so the decals can be given away; the place pays nothing. Nothing is sold. No dollar amounts go on the public site until Ken decides pricing.

## What a Hub receives (bill of materials, nothing built yet except where noted)
| Piece | Status | Notes |
|---|---|---|
| The decals (100 or more per place) | Built | Made from the sponsor's order (`/sponsor/`). |
| Basket | Not chosen | Small countertop basket or tray. Needs a supplier and a unit cost. |
| Header sign | Not designed | Idea: reuse the 6 × 4 in header card in `tools/print/header.mjs` ("Free MannaFish · take one"), on a small easel or a card standing in the basket. |
| Packing box | Not chosen | One standard box size that holds basket, sign and 100 decals. |
| Shipping label | Not built | Printed from the accepted nomination: the place's name and shipping address are already stored when they accept (`/nominate/`). |
| Shipping process | Not written | Ken gets "ACCEPTED" email with the address and quantity, makes the order, packs, ships, then marks the order done. |

## Cost per location (to fill in)
Basket + sign + box + label + postage + decals. Ken sets the number; the sponsor page shows no dollars. Rule so far: 100 decals minimum per location. Two or five locations = the same card copied, with a different place chosen on each (the sponsor page does this today with "Copy this card").

## Monthly free "MannaFish basket" for sign-ups (idea)
Once a month, one sign-up (or a few) receives a basket: shirt, hat, keychain, decals, other branded items.
Merchandise is still under development, so emails and pages say "decals and a basket" only.
Caution before launching it: a prize drawing can fall under state sweepstakes rules (no purchase necessary, official rules, odds, who is eligible, who can win, a winners list on request). Needs a short rules page and a check with a lawyer or the state rules before the first drawing. Alternative with no legal worry: give a basket to the Hub nearest the sign-up count milestone, not by chance.

## Questions for Ken
1. Word: "Hub" or "Embassy"? (The emails and the sponsor page say Hub now.)
2. Do you want to approve every new business before it is emailed? (Built that way now: nobody is emailed until you press Approve in `/print/orders/`.)
3. If a place never answers: remind once after 14 days, or leave it? (Not built.)
4. Who pays for the basket, sign, box and postage: included in the sponsor price, or a separate Hub fee?
5. The monthly basket: random drawing, or given by you to someone you choose?

## Decisions (Ken, 18 Nov: "Yes to all")
1. Name: **Hub**. The person who runs one is the **Ambassador**.
2. Ken approves every new business before it is emailed.
3. Reminder at 2 days; call at 2; mail at 5; after 14 days "no answer", the sponsor is told and can give the decals out or choose another place.
4. Ken mails a handwritten-style note, two sample decals and the vision card.
5. The sponsor's price covers basket, sign, box and postage; the place pays nothing.
6. Header sign ("TAKE 2! One to keep, one to give away."): the 6 x 4 in card (`node tools/print/header.mjs <run>`; sample `print/out/headers/R0020-header-counted.pdf`).
7. Monthly basket: chosen by Ken, no random drawing.
8. Price: Ken does not know, so these are my guesses to check against real quotes. Not on the public site.

## Price guess per Hub location (to check with real quotes)
| Item | Guess |
|---|---|
| Basket or tray | $6 to $12 |
| Header sign (printed 6 x 4 card) | $1 to $2 |
| Packing box | $3 to $5 |
| Label | $0.25 |
| Postage (about 2 to 3 lb) | $10 to $16 |
| Mailed note, two sample decals, vision card | $2 |
| Total kit, without decals | about $25 to $40 |

Decals: **$1.23 each at 100 = $123 per 100** (Ken, 18 Nov, his real cost; my earlier $30 to $60 guess was far too low).
One Hub with 100 decals therefore costs about **$150 to $165** (decals $123 + kit $25 to $40).

## Prices (Ken, 18 Nov: "$249 for 100, at least $1.00 profit per decal. It needs to pay for the Bible app too, and any hired help")
Rule: profit of **$1.00 or more per decal** after the decals, the kit and card fees (about 2.9% + $0.30). The profit pays for the Bible app and any hired help.
| Quantity | Decals + kit (cost) | Price | Card fees | Profit | Per decal |
|---|---|---|---|---|---|
| 100 | $123 (real) + $33 kit (guess) = $156 | **$269** | $8 | $105 | $1.05 |
| 500 | about $375 (guess) + $33 = $408 | **$949** | $28 | $513 | $1.03 |
| 1,000 | about $550 (guess) + $33 = $583 | **$1,649** | $48 | $1,018 | $1.02 |
At $249 for 100 the profit is about $0.85 per decal after fees, under the $1.00 rule, so $269 is the price that meets it. Ken can still choose $249.
Extra locations: add the kit cost ($33) and the same $1.00 per decal. 500 and 1,000 depend on real StickerApp quotes and a real kit cost: nothing here is on the site.
