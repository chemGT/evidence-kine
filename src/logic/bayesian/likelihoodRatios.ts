// =============================================================================
// Evidence Kine - Moteur bayesien : Likelihood Ratios (Se/Sp -> LR+/LR-)
// -----------------------------------------------------------------------------
// Serious Game pedagogique uniquement. Aucune donnee de patient reel.
//
// Ce module convertit la sensibilite (Se) et la specificite (Sp) d'un test
// clinique en rapports de vraisemblance (likelihood ratios) :
//
//   LR+ = Se / (1 - Sp)    : un LR+ eleve augmente la probabilite post-test
//                            quand le test est positif.
//   LR- = (1 - Se) / Sp    : un LR- bas diminue la probabilite post-test
//                            quand le test est negatif.
//
// Les LR sont l'entree canonique du theoreme de Bayes sur les odds
// (cf. `bayes.ts`). On NE JAMAIS combine de simples pourcentages Se/Sp : seuls
// les LR sont mathematiquement valides pour chainer plusieurs tests.
//
// Reference : Hegedus EJ et al., Br J Sports Med 2012; DOI 10.1136/bjsports-2012-091066
// =============================================================================

/**
 * Parametres cliniques d'un test diagnostique.
 *
 * @property sensitivity - Sensibilite (Se), dans [0, 1]. Probabilite d'un test
 *   positif chez un sujet malade.
 * @property specificity - Specificite (Sp), dans [0, 1]. Probabilite d'un test
 *   negatif chez un sujet sain.
 */
export interface TestAccuracy {
  sensitivity: number;
  specificity: number;
}

/**
 * Rapports de vraisemblance issus de Se/Sp.
 *
 * @property lrPositive - LR+ = Se / (1 - Sp). `Infinity` si Sp = 1 (test
 *   parfaitement specifique).
 * @property lrNegative - LR- = (1 - Se) / Sp. `Infinity` si Sp = 0, `0` si
 *   Se = 1.
 */
export interface LikelihoodRatios {
  lrPositive: number;
  lrNegative: number;
}

/**
 * Valide qu'une probabilite est un nombre fini dans [0, 1].
 * Lance une erreur explicite sinon (utile en dev, capture les NaN).
 */
function assertProbability(value: number, name: string): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${name} doit etre un nombre fini, recu : ${value}`);
  }
  if (value < 0 || value > 1) {
    throw new RangeError(`${name} doit etre dans [0, 1], recu : ${value}`);
  }
}

/**
 * Convertit la precision d'un test (Se, Sp) en rapports de vraisemblance.
 *
 * Cas limites :
 *   - Sp = 1    -> LR+ = +Infinity (test parfaitement specifique : un positif
 *                  confirme la maladie).
 *   - Se = 1    -> LR- = 0         (test parfaitement sensible : un negatif
 *                  elimine la maladie).
 *   - Sp = 0    -> LR- = +Infinity (cas degenerer : tous les sains sont
 *                  positifs, un negatif est donc tres informatif a l'envers ;
 *                  mathematiquement correct).
 *   - Se = 0    -> LR+ = 0         (cas degenerer : aucun malade n'est
 *                  positif, un positif est alors impossible chez un malade).
 *
 * @throws RangeError si Se ou Sp est hors de [0, 1] ou non fini.
 */
export function computeLikelihoodRatios(
  accuracy: TestAccuracy,
): LikelihoodRatios {
  const { sensitivity, specificity } = accuracy;
  assertProbability(sensitivity, "sensitivity");
  assertProbability(specificity, "specificity");

  const oneMinusSp = 1 - specificity;
  const lrPositive =
    oneMinusSp === 0 ? Number.POSITIVE_INFINITY : sensitivity / oneMinusSp;
  const lrNegative =
    specificity === 0
      ? Number.POSITIVE_INFINITY
      : (1 - sensitivity) / specificity;

  return { lrPositive, lrNegative };
}
