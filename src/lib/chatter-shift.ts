/**
 * Chatter Shift Utilities
 *
 * Schedule format (stored as JSON string in Chatter.schedule):
 * {
 *   "monday": [{ "start": "09:00", "end": "17:00" }],
 *   "tuesday": [{ "start": "09:00", "end": "13:00" }, { "start": "14:00", "end": "18:00" }],
 *   "wednesday": [],
 *   ...
 * }
 */

export interface ShiftSlot {
  start: string; // "HH:mm" format
  end: string;   // "HH:mm" format
}

export interface WeekSchedule {
  monday?: ShiftSlot[];
  tuesday?: ShiftSlot[];
  wednesday?: ShiftSlot[];
  thursday?: ShiftSlot[];
  friday?: ShiftSlot[];
  saturday?: ShiftSlot[];
  sunday?: ShiftSlot[];
}

const DAY_NAMES: (keyof WeekSchedule)[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

/**
 * Parse schedule JSON string to WeekSchedule object
 */
export function parseSchedule(scheduleJson: string | null): WeekSchedule | null {
  if (!scheduleJson) return null;

  try {
    return JSON.parse(scheduleJson) as WeekSchedule;
  } catch {
    return null;
  }
}

/**
 * Check if current time falls within any shift slot for today
 */
export function isWithinShift(schedule: WeekSchedule | null, timezone?: string): boolean {
  if (!schedule) {
    // No schedule defined = always allowed
    return true;
  }

  const now = new Date();

  // Get current day and time in the specified timezone (or local)
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: timezone || "Europe/Paris", // Default to Paris timezone
  };

  const formatter = new Intl.DateTimeFormat("en-US", options);
  const parts = formatter.formatToParts(now);

  const dayPart = parts.find(p => p.type === "weekday")?.value?.toLowerCase();
  const hourPart = parts.find(p => p.type === "hour")?.value || "00";
  const minutePart = parts.find(p => p.type === "minute")?.value || "00";

  const currentTime = `${hourPart}:${minutePart}`;
  const dayKey = dayPart as keyof WeekSchedule;

  const todaySlots = schedule[dayKey];

  if (!todaySlots || todaySlots.length === 0) {
    // No shifts scheduled for today
    return false;
  }

  // Check if current time falls within any slot
  return todaySlots.some(slot => {
    return isTimeInRange(currentTime, slot.start, slot.end);
  });
}

/**
 * Check if a time string is within a range
 */
function isTimeInRange(current: string, start: string, end: string): boolean {
  const currentMinutes = timeToMinutes(current);
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);

  // Handle overnight shifts (e.g., 22:00 - 06:00)
  if (endMinutes < startMinutes) {
    return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
  }

  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

/**
 * Convert "HH:mm" to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Get shift status with details
 */
export function getShiftStatus(schedule: WeekSchedule | null, timezone?: string): {
  isOnShift: boolean;
  currentDay: string;
  currentTime: string;
  todayShifts: ShiftSlot[];
  nextShift: { day: string; slot: ShiftSlot } | null;
} {
  const now = new Date();
  const tz = timezone || "Europe/Paris";

  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: tz,
  };

  const formatter = new Intl.DateTimeFormat("en-US", options);
  const parts = formatter.formatToParts(now);

  const dayPart = parts.find(p => p.type === "weekday")?.value || "Monday";
  const hourPart = parts.find(p => p.type === "hour")?.value || "00";
  const minutePart = parts.find(p => p.type === "minute")?.value || "00";

  const currentTime = `${hourPart}:${minutePart}`;
  const dayKey = dayPart.toLowerCase() as keyof WeekSchedule;

  const todayShifts = schedule?.[dayKey] || [];
  const isOnShift = isWithinShift(schedule, tz);

  // Find next shift
  let nextShift: { day: string; slot: ShiftSlot } | null = null;

  if (!isOnShift && schedule) {
    const currentDayIndex = DAY_NAMES.indexOf(dayKey);

    // Check remaining slots today
    for (const slot of todayShifts) {
      if (timeToMinutes(slot.start) > timeToMinutes(currentTime)) {
        nextShift = { day: dayPart, slot };
        break;
      }
    }

    // Check upcoming days
    if (!nextShift) {
      for (let i = 1; i <= 7 && !nextShift; i++) {
        const nextDayIndex = (currentDayIndex + i) % 7;
        const nextDayKey = DAY_NAMES[nextDayIndex];
        const nextDaySlots = schedule[nextDayKey];

        if (nextDaySlots && nextDaySlots.length > 0) {
          nextShift = {
            day: nextDayKey.charAt(0).toUpperCase() + nextDayKey.slice(1),
            slot: nextDaySlots[0],
          };
        }
      }
    }
  }

  return {
    isOnShift,
    currentDay: dayPart,
    currentTime,
    todayShifts,
    nextShift,
  };
}

/**
 * Format shift slots for display
 */
export function formatShiftSlots(slots: ShiftSlot[]): string {
  if (!slots || slots.length === 0) return "No shifts";
  return slots.map(s => `${s.start} - ${s.end}`).join(", ");
}
