export function shouldAutoplayWeddingCoverVideo(animationPreset, prefersReducedMotion = false, saveData = false) {
  return animationPreset !== 'Nenhum' && !prefersReducedMotion && !saveData
}
