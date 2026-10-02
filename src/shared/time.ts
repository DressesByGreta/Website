/**
 * Days, weeks and months in Tirana time, the shop's own clock. The Worker runs in UTC and a phone
 * may be anywhere, so the visit counts and the sales report both work out the day here. Dates are
 * YYYY-MM-DD strings; instants are ISO strings, like the orders' created_at.
 */
export const TZ = 'Europe/Tirane';

const clock = new Intl.DateTimeFormat('en-US', {
  timeZone: TZ,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

/** Tirana's wall clock at an instant, written as if it were UTC (milliseconds). */
export function wall(at: number): number {
  const p: Record<string, number> = {};
  for (const x of clock.formatToParts(new Date(at))) if (x.type !== 'literal') p[x.type] = Number(x.value);
  return Date.UTC(p.year!, p.month! - 1, p.day!, p.hour!, p.minute!, p.second!);
}

/** The day in Tirana at an instant. */
export const tiranaDay = (at: number = Date.now()): string => new Date(wall(at)).toISOString().slice(0, 10);

/** The instant a Tirana day begins (midnight never falls inside a clock change there). */
export function dayStart(day: string): string {
  const midnight = Date.parse(`${day}T00:00:00Z`);
  let at = midnight - (wall(midnight) - midnight);
  at = midnight - (wall(at) - at);
  return new Date(at).toISOString();
}

export const addDays = (day: string, n: number): string => new Date(Date.parse(`${day}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);

/** The Monday of the week that holds `day`. */
export const weekStart = (day: string): string => addDays(day, -((new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7));

/** The first day of the month `n` months after the one that holds `day`. */
export function monthStart(day: string, n = 0): string {
  const d = new Date(`${day.slice(0, 7)}-01T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString().slice(0, 10);
}

export const isDay = (v: unknown): v is string => {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const t = Date.parse(`${v}T00:00:00Z`);
  return !Number.isNaN(t) && new Date(t).toISOString().startsWith(v);
};
