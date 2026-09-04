import { SundaySlotInfo } from '../types';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export function formatDateToISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatShortDate(iso: string): string {
  const d = parseISODate(iso);
  return `${d.getDate()} ${MONTH_NAMES_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatFullSunday(iso: string): string {
  const d = parseISODate(iso);
  return `Sunday, ${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatMonthYear(monthIndex: number, year: number): string {
  return `${MONTH_NAMES[monthIndex]} ${year}`;
}

/**
 * Get all Sundays in a specific year
 */
export function getSundaysInYear(year: number): SundaySlotInfo[] {
  const sundays: SundaySlotInfo[] = [];
  const date = new Date(year, 0, 1);
  const today = new Date(2026, 8, 4); // September 4, 2026 reference or current

  // Advance to the first Sunday of the year
  while (date.getDay() !== 0) {
    date.setDate(date.getDate() + 1);
  }

  while (date.getFullYear() === year) {
    const iso = formatDateToISO(date);
    
    // Next Sunday (+7 days)
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 7);
    const nextIso = formatDateToISO(nextDate);

    sundays.push({
      date: iso,
      formattedDate: `${date.getDate()} ${MONTH_NAMES_SHORT[date.getMonth()]} ${date.getFullYear()}`,
      fullDisplay: `Sunday, ${date.getDate()} ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`,
      nextSunday: nextIso,
      formattedNextSunday: `${nextDate.getDate()} ${MONTH_NAMES_SHORT[nextDate.getMonth()]} ${nextDate.getFullYear()}`,
      isPast: date < today
    });

    date.setDate(date.getDate() + 7);
  }

  return sundays;
}

/**
 * Get Sundays for a specific month
 */
export function getSundaysInMonth(year: number, monthIndex: number): SundaySlotInfo[] {
  return getSundaysInYear(year).filter(s => {
    const d = parseISODate(s.date);
    return d.getMonth() === monthIndex;
  });
}
