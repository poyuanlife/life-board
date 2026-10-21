import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { useTheme } from '@/lib/theme';

// 熱量頁共用的小元件

export function Panel({ title, right, children }: { title?: string; right?: ReactNode; children: ReactNode }) {
  const t = useTheme();
  return (
    <View style={[styles.panel, { backgroundColor: t.card, borderColor: t.border }]}>
      {(title || right) && (
        <View style={styles.panelHead}>
          {title ? <Text style={{ color: t.text, fontSize: 16, fontWeight: '700' }}>{title}</Text> : <View />}
          {right}
        </View>
      )}
      {children}
    </View>
  );
}

export function Chip({ label, on, onPress, onRemove }: { label: string; on?: boolean; onPress: () => void; onRemove?: () => void }) {
  const t = useTheme();
  return (
    <View style={[styles.chip, { backgroundColor: on ? t.accent : t.chip }]}>
      <Pressable onPress={onPress} style={styles.chipMain}>
        <Text style={{ color: on ? '#fff' : t.text, fontSize: 13 }}>{label}</Text>
      </Pressable>
      {onRemove && (
        <Pressable onPress={onRemove} style={styles.chipX} accessibilityLabel={`刪除${label}`}>
          <Text style={{ color: on ? '#fff' : t.faint, fontSize: 13 }}>✕</Text>
        </Pressable>
      )}
    </View>
  );
}

export function Stepper({ value, onChange, step = 1, label }: { value: number; onChange: (v: number) => void; step?: number; label: string }) {
  const t = useTheme();
  const shown = Number.isInteger(value) ? String(value) : value.toFixed(1);
  return (
    <View style={styles.stepper}>
      <Pressable
        onPress={() => onChange(Math.max(0, Math.round((value - step) * 10) / 10))}
        style={[styles.stepBtn, { borderColor: t.border, opacity: value === 0 ? 0.35 : 1 }]}
        accessibilityLabel={`減少${label}`}>
        <Text style={{ color: t.text, fontSize: 16 }}>−</Text>
      </Pressable>
      <Text style={[styles.count, { color: value ? t.text : t.faint }]}>{shown}</Text>
      <Pressable
        onPress={() => onChange(Math.round((value + step) * 10) / 10)}
        style={[styles.stepBtn, { borderColor: t.accent, backgroundColor: t.accent }]}
        accessibilityLabel={`增加${label}`}>
        <Text style={{ color: '#fff', fontSize: 16 }}>+</Text>
      </Pressable>
    </View>
  );
}

export function Input(props: TextInputProps & { flex?: number }) {
  const t = useTheme();
  const { flex, style, ...rest } = props;
  return (
    <TextInput
      placeholderTextColor={t.faint}
      {...rest}
      style={[styles.input, { flex, borderColor: t.border, color: t.text, backgroundColor: t.bg }, style]}
    />
  );
}

export function Button({ label, onPress, ghost, disabled }: { label: string; onPress: () => void; ghost?: boolean; disabled?: boolean }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={[
        styles.btn,
        ghost ? { borderColor: t.accent, borderWidth: 1 } : { backgroundColor: t.accent },
        disabled && { opacity: 0.4 },
      ]}>
      <Text style={{ color: ghost ? t.accent : '#fff', fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}

export const kcalText = (n: number) => Math.round(n).toLocaleString('en-US');

const styles = StyleSheet.create({
  panel: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  panelHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', borderRadius: 999 },
  chipMain: { paddingLeft: 12, paddingRight: 12, paddingVertical: 6 },
  chipX: { paddingRight: 10, paddingLeft: 2, paddingVertical: 6 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepBtn: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  count: { width: 34, textAlign: 'center', fontVariant: ['tabular-nums'], fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 15, minWidth: 0 },
  btn: { borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center' },
});
