// 「自訂版面」編輯畫面：每個區塊縮成一行，用大按鈕調整（手機也好按）
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { move, switchColumn, toggleHidden, WIDGETS, type Layout, type WidgetId } from '@/lib/layout';
import { useTheme } from '@/lib/theme';

type Props = {
  layout: Layout;
  wide: boolean; // 電腦版（左右兩欄）
  onChange: (l: Layout) => void;
  onReset: () => void;
  onDone: () => void;
};

function Btn({ label, a11y, onPress, disabled }: { label: string; a11y: string; onPress: () => void; disabled?: boolean }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      style={[styles.btn, { borderColor: t.border, backgroundColor: t.card, opacity: disabled ? 0.3 : 1 }]}>
      <Text style={{ color: t.text, fontSize: 15 }}>{label}</Text>
    </Pressable>
  );
}

export function LayoutEditor({ layout, wide, onChange, onReset, onDone }: Props) {
  const t = useTheme();

  const row = (id: WidgetId, i: number, list: WidgetId[], col: 'side' | 'main' | 'flat') => {
    const w = WIDGETS[id];
    // 手機版是一整條清單（左側欄 + 主要欄），交界處也能上下移
    const first = i === 0;
    const last = i === list.length - 1;
    return (
      <View key={id} style={[styles.row, { borderColor: t.border, backgroundColor: t.card }]}>
        <Text style={{ fontSize: 18 }}>{w.icon}</Text>
        <Text style={{ color: t.text, flex: 1, fontSize: 14 }} numberOfLines={2}>
          {w.label}
        </Text>
        <Btn label="▲" a11y={`上移 ${w.label}`} disabled={first} onPress={() => onChange(move(layout, id, -1, col === 'flat'))} />
        <Btn label="▼" a11y={`下移 ${w.label}`} disabled={last} onPress={() => onChange(move(layout, id, 1, col === 'flat'))} />
        {col !== 'flat' && (
          <Btn
            label={col === 'side' ? '▶' : '◀'}
            a11y={col === 'side' ? `把 ${w.label} 移到主要欄` : `把 ${w.label} 移到左側欄`}
            onPress={() => onChange(switchColumn(layout, id))}
          />
        )}
        <Btn label="隱藏" a11y={`隱藏 ${w.label}`} onPress={() => onChange(toggleHidden(layout, id))} />
      </View>
    );
  };

  const flat = [...layout.side, ...layout.main];

  return (
    <View style={[styles.panel, { borderColor: t.accent, backgroundColor: t.bg }]}>
      <View style={styles.head}>
        <View style={{ flex: 1, minWidth: 200, gap: 2 }}>
          <Text style={{ color: t.text, fontSize: 18, fontWeight: '800' }}>⚙️ 自訂版面</Text>
          <Text style={{ color: t.muted, fontSize: 13 }}>
            {wide ? '▲▼ 調整順序，◀▶ 換到左側欄或主要欄。' : '▲▼ 調整由上到下的順序。'}設定只存在這台裝置的瀏覽器。
          </Text>
        </View>
        <Pressable onPress={onReset} style={[styles.action, { borderColor: t.border }]}>
          <Text style={{ color: t.muted }}>恢復預設</Text>
        </Pressable>
        <Pressable onPress={onDone} style={[styles.action, { borderColor: t.accent, backgroundColor: t.accent }]}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>完成</Text>
        </Pressable>
      </View>

      {wide ? (
        <View style={styles.cols}>
          <View style={{ width: 340, gap: 6 }}>
            <Text style={[styles.colTitle, { color: t.muted }]}>左側欄</Text>
            {layout.side.map((id, i) => row(id, i, layout.side, 'side'))}
            {!layout.side.length && <Text style={{ color: t.faint, fontSize: 13 }}>（空的，左側欄不會顯示）</Text>}
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={[styles.colTitle, { color: t.muted }]}>主要欄</Text>
            {layout.main.map((id, i) => row(id, i, layout.main, 'main'))}
          </View>
        </View>
      ) : (
        <View style={{ gap: 6 }}>
          {flat.map((id, i) => (
            <View key={id} style={{ gap: 6 }}>
              {i === 0 && layout.side.length > 0 && <Text style={[styles.colTitle, { color: t.muted }]}>最上方（電腦版的左側欄）</Text>}
              {i === layout.side.length && <Text style={[styles.colTitle, { color: t.muted }]}>接著（電腦版的主要欄）</Text>}
              {row(id, i, flat, 'flat')}
            </View>
          ))}
        </View>
      )}

      {layout.hidden.length > 0 && (
        <View style={{ gap: 6 }}>
          <Text style={[styles.colTitle, { color: t.muted }]}>已隱藏</Text>
          {layout.hidden.map((id) => (
            <View key={id} style={[styles.row, { borderColor: t.border, opacity: 0.8 }]}>
              <Text style={{ fontSize: 18 }}>{WIDGETS[id].icon}</Text>
              <Text style={{ color: t.muted, flex: 1, fontSize: 14 }}>{WIDGETS[id].label}</Text>
              <Btn label="顯示" a11y={`顯示 ${WIDGETS[id].label}`} onPress={() => onChange(toggleHidden(layout, id))} />
            </View>
          ))}
        </View>
      )}

      <Pressable onPress={onDone} style={[styles.action, styles.doneBottom, { borderColor: t.accent, backgroundColor: t.accent }]}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>完成</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { borderWidth: 2, borderRadius: 16, padding: 14, gap: 14 },
  head: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 },
  action: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 16, minHeight: 44, justifyContent: 'center' },
  doneBottom: { alignItems: 'center' },
  cols: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  colTitle: { fontSize: 12, fontWeight: '700', marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 12, paddingLeft: 10, paddingRight: 6, paddingVertical: 6 },
  // 手指好按：至少 44 x 44
  btn: { minWidth: 44, minHeight: 44, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
});
