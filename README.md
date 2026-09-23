# Boat Race Calculator

A calculator which uses basic fluid dynamics to determine whether or not a boat will float with two people of different weights in it. Made for a cardboard boat race.

Open `index.html`. Type the boat's length x width x height, the two passengers' weights, the boat's own weight and a leeway (extra weight to see how much more it could take). The drawing settles into place as you type. `ft / lb` and `m / kg` are both available; switching converts the inputs in place.

## What it draws

* **Side view** — the hull sunk to its draft, with the freeboard band coloured green (fine), amber (less than a quarter of the hull height left) or red (under water). The purple arrow is the total weight, the green/red arrow the buoyancy it gets, the grey one the most the hull could ever give. The white ghost is the boat with no sinking distance.
* **End view** — the hull across its width with the keel **K**, centre of buoyancy **B**, centre of gravity **G** and metacentre **M** marked on the centreline. The boat rights itself when M is above G.
* **Top view** — where the two passengers should sit, fore and aft, so the boat sits level.
* **The numbers** under the inputs, with the formula each one came from.

## The physics

Everything is a box hull of length *L*, width *W* and height *H*, in fresh water of density ρ = 62.4 lb/ft³ (1000 kg/m³).

**Floating (Archimedes).** A floating body pushes aside its own weight in water. A box of waterplane area *L·W* sunk to a depth *d* displaces *L·W·d* of water, so it comes to rest at

    d = W_total / (ρ · L · W)          W_total = passenger 1 + passenger 2 + boat + leeway

The **freeboard** is *H − d*. The boat floats while that is positive; the most it can ever carry is *ρ·L·W·H*, and the difference between that and *W_total* is the reserve. (The original code divided by *(L + 2H)·(W + 2H)*, the footprint of the flattened cardboard rather than the hull's waterplane, so the drawn waterline sat about half as deep as it should.)

**Initial stability (metacentric height).** For a box floating upright, the centre of buoyancy is halfway down the draft and the metacentre sits above it by the waterplane's second moment over the displaced volume:

    KB = d / 2
    BM = I / V = (L · W³ / 12) / (L · W · d) = W² / (12 · d)
    KG = Σ (weight × height of its centre of gravity) / W_total
    GM = KB + BM − KG

The centres of gravity are estimates: a seated passenger 1 ft (0.3 m) above the floor, the boat's own weight at *H/2*, the leeway lying on the floor at 0.25 ft. GM above zero means the boat rights itself when it heels a little; under 0.25 ft it is marked tippy. A wide boat is stable because *BM* grows with the width squared; a narrow deep one with heavy people high up is not. The same formula along the length, *BM_L = L² / (12·d)*, gives the pitch stiffness used below.

**Seating (moment balance).** Two people of weights *G* and *S* sitting *x₁* and *x₂* from the middle keep the boat level when

    G · x₁ + S · x₂ = 0

They are placed *spread* apart (the length minus 2 ft for a seated person, up to 4 ft), which puts the heavier one nearer the middle: *x₁ = spread · S / (G + S)* toward the bow and *x₂ = −spread · G / (G + S)* toward the stern. If they sat the same distance from the middle instead, the unbalanced moment *(G − S)·spread / 2* would trim the boat by *atan(moment / (W_total · GM_L))*, and that angle and the dip at the low end are reported too. A hull shorter than 4 ft is flagged as too short for two.

**What is left out.** Real cardboard soaks and softens, hulls are not perfect boxes, and paddling makes waves; keep a margin. The heel figure ("every inch a passenger shifts sideways heels it …") is the small-angle estimate *atan(w · y / (W_total · GM))*.
