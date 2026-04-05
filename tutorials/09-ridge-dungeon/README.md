# Ridge Dungeon

This tutorial uses ridged fractal Brownian motion to carve a branching corridor network. The noise field is folded so its peak lines — the crests between two valleys — become the floor tiles. Each octave adds finer branching detail to the network.

## What It Explains

- how ridged noise differs from standard fBm by folding the output around its peak
- how the threshold value controls passage width rather than depth
- why a purely implicit field can produce branching layouts without any explicit graph

## Good Uses

- cave networks
- mine tunnel complexes
- dungeon corridors
- underground river systems

## Limits

- no control over where individual passages go
- connectivity is not guaranteed at all settings
- branching structure depends entirely on the noise, not on design intent
