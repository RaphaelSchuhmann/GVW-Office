/**
 * Capitalizes the first letter of each word in a string
 * @param {string} str - String to capitalize
 * @returns {string} String with each word capitalized
 */
export function capitalizeWords(str) {
    return str
        .toLowerCase()
        .replaceAll(/(^|[\s-_])\w/g, match => match.toUpperCase());
}

export const currentYear = new Date().getFullYear();
export const currentMonth = new Date().getMonth();

/**
 * Returns the number of days in a given month and year
 * @param {number} year - The year
 * @param {number} month - The month (0-indexed)
 * @returns {number} Number of days in the month
 */
export function daysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

/**
 * Returns the first weekday of a month (Monday = 0, Sunday = 6)
 * @param {number} year - The year
 * @param {number} month - The month (0-indexed)
 * @returns {number} First weekday of the month (0-6, Monday first)
 */
export function firstWeekdayOfMonth(year, month) {
    let day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
}

/**
 * Checks if a given day/month/year is today
 * @param {number} day - Day of the month
 * @param {number} month - Month (0-indexed)
 * @param {number} year - Year
 * @returns {boolean} True if the date is today
 */
export function isToday(day, month, year) {
    let today = new Date();
    return (day === today.getDate() && month === today.getMonth() && year === today.getFullYear());
}

/**
 * Formats an ISO date string into a localized German date string.
 *
 * Responsibilities:
 * - Parses the provided date string into a JavaScript `Date` object
 * - Formats the date using the German locale (`de-DE`)
 * - Returns the formatted date in `dd.MM.yyyy` format
 *
 * Behavior:
 * - Returns a formatted date string if parsing is successful
 * - Returns `"Ungültiges Datum"` if the input cannot be parsed
 *
 * @function formatISODateString
 * @param {string} dateStr - ISO date string (e.g. "2026-04-10T11:55:00Z")
 * @returns {string} Formatted date string or fallback message
 */
export function formatISODateString(dateStr) {
    if (!dateStr) return "Ungültiges Datum";
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return "Ungültiges Datum";

    return new Intl.DateTimeFormat('de-DE', {
        day: "2-digit",
        month: "2-digit",
        year: 'numeric',
    }).format(date);
}

// FIXME: Can be removed after standardization on ISO Date Strings is finished
/**
 * Converts DD.MM.YYYY string to JavaScript Date object
 * @param {string} dateStr - Date string in DD.MM.YYYY format
 * @returns {Date} JavaScript Date object
 */
export function parseDMYToDate(dateStr) {
    const [dayStr, monthStr, yearStr] = dateStr.split(".");
    const day = Number(dayStr);
    const month = Number(monthStr);
    const year = Number(yearStr);
    return new Date(year, month - 1, day);
}

/**
 * Gets the last day of the current month.
 * * Logic: The Date constructor treats day '0' as the last day of the previous month.
 * By targeting (Current Month + 1) and Day 0, JavaScript rolls back one day
 * from the start of next month to the exact end of the current month.
 * * @returns {Date} Date object representing the last day of current month
 */
export function getLastDayOfCurrentMonth() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    // Setting the day to 0 returns the last day of the month prior to the one provided
    return new Date(year, month + 1, 0);
}

/**
 * Determines if a string contains a number
 * @param {string} str - String to check
 * @returns {boolean} True if string contains a number
 */
export function determineChoirType(str) {
    return /\d/.test(str);
}