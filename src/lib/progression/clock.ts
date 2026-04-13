const MS_PER_DAY = 24 * 60 * 60 * 1000;

function getUtcDayParts(date: Date): {
  year: number;
  month: number;
  day: number;
} {
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function getWeekdayOfUtcDate(year: number, month: number, day: number): number {
  const offsets = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];
  let adjustedYear = year;

  if (month < 3) {
    adjustedYear -= 1;
  }

  const sundayBased =
    (adjustedYear +
      Math.floor(adjustedYear / 4) -
      Math.floor(adjustedYear / 100) +
      Math.floor(adjustedYear / 400) +
      offsets[month - 1] +
      day) %
    7;

  return (sundayBased + 6) % 7;
}

function getDayOfYear(date: Date): number {
  const { year, month, day } = getUtcDayParts(date);
  const monthLengths = [
    31,
    isLeapYear(year) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  let total = day;
  for (let i = 0; i < month - 1; i += 1) {
    total += monthLengths[i];
  }

  return total;
}

function getWeeksInUtcYear(year: number): number {
  const jan1Weekday = getWeekdayOfUtcDate(year, 1, 1);

  if (jan1Weekday === 4 || (jan1Weekday === 3 && isLeapYear(year))) {
    return 53;
  }

  return 52;
}

/**
 * Get the current UTC date string in YYYY-MM-DD format.
 */
export function getUtcDayKey(date: Date): string {
  const { year, month, day } = getUtcDayParts(date);
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

/**
 * Get the current UTC month string in YYYY-MM format.
 */
export function getUtcMonthKey(date: Date): string {
  const { year, month } = getUtcDayParts(date);
  return `${year}-${pad2(month)}`;
}

/**
 * Get the ISO week key in YYYY-WNN format.
 */
export function getUtcWeekKey(date: Date): string {
  const year = date.getUTCFullYear();
  const dayOfYear = getDayOfYear(date);
  const dayOfWeek = (date.getUTCDay() + 6) % 7;
  let week = Math.floor((dayOfYear - dayOfWeek + 10) / 7);
  let weekYear = year;

  if (week < 1) {
    weekYear = year - 1;
    week = getWeeksInUtcYear(weekYear);
  } else {
    const weeksInYear = getWeeksInUtcYear(year);
    if (week > weeksInYear) {
      weekYear = year + 1;
      week = 1;
    }
  }

  return `${weekYear}-W${pad2(week)}`;
}

/**
 * Get the UTC day number since Unix epoch.
 */
export function getUtcDayNumber(date: Date): number {
  return Math.floor(date.getTime() / MS_PER_DAY);
}

/**
 * Check if `after` is the immediate next UTC day after `before`.
 */
export function isNextUtcDay(after: Date, before: Date): boolean {
  return getUtcDayNumber(after) - getUtcDayNumber(before) === 1;
}
