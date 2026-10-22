import { View } from 'react-native';
import { ExtLink } from '@/components/ExtLink';
import { H1, H2, Li, Muted, P } from '@/components/Prose';
import { SiteLayout } from '@/components/SiteLayout';
import { meta, PAGES } from '@/lib/meta';
import { CONTACT_EMAIL } from '@/lib/site';

export function generateMetadata() {
  return meta(PAGES.about.title, PAGES.about.description);
}

export default function About() {
  return (
    <SiteLayout
      title={PAGES.about.title}
      description={PAGES.about.description}
      maxWidth={760}>
      <H1>關於本站</H1>

      <View style={{ gap: 8 }}>
        <P>
          生活物價看板是一個免費的台灣民生物價整理網站。我們把散落在不同政府網站的油價、匯率、蔬果、雞蛋與豬肉價格整理在同一個畫面，並用「物價溫度計」、紅綠燈號和週 K 線，讓你一眼看出這週什麼變貴、什麼變便宜。
        </P>
        <P>每週也會整理一篇「每週物價觀察」，用文字說明本週的漲跌重點，方便安排採買、加油或換匯。</P>
      </View>

      <View style={{ gap: 8 }}>
        <H2 id="sources">資料來源</H2>
        <Li>
          油價：<ExtLink href="https://www.cpc.com.tw/">台灣中油</ExtLink>
          公告之汽柴油參考牌價（92、95、98 無鉛汽油與超級柴油）。
        </Li>
        <Li>
          蔬果：<ExtLink href="https://data.moa.gov.tw/">農業部農業資料開放平臺</ExtLink>
          「農產品交易行情」，取台北一市場的蔬菜、水果批發均價。
        </Li>
        <Li>魚貨海鮮：農業部農業資料開放平臺「漁產品交易行情」，為全台各魚市場依交易量加權的批發均價。</Li>
        <Li>雞蛋、白肉雞：農業部農業資料開放平臺「畜禽產品交易行情」，為產地價。</Li>
        <Li>毛豬：農業部農業資料開放平臺「毛豬交易行情」，為全台各拍賣市場依成交頭數加權的平均價。</Li>
        <Li>
          匯率：<ExtLink href="https://github.com/fawazahmed0/exchange-api">Free Currency Exchange Rates API</ExtLink>
          提供之國際中間價。
        </Li>
        <Li>
          天氣、地震、颱風：<ExtLink href="https://opendata.cwa.gov.tw/">中央氣象署氣象資料開放平臺</ExtLink>
          之縣市 36 小時預報、即時觀測、有感地震報告與颱風路徑；地震即時畫面嵌入自 YouTube 頻道「台灣地震監視」。
        </Li>
        <Li>金價：同上資料源的國際金價（每盎司），換算為新台幣每錢（1 錢 = 3.75 公克），不含銀樓工本與價差。</Li>
      </View>

      <View style={{ gap: 8 }}>
        <H2>更新頻率</H2>
        <P>
          網站每天早上 7 點（台灣時間）自動抓取最新資料並更新。油價每週一調整；蔬果、雞蛋、豬肉為每個交易日的行情，休市日沿用前一個交易日的價格。
        </P>
      </View>

      <View style={{ gap: 8 }}>
        <H2>怎麼看</H2>
        <Li>價格單位：蔬菜、水果、魚貨與肉蛋以「元/台斤」（1 台斤 = 600 公克）顯示，旁邊附上每公斤價格；原始資料為每公斤者由本站換算。</Li>
        <Li>紅綠燈：🔴 漲、🟡 持平、🟢 跌，比較的是本週與上週。蔬果與魚貨 ±5%、肉蛋 ±3%、匯率與金價 ±1% 以內視為持平。</Li>
        <Li>週 K 線：每根代表一週。開盤是上週收盤價，收盤是本週最新價格；紅色代表本週比上週貴，綠色代表比上週便宜。</Li>
        <Li>物價溫度計：油價、蔬果、魚貨與肉蛋本週漲跌幅的平均值（匯率、金價不列入）。</Li>
        <Li>本週划算推薦：拿目前價格和最近 8 週的平均價相比，便宜 15% 以上列為「適合多買」，貴 20% 以上列為「可以先少買」。</Li>
      </View>

      <View style={{ gap: 8 }}>
        <H2>免責聲明</H2>
        <P>
          本站資料來自上述公開資料，由程式自動整理，可能因資料來源延遲、休市或格式變動而出現誤差。蔬果與肉品為批發或產地價，零售價通常為批發價的 2～3 倍；匯率為國際中間價，實際換匯請以銀行牌告為準。本站內容僅供生活參考，不構成任何投資建議。
        </P>
      </View>

      <View style={{ gap: 8 }}>
        <H2>聯絡我們</H2>
        <P>
          發現資料錯誤或有任何建議，歡迎來信 <ExtLink href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</ExtLink>。
        </P>
      </View>

      <Muted>最後更新：2026 年 10 月 20 日</Muted>
    </SiteLayout>
  );
}
