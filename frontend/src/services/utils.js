/**
 * Creates a promise that resolves after the specified delay
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} Promise that resolves after delay
 */
export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Capitalizes the first letter of each word in a string
 * @param {string} str - String to capitalize
 * @returns {string} String with each word capitalized
 */
export function capitalizeWords(str) {
    return str
        .toLowerCase()
        .replace(/(^|[\s-_])\w/g, match => match.toUpperCase());
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
 * Parses a DD.MM.YYYY string into day, month, year numbers
 * @param {string} dateStr - Date string in DD.MM.YYYY format
 * @returns {Object|null} Object with day, month, year or null if invalid
 */
function parseDMY(dateStr) {
    const parts = dateStr.split(".");
    if (parts.length !== 3) return null;

    const [dayStr, monthStr, yearStr] = parts;
    const day = Number(dayStr);
    const month = Number(monthStr);
    const year = Number(yearStr);

    if (!day || !month || !year) return null;

    return { day, month, year };
}

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
 * Validates if a DD.MM.YYYY string represents a valid date
 * @param {string} dateStr - Date string to validate
 * @returns {boolean} True if the date string is valid
 */
export function isValidDateString(dateStr) {
    const parsed = parseDMY(dateStr);
    if (!parsed) return false;

    const { day, month, year } = parsed;

    // JS months are 0-indexed
    const date = new Date(year, month - 1, day);

    return (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
    );
}

/**
 * Gets the last day of the current month
 * @returns {Date} Date object representing the last day of current month
 */
export function getLastDayOfCurrentMonth() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    return new Date(year, month + 1, 0);
}

/**
 * Creates a DD.MM.YYYY string from day and month in current year
 * @param {number} day - Day of the month
 * @param {number} month - Month (0-indexed)
 * @returns {string} Date string in DD.MM.YYYY format
 */
export function makeDateFromMonthAndDay(day, month) {
    const today = new Date();
    const year = today.getFullYear();

    const date = new Date(year, month, day);

    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0"); // JS months are 0-indexed
    const yyyy = date.getFullYear();

    return `${dd}.${mm}.${yyyy}`;
}

/**
 * Gets weekday number from DD.MM.YYYY string (Monday = 1, Sunday = 7)
 * @param {string} dateStr - Date string in DD.MM.YYYY format
 * @returns {number} Weekday number (1-7, Monday first)
 */
export function getWeekDayFromDMYMondayFirst(dateStr) {
    const [day, month, year] = dateStr.split(".").map(Number);
    const date = new Date(year, month - 1, day);

    const jsDay = date.getDay(); // 0–6 (Sun–Sat)

    // Convert to 1–7 (Mon–Sun)
    return jsDay === 0 ? 7 : jsDay;
}

/**
 * Gets the ordinal week number (1st, 2nd, 3rd, 4th) from a date string
 * @param {string} dateStr - Date string in DD.MM.YYYY format
 * @returns {number} Ordinal week number (1-4)
 */
export function getOrdinalFromDMY(dateStr) {
    const [day, month, year] = dateStr.split(".").map(Number);

    return Math.ceil(day / 7);
}
