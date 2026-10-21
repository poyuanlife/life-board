import { View } from 'react-native';
import { ExtLink } from '@/components/ExtLink';
import { H1, H2, Li, Muted, P } from '@/components/Prose';
import { SiteLayout } from '@/components/SiteLayout';
import { meta, PAGES } from '@/lib/meta';
import { CONTACT_EMAIL, CONTACT_URL } from '@/lib/site';

export function generateMetadata() {
  return meta(PAGES.privacy.title, PAGES.privacy.description);
}

export default function Privacy() {
  return (
    <SiteLayout
      title={PAGES.privacy.title}
      description={PAGES.privacy.description}
      maxWidth={760}>
      <H1>隱私權政策</H1>
      <P>
        生活物價看板（以下稱「本站」）重視你的隱私。本政策說明你在瀏覽本站時，哪些資料可能被收集、如何使用，以及你可以如何管理。使用本站即表示你同意本政策。
      </P>

      <View style={{ gap: 8 }}>
        <H2>一、本站收集的資料</H2>
        <P>本站不需要註冊或登入，也不會要求你提供姓名、電話、電子郵件等個人資料。</P>
        <P>
          本站架設於 <ExtLink href="https://www.cloudflare.com/privacypolicy/">Cloudflare</ExtLink>
          ，主機服務商會為了網站安全與正常運作，自動記錄一般性的技術資料，例如 IP 位址、瀏覽器類型、造訪時間與瀏覽的網頁。這些資料不會被用來辨識你的個人身分。
        </P>
        <P>
          「YouTube 熱門」頁面的影片縮圖直接從 YouTube 的伺服器載入，YouTube 因此會收到一般性的技術資料（例如 IP 位址）；點擊影片後會前往 YouTube 網站，適用
          <ExtLink href="https://policies.google.com/privacy">Google 隱私權政策</ExtLink>。
        </P>
      </View>

      <View style={{ gap: 8 }}>
        <H2>二、Cookie 的使用</H2>
        <P>
          Cookie 是網站存放在你瀏覽器中的小型文字檔。本站本身不使用 Cookie 追蹤你的瀏覽行為；但若本站放置第三方廣告（見下一節），廣告服務商可能會使用 Cookie。你可以在瀏覽器設定中封鎖或刪除 Cookie，這不會影響你瀏覽本站的物價資訊。
        </P>
      </View>

      <View style={{ gap: 8 }}>
        <H2>三、第三方廣告（Google AdSense）</H2>
        <P>本站可能使用 Google AdSense 等第三方廣告服務，以維持網站的營運費用。相關說明如下：</P>
        <Li>Google 等第三方廠商會使用 Cookie，根據你先前造訪本站或其他網站的紀錄，向你放送廣告。</Li>
        <Li>Google 使用廣告 Cookie，讓 Google 及其合作夥伴能根據你造訪本站和（或）網路上其他網站的紀錄，向你放送合適的廣告。</Li>
        <Li>
          你可以前往 <ExtLink href="https://adssettings.google.com/">Google 廣告設定</ExtLink>
          停用個人化廣告，或前往 <ExtLink href="https://www.aboutads.info/choices/">www.aboutads.info</ExtLink>
          停用第三方廠商用於個人化廣告的 Cookie。
        </Li>
        <Li>
          更多資訊請參考 <ExtLink href="https://policies.google.com/technologies/ads">Google 的廣告政策說明</ExtLink>。
        </Li>
      </View>

      <View style={{ gap: 8 }}>
        <H2>四、外部連結</H2>
        <P>本站含有連往其他網站的連結（例如資料來源網站）。這些網站有各自的隱私權政策，本站不負責其內容與資料處理方式。</P>
      </View>

      <View style={{ gap: 8 }}>
        <H2>五、資料安全</H2>
        <P>本站全程使用 HTTPS 加密連線。由於本站不收集個人資料，也不會將你的個人資料出售或提供給他人。</P>
      </View>

      <View style={{ gap: 8 }}>
        <H2>六、政策修訂</H2>
        <P>本站可能因服務調整或法規變更而修訂本政策，修訂後會公布於本頁並更新下方日期。</P>
      </View>

      <View style={{ gap: 8 }}>
        <H2>七、聯絡我們</H2>
        <P>
          對本政策有任何疑問，歡迎來信 <ExtLink href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</ExtLink>，或到 <ExtLink href={CONTACT_URL}>GitHub 意見回饋</ExtLink> 留言。
        </P>
      </View>

      <Muted>最後更新：2026 年 10 月 20 日</Muted>
    </SiteLayout>
  );
}
