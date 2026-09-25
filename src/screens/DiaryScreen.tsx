import React, { useMemo, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DateSelector } from '../components/DateSelector';
import { DiaryEditor } from '../components/DiaryEditor';
import { PositiveThingItem } from '../components/PositiveThingItem';
import { Tab, TopTabs } from '../components/TopTabs';
import { Diary, DiaryEntry, emptyEntry, hasContent } from '../models/DiaryEntry';
import { Theme, serif } from '../theme/theme';
import { dateKey, prettyDate } from '../utils/dateUtils';

type Props = {
  diary: Diary; date: string; onDate: (date: string) => void;
  onUpdate: (entry: DiaryEntry) => void; onSave: () => void;
  saveStatus: 'saved' | 'saving' | 'error'; onSettings: () => void; theme: Theme;
};

export function DiaryScreen({ diary, date, onDate, onUpdate, onSave, saveStatus, onSettings, theme }: Props) {
  const [tab, setTab] = useState<Tab>('whatsGoingOn');
  const [searchOpen, setSearchOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [query, setQuery] = useState('');
  const entry = diary[date] ?? emptyEntry(date);
  const today = date === dateKey(new Date());
  const marked = useMemo(() => new Set(Object.values(diary).filter(hasContent).map(item => item.date)), [diary]);
  const history = useMemo(() => Object.values(diary).filter(hasContent).sort((a, b) => b.date.localeCompare(a.date)), [diary]);
  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    return history.flatMap(item => {
      const matches: { date: string; section: string; excerpt: string; tab: Tab }[] = [];
      if (item.whatsGoingOn.toLowerCase().includes(term)) matches.push({ date: item.date, section: 'What’s Going On', excerpt: item.whatsGoingOn, tab: 'whatsGoingOn' });
      const positive = item.positiveThings.find(x => x.toLowerCase().includes(term));
      if (positive) matches.push({ date: item.date, section: 'Positive Things', excerpt: positive, tab: 'positiveThings' });
      if (item.manifestation.toLowerCase().includes(term)) matches.push({ date: item.date, section: 'Manifestation', excerpt: item.manifestation, tab: 'manifestation' });
      return matches;
    });
  }, [query, history]);
  function change(field: 'whatsGoingOn' | 'manifestation', value: string) { onUpdate({ ...entry, [field]: value, updatedAt: new Date().toISOString() }); }
  function changePoints(points: string[]) { onUpdate({ ...entry, positiveThings: points, updatedAt: new Date().toISOString() }); }
  function switchTab(next: Tab) { Keyboard.dismiss(); onSave(); setTab(next); }
  function selectDate(next: string) { Keyboard.dismiss(); onSave(); onDate(next); }

  return <SafeAreaView style={[styles.page, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
    <View style={styles.header}>
      <View><Text style={[styles.brand, { color: theme.accent }]}>DIAR <Text style={{ color: theme.gold }}>✦</Text></Text><Text style={[styles.headerSub, { color: theme.muted }]}>A little space for yourself</Text></View>
      <View style={styles.headerActions}>
        <Pressable accessibilityLabel="Search diary" onPress={() => setSearchOpen(true)} style={styles.iconButton}><Text style={[styles.icon, { color: theme.ink }]}>⌕</Text></Pressable>
        <Pressable accessibilityLabel="Diary history" onPress={() => setHistoryOpen(true)} style={styles.iconButton}><Text style={[styles.icon, { color: theme.ink }]}>☷</Text></Pressable>
        <Pressable accessibilityLabel="Settings" onPress={onSettings} style={styles.iconButton}><Text style={[styles.icon, { color: theme.ink }]}>⚙</Text></Pressable>
      </View>
    </View>
    <DateSelector date={date} onChange={selectDate} marked={marked} theme={theme} />
    <TopTabs active={tab} onChange={switchTab} theme={theme} />
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView key={`${date}:${tab}`} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={[styles.eyebrow, { color: theme.accent }]}>{today ? 'TODAY’S PAGE' : 'A PAGE FROM YOUR DIARY'}</Text>
      {tab === 'whatsGoingOn' && <>
        <Text style={[styles.title, { color: theme.ink }]}>What’s going on?</Text>
        <Text style={[styles.prompt, { color: theme.muted }]}>How was your day? Take your time.</Text>
        <DiaryEditor value={entry.whatsGoingOn} onChange={value => change('whatsGoingOn', value)} placeholder="What’s on your mind today?" theme={theme} />
      </>}
      {tab === 'positiveThings' && <>
        <Text style={[styles.title, { color: theme.ink }]}>Positive things</Text>
        <Text style={[styles.prompt, { color: theme.muted }]}>Find three little things that made today better.</Text>
        {entry.positiveThings.length === 0 && <View style={[styles.empty, { backgroundColor: theme.accentSoft }]}><Text style={{ fontSize: 27 }}>☀</Text><Text style={[styles.emptyText, { color: theme.accent }]}>What are you grateful for today?</Text></View>}
        {entry.positiveThings.map((point, i) => <PositiveThingItem key={`${date}:${i}`} index={i} value={point} theme={theme}
          onChange={value => changePoints(entry.positiveThings.map((p, j) => j === i ? value : p))}
          onDelete={() => changePoints(entry.positiveThings.filter((_, j) => j !== i))}
          onMoveUp={i > 0 ? () => { const items = [...entry.positiveThings]; [items[i - 1], items[i]] = [items[i], items[i - 1]]; changePoints(items); } : undefined}
          onMoveDown={i < entry.positiveThings.length - 1 ? () => { const items = [...entry.positiveThings]; [items[i + 1], items[i]] = [items[i], items[i + 1]]; changePoints(items); } : undefined} />)}
        <Pressable onPress={() => changePoints([...entry.positiveThings, ''])} style={[styles.addButton, { borderColor: theme.accent }]}><Text style={{ color: theme.accent, fontWeight: '700' }}>＋  Add a positive thing</Text></Pressable>
      </>}
      {tab === 'manifestation' && <>
        <Text style={[styles.title, { color: theme.ink }]}>Manifestation</Text>
        <Text style={[styles.prompt, { color: theme.muted }]}>Write the future you want to create.</Text>
        <DiaryEditor value={entry.manifestation} onChange={value => change('manifestation', value)} placeholder="What are you becoming?" theme={theme} />
        <View style={[styles.affirmation, { backgroundColor: theme.accentSoft }]}><Text style={{ color: theme.accent, fontSize: 12, fontWeight: '700', letterSpacing: 1 }}>TODAY’S AFFIRMATION</Text><Text style={[styles.quote, { color: theme.ink }]}>“I am becoming the person I want to be.”</Text></View>
      </>}
      <View style={styles.footer}><Text style={{ color: saveStatus === 'error' ? theme.danger : theme.muted, fontSize: 12 }}>{saveStatus === 'saved' ? '✓ Saved on this device' : saveStatus === 'saving' ? 'Saving…' : 'Couldn’t save. Try again.'}</Text><Pressable onPress={onSave} style={[styles.saveButton, { backgroundColor: theme.accent }]}><Text style={{ color: theme.surface, fontWeight: '700' }}>Save now</Text></Pressable></View>
      <Text style={[styles.privacy, { color: theme.muted }]}>Your diary stays on your device.</Text>
    </ScrollView>
    </KeyboardAvoidingView>
    <Modal visible={historyOpen} animationType="slide" onRequestClose={() => setHistoryOpen(false)}><SafeAreaView style={[styles.modalPage, { backgroundColor: theme.background }]}>
      <View style={styles.modalHeader}><Text style={[styles.modalTitle, { color: theme.ink }]}>Diary history</Text><Pressable onPress={() => setHistoryOpen(false)}><Text style={{ color: theme.accent, fontSize: 16 }}>Done</Text></Pressable></View>
      <ScrollView contentContainerStyle={{ padding: 20 }}>{history.length === 0 ? <Text style={{ color: theme.muted, textAlign: 'center', marginTop: 50 }}>Your written days will appear here.</Text> : history.map(item => <Pressable key={item.date} onPress={() => { selectDate(item.date); setHistoryOpen(false); }} style={[styles.historyCard, { backgroundColor: theme.surface, borderColor: theme.line }]}><Text style={[styles.historyDate, { color: theme.ink }]}>{prettyDate(item.date)}</Text><Text numberOfLines={2} style={{ color: theme.muted, marginTop: 5, lineHeight: 20 }}>{item.whatsGoingOn || item.positiveThings.find(Boolean) || item.manifestation}</Text></Pressable>)}</ScrollView>
    </SafeAreaView></Modal>
    <Modal visible={searchOpen} animationType="slide" onRequestClose={() => setSearchOpen(false)}><SafeAreaView style={[styles.modalPage, { backgroundColor: theme.background }]}>
      <View style={styles.modalHeader}><Text style={[styles.modalTitle, { color: theme.ink }]}>Search your diary</Text><Pressable onPress={() => { setSearchOpen(false); setQuery(''); }}><Text style={{ color: theme.accent, fontSize: 16 }}>Done</Text></Pressable></View>
      <TextInput autoFocus value={query} onChangeText={setQuery} placeholder="Search your writing…" placeholderTextColor={theme.muted} style={[styles.searchInput, { color: theme.ink, backgroundColor: theme.surface, borderColor: theme.line }]} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }}>{query.trim() && results.length === 0 ? <Text style={{ color: theme.muted, textAlign: 'center', marginTop: 40 }}>No matching pages yet.</Text> : results.map((result, i) => <Pressable key={`${result.date}:${result.tab}:${i}`} onPress={() => { selectDate(result.date); setTab(result.tab); setSearchOpen(false); setQuery(''); }} style={[styles.historyCard, { backgroundColor: theme.surface, borderColor: theme.line }]}><Text style={{ color: theme.accent, fontWeight: '700', fontSize: 12 }}>{result.section}</Text><Text style={[styles.historyDate, { color: theme.ink, marginTop: 4 }]}>{prettyDate(result.date)}</Text><Text numberOfLines={3} style={{ color: theme.muted, marginTop: 5, lineHeight: 20 }}>{result.excerpt}</Text></Pressable>)}</ScrollView>
    </SafeAreaView></Modal>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  page: { flex: 1 }, header: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { fontSize: 19, letterSpacing: 3, fontWeight: '800' }, headerSub: { fontSize: 11, marginTop: 3 }, headerActions: { flexDirection: 'row' }, iconButton: { padding: 8, marginLeft: 2 }, icon: { fontSize: 23 },
  content: { padding: 22, paddingBottom: 45 }, eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.7, marginBottom: 10 }, title: { fontFamily: serif, fontSize: 30 }, prompt: { fontSize: 14, lineHeight: 21, marginTop: 8, marginBottom: 23 },
  empty: { borderRadius: 17, padding: 25, alignItems: 'center', marginBottom: 17 }, emptyText: { marginTop: 8, textAlign: 'center', fontSize: 14 },
  addButton: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 15, padding: 16, alignItems: 'center', marginTop: 3 },
  affirmation: { borderRadius: 17, padding: 20, marginTop: 18 }, quote: { fontFamily: serif, fontSize: 17, lineHeight: 25, marginTop: 8 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 }, saveButton: { borderRadius: 12, paddingHorizontal: 17, paddingVertical: 11 }, privacy: { textAlign: 'center', fontSize: 11, marginTop: 33 },
  modalPage: { flex: 1 }, modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 }, modalTitle: { fontFamily: serif, fontSize: 25 },
  historyCard: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 11 }, historyDate: { fontFamily: serif, fontSize: 16 }, searchInput: { borderRadius: 14, borderWidth: 1, marginHorizontal: 20, marginBottom: 18, padding: 14, fontSize: 16 },
});
