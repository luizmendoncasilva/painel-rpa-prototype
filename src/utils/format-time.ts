import dayjs, { type Dayjs } from 'dayjs';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';

// ----------------------------------------------------------------------

dayjs.extend(duration);
dayjs.extend(relativeTime);

// ----------------------------------------------------------------------

export const FORMAT_PATTERNS = {
  dateTime: 'DD MMM YYYY h:mm a',
  date: 'DD MMM YYYY',
  time: 'h:mm a',
  split: {
    dateTime: 'DD/MM/YYYY h:mm a',
    date: 'DD/MM/YYYY',
  },
  paramCase: {
    dateTime: 'DD-MM-YYYY h:mm a',
    date: 'DD-MM-YYYY',
  },
};

type DateInput = string | number | Date | Dayjs | null | undefined;

const INVALID_DATE = 'Invalid';

// ----------------------------------------------------------------------

export function today(template?: string): string {
  return dayjs(new Date()).startOf('day').format(template);
}

// ----------------------------------------------------------------------

export function fDateTime(input: DateInput, template: string = FORMAT_PATTERNS.dateTime): string {
  if (!input) return '';
  const date = dayjs(input);
  if (!date.isValid()) return INVALID_DATE;
  return date.format(template);
}

// ----------------------------------------------------------------------

export function fDate(input: DateInput, template: string = FORMAT_PATTERNS.date): string {
  if (!input) return '';
  const date = dayjs(input);
  if (!date.isValid()) return INVALID_DATE;
  return date.format(template);
}

// ----------------------------------------------------------------------

export function fTime(input: DateInput, template: string = FORMAT_PATTERNS.time): string {
  if (!input) return '';
  const date = dayjs(input);
  if (!date.isValid()) return INVALID_DATE;
  return date.format(template);
}

// ----------------------------------------------------------------------

export function fTimestamp(input: DateInput): number | string {
  if (!input) return '';
  const date = dayjs(input);
  if (!date.isValid()) return INVALID_DATE;
  return date.valueOf();
}

// ----------------------------------------------------------------------

export function fToNow(input: DateInput): string {
  if (!input) return '';
  const date = dayjs(input);
  if (!date.isValid()) return INVALID_DATE;
  return date.toNow(true);
}

// ----------------------------------------------------------------------

export function fIsBetween(
  input: DateInput,
  start: DateInput,
  end: DateInput
): boolean {
  if (!input || !start || !end) return false;
  const inputDate = dayjs(input);
  const startDate = dayjs(start);
  const endDate = dayjs(end);
  if (!inputDate.isValid() || !startDate.isValid() || !endDate.isValid()) return false;
  const inputValue = inputDate.valueOf();
  const startValue = startDate.valueOf();
  const endValue = endDate.valueOf();
  return (
    inputValue >= Math.min(startValue, endValue) && inputValue <= Math.max(startValue, endValue)
  );
}

// ----------------------------------------------------------------------

export function fIsAfter(start: DateInput, end: DateInput): boolean {
  if (!start || !end) return false;
  const startDate = dayjs(start);
  const endDate = dayjs(end);
  if (!startDate.isValid() || !endDate.isValid()) return false;
  return startDate.isAfter(endDate);
}

// ----------------------------------------------------------------------

export function fIsSame(
  start: DateInput,
  end: DateInput,
  unit: dayjs.OpUnitType = 'year'
): boolean {
  if (!start || !end) return false;
  const startDate = dayjs(start);
  const endDate = dayjs(end);
  if (!startDate.isValid() || !endDate.isValid()) return false;
  return startDate.isSame(endDate, unit);
}

// ----------------------------------------------------------------------

export function fDateRangeShortLabel(
  start: DateInput,
  end: DateInput,
  initial?: boolean
): string {
  if (!start || !end) return '';
  const startDate = dayjs(start);
  const endDate = dayjs(end);
  if (!startDate.isValid() || !endDate.isValid() || startDate.isAfter(endDate)) return INVALID_DATE;
  if (initial) return `${fDate(startDate)} - ${fDate(endDate)}`;
  const isSameDay = startDate.isSame(endDate, 'day');
  const isSameMonth = startDate.isSame(endDate, 'month');
  const isSameYear = startDate.isSame(endDate, 'year');
  if (isSameDay) return fDate(endDate);
  if (isSameMonth) return `${fDate(startDate, 'DD')} - ${fDate(endDate)}`;
  if (isSameYear) return `${fDate(startDate, 'DD MMM')} - ${fDate(endDate)}`;
  return `${fDate(startDate)} - ${fDate(endDate)}`;
}

// ----------------------------------------------------------------------

interface Duration {
  years?: number;
  months?: number;
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
  milliseconds?: number;
}

export function fAdd({ years = 0, months = 0, days = 0, hours = 0, minutes = 0, seconds = 0, milliseconds = 0 }: Duration): string {
  return dayjs().add(dayjs.duration({ years, months, days, hours, minutes, seconds, milliseconds })).format();
}

export function fSub({ years = 0, months = 0, days = 0, hours = 0, minutes = 0, seconds = 0, milliseconds = 0 }: Duration): string {
  return dayjs().subtract(dayjs.duration({ years, months, days, hours, minutes, seconds, milliseconds })).format();
}
