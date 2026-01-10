export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function capitalizeWords(str) {
    return str
        .toLowerCase()
        .replace(/(^|[\s-_])\w/g, match => match.toUpperCase());
}

export const currentYear = new Date().getFullYear();
export const currentMonth = new Date().getMonth();

export function daysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

export function firstWeekdayOfMonth(year, month) {
    let day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
}

export function isToday(day, month, year) {
    let today = new Date();
    return (day === today.getDate() && month === today.getMonth() && year === today.getFullYear());
}

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

export function parseDMYToDate(dateStr) {
    const [dayStr, monthStr, yearStr] = dateStr.split(".");
    const day = Number(dayStr);
    const month = Number(monthStr);
    const year = Number(yearStr);
    return new Date(year, month - 1, day);
}

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

export function getLastDayOfCurrentMonth() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    return new Date(year, month + 1, 0);
}

export function makeDateForCurrentMonth(day) {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    const date = new Date(year, month, day);

    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0"); // JS months are 0-indexed
    const yyyy = date.getFullYear();

    return `${dd}.${mm}.${yyyy}`;
}

export function getWeekDayFromDMYMondayFirst(dateStr) {
    const [day, month, year] = dateStr.split(".").map(Number);
    const date = new Date(year, month - 1, day);

    const jsDay = date.getDay(); // 0–6 (Sun–Sat)

    // Convert to 1–7 (Mon–Sun)
    return jsDay === 0 ? 7 : jsDay;
}

export function getOrdinalFromDMY(dateStr) {
    const [day, month, year] = dateStr.split(".").map(Number);

    return Math.ceil(day / 7);
}
