import { View } from 'react-native';
import { CalorieTable, EMPTY_DIARY, type Diary } from '@/components/CalorieTable';
import { computeEnergy, DEFAULT_PROFILE, EnergyCalculator, type Profile } from '@/components/EnergyCalculator';
import { H1, H2, Li, Muted, P } from '@/components/Prose';
import { SiteLayout } from '@/components/SiteLayout';
import { meta, PAGES } from '@/lib/meta';
import { useStoredState } from '@/lib/storage';

export function generateMetadata() {
  return meta(PAGES.calories.title, PAGES.calories.description);
}

export default function Calories() {
  const [profile, setProfile] = useStoredState<Profile>('life-board:profile', DEFAULT_PROFILE);
  const [diary, setDiary] = useStoredState<Diary>('life-board:diary', EMPTY_DIARY);
  const energy = computeEnergy(profile);

  return (
    <SiteLayout title={PAGES.calories.title} description={PAGES.calories.description} maxWidth={960}>
      <View style={{ gap: 6 }}>
        <H1>BMR・TDEE 熱量計算機</H1>
        <Muted>算出你的基礎代謝率與每日總熱量消耗，再用下方的卡路里計算表加總今天吃了多少。輸入的資料只會存在你自己的瀏覽器裡。</Muted>
      </View>

      <EnergyCalculator profile={profile} onChange={setProfile} />

      <View style={{ gap: 10 }}>
        <H2>🍱 卡路里計算表</H2>
        <CalorieTable diary={diary} onChange={setDiary} target={energy?.tdee ?? null} />
      </View>

      <View style={{ gap: 8 }}>
        <H2>什麼是 BMR？</H2>
        <P>
          BMR（Basal Metabolic Rate，基礎代謝率）是身體在完全靜止、不做任何活動時，維持呼吸、心跳、體溫等基本生理功能所需要的熱量。就算整天躺著不動，身體也會消耗這些熱量。本站使用目前最常用的 Mifflin-St Jeor 公式計算：
        </P>
        <Li>男性：10 × 體重（公斤）＋ 6.25 × 身高（公分）− 5 × 年齡 ＋ 5</Li>
        <Li>女性：10 × 體重（公斤）＋ 6.25 × 身高（公分）− 5 × 年齡 − 161</Li>
      </View>

      <View style={{ gap: 8 }}>
        <H2>什麼是 TDEE？</H2>
        <P>
          TDEE（Total Daily Energy Expenditure，每日總熱量消耗）是 BMR 再加上走路、工作、運動等日常活動所消耗的熱量，計算方式是「BMR × 活動係數」。活動量越大，係數越高（久坐 1.2、輕度 1.375、中度 1.55、高度 1.725、非常高 1.9）。
        </P>
        <P>
          每天吃進的熱量等於 TDEE 時，體重大致會維持不變；想減脂可以每天少吃約 500 大卡，大約每週減少 0.5 公斤；想增肌則可以多吃約 300 大卡，並搭配重量訓練。
        </P>
      </View>

      <View style={{ gap: 8 }}>
        <H2>使用提醒</H2>
        <Li>計算結果是依公式推估的參考值，每個人的實際代謝會因肌肉量、體質與健康狀況而不同。</Li>
        <Li>長期每天攝取低於基礎代謝率的熱量，可能影響健康，不建議自行極端節食。</Li>
        <Li>孕婦、哺乳期、未成年或有慢性疾病者，請諮詢醫師或營養師後再調整飲食。</Li>
      </View>
    </SiteLayout>
  );
}
