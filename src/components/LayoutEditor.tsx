// 「自訂版面」編輯畫面：按住 ≡ 拖曳排序，也可以一鍵套用範本
import { useMemo, useRef, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  PRESETS,
  place,
  placeFlat,
  sameLayout,
  switchColumn,
  toggleHidden,
  toTop,
  WIDGETS,
  type Column,
  type Layout,
  type WidgetId,
  DEVICE_NOTE,
} from '@/lib/layout';
import { useTheme } from '@/lib/theme';

type Props = {
  layout: Layout;
  wide: boolean; // 電腦版（左右兩欄）
  onChange: (l: Layout) => void;
  onDone: () => void;
};

type ListKey = Column | 'flat';
// 量得到畫面位置的元件（View 的 ref）
type Measurable = {
  measureInWindow: (cb: (x: number, y: number, w: number, h: number) => void) => void;
};
// ≡ 把手的中心離一行左邊多遠
const HANDLE_X = 24;
type Rect = { x: number; y: number; w: number; h: number };
type Drag = {
  id: WidgetId;
  dx: number;
  dy: number;
  sy: number;
  target: { list: ListKey; index: number } | null;
};

// 網頁專用的樣式（react-native 的型別裡沒有）
const web = (s: Record<string, string>) => s as object;

function Btn({
  label,
  a11y,
  onPress,
  disabled,
}: {
  label: string;
  a11y: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      style={[
        styles.btn,
        {
          borderColor: t.border,
          backgroundColor: t.card,
          opacity: disabled ? 0.3 : 1,
        },
      ]}>
      <Text style={{ color: t.text, fontSize: 14 }}>{label}</Text>
    </Pressable>
  );
}

/** 拖曳把手：只有按住這裡才會拖，平常滑動頁面不受影響 */
function Handle({
  id,
  onStart,
  onMove,
  onEnd,
}: {
  id: WidgetId;
  onStart: (id: WidgetId) => void;
  onMove: (dx: number, dy: number) => void;
  onEnd: (drop: boolean) => void;
}) {
  const t = useTheme();
  const cb = useRef({ onStart, onMove, onEnd });
  cb.current = { onStart, onMove, onEnd };
  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => cb.current.onStart(id),
        onPanResponderMove: (_, g) => cb.current.onMove(g.dx, g.dy),
        onPanResponderRelease: () => cb.current.onEnd(true),
        onPanResponderTerminate: () => cb.current.onEnd(false),
      }),
    [id],
  );
  return (
    <View
      {...pan.panHandlers}
      accessibilityLabel={`按住拖曳 ${WIDGETS[id].label}`}
      style={[styles.handle, web({ touchAction: 'none', cursor: 'grab', userSelect: 'none' })]}>
      <Text style={{ color: t.muted, fontSize: 20, lineHeight: 22 }}>≡</Text>
    </View>
  );
}

/** 量出元件在視窗裡的位置（網頁上直接讀，不用等下一輪） */
function measure(v: Measurable, done: (r: Rect) => void) {
  if (typeof HTMLElement !== 'undefined' && v instanceof HTMLElement) {
    const b = v.getBoundingClientRect();
    done({ x: b.left, y: b.top, w: b.width, h: b.height });
  } else {
    v.measureInWindow((x, y, w, h) => done({ x, y, w, h }));
  }
}

/** 找出包住編輯畫面、可以捲動的那一層（網頁上 ScrollView 是一個 div） */
function findScroller(node: unknown): HTMLElement | null {
  if (typeof document === 'undefined' || !(node instanceof HTMLElement)) return null;
  for (let el: HTMLElement | null = node; el; el = el.parentElement) {
    const o = getComputedStyle(el).overflowY;
    if ((o === 'auto' || o === 'scroll') && el.scrollHeight > el.clientHeight) return el;
  }
  return (document.scrollingElement as HTMLElement | null) ?? null;
}

export function LayoutEditor({ layout, wide, onChange, onDone }: Props) {
  const t = useTheme();
  const [drag, setDragState] = useState<Drag | null>(null);
  const dragRef = useRef<Drag | null>(null);
  const setDrag = (d: Drag | null) => {
    dragRef.current = d;
    setDragState(d);
  };
  const rowRefs = useRef(new Map<WidgetId, Measurable>());
  const listRefs = useRef(new Map<ListKey, Measurable>());
  const rects = useRef({
    rows: new Map<WidgetId, Rect>(),
    lists: new Map<ListKey, Rect>(),
  });
  const panelRef = useRef<unknown>(null);
  // 拖到畫面上下邊緣時自動捲動（手機上清單比螢幕長）
  const auto = useRef({
    el: null as HTMLElement | null,
    start: 0,
    raf: 0,
    dx: 0,
    dy: 0,
  });
  const scrolled = () => (auto.current.el ? auto.current.el.scrollTop - auto.current.start : 0);

  const flat = [...layout.side, ...layout.main];
  const lists: ListKey[] = wide ? ['side', 'main'] : ['flat'];
  const idsOf = (k: ListKey) => (k === 'flat' ? flat : layout[k]);

  // 開始拖的時候記下每一行在畫面上的位置
  const start = (id: WidgetId) => {
    const r = rects.current;
    r.rows.clear();
    r.lists.clear();
    rowRefs.current.forEach((v, k) => measure(v, (rect) => r.rows.set(k, rect)));
    listRefs.current.forEach((v, k) => measure(v, (rect) => r.lists.set(k, rect)));
    const a = auto.current;
    a.el = findScroller(panelRef.current);
    a.start = a.el?.scrollTop ?? 0;
    a.dx = a.dy = 0;
    setDrag({ id, dx: 0, dy: 0, sy: 0, target: null });
    if (a.el && typeof requestAnimationFrame !== 'undefined') {
      cancelAnimationFrame(a.raf);
      const tick = () => {
        const d = dragRef.current;
        const me = d && rects.current.rows.get(d.id);
        if (!d) return;
        if (a.el && me) {
          const y = me.y + me.h / 2 + a.dy; // 拖曳中那一行在視窗裡的位置
          const H = window.innerHeight;
          const edge = 80;
          const v = y < edge ? -(edge - y) / 3 : y > H - edge ? (y - (H - edge)) / 3 : 0;
          if (v) {
            a.el.scrollTop += Math.max(-24, Math.min(24, v));
            update.current();
          }
        }
        a.raf = requestAnimationFrame(tick);
      };
      a.raf = requestAnimationFrame(tick);
    }
  };

  // 依拖曳中那一行的中心點，算出會放到哪一欄的第幾個
  const targetOf = (id: WidgetId, dx: number, dy: number): Drag['target'] => {
    const me = rects.current.rows.get(id);
    if (!me) return null;
    const cx = me.x + HANDLE_X + dx; // 手指按在左邊的 ≡ 上
    const cy = me.y + me.h / 2 + dy;
    let list: ListKey = 'flat';
    if (wide) {
      const dist = (k: ListKey) => {
        const r = rects.current.lists.get(k);
        if (!r) return Infinity;
        return cx < r.x ? r.x - cx : cx > r.x + r.w ? cx - r.x - r.w : 0;
      };
      list = dist('side') <= dist('main') ? 'side' : 'main';
    }
    // 頁面捲動後，其他行在視窗裡的位置也跟著往上移
    const sy = scrolled();
    let index = 0;
    for (const x of idsOf(list)) {
      if (x === id) continue;
      const r = rects.current.rows.get(x);
      if (r && r.y - sy + r.h / 2 < cy) index++;
    }
    return { list, index };
  };

  const update = useRef(() => {});
  update.current = () => {
    const d = dragRef.current;
    const { dx, dy } = auto.current;
    if (d) setDrag({ ...d, dx, dy, sy: scrolled(), target: targetOf(d.id, dx, dy) });
  };
  const moveTo = (dx: number, dy: number) => {
    auto.current.dx = dx;
    auto.current.dy = dy;
    update.current();
  };

  const end = (drop: boolean) => {
    const d = dragRef.current;
    if (typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(auto.current.raf);
    setDrag(null);
    if (d && drop && d.target) {
      const { list, index } = d.target;
      onChange(list === 'flat' ? placeFlat(layout, d.id, index) : place(layout, d.id, list, index));
    }
  };

  const row = (id: WidgetId, list: ListKey) => {
    const w = WIDGETS[id];
    const dragging = drag?.id === id;
    const isTop = list === 'flat' ? flat[0] === id : idsOf(list)[0] === id;
    return (
      <View
        ref={(v) => {
          if (v) rowRefs.current.set(id, v as unknown as Measurable);
          else rowRefs.current.delete(id);
        }}
        style={[
          styles.row,
          {
            borderColor: dragging ? t.accent : t.border,
            backgroundColor: t.card,
          },
          dragging && {
            transform: [{ translateX: drag.dx }, { translateY: drag.dy + drag.sy }],
            zIndex: 100,
            opacity: 0.95,
            shadowColor: '#000',
            shadowOpacity: 0.25,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
            elevation: 8,
          },
        ]}>
        <Handle id={id} onStart={start} onMove={moveTo} onEnd={end} />
        <Text style={{ fontSize: 18 }}>{w.icon}</Text>
        <Text style={{ color: t.text, flex: 1, fontSize: 14 }} numberOfLines={2}>
          {w.label}
        </Text>
        <Btn
          label="⤒"
          a11y={`把 ${w.label} 移到最上面`}
          disabled={isTop}
          onPress={() => onChange(toTop(layout, id, list === 'flat'))}
        />
        {list !== 'flat' && (
          <Btn
            label={list === 'side' ? '▶' : '◀'}
            a11y={list === 'side' ? `把 ${w.label} 移到主要欄` : `把 ${w.label} 移到左側欄`}
            onPress={() => onChange(switchColumn(layout, id))}
          />
        )}
        <Btn label="隱藏" a11y={`隱藏 ${w.label}`} onPress={() => onChange(toggleHidden(layout, id))} />
      </View>
    );
  };

  // 放下位置的提示線（疊在行與行之間，不會讓清單跳動）
  const line = (pos: 'top' | 'bottom') => (
    <View
      pointerEvents="none"
      style={[styles.line, pos === 'top' ? { top: -5 } : { bottom: -5 }, { backgroundColor: t.accent }]}
    />
  );

  const renderList = (k: ListKey) => {
    const ids = idsOf(k);
    const others = ids.filter((x) => x !== drag?.id);
    const tgt = drag?.target?.list === k ? drag.target.index : -1;
    const holding = !!drag && ids.includes(drag.id);
    return (
      <View
        key={k}
        ref={(v) => {
          if (v) listRefs.current.set(k, v as unknown as Measurable);
          else listRefs.current.delete(k);
        }}
        style={[{ gap: 6, minHeight: 60 }, k === 'side' ? { width: 340 } : { flex: 1 }, holding && { zIndex: 10 }]}>
        {k === 'side' && <Text style={[styles.colTitle, { color: t.muted }]}>左側欄</Text>}
        {k === 'main' && <Text style={[styles.colTitle, { color: t.muted }]}>主要欄</Text>}
        {ids.map((id, i) => {
          const pos = others.indexOf(id);
          return (
            <View key={id} style={{ gap: 6, zIndex: drag?.id === id ? 100 : 0 }}>
              {k === 'flat' && i === 0 && layout.side.length > 0 && (
                <Text style={[styles.colTitle, { color: t.muted }]}>最上方（電腦版的左側欄）</Text>
              )}
              {k === 'flat' && i === layout.side.length && (
                <Text style={[styles.colTitle, { color: t.muted }]}>接著（電腦版的主要欄）</Text>
              )}
              <View>
                {row(id, k)}
                {pos >= 0 && tgt === pos && line('top')}
                {pos >= 0 && pos === others.length - 1 && tgt === others.length && line('bottom')}
              </View>
            </View>
          );
        })}
        {!others.length && (
          <View style={[styles.empty, { borderColor: tgt === 0 ? t.accent : t.border }]}>
            <Text style={{ color: t.faint, fontSize: 13 }}>
              把區塊拖到這裡{k === 'side' ? '（空的時候不顯示左側欄）' : ''}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View
      ref={(v) => {
        panelRef.current = v;
      }}
      style={[styles.panel, { borderColor: t.accent, backgroundColor: t.bg }, drag && web({ userSelect: 'none' })]}>
      <View style={styles.head}>
        <View style={{ flex: 1, minWidth: 200, gap: 2 }}>
          <Text style={{ color: t.text, fontSize: 18, fontWeight: '800' }}>⚙️ 自訂版面</Text>
          <Text style={{ color: t.muted, fontSize: 13, lineHeight: 19 }}>
            按住左邊的 ≡ 拖曳排序{wide ? '，可以拖到左側欄或主要欄' : ''}；⤒
            是直接移到最上面。
          </Text>
        </View>
        <Pressable onPress={onDone} style={[styles.action, { borderColor: t.accent, backgroundColor: t.accent }]}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>完成</Text>
        </Pressable>
      </View>

      <View style={[styles.note, { borderColor: t.flat, backgroundColor: t.card }]}>
        <Text style={{ fontSize: 18 }}>📱💻</Text>
        <Text style={{ color: t.text, fontSize: 14, flex: 1, lineHeight: 20 }}>{DEVICE_NOTE}</Text>
      </View>

      <View style={{ gap: 6 }}>
        <Text style={[styles.colTitle, { color: t.muted }]}>一鍵套用範本（套用後還能再調）</Text>
        <View style={styles.presets}>
          {PRESETS.map((p) => {
            const on = sameLayout(layout, p.layout);
            return (
              <Pressable
                key={p.key}
                onPress={() => onChange(p.layout)}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                style={[
                  styles.preset,
                  {
                    borderColor: on ? t.accent : t.border,
                    backgroundColor: t.card,
                  },
                ]}>
                <Text style={{ color: t.text, fontWeight: '700', fontSize: 15 }}>
                  {p.icon} {p.label}
                </Text>
                <Text style={{ color: t.faint, fontSize: 12 }}>{p.hint}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={wide ? styles.cols : undefined}>{lists.map(renderList)}</View>

      {layout.hidden.length > 0 && (
        <View style={{ gap: 6 }}>
          <Text style={[styles.colTitle, { color: t.muted }]}>已隱藏</Text>
          {layout.hidden.map((id) => (
            <View key={id} style={[styles.row, { borderColor: t.border, opacity: 0.8 }]}>
              <Text style={{ fontSize: 18, paddingLeft: 4 }}>{WIDGETS[id].icon}</Text>
              <Text style={{ color: t.muted, flex: 1, fontSize: 14 }}>{WIDGETS[id].label}</Text>
              <Btn label="顯示" a11y={`顯示 ${WIDGETS[id].label}`} onPress={() => onChange(toggleHidden(layout, id))} />
            </View>
          ))}
        </View>
      )}

      <Pressable
        onPress={onDone}
        style={[styles.action, styles.doneBottom, { borderColor: t.accent, backgroundColor: t.accent }]}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>完成</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { borderWidth: 2, borderRadius: 16, padding: 14, gap: 14 },
  head: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
  },
  action: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    minHeight: 44,
    justifyContent: 'center',
  },
  doneBottom: { alignItems: 'center' },
  note: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 12, padding: 12 },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  preset: {
    flexGrow: 1,
    flexBasis: 140,
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 2,
  },
  cols: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  colTitle: { fontSize: 12, fontWeight: '700', marginTop: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 12,
    paddingLeft: 4,
    paddingRight: 6,
    paddingVertical: 6,
  },
  // 手指好按：至少 44 x 44
  btn: {
    minWidth: 44,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  handle: {
    width: 40,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  line: { position: 'absolute', left: 0, right: 0, height: 4, borderRadius: 2 },
  empty: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
});
