// utils/dateKey.ts
export function getBelgiumDateKey(date: Date): string {
  // Belgium time (Europe/Brussels) aligns with UTC+1 / UTC+2 DST
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Brussels",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(date); // YYYY-MM-DD
}
