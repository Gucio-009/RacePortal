/**
 * Widok kalendarza miesięcznego dla wydarzeń (markery z `/api/events/markers`).
 *
 * Rola w architekturze: jeden z trzech trybów listy eventów (lista / kalendarz / mapa)
 * w `EventsScreen` — siatka Pn–Nd, dni ze złotym tłem = eventy, tap → lista dnia.
 * Logika lokalna (bez zewnętrznej lib kalendarza), tydzień zaczyna się od poniedziałku.
 *
 * Technologie: React Native View/Pressable, `EventMarker` z api-types.
 *
 * Pomysł (alt): `react-native-calendars` / FullCalendar WebView;
 * Flutter `table_calendar`; synchro z Google Calendar.
 */
import { useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import type { EventMarker } from "../api/types";
import { colors } from "../theme/colors";

const WEEKDAYS = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function daysInMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

/** Indeks dnia tygodnia 0..6 z poniedziałkiem jako 0. */
function mondayIndex(date: Date) {
  return (date.getDay() + 6) % 7;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function parseEventDay(iso: string): Date | null {
  try {
    const d = new Date(iso.slice(0, 10) + "T12:00:00");
    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

export function EventsCalendarView({
  events,
  onSelectEvent,
}: {
  events: EventMarker[];
  onSelectEvent: (id: string) => void;
}) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState<Date | null>(null);

  const eventDays = useMemo(() => {
    const map = new Map<string, EventMarker[]>();
    for (const e of events) {
      const d = parseEventDay(e.date);
      if (!d) continue;
      const key = d.toISOString().slice(0, 10);
      const list = map.get(key) ?? [];
      list.push(e);
      map.set(key, list);
    }
    return map;
  }, [events]);

  const cells = useMemo(() => {
    const first = startOfMonth(month);
    const total = daysInMonth(month);
    const pad = mondayIndex(first);
    const out: (Date | null)[] = Array(pad).fill(null);
    for (let day = 1; day <= total; day++) {
      out.push(new Date(month.getFullYear(), month.getMonth(), day));
    }
    while (out.length % 7 !== 0) out.push(null);
    return out;
  }, [month]);

  const dayEvents = useMemo(() => {
    if (!selected) return [];
    const key = selected.toISOString().slice(0, 10);
    return eventDays.get(key) ?? [];
  }, [selected, eventDays]);

  const title = month.toLocaleDateString("pl-PL", { month: "long", year: "numeric" });

  return (
    <View style={styles.root}>
      <View style={styles.nav}>
        <Pressable
          onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
          style={styles.navBtn}
        >
          <Text style={styles.navBtnText}>‹</Text>
        </Pressable>
        <Text style={styles.title}>{title}</Text>
        <Pressable
          onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
          style={styles.navBtn}
        >
          <Text style={styles.navBtnText}>›</Text>
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAYS.map((w) => (
          <Text key={w} style={styles.weekday}>
            {w}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((day, i) => {
          if (!day) return <View key={`e-${i}`} style={styles.cell} />;
          const key = day.toISOString().slice(0, 10);
          const has = eventDays.has(key);
          const on = selected && sameDay(day, selected);
          return (
            <Pressable
              key={key}
              style={[styles.cell, has && styles.cellHas, on && styles.cellOn]}
              onPress={() => setSelected(day)}
            >
              <Text style={[styles.cellText, has && styles.cellTextHas, on && styles.cellTextOn]}>
                {day.getDate()}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.hint}>
        {selected
          ? selected.toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" })
          : "Wybierz dzień w kalendarzu"}
      </Text>

      {dayEvents.map((e) => (
        <Pressable key={e.id} style={styles.eventRow} onPress={() => onSelectEvent(e.id)}>
          <Text style={styles.eventName} numberOfLines={2}>
            {e.name}
          </Text>
          <Text style={styles.eventMeta}>
            {e.category} · {e.track} · {e.time}
          </Text>
        </Pressable>
      ))}
      {selected && dayEvents.length === 0 ? (
        <Text style={styles.empty}>Brak wydarzeń w tym dniu (dla filtrów).</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { padding: 16, gap: 10 },
  nav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  navBtn: { padding: 8, minWidth: 40, alignItems: "center" },
  navBtnText: { color: colors.gold, fontSize: 28, fontWeight: "800" },
  title: { color: colors.text, fontWeight: "800", fontSize: 16, textTransform: "capitalize" },
  weekRow: { flexDirection: "row" },
  weekday: { flex: 1, textAlign: "center", color: colors.muted, fontSize: 11, fontWeight: "700" },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: {
    width: "14.28%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 2,
  },
  cellHas: { backgroundColor: "rgba(255,215,0,0.2)", borderRadius: 8 },
  cellOn: { borderWidth: 1, borderColor: colors.gold, borderRadius: 8 },
  cellText: { color: colors.text, fontSize: 13 },
  cellTextHas: { color: colors.gold, fontWeight: "800" },
  cellTextOn: { color: colors.gold },
  hint: { color: colors.muted, fontSize: 13, marginTop: 4 },
  eventRow: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  eventName: { color: colors.text, fontWeight: "800" },
  eventMeta: { color: colors.muted, fontSize: 12 },
  empty: { color: colors.muted, textAlign: "center", marginTop: 8 },
});
