// 首頁每個區塊右上角的「⋯」：不用進編輯畫面，直接調整這一個區塊
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { DEVICE_NOTE, canMove, move, switchColumn, toggleHidden, toTop, WIDGETS, type Layout, type WidgetId } from '@/lib/layout';
import { useTheme } from '@/lib/theme';

/** 區塊標題旁的小按鈕 */
export function MenuButton({ id, onOpen }: { id: WidgetId; onOpen: (id: WidgetId) => void }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={() => onOpen(id)}
      accessibilityRole="button"
      accessibilityLabel={`調整「${WIDGETS[id].label}」的位置`}
      hitSlop={6}
      style={({ hovered }: { hovered?: boolean }) => [
        styles.dots,
        {
          borderColor: t.border,
          backgroundColor: hovered ? t.border : 'transparent',
        },
      ]}>
      <Text
        style={{
          color: t.muted,
          fontSize: 16,
          lineHeight: 18,
          fontWeight: '800',
        }}>
        ⋯
      </Text>
    </Pressable>
  );
}

type Props = {
  id: WidgetId | null;
  layout: Layout;
  wide: boolean; // 電腦版兩欄
  onChange: (l: Layout) => void;
  onHide: (id: WidgetId) => void;
  onCustomize: () => void;
  onClose: () => void;
};

export function WidgetMenu({ id, layout, wide, onChange, onHide, onCustomize, onClose }: Props) {
  const t = useTheme();
  if (!id) return null;
  const w = WIDGETS[id];
  const flat = !wide;
  const inSide = layout.side.includes(id);
  const act = (next: Layout) => {
    onChange(next);
    onClose();
  };

  const items: {
    icon: string;
    label: string;
    onPress: () => void;
    disabled?: boolean;
  }[] = [
    {
      icon: '⤒',
      label: '移到最上面',
      onPress: () => act(toTop(layout, id, flat)),
      disabled: !canMove(layout, id, -1, flat),
    },
    {
      icon: '▲',
      label: '往上移一格',
      onPress: () => act(move(layout, id, -1, flat)),
      disabled: !canMove(layout, id, -1, flat),
    },
    {
      icon: '▼',
      label: '往下移一格',
      onPress: () => act(move(layout, id, 1, flat)),
      disabled: !canMove(layout, id, 1, flat),
    },
    ...(wide
      ? [
          {
            icon: inSide ? '▶' : '◀',
            label: inSide ? '移到右邊主要欄' : '移到左側欄',
            onPress: () => act(switchColumn(layout, id)),
          },
        ]
      : []),
    {
      icon: '🙈',
      label: '隱藏這個區塊',
      onPress: () => {
        onChange(toggleHidden(layout, id));
        onHide(id);
        onClose();
      },
    },
    {
      icon: '⚙️',
      label: '更多自訂（拖曳排序、範本）',
      onPress: () => {
        onClose();
        onCustomize();
      },
    },
  ];

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <Pressable
        style={[styles.backdrop, { justifyContent: wide ? 'center' : 'flex-end' }]}
        onPress={onClose}
        accessibilityLabel="關閉">
        {/* 點選單本身不要關掉 */}
        <Pressable
          onPress={() => {}}
          style={[
            styles.sheet,
            wide ? styles.sheetWide : styles.sheetPhone,
            { backgroundColor: t.card, borderColor: t.border },
          ]}>
          <Text
            style={{
              color: t.text,
              fontSize: 17,
              fontWeight: '800',
              paddingHorizontal: 6,
              paddingBottom: 4,
            }}>
            {w.icon} {w.label}
          </Text>
          {items.map((it) => (
            <Pressable
              key={it.label}
              onPress={it.onPress}
              disabled={it.disabled}
              accessibilityRole="button"
              style={({ hovered }: { hovered?: boolean }) => [
                styles.item,
                {
                  opacity: it.disabled ? 0.35 : 1,
                  backgroundColor: hovered && !it.disabled ? t.bg : 'transparent',
                },
              ]}>
              <Text
                style={{
                  width: 28,
                  textAlign: 'center',
                  color: t.text,
                  fontSize: 17,
                }}>
                {it.icon}
              </Text>
              <Text style={{ color: t.text, fontSize: 16 }}>{it.label}</Text>
            </Pressable>
          ))}
          <Text style={{ color: t.faint, fontSize: 12, paddingHorizontal: 6, paddingTop: 4 }}>{DEVICE_NOTE}</Text>
          <Pressable onPress={onClose} style={[styles.cancel, { borderColor: t.border }]} accessibilityRole="button">
            <Text style={{ color: t.muted, fontSize: 16 }}>取消</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dots: {
    width: 34,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
  },
  sheet: { width: '100%', borderWidth: 1, padding: 12, gap: 2 },
  sheetWide: { maxWidth: 380, borderRadius: 16 },
  // 手機：從下面出來，大拇指按得到
  sheetPhone: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 24,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 50,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  cancel: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
});
