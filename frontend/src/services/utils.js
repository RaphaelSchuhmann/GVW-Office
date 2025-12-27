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