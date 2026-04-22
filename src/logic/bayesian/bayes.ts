// =============================================================================
// Evidence Kine - Moteur bayesien : theoreme de Bayes sur les odds
// -----------------------------------------------------------------------------
// Serious Game pedagogique uniquement. Aucune donnee de patient reel.
//
// Ce module calcule la probabilite post-test (post-test probability) a partir
// de la probabilite pre-test et d'un rapport de vraisemblance (LR+ ou LR-).
//
//   odds(p)        = p / (1 - p)
//   post_odds      = pre_odds * LR
//   post_prob      = post_odds / (1 + post_odds)
//
// Seuls les LR sont utilises : combiner des pourcentages Se/Sp bruts est
// mathematiquement incorrect des qu'on chaine plusieurs tests.
// =============================================================================

/**
 * Convertit une probabilite p dans [0, 1] en odds p / (1 - p).
 * Retourne `Infinity` pour p = 1.
 */
export function probabilityToOdds(probability: number): number {
  if (probability < 0 || probability > 1 || !Number.isFinite(probability)) {
    throw new RangeError(
      `probability doit etre dans [0, 1], recu : ${probability}`,
    );
  }
  if (probability === 1) return Number.POSITIVE_INFINITY;
  return probability / (1 - probability);
}

/**
 * Convertit des odds o >= 0 en probabilite o / (1 + o).
 * Retourne `1` pour o = Infinity.
 */
export function oddsToProbability(odds: number): number {
  if (odds < 0) {
    throw new RangeError(`odds doit etre >= 0, recu : ${odds}`);
  }
  if (odds === Number.POSITIVE_INFINITY) return 1;
  if (Number.isNaN(odds)) {
    throw new RangeError(`odds ne peut pas etre NaN`);
  }
  return odds / (1 + odds);
}

/**
 * Applique le theoreme de Bayes sur les odds.
 *
 *   post_prob = bayes(pre_prob, LR)
 *   post_odds = pre_odds * LR
 *
 * Cas limites :
 *   - preTestProb = 0 -> 0           (aucune maladie a priori : aucun test ne
 *                                     peut la creer).
 *   - preTestProb = 1 -> 1           (certitude a priori : meme un LR- bas ne
 *                                     peut pas descendre, car pre_odds = Inf).
 *   - likelihoodRatio = 1 -> inchange (test non informatif).
 *   - likelihoodRatio = 0 -> 0        (test parfaitement eliminatoire).
 *   - likelihoodRatio = +Infinity -> 1 si preTestProb > 0 (test parfaitement
 *                                     confirmatoire).
 *
 * @param preTestProb - Probabilite pre-test dans [0, 1].
 * @param likelihoodRatio - LR (LR+ ou LR-) >= 0, peut etre +Infinity.
 * @returns Probabilite post-test dans [0, 1].
 * @throws RangeError si les entrees sont hors domaine.
 */
export function postTestProbability(
  preTestProb: number,
  likelihoodRatio: number,
): number {
  if (!Number.isFinite(preTestProb) || preTestProb < 0 || preTestProb > 1) {
    throw new RangeError(
      `preTestProb doit etre dans [0, 1], recu : ${preTestProb}`,
    );
  }
  if (Number.isNaN(likelihoodRatio) || likelihoodRatio < 0) {
    throw new RangeError(
      `likelihoodRatio doit etre >= 0 (peut etre Infinity), recu : ${likelihoodRatio}`,
    );
  }

  if (preTestProb === 0) return 0;
  if (preTestProb === 1) return 1;
  if (likelihoodRatio === 0) return 0;
  if (likelihoodRatio === Number.POSITIVE_INFINITY) return 1;

  const preOdds = probabilityToOdds(preTestProb);
  const postOdds = preOdds * likelihoodRatio;
  return oddsToProbability(postOdds);
}
