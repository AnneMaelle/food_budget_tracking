import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
dayjs.extend(utc)
dayjs.extend(timezone)

export type Cycle = { startISO: string; endISO: string }

// Compute the current 14-day cycle using an anchor date. Defaults to Jan 1, 2025 in Europe/Paris.
export function computeCycle(now = dayjs(), anchorISO = '2025-01-01', tz = 'Europe/Paris'): Cycle {
  const dNow = dayjs.tz(now, tz)
  const anchor = dayjs.tz(anchorISO, tz).startOf('day')
  const daysDiff = dNow.startOf('day').diff(anchor, 'day')
  const offset = Math.floor(daysDiff / 14) * 14
  const start = anchor.add(offset, 'day')
  const end = start.add(14, 'day')
  return { startISO: start.toISOString(), endISO: end.toISOString() }
}

export function formatRange(cycle: Cycle, tz='Europe/Paris') {
  const s = dayjs(cycle.startISO).tz(tz)
  const e = dayjs(cycle.endISO).tz(tz).subtract(1, 'day')
  return `${s.format('MMM D')}–${e.format('MMM D')}`
}
