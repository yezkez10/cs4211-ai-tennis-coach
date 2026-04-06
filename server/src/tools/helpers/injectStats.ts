import { MatchStats } from "./getMatchWeights";
import { getMatchWeights } from "./getMatchWeights";

// Injects raw counts into template via placeholder replacement
export function injectStats(template: string, matchStats: MatchStats): string {
  const weights = getMatchWeights(matchStats);
  let result = template;
  for (const [key, value] of Object.entries(weights)) {
    const placeholder = `{{${key}}}`;
    result = result.replaceAll(placeholder, value.toString());
  }
  return result;
}