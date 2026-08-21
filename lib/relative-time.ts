const RELATIVE_TIME_UNITS = [
  { unit: "second", value: 1, threshold: 60 },
  { unit: "minute", value: 60, threshold: 60 * 60 },
  { unit: "hour", value: 60 * 60, threshold: 60 * 60 * 24 },
  { unit: "day", value: 60 * 60 * 24, threshold: 60 * 60 * 24 * 7 },
  { unit: "week", value: 60 * 60 * 24 * 7, threshold: 60 * 60 * 24 * 30 },
  { unit: "month", value: 60 * 60 * 24 * 30, threshold: 60 * 60 * 24 * 365 },
  { unit: "year", value: 60 * 60 * 24 * 365, threshold: Number.POSITIVE_INFINITY },
] as const;

const relativeTimeFormatter = new Intl.RelativeTimeFormat("en", { numeric: "always" });

export function formatRelativeTime(value: string, now = Date.now()) {
  const differenceInSeconds = (Date.parse(value) - now) / 1000;

  if (!Number.isFinite(differenceInSeconds)) return "—";

  const absoluteDifference = Math.abs(differenceInSeconds);
  const selectedUnit = RELATIVE_TIME_UNITS.find(({ threshold }) => absoluteDifference < threshold) ?? RELATIVE_TIME_UNITS.at(-1)!;
  const amount = Math.round(differenceInSeconds / selectedUnit.value);

  return relativeTimeFormatter.format(amount, selectedUnit.unit);
}
