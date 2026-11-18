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
