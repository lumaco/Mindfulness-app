import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useLog } from '../state/LogContext';
import { usePalette } from '../state/PaletteContext';
import { colors } from '../theme';
import { useI18n } from '../state/I18nContext';

function hexToRgb(hex: string) { let h=hex.replace('#',''); if(h.length===3) h=h.split('').map(c=>c+c).join(''); const n=parseInt(h,16); return {r:(n>>16)&255,g:(n>>8)&255,b:n&255}; }
function withAlpha(hex: string, a:number){ const {r,g,b}=hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; }

function MiniChart14({ data, tint }: { data: { label: string; minutes: number }[]; tint: string }) {
  const maxMin = Math.max(10, ...data.map(d => d.minutes));
  const H = 80;
  const barW = Math.floor((300 - (data.length - 1) * 6) / data.length);
  const xLabelsIdx = [0, Math.floor(data.length/2), data.length-1];

  return (
    <View style={cs.wrap}>
      <View style={cs.grid}>
        {[0.0, 0.5, 1.0].map((p, i) => (<View key={i} style={[cs.gridLine, { bottom: p * H, backgroundColor: withAlpha(tint, 0.25) }]} />))}
      </View>
      <View style={[cs.row, { height: H }]}>
        {data.map((d, i) => { const h = Math.max(4, (d.minutes / maxMin) * (H - 4)); return <View key={i} style={[cs.bar, { height: h, width: barW, backgroundColor: tint }]} />; })}
      </View>
      <View style={cs.xrow}>
        {data.map((d, i) => (<Text key={i} style={[cs.xlabel, xLabelsIdx.includes(i) ? cs.xlabelOn : cs.xlabelOff]}>{d.label}</Text>))}
      </View>
    </View>
  );
}

export default function LogScreen() {
  const { entries, clearAll, stats } = useLog();
  const { palette } = usePalette();
  const { t, wd } = useI18n();
  const tint = palette.inhale;

  const chartData = useMemo(() => stats.last14.map(d => ({ label: d.label[0], minutes: d.minutes })), [stats.last14]);

  function fmtClock(iso: string) { const d = new Date(iso); return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; }
  function fmtDate(iso: string) { const d = new Date(iso); const dd = String(d.getDate()).padStart(2,'0'); const mo = String(d.getMonth()+1).padStart(2,'0'); return `${wd(d.getDay())} ${dd}/${mo}`; }

  return (
    <View style={s.container}>
      <Text style={s.title}>{t('log.title')}</Text>

      <View style={s.cards}>
        <View style={s.card}><Text style={[s.kpi, { color: tint }]}>{stats.totalMinutes}</Text><Text style={s.kpiLabel}>{t('log.kpi.totalMin')}</Text></View>
        <View style={s.card}><Text style={[s.kpi, { color: tint }]}>{stats.totalSessions}</Text><Text style={s.kpiLabel}>{t('log.kpi.sessions')}</Text></View>
        <View style={s.card}><Text style={[s.kpi, { color: tint }]}>{stats.streakDays}</Text><Text style={s.kpiLabel}>{t('log.kpi.streakDays')}</Text></View>
      </View>

      <View style={s.graphCard}>
        <Text style={s.section}>{t('log.last14')}</Text>
        <MiniChart14 data={chartData} tint={tint} />
      </View>

      <Text style={[s.section, { marginTop: 12 }]}>{t('log.listTitle')}</Text>
      <FlatList
        data={entries}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={<Text style={{ color: '#94a3b8', padding: 8 }}>{t('log.empty')}</Text>}
        renderItem={({ item }) => (
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={s.rowTitle}>{fmtDate(item.dateISO)} · {fmtClock(item.dateISO)}</Text>
              <Text style={s.rowSub}>
                {Math.round(item.durationSec/60)} min · {t('home.breathHalf')}: {item.breathHalfSec.toFixed(1)}s · {t('home.bellEvery')}: {item.bellIntervalSec}s
              </Text>
            </View>
            {item.paletteId ? <View style={[s.swatch, { borderColor: tint }]}><Text style={[s.swatchText, { color: tint }]}>{item.paletteId}</Text></View> : null}
          </View>
        )}
      />

      <View style={{ height: 8 }} />
      <View style={[s.btn, { backgroundColor: withAlpha(tint, 0.12), borderColor: tint }]} onTouchEnd={clearAll}>
        <Text style={[s.btnGhostText, { color: tint }]}>{t('log.clear')}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b1220', padding: 16 },
  title: { color: '#e5e7eb', fontSize: 26, fontWeight: '800', marginBottom: 12 },
  section: { color: '#94a3b8', fontWeight: '600', marginBottom: 8 },
  cards: { flexDirection: 'row', gap: 10 },
  card: { flex: 1, backgroundColor: '#0f172a', borderColor: '#1f2a44', borderWidth: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
  kpi: { fontSize: 20, fontWeight: '800' },
  kpiLabel: { color: '#94a3b8', marginTop: 2 },
  graphCard: { marginTop: 10, backgroundColor: '#0f172a', borderColor: '#1f2a44', borderWidth: 1, borderRadius: 12, padding: 12 },
  row: { flexDirection: 'row', gap: 10, alignItems: 'center', padding: 10, borderRadius: 12, backgroundColor: '#0f172a', borderColor: '#1f2a44', borderWidth: 1, marginBottom: 8 },
  rowTitle: { color: '#e5e7eb', fontWeight: '700' },
  rowSub: { color: '#94a3b8' },
  swatch: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  swatchText: { fontWeight: '700' },
  btn: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 12, borderWidth: 1, alignSelf: 'flex-start' },
  btnGhostText: { fontWeight: '700' },
});

const cs = StyleSheet.create({
  wrap: { marginTop: 4 },
  grid: { position: 'absolute', left: 0, right: 0, top: 6, bottom: 30 },
  gridLine: { position: 'absolute', left: 0, right: 0, height: 1 },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, paddingHorizontal: 2, marginTop: 6 },
  bar: { borderRadius: 6 },
  xrow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingHorizontal: 2 },
  xlabel: { width: 14, textAlign: 'center', color: '#94a3b8', fontSize: 11 },
  xlabelOn: { opacity: 1 },
  xlabelOff: { opacity: 0.35 },
});
