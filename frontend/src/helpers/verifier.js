// Contrôles préliminaires, cohérents avec le filtrage Python et navigateur.
export function verifier({ mf, mr, ix, i, vf, vr }) {
  const finite = (...values) => values.every(v => typeof v === 'number' && Number.isFinite(v));
  return {
    verif_mf: finite(mf, mr) && mr > 0 ? Math.abs(mf) <= mr : null,
    verif_vf: finite(vf, vr) && vr > 0 ? Math.abs(vf) <= vr : null,
    verif_i: finite(ix, i) && ix > 0 ? ix >= i : null,
  };
}
