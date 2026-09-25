import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme, serif } from '../theme/theme';
import { dateKey, parseDate, prettyDate, shiftDate } from '../utils/dateUtils';

type Props = { date: string; onChange: (date: string) => void; marked: Set<string>; theme: Theme };

export function DateSelector({ date, onChange, marked, theme }: Props) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => { const d = parseDate(date); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const firstWeekday = (month.getDay() + 6) % 7;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((firstWeekday + days) / 7) * 7 }, (_, i) => i - firstWeekday + 1);
  function moveMonth(delta: number) { setMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1)); }
  function choose(day: number) {
    onChange(dateKey(new Date(month.getFullYear(), month.getMonth(), day)));
    setOpen(false);
  }
  return <>
    <View style={[styles.row, { borderColor: theme.line }]}>
      <Pressable onPress={() => onChange(shiftDate(date, -1))} style={styles.arrow} accessibilityLabel="Previous day"><Text style={{ color: theme.ink, fontSize: 22 }}>‹</Text></Pressable>
      <Pressable onPress={() => { const d = parseDate(date); setMonth(new Date(d.getFullYear(), d.getMonth(), 1)); setOpen(true); }} style={styles.dateButton} accessibilityRole="button" accessibilityLabel="Choose a date">
        <Text style={[styles.dateText, { color: theme.ink }]}>{prettyDate(date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</Text>
        <Text style={{ color: theme.accent, fontSize: 12, marginTop: 3 }}>▦  Open calendar</Text>
      </Pressable>
      <Pressable onPress={() => onChange(shiftDate(date, 1))} style={styles.arrow} accessibilityLabel="Next day"><Text style={{ color: theme.ink, fontSize: 22 }}>›</Text></Pressable>
    </View>
    <Modal visible={open} animationType="fade" transparent onRequestClose={() => setOpen(false)}>
      <SafeAreaView style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
        <View style={[styles.calendar, { backgroundColor: theme.surface }]}>
          <View style={styles.monthRow}>
            <Pressable onPress={() => moveMonth(-1)} style={styles.monthArrow}><Text style={{ color: theme.ink, fontSize: 24 }}>‹</Text></Pressable>
            <Text style={[styles.monthTitle, { color: theme.ink }]}>{new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(month)}</Text>
            <Pressable onPress={() => moveMonth(1)} style={styles.monthArrow}><Text style={{ color: theme.ink, fontSize: 24 }}>›</Text></Pressable>
          </View>
          <View style={styles.grid}>{['M','T','W','T','F','S','S'].map((day, i) => <Text key={i} style={[styles.cell, { color: theme.muted, fontWeight: '600' }]}>{day}</Text>)}
            {cells.map((day, i) => <Pressable key={i} disabled={day < 1 || day > days} onPress={() => choose(day)} style={[styles.cell, day > 0 && day <= days && date === dateKey(new Date(month.getFullYear(), month.getMonth(), day)) && { backgroundColor: theme.accent, borderRadius: 18 }]}>
              {day > 0 && day <= days && <><Text style={{ color: date === dateKey(new Date(month.getFullYear(), month.getMonth(), day)) ? theme.surface : theme.ink }}>{day}</Text>{marked.has(dateKey(new Date(month.getFullYear(), month.getMonth(), day))) && <View style={[styles.marker, { backgroundColor: date === dateKey(new Date(month.getFullYear(), month.getMonth(), day)) ? theme.surface : theme.gold }]} />}</>}
            </Pressable>)}
          </View>
          <Pressable onPress={() => { onChange(dateKey(new Date())); setOpen(false); }} style={styles.today}><Text style={{ color: theme.accent, fontWeight: '600' }}>Go to today</Text></Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  </>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, marginHorizontal: 20, paddingVertical: 13 },
  arrow: { width: 36, height: 40, alignItems: 'center', justifyContent: 'center' },
  dateButton: { flex: 1, alignItems: 'center', paddingVertical: 2 },
  dateText: { fontFamily: serif, fontSize: 16, textAlign: 'center' },
  overlay: { flex: 1, backgroundColor: '#0008', justifyContent: 'center', padding: 22 },
  calendar: { borderRadius: 24, padding: 18 },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  monthArrow: { width: 40, alignItems: 'center' },
  monthTitle: { fontFamily: serif, fontSize: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.2857%', height: 43, alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
  marker: { width: 4, height: 4, borderRadius: 2, position: 'absolute', bottom: 5 },
  today: { alignSelf: 'center', padding: 14, marginTop: 10 },
});
