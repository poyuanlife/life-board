// 讀取 app.json，再依環境變數補上設定。
// 放到 GitHub Pages 時網址會是 https://帳號.github.io/專案名/，
// 所以建置時設定 BASE_URL=/專案名（GitHub Actions 會自動帶入）。
module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...config.experiments,
    ...(process.env.BASE_URL ? { baseUrl: process.env.BASE_URL } : {}),
  },
});
