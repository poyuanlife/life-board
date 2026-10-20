// BMR、TDEE、BMI 的計算

export type Sex = 'male' | 'female';

export const ACTIVITY = [
  { factor: 1.2, label: '久坐', hint: '辦公室工作，幾乎不運動' },
  { factor: 1.375, label: '輕度活動', hint: '每週運動 1～3 天' },
  { factor: 1.55, label: '中度活動', hint: '每週運動 3～5 天' },
  { factor: 1.725, label: '高度活動', hint: '每週運動 6～7 天' },
  { factor: 1.9, label: '非常高', hint: '體力勞動工作或每天高強度訓練' },
] as const;

/** 基礎代謝率：Mifflin-St Jeor 公式（目前最常用、誤差較小的版本） */
export function bmr(sex: Sex, age: number, heightCm: number, weightKg: number) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(sex === 'male' ? base + 5 : base - 161);
}

export function tdee(bmrValue: number, factor: number) {
  return Math.round(bmrValue * factor);
}

export function bmi(heightCm: number, weightKg: number) {
  const m = heightCm / 100;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}

/** 衛福部國民健康署的成人 BMI 標準 */
export function bmiLevel(v: number): { label: string; tone: 'down' | 'flat' | 'up' } {
  if (v < 18.5) return { label: '體重過輕', tone: 'flat' };
  if (v < 24) return { label: '健康體位', tone: 'down' };
  if (v < 27) return { label: '過重', tone: 'flat' };
  return { label: '肥胖', tone: 'up' };
}
