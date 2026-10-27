import type { 
  CleanEncounterRecord, 
  DashboardFilters, 
  FrequencyItem, 
  GroupAggregationResult, 
  ModelEvaluationMetrics 
} from '../types/dataset';

export interface NumericSummary {
  count: number;
  min: number;
  max: number;
  mean: number;
  median: number;
  q1: number;
  q3: number;
  iqr: number;
  variance: number;
  stdDev: number;
  skewness: number;
}

export function calculateNumericSummary(values: number[]): NumericSummary {
  const n = values.length;
  if (n === 0) {
    return {
      count: 0,
      min: 0,
      max: 0,
      mean: 0,
      median: 0,
      q1: 0,
      q3: 0,
      iqr: 0,
      variance: 0,
      stdDev: 0,
      skewness: 0
    };
  }

  // Sort values copy for quantile math
  const sorted = [...values].sort((a, b) => a - b);
  
  const min = sorted[0];
  const max = sorted[n - 1];
  
  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += sorted[i];
  }
  const mean = sum / n;

  // Median, Q1, Q3
  const getPercentile = (p: number) => {
    const idx = (n - 1) * p;
    const low = Math.floor(idx);
    const high = Math.ceil(idx);
    if (low === high) return sorted[low];
    return sorted[low] + (sorted[high] - sorted[low]) * (idx - low);
  };

  const median = getPercentile(0.5);
  const q1 = getPercentile(0.25);
  const q3 = getPercentile(0.75);
  const iqr = q3 - q1;

  // Variance & Standard Deviation
  let sumSquaredDiff = 0;
  let sumCubedDiff = 0;
  for (let i = 0; i < n; i++) {
    const diff = sorted[i] - mean;
    sumSquaredDiff += diff * diff;
    sumCubedDiff += diff * diff * diff;
  }

  const variance = n > 1 ? sumSquaredDiff / (n - 1) : 0;
  const stdDev = Math.sqrt(variance);

  // Fisher-Pearson Skewness
  const skewness = (stdDev > 0 && n > 2) 
    ? (n / ((n - 1) * (n - 2))) * (sumCubedDiff / Math.pow(stdDev, 3)) 
    : 0;

  return {
    count: n,
    min,
    max,
    mean: Number(mean.toFixed(3)),
    median: Number(median.toFixed(2)),
    q1: Number(q1.toFixed(2)),
    q3: Number(q3.toFixed(2)),
    iqr: Number(iqr.toFixed(2)),
    variance: Number(variance.toFixed(3)),
    stdDev: Number(stdDev.toFixed(3)),
    skewness: Number(skewness.toFixed(3))
  };
}

/**
 * Compute Pearson Correlation Coefficient between two numeric variables
 */
export function calculatePearsonCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n <= 1) return 0;

  let sumX = 0;
  let sumY = 0;
  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
  }
  const meanX = sumX / n;
  const meanY = sumY / n;

  let numerator = 0;
  let sumSqX = 0;
  let sumSqY = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    numerator += dx * dy;
    sumSqX += dx * dx;
    sumSqY += dy * dy;
  }

  const denominator = Math.sqrt(sumSqX * sumSqY);
  if (denominator === 0) return 0;

  return Number((numerator / denominator).toFixed(4));
}

/**
 * Compute categorical frequency distribution and mean LOS by group
 */
export function calculateGroupLOS(
  data: Array<{ group: string; los: number }>
): Array<{
  name: string;
  count: number;
  percentage: number;
  meanLOS: number;
  medianLOS: number;
  minLOS: number;
  maxLOS: number;
}> {
  const groups = new Map<string, number[]>();

  for (const item of data) {
    const key = item.group || 'Unspecified';
    let arr = groups.get(key);
    if (!arr) {
      arr = [];
      groups.set(key, arr);
    }
    arr.push(item.los);
  }

  const totalCount = data.length;
  const results: Array<{
    name: string;
    count: number;
    percentage: number;
    meanLOS: number;
    medianLOS: number;
    minLOS: number;
    maxLOS: number;
  }> = [];

  groups.forEach((losValues, groupName) => {
    const summary = calculateNumericSummary(losValues);
    results.push({
      name: groupName,
      count: losValues.length,
      percentage: totalCount > 0 ? Number(((losValues.length / totalCount) * 100).toFixed(2)) : 0,
      meanLOS: summary.mean,
      medianLOS: summary.median,
      minLOS: summary.min,
      maxLOS: summary.max
    });
  });

  return results.sort((a, b) => b.count - a.count);
}

/**
 * Standard Normal Error Function erf(x) approximation (Abramowitz & Stegun)
 */
function erf(x: number): number {
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}

/**
 * Standard Normal cumulative distribution function
 */
function normalCDF(z: number): number {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

/**
 * One-Way Analysis of Variance (ANOVA)
 * Tests whether mean LOS differs significantly across multiple categorical groups.
 */
export interface ANOVAResult {
  fStatistic: number;
  pValue: number;
  dfBetween: number;
  dfWithin: number;
  ssBetween: number;
  ssWithin: number;
  etaSquared: number;
  groupStats: Array<{
    name: string;
    n: number;
    mean: number;
    stdDev: number;
  }>;
}

export function calculateOneWayANOVA(groups: Record<string, number[]>): ANOVAResult {
  const groupKeys = Object.keys(groups).filter((k) => groups[k] && groups[k].length > 0);
  const k = groupKeys.length;
  if (k < 2) {
    return {
      fStatistic: 0,
      pValue: 1,
      dfBetween: 0,
      dfWithin: 0,
      ssBetween: 0,
      ssWithin: 0,
      etaSquared: 0,
      groupStats: []
    };
  }

  let totalN = 0;
  let grandSum = 0;
  const groupSummaries: Array<{ name: string; n: number; sum: number; mean: number; ss: number }> = [];

  for (const key of groupKeys) {
    const vals = groups[key];
    const n = vals.length;
    let sum = 0;
    for (let i = 0; i < n; i++) sum += vals[i];
    const mean = sum / n;

    let ss = 0;
    for (let i = 0; i < n; i++) {
      const d = vals[i] - mean;
      ss += d * d;
    }

    totalN += n;
    grandSum += sum;
    groupSummaries.push({ name: key, n, sum, mean, ss });
  }

  const grandMean = grandSum / totalN;
  let ssBetween = 0;
  let ssWithin = 0;

  for (const g of groupSummaries) {
    ssBetween += g.n * Math.pow(g.mean - grandMean, 2);
    ssWithin += g.ss;
  }

  const dfBetween = k - 1;
  const dfWithin = totalN - k;

  const msBetween = dfBetween > 0 ? ssBetween / dfBetween : 0;
  const msWithin = dfWithin > 0 ? ssWithin / dfWithin : 0;

  const fStatistic = msWithin > 0 ? msBetween / msWithin : 0;
  const etaSquared = (ssBetween + ssWithin) > 0 ? ssBetween / (ssBetween + ssWithin) : 0;

  // Approximate p-value for large samples using F to chi-square / normal asymptotic transform
  // For dfWithin > 1000, dfBetween * F ~ ChiSquare(dfBetween)
  const zScore = Math.sqrt(Math.max(0, 2 * fStatistic)) - Math.sqrt(Math.max(0, 2 * dfBetween - 1));
  const pValue = fStatistic > 1 ? Math.max(1e-15, 2 * (1 - normalCDF(Math.abs(zScore)))) : 0.999;

  return {
    fStatistic: Number(fStatistic.toFixed(2)),
    pValue: pValue < 0.0001 ? 0.0001 : Number(pValue.toFixed(4)),
    dfBetween,
    dfWithin,
    ssBetween: Number(ssBetween.toFixed(1)),
    ssWithin: Number(ssWithin.toFixed(1)),
    etaSquared: Number(etaSquared.toFixed(4)),
    groupStats: groupSummaries.map((g) => ({
      name: g.name,
      n: g.n,
      mean: Number(g.mean.toFixed(2)),
      stdDev: g.n > 1 ? Number(Math.sqrt(g.ss / (g.n - 1)).toFixed(2)) : 0
    }))
  };
}

/**
 * Welch's Two-Sample t-test (unequal variances assumed)
 */
export interface TTestResult {
  tStatistic: number;
  pValue: number;
  df: number;
  meanDiff: number;
  mean1: number;
  mean2: number;
  cohensD: number;
  ci95: [number, number];
  n1: number;
  n2: number;
}

export function calculateWelchTTest(group1: number[], group2: number[]): TTestResult {
  const n1 = group1.length;
  const n2 = group2.length;
  if (n1 < 2 || n2 < 2) {
    return {
      tStatistic: 0,
      pValue: 1,
      df: 0,
      meanDiff: 0,
      mean1: 0,
      mean2: 0,
      cohensD: 0,
      ci95: [0, 0],
      n1,
      n2
    };
  }

  let sum1 = 0;
  for (let i = 0; i < n1; i++) sum1 += group1[i];
  const m1 = sum1 / n1;

  let sum2 = 0;
  for (let i = 0; i < n2; i++) sum2 += group2[i];
  const m2 = sum2 / n2;

  let s1 = 0;
  for (let i = 0; i < n1; i++) s1 += (group1[i] - m1) * (group1[i] - m1);
  const v1 = s1 / (n1 - 1);

  let s2 = 0;
  for (let i = 0; i < n2; i++) s2 += (group2[i] - m2) * (group2[i] - m2);
  const v2 = s2 / (n2 - 1);

  const seDiff = Math.sqrt(v1 / n1 + v2 / n2);
  const meanDiff = m1 - m2;
  const tStat = seDiff > 0 ? meanDiff / seDiff : 0;

  // Welch-Satterthwaite df
  const numDf = Math.pow(v1 / n1 + v2 / n2, 2);
  const denDf = Math.pow(v1 / n1, 2) / (n1 - 1) + Math.pow(v2 / n2, 2) / (n2 - 1);
  const df = denDf > 0 ? Math.round(numDf / denDf) : n1 + n2 - 2;

  const pooledSD = Math.sqrt(((n1 - 1) * v1 + (n2 - 1) * v2) / (n1 + n2 - 2));
  const cohensD = pooledSD > 0 ? meanDiff / pooledSD : 0;

  const z = Math.abs(tStat);
  const pVal = 2 * (1 - normalCDF(z));

  const margin = 1.96 * seDiff;

  return {
    tStatistic: Number(tStat.toFixed(3)),
    pValue: pVal < 0.0001 ? 0.0001 : Number(pVal.toFixed(4)),
    df,
    meanDiff: Number(meanDiff.toFixed(3)),
    mean1: Number(m1.toFixed(2)),
    mean2: Number(m2.toFixed(2)),
    cohensD: Number(cohensD.toFixed(3)),
    ci95: [Number((meanDiff - margin).toFixed(3)), Number((meanDiff + margin).toFixed(3))],
    n1,
    n2
  };
}

/**
 * Pearson Correlation with Inferential Test & 95% Confidence Interval
 */
export interface CorrelationInferenceResult {
  r: number;
  rSquared: number;
  tStatistic: number;
  pValue: number;
  ci95: [number, number];
  n: number;
}

export function calculateCorrelationInference(x: number[], y: number[]): CorrelationInferenceResult {
  const n = Math.min(x.length, y.length);
  const r = calculatePearsonCorrelation(x, y);
  if (n <= 2) {
    return { r, rSquared: 0, tStatistic: 0, pValue: 1, ci95: [0, 0], n };
  }

  const denom = Math.sqrt(Math.max(1e-12, 1 - r * r));
  const tStat = r * Math.sqrt((n - 2)) / denom;
  const pVal = 2 * (1 - normalCDF(Math.abs(tStat)));

  // Fisher z-transform for 95% CI
  const z = 0.5 * Math.log((1 + r) / Math.max(1e-12, 1 - r));
  const seZ = 1 / Math.sqrt(n - 3);
  const zLow = z - 1.96 * seZ;
  const zHigh = z + 1.96 * seZ;
  const rLow = (Math.exp(2 * zLow) - 1) / (Math.exp(2 * zLow) + 1);
  const rHigh = (Math.exp(2 * zHigh) - 1) / (Math.exp(2 * zHigh) + 1);

  return {
    r,
    rSquared: Number((r * r).toFixed(4)),
    tStatistic: Number(tStat.toFixed(2)),
    pValue: pVal < 0.0001 ? 0.0001 : Number(pVal.toFixed(4)),
    ci95: [Number(rLow.toFixed(4)), Number(rHigh.toFixed(4))],
    n
  };
}

/**
 * Assign fractional ranks with average tie handling
 */
export function assignRanks(values: number[]): number[] {
  const n = values.length;
  const indexed = values.map((v, i) => ({ val: v, origIdx: i }));
  indexed.sort((a, b) => a.val - b.val);

  const ranks = new Array<number>(n);
  let i = 0;
  while (i < n) {
    let j = i;
    while (j < n - 1 && indexed[j + 1].val === indexed[j].val) {
      j++;
    }
    const avgRank = (i + 1 + j + 1) / 2; // 1-based ranks
    for (let k = i; k <= j; k++) {
      ranks[indexed[k].origIdx] = avgRank;
    }
    i = j + 1;
  }
  return ranks;
}

/**
 * Spearman Rank-Order Correlation Coefficient (non-parametric monotonic association)
 */
export interface SpearmanCorrelationResult {
  rho: number;
  rhoSquared: number;
  tStatistic: number;
  pValue: number;
  n: number;
}

export function calculateSpearmanCorrelation(x: number[], y: number[]): SpearmanCorrelationResult {
  const n = Math.min(x.length, y.length);
  if (n <= 2) {
    return { rho: 0, rhoSquared: 0, tStatistic: 0, pValue: 1, n };
  }
  const rankX = assignRanks(x.slice(0, n));
  const rankY = assignRanks(y.slice(0, n));
  const rho = calculatePearsonCorrelation(rankX, rankY);

  const denom = Math.sqrt(Math.max(1e-12, 1 - rho * rho));
  const tStat = rho * Math.sqrt(n - 2) / denom;
  const z = Math.abs(tStat);
  const pVal = 2 * (1 - normalCDF(z));

  return {
    rho: Number(rho.toFixed(4)),
    rhoSquared: Number((rho * rho).toFixed(4)),
    tStatistic: Number(tStat.toFixed(2)),
    pValue: pVal < 0.0001 ? 0.0001 : Number(pVal.toFixed(4)),
    n
  };
}

/**
 * Mann-Whitney U Test (Wilcoxon Rank-Sum Test)
 * Non-parametric comparison between two independent groups.
 */
export interface MannWhitneyResult {
  uStatistic: number;
  zScore: number;
  pValue: number;
  rankBiserialCorr: number; // effect size r in [-1, 1]
  n1: number;
  n2: number;
  median1: number;
  median2: number;
  rankSum1: number;
  rankSum2: number;
}

export function calculateMannWhitneyU(sample1: number[], sample2: number[]): MannWhitneyResult {
  const n1 = sample1.length;
  const n2 = sample2.length;
  if (n1 === 0 || n2 === 0) {
    return {
      uStatistic: 0,
      zScore: 0,
      pValue: 1,
      rankBiserialCorr: 0,
      n1,
      n2,
      median1: 0,
      median2: 0,
      rankSum1: 0,
      rankSum2: 0
    };
  }

  // Combine and assign ranks
  const combined = [...sample1, ...sample2];
  const ranks = assignRanks(combined);

  let rankSum1 = 0;
  for (let i = 0; i < n1; i++) {
    rankSum1 += ranks[i];
  }
  let rankSum2 = 0;
  for (let i = n1; i < n1 + n2; i++) {
    rankSum2 += ranks[i];
  }

  const u1 = rankSum1 - (n1 * (n1 + 1)) / 2;
  const u2 = n1 * n2 - u1;
  const uStat = Math.min(u1, u2);

  const meanU = (n1 * n2) / 2;
  const stdU = Math.sqrt((n1 * n2 * (n1 + n2 + 1)) / 12);
  const zScore = stdU > 0 ? (uStat - meanU) / stdU : 0;
  const pVal = 2 * (1 - normalCDF(Math.abs(zScore)));

  // Rank-biserial correlation: r = 1 - (2U / (n1*n2))
  const rankBiserial = n1 * n2 > 0 ? 1 - (2 * uStat) / (n1 * n2) : 0;

  const s1 = [...sample1].sort((a, b) => a - b);
  const s2 = [...sample2].sort((a, b) => a - b);
  const median1 = s1[Math.floor(n1 / 2)];
  const median2 = s2[Math.floor(n2 / 2)];

  return {
    uStatistic: Math.round(uStat),
    zScore: Number(zScore.toFixed(3)),
    pValue: pVal < 0.0001 ? 0.0001 : Number(pVal.toFixed(4)),
    rankBiserialCorr: Number(rankBiserial.toFixed(3)),
    n1,
    n2,
    median1,
    median2,
    rankSum1: Math.round(rankSum1),
    rankSum2: Math.round(rankSum2)
  };
}

/**
 * Kruskal-Wallis H Test (Non-parametric One-Way ANOVA)
 * Evaluates whether k independent samples originate from identical median distributions.
 */
export interface KruskalWallisResult {
  hStatistic: number;
  pValue: number;
  df: number;
  etaSquaredH: number; // effect size: (H - k + 1) / (N - k)
  totalN: number;
  groups: Array<{
    name: string;
    n: number;
    median: number;
    meanRank: number;
  }>;
}

export function calculateKruskalWallis(groups: Record<string, number[]>): KruskalWallisResult {
  const keys = Object.keys(groups).filter((k) => groups[k] && groups[k].length > 0);
  const k = keys.length;
  if (k < 2) {
    return { hStatistic: 0, pValue: 1, df: 0, etaSquaredH: 0, totalN: 0, groups: [] };
  }

  let totalN = 0;
  const flatVals: number[] = [];
  const groupIndices: Array<{ name: string; start: number; length: number; median: number }> = [];

  for (const key of keys) {
    const vals = groups[key];
    const n = vals.length;
    const sorted = [...vals].sort((a, b) => a - b);
    const median = sorted[Math.floor(n / 2)];
    groupIndices.push({
      name: key,
      start: flatVals.length,
      length: n,
      median
    });
    for (let i = 0; i < n; i++) {
      flatVals.push(vals[i]);
    }
    totalN += n;
  }

  const allRanks = assignRanks(flatVals);

  let sumRankSquaredOverN = 0;
  const groupSummaries: Array<{ name: string; n: number; median: number; meanRank: number }> = [];

  for (const g of groupIndices) {
    let rankSum = 0;
    for (let i = g.start; i < g.start + g.length; i++) {
      rankSum += allRanks[i];
    }
    sumRankSquaredOverN += (rankSum * rankSum) / g.length;
    groupSummaries.push({
      name: g.name,
      n: g.length,
      median: g.median,
      meanRank: Number((rankSum / g.length).toFixed(1))
    });
  }

  const h = (12 / (totalN * (totalN + 1))) * sumRankSquaredOverN - 3 * (totalN + 1);
  const df = k - 1;

  // Approximate chi-square p-value for large N
  const zScore = Math.sqrt(Math.max(0, 2 * h)) - Math.sqrt(Math.max(0, 2 * df - 1));
  const pVal = h > 1 ? Math.max(1e-15, 2 * (1 - normalCDF(Math.abs(zScore)))) : 0.999;

  const etaSquaredH = (totalN - k) > 0 ? Math.max(0, (h - k + 1) / (totalN - k)) : 0;

  return {
    hStatistic: Number(h.toFixed(2)),
    pValue: pVal < 0.0001 ? 0.0001 : Number(pVal.toFixed(4)),
    df,
    etaSquaredH: Number(etaSquaredH.toFixed(4)),
    totalN,
    groups: groupSummaries
  };
}

/**
 * Multiple-Comparison Correction (Benjamini-Hochberg False Discovery Rate & Bonferroni)
 */
export interface AdjustedPValue {
  originalP: number;
  bonferroniP: number;
  fdrQValue: number;
}

export function adjustPValues(rawPValues: number[]): AdjustedPValue[] {
  const m = rawPValues.length;
  if (m === 0) return [];

  // Pair each p-value with its original index
  const indexed = rawPValues.map((p, idx) => ({ p, idx }));
  indexed.sort((a, b) => a.p - b.p);

  const adjusted = new Array<AdjustedPValue>(m);
  let minQ = 1.0;

  // Compute Benjamini-Hochberg in reverse order
  for (let i = m - 1; i >= 0; i--) {
    const rank = i + 1;
    const rawP = indexed[i].p;
    const q = Math.min(1.0, (rawP * m) / rank);
    minQ = Math.min(minQ, q);

    adjusted[indexed[i].idx] = {
      originalP: rawP,
      bonferroniP: Number(Math.min(1.0, rawP * m).toFixed(4)),
      fdrQValue: Number(minQ.toFixed(4))
    };
  }

  return adjusted;
}

/**
 * Tukey's Fences Outlier Investigation for Length-of-Stay
 */
export interface OutlierAuditResult {
  q1: number;
  q3: number;
  iqr: number;
  lowerMildFence: number;
  upperMildFence: number;
  lowerExtremeFence: number;
  upperExtremeFence: number;
  mildOutliersCount: number;
  mildOutliersPct: number;
  extremeOutliersCount: number;
  extremeOutliersPct: number;
  clinicalInterpretation: string;
}

export function detectTukeyOutliers(losValues: number[]): OutlierAuditResult {
  const n = losValues.length;
  if (n === 0) {
    return {
      q1: 0, q3: 0, iqr: 0,
      lowerMildFence: 0, upperMildFence: 0,
      lowerExtremeFence: 0, upperExtremeFence: 0,
      mildOutliersCount: 0, mildOutliersPct: 0,
      extremeOutliersCount: 0, extremeOutliersPct: 0,
      clinicalInterpretation: 'Empty cohort'
    };
  }

  const sorted = [...losValues].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(n * 0.25)];
  const q3 = sorted[Math.floor(n * 0.75)];
  const iqr = q3 - q1;

  const upperMildFence = q3 + 1.5 * iqr; // Typically 6 + 1.5*4 = 12 days
  const upperExtremeFence = q3 + 3.0 * iqr; // Typically 6 + 12 = 18 days (dataset caps at 14)

  const mildOutliersCount = sorted.filter((v) => v > upperMildFence).length;
  const extremeOutliersCount = sorted.filter((v) => v > upperExtremeFence).length;

  return {
    q1,
    q3,
    iqr,
    lowerMildFence: Math.max(1, q1 - 1.5 * iqr),
    upperMildFence,
    lowerExtremeFence: Math.max(1, q1 - 3.0 * iqr),
    upperExtremeFence,
    mildOutliersCount,
    mildOutliersPct: Number(((mildOutliersCount / n) * 100).toFixed(2)),
    extremeOutliersCount,
    extremeOutliersPct: Number(((extremeOutliersCount / n) * 100).toFixed(2)),
    clinicalInterpretation:
      `Tukey mild upper fence is ${upperMildFence} days. In total, ${mildOutliersCount.toLocaleString()} stays (${((mildOutliersCount / n) * 100).toFixed(1)}%) ` +
      `are 13 or 14 days long. In clinical research, these represent authentic severe medical trajectories (multisystem diabetic ketoacidosis, sepsis, post-amputation recovery) ` +
      `rather than measurement recording errors. In accordance with clinical methodology, they are retained in the empirical cohort.`
  };
}

// -----------------------------------------------------------------------------
// Centralized Data Processing Utilities
// -----------------------------------------------------------------------------

function buildLosRangePredicate(losRange: string): (los: number) => boolean {
  switch (losRange) {
    case '1-3': return (v) => v >= 1 && v <= 3;
    case '4-7': return (v) => v >= 4 && v <= 7;
    case '8-14': return (v) => v >= 8 && v <= 14;
    default: return () => true;
  }
}

/** Apply DashboardFilters to a records array without mutating the original. */
export function applyFilters(
  records: CleanEncounterRecord[],
  filters: DashboardFilters
): CleanEncounterRecord[] {
  const losRangePredicate = buildLosRangePredicate(filters.losRange);
  const searchQ = filters.search.trim().toLowerCase();
  return records.filter((r) => {
    if (filters.age !== 'ALL' && r.age !== filters.age) return false;
    if (filters.gender !== 'ALL' && r.gender !== filters.gender) return false;
    if (filters.admissionType !== 'ALL' && r.admission_type_desc !== filters.admissionType) return false;
    if (filters.admissionSource !== 'ALL' && r.admission_source_desc !== filters.admissionSource) return false;
    if (filters.dischargeDisposition !== 'ALL' && r.discharge_disposition_desc !== filters.dischargeDisposition) return false;
    if (filters.readmission !== 'ALL' && r.readmitted !== filters.readmission) return false;
    if (!losRangePredicate(r.time_in_hospital)) return false;
    if (searchQ) {
      const hit =
        r.encounter_id.includes(searchQ) ||
        r.patient_nbr.includes(searchQ) ||
        r.diag_1_category.toLowerCase().includes(searchQ) ||
        (r.medical_specialty ?? '').toLowerCase().includes(searchQ) ||
        (r.race ?? '').toLowerCase().includes(searchQ);
      if (!hit) return false;
    }
    return true;
  });
}

/** Build a categorical frequency table from a field extractor. null / '?' / '' => "Missing / Unknown". */
export function buildFrequencyTable(
  records: CleanEncounterRecord[],
  extract: (r: CleanEncounterRecord) => string | null
): FrequencyItem[] {
  const n = records.length;
  const counts = new Map<string, number>();
  for (const r of records) {
    const raw = extract(r);
    const cat = raw === null || raw === '?' || raw === '' ? 'Missing / Unknown' : raw;
    counts.set(cat, (counts.get(cat) ?? 0) + 1);
  }
  const result: FrequencyItem[] = [];
  counts.forEach((count, category) => {
    result.push({ category, count, percentage: n > 0 ? Number(((count / n) * 100).toFixed(2)) : 0 });
  });
  return result.sort((a, b) => b.count - a.count);
}

/** Aggregate time_in_hospital stats by string groupFn. */
export function aggregateByGroup(
  records: CleanEncounterRecord[],
  groupFn: (r: CleanEncounterRecord) => string
): GroupAggregationResult[] {
  const map = new Map<string, number[]>();
  for (const r of records) {
    const g = groupFn(r);
    let arr = map.get(g);
    if (!arr) { arr = []; map.set(g, arr); }
    arr.push(r.time_in_hospital);
  }
  const results: GroupAggregationResult[] = [];
  map.forEach((vals, group) => {
    const s = calculateNumericSummary(vals);
    results.push({ group, count: s.count, mean: s.mean, median: s.median, min: s.min, max: s.max, stdDev: s.stdDev });
  });
  return results.sort((a, b) => b.count - a.count);
}

/** Count missing values per column key. A value is missing if null, '?', or ''. */
export function countMissingByColumn(
  records: CleanEncounterRecord[],
  keys: string[]
): Array<{ column: string; missingCount: number; missingPct: number }> {
  const n = records.length;
  const counts: Record<string, number> = {};
  for (const k of keys) counts[k] = 0;
  for (const r of records) {
    for (const k of keys) {
      const v = (r as unknown as Record<string, unknown>)[k];
      if (v === null || v === undefined || v === '?' || v === '') counts[k]++;
    }
  }
  return keys
    .map((column) => ({
      column,
      missingCount: counts[column],
      missingPct: n > 0 ? Number(((counts[column] / n) * 100).toFixed(2)) : 0
    }))
    .filter((e) => e.missingCount > 0)
    .sort((a, b) => b.missingCount - a.missingCount);
}

/** Calculate MAE, RMSE, and R^2 on held-out model predictions vs actual LOS. */
export function calculateModelMetrics(
  actual: number[],
  predicted: number[]
): ModelEvaluationMetrics {
  const n = Math.min(actual.length, predicted.length);
  if (n === 0) {
    return { n: 0, mae: 0, rmse: 0, r2: 0, meanResidual: 0, actualMean: 0, predMean: 0 };
  }
  let sumActual = 0, sumPred = 0, sumAbs = 0, sumSq = 0, sumResidual = 0;
  for (let i = 0; i < n; i++) {
    const residual = actual[i] - predicted[i];
    sumActual += actual[i];
    sumPred += predicted[i];
    sumAbs += Math.abs(residual);
    sumSq += residual * residual;
    sumResidual += residual;
  }
  const actualMean = sumActual / n;
  let ssTot = 0;
  for (let i = 0; i < n; i++) ssTot += (actual[i] - actualMean) ** 2;
  return {
    n,
    mae: Number((sumAbs / n).toFixed(3)),
    rmse: Number(Math.sqrt(sumSq / n).toFixed(3)),
    r2: Number((ssTot > 0 ? 1 - sumSq / ssTot : 0).toFixed(4)),
    meanResidual: Number((sumResidual / n).toFixed(3)),
    actualMean: Number(actualMean.toFixed(3)),
    predMean: Number((sumPred / n).toFixed(3))
  };
}
