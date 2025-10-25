/**
 * Time conversion utilities for handling 12-hour and 24-hour time formats
 */

/**
 * Converts 24-hour time (HH:MM) to 12-hour time with AM/PM
 * @param time24 - Time in 24-hour format (e.g., "14:30", "09:00")
 * @returns Time in 12-hour format with AM/PM (e.g., "2:30 PM", "9:00 AM")
 */
export function convertTo12Hour(time24: string): string {
  if (!time24 || !time24.includes(':')) return time24;
  
  // If already has AM/PM, return as-is
  if (/AM|PM/i.test(time24)) return time24;
  
  const [hoursStr, minutes] = time24.split(':');
  let hours = parseInt(hoursStr, 10);
  
  if (isNaN(hours)) return time24;
  
  const period = hours >= 12 ? 'PM' : 'AM';
  
  // Convert 24-hour to 12-hour
  if (hours === 0) {
    hours = 12; // Midnight
  } else if (hours > 12) {
    hours = hours - 12;
  }
  
  return `${hours}:${minutes} ${period}`;
}

/**
 * Converts 12-hour time with AM/PM to 24-hour time
 * @param time12 - Time in 12-hour format with AM/PM (e.g., "2:30 PM", "9:00 AM")
 * @returns Time in 24-hour format (e.g., "14:30", "09:00")
 */
export function convertTo24Hour(time12: string): string {
  if (!time12) return '';
  
  // If already in 24-hour format (no AM/PM), return as-is
  if (!/AM|PM/i.test(time12)) return time12;
  
  const match = time12.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return time12;
  
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const period = match[3].toUpperCase();
  
  // Convert 12-hour to 24-hour
  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }
  
  const hoursStr = hours.toString().padStart(2, '0');
  return `${hoursStr}:${minutes}`;
}

/**
 * Extracts time and period from a time string
 * @param timeStr - Time string (e.g., "2:30 PM", "14:30")
 * @returns Object with time (HH:MM) and period (AM/PM) or null
 */
export function parseTime(timeStr: string): { time: string; period: 'AM' | 'PM' } | null {
  if (!timeStr) return null;
  
  // Check if has AM/PM
  const match = timeStr.match(/(\d{1,2}:\d{2})\s*(AM|PM)/i);
  if (match) {
    const time24 = convertTo24Hour(timeStr);
    const hours = parseInt(time24.split(':')[0], 10);
    return {
      time: time24,
      period: (hours >= 12 ? 'PM' : 'AM') as 'AM' | 'PM'
    };
  }
  
  // No AM/PM, assume 24-hour format
  const hours = parseInt(timeStr.split(':')[0], 10);
  if (isNaN(hours)) return null;
  
  return {
    time: timeStr,
    period: (hours >= 12 ? 'PM' : 'AM') as 'AM' | 'PM'
  };
}

/**
 * Formats a time value and period into a complete time string
 * @param time - Time in HH:MM format (24-hour from time input, 0-23 hours)
 * @param period - AM or PM (from user's dropdown selection)
 * @returns Formatted time string with AM/PM
 */
export function formatTimeWithPeriod(time: string, period: 'AM' | 'PM'): string {
  if (!time) return '';
  
  const [hoursStr, minutes] = time.split(':');
  let hours = parseInt(hoursStr, 10);
  
  if (isNaN(hours)) return time;
  
  // The time input gives us 24-hour format (0-23)
  // First, convert to 12-hour display (1-12)
  let displayHours = hours % 12;
  if (displayHours === 0) displayHours = 12;
  
  // Use the user's selected period from the dropdown
  return `${displayHours}:${minutes} ${period}`;
}
