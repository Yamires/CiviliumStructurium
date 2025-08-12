// Fonction de vérification des contraintes mécaniques
export function verifier({ mf, mr, ix, i, vf, vr }) {

  // Initialisation des résultats de vérification
  let verif_mf = null;
  let verif_vf = null;
  let verif_i = null;

  // Vérifie la contrainte de moment fléchissant (mf/mr < 1)
  if (mf !== undefined && mr !== undefined && mr !== 0) verif_mf = mf / mr < 1;
  // Vérifie la contrainte d'inertie (ix/i < 1)
  if (i !== undefined && ix !== undefined && ix !== 0) verif_i = ix / i < 1;
  // Vérifie la contrainte d'effort tranchant (vf/vr < 1)
  if (vf !== undefined && vr !== undefined && vr !== 0) verif_vf = vf / vr < 1;
  
  // Retourne les résultats de vérification
  return { verif_mf, verif_vf, verif_i };

}
