export function calculateMacros(items, foodMap, mealMap = new Map()) {
  const totals = { calories: 0, protein: 0, netCarbs: 0, fat: 0 };

  for (const item of items) {
    const multiplier = item.quantity / 100;

    if (item.type === 'food') {
      const food = foodMap.get(item.refId || item.foodId);
      if (food) {
        totals.calories += food.calories * multiplier;
        totals.protein += food.protein * multiplier;
        totals.netCarbs += food.netCarbs * multiplier;
        totals.fat += food.fat * multiplier;
      }
    } else if (item.type === 'compositeMeal') {
      const meal = mealMap.get(item.refId);
      if (meal?.totalMacros) {
        totals.calories += meal.totalMacros.calories * multiplier;
        totals.protein += meal.totalMacros.protein * multiplier;
        totals.netCarbs += meal.totalMacros.netCarbs * multiplier;
        totals.fat += meal.totalMacros.fat * multiplier;
      }
    }
  }

  return {
    calories: Math.round(totals.calories),
    protein: Math.round(totals.protein * 10) / 10,
    netCarbs: Math.round(totals.netCarbs * 10) / 10,
    fat: Math.round(totals.fat * 10) / 10,
  };
}

export function getPercentage(current, goal) {
  if (!goal || goal <= 0) return 0;
  return Math.min(100, Math.round((current / goal) * 100));
}

// All date keys throughout the app must match the backend, which stores
// DailyPlan / WeeklyPlan dates at UTC midnight (see backend/src/routes/*).
// We therefore do every date computation in UTC so that the date string
// returned here always corresponds to the same Mongo document key
// regardless of the user's local timezone or DST transitions.

export function formatDate(date) {
  const d = new Date(date);
  // Build the YYYY-MM-DD string from UTC parts so the result lines up
  // with what the backend uses as the lookup key.
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// "Today" should reflect the calendar day the USER is in, then be
// converted to its UTC-midnight key. We start from local Y/M/D so we
// don't roll into yesterday/tomorrow when local time is near midnight.
export function todayDateString() {
  const now = new Date();
  return localPartsToISODate(now.getFullYear(), now.getMonth(), now.getDate());
}

function localPartsToISODate(year, month, day) {
  const utc = new Date(Date.UTC(year, month, day));
  return formatDate(utc);
}

export function getWeekStart(date = new Date()) {
  // Use the user's local Y/M/D, then walk back to Monday using UTC math
  // (which has no DST surprises) so the resulting weekStart string is
  // exactly what the backend expects when it does
  // `new Date(weekStart + 'T00:00:00Z')`.
  const src = new Date(date);
  const utcMidnight = new Date(Date.UTC(
    src.getFullYear(), src.getMonth(), src.getDate()
  ));
  const jsDow = utcMidnight.getUTCDay();      // Sun=0..Sat=6
  const dow = (jsDow + 6) % 7;                 // Mon=0..Sun=6 (matches backend)
  utcMidnight.setUTCDate(utcMidnight.getUTCDate() - dow);
  return formatDate(utcMidnight);
}

// Add `n` days to a YYYY-MM-DD date string in UTC and return a new
// YYYY-MM-DD string. Useful for the week page's per-day date links.
export function addDays(dateString, n) {
  const d = new Date(dateString + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return formatDate(d);
}

// Inverse of addDays — returns the integer offset between the two
// YYYY-MM-DD strings, computed in UTC. Used by `todayIndex` on the
// week page so the highlighted day always matches the user's calendar.
export function dayOffset(fromDateString, toDateString) {
  const from = new Date(fromDateString + 'T00:00:00Z').getTime();
  const to = new Date(toDateString + 'T00:00:00Z').getTime();
  return Math.round((to - from) / 86400000);
}

export function getDayNames() {
  return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
}

export function getDayShortNames() {
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
}
