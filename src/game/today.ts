const FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Argentina/Buenos_Aires",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function today(now: Date = new Date()): string {
  return FORMATTER.format(now);
}

export function currentYearArt(now: Date = new Date()): number {
  return Number(today(now).slice(0, 4));
}
