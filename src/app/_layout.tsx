import { Platform } from 'react-native';
import { Slot, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      {/*
        網頁版用 Slot：一次只顯示目前這一頁，換頁時舊頁面直接關掉。
        Stack 會把舊頁面藏在後面繼續跑，YouTube 直播會在背景重複播放、地震資料也會被重複抓取。
        瀏覽器的上一頁／下一頁照常可以用。
      */}
      {Platform.OS === 'web' ? <Slot /> : <Stack screenOptions={{ headerShown: false }} />}
      <StatusBar style="auto" />
    </>
  );
}
