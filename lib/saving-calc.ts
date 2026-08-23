export function calcSchedule(
  targetAmount: number,
  currentAmount: number,
  targetDate: Date | string
) {
  const remaining = Math.max(0, targetAmount - currentAmount);
  const to = typeof targetDate === "string" ? new Date(targetDate) : targetDate;
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  to.setHours(23, 59, 59, 999);
  const daysLeft = Math.max(
    1,
    Math.ceil((to.getTime() - from.getTime()) / 86400000)
  );
  if (remaining === 0) {
    return {
      remaining,
      daysLeft,
      perDay: 0,
      perWeek: 0,
      perMonth: 0,
      onTrack: true,
    };
  }
  const perDay = remaining / daysLeft;
  return {
    remaining,
    daysLeft,
    perDay,
    perWeek: perDay * 7,
    perMonth: perDay * 30,
    onTrack: false,
  };
}
