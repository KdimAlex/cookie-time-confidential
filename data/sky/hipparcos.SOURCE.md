# Hipparcos table

`hipparcos.tsv` is Hipparcos I/239 `hip_main`, pulled from VizieR on 12 October 2026.

Request:

`https://vizier.cds.unistra.fr/viz-bin/asu-tsv?-source=I/239/hip_main&-oc.form=dec&-out.add=_RAJ2000,_DEJ2000&-out=HIP&-out=pmRA&-out=pmDE&-out=Plx&-out=Vmag&-out=B-V&-out=HD&-out=SpType&-out.max=200000`

`_RAJ2000` and `_DEJ2000` are FK5, equinox J2000, epoch J2000, with proper motion already applied from the catalog epoch J1991.25. `pmRA` is μ_α cos δ, in mas/yr.

117,955 rows have a position. 263 rows have a blank coordinate and are left out. Four of those are brighter than magnitude 6.5 (HIP 31067, 55203, 78727, 115125).

The dome and the window plot stars at magnitude 6.5 and brighter. Fainter rows stay in the TSV.
