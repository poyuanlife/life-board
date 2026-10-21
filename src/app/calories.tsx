import { StyleSheet, Text, View } from 'react-native';
import { DailyLog } from '@/components/DailyLog';
import { computeEnergy, DEFAULT_PROFILE, EnergyCalculator, type Profile } from '@/components/EnergyCalculator';
import { ProteinValue } from '@/components/ProteinValue';
import { H1, H2, Li, Muted, P } from '@/components/Prose';
import { SiteLayout } from '@/components/SiteLayout';
import { EMPTY_LOG, type Log } from '@/lib/diary';
import { PortionGuide } from '@/components/PortionGuide';
import { nutritionOf, portionsText, PRESETS } from '@/lib/exchange';
import { meta, PAGES } from '@/lib/meta';
import { useStoredState } from '@/lib/storage';
import { useTheme } from '@/lib/theme';

export function generateMetadata() {
  return meta(PAGES.calories.title, PAGES.calories.description);
}

export default function Calories() {
  const t = useTheme();
  const [profile, setProfile] = useStoredState<Profile>('life-board:profile', DEFAULT_PROFILE);
  const [log, setLog] = useStoredState<Log>('life-board:log', EMPTY_LOG);
  const energy = computeEnergy(profile);

  return (
    <SiteLayout title={PAGES.calories.title} description={PAGES.calories.description} maxWidth={960}>
      <View style={{ gap: 6 }}>
        <H1>BMR・TDEE 熱量計算機與飲食紀錄</H1>
        <Muted>
          算出你的基礎代謝率與每日目標熱量，再用「份數」記錄每天吃了幾份澱粉、蛋白質、蔬菜、水果，自動估算熱量和三大營養素。輸入的資料只會存在你自己的瀏覽器裡。
        </Muted>
      </View>

      <EnergyCalculator profile={profile} onChange={setProfile} />

      <View style={{ gap: 10 }}>
        <H2>📅 每日飲食紀錄</H2>
        <DailyLog log={log} onChange={setLog} target={energy?.target ?? null} weight={energy?.weight ?? null} goal={energy?.goal ?? profile.goal} />
      </View>

      <View style={{ gap: 10 }}>
        <H2>🥩 哪種蛋白質最划算？</H2>
        <ProteinValue />
      </View>

      <View style={{ gap: 8 }}>
        <H2>1 份是多少？食物份量對照</H2>
        <P>
          本站依照衛福部「食物代換表」，把食物分成六大類，同一類的每一份熱量和營養素都差不多，所以只要估計吃了「幾份」，就能算出大概的熱量，不用每樣食物都去查。
        </P>
        <PortionGuide />
      </View>

      <View style={{ gap: 8 }}>
        <H2>常見外食大約幾份？</H2>
        <View style={[styles.table, { borderColor: t.border }]}>
          {PRESETS.map((x, i) => (
            <View key={x.id} style={[styles.tr, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderColor: t.border }]}>
              <Text style={[styles.th, { color: t.text }]}>{x.name}</Text>
              <Text style={[styles.td, { color: t.muted }]}>
                {portionsText(x.p)}
                {x.extra ? `・糖約 ${x.extra} 大卡` : ''}
              </Text>
              <Text style={[styles.kcal, { color: t.text }]}>約 {Math.round(nutritionOf(x.p, x.extra).kcal / 10) * 10} 大卡</Text>
            </View>
          ))}
        </View>
        <Muted>份數為一般份量的粗估，實際會因店家、做法和份量而不同。</Muted>
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
        <Li>紀錄只存在這台裝置的瀏覽器裡，清除瀏覽資料或換手機就看不到了；最多保留最近 90 天。</Li>
      </View>
    </SiteLayout>
  );
}

const styles = StyleSheet.create({
  table: { borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  tr: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10 },
  th: { width: 170, fontWeight: '600', fontSize: 15 },
  td: { flex: 1, minWidth: 180, fontSize: 13, lineHeight: 20 },
  kcal: { fontWeight: '600', fontVariant: ['tabular-nums'] },
});
