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

Suggested sponsor prices (not on the site; Ken to confirm, and 500 / 1,000 need real quotes because the price per decal usually drops with quantity):
| Quantity | Your cost (decals) | Guess | Suggested price |
|---|---|---|---|
| 100 | $123 (real) | + kit $33 = about $156 | **$199** |
| 500 | about $0.75 each = $375 (guess) | + kit $33 = about $408 | **$549** |
| 1,000 | about $0.55 each = $550 (guess) | + kit $33 = about $583 | **$799** |
Each extra location adds its kit cost (about $33) plus its own decals, and the 100 minimum applies to each location.
