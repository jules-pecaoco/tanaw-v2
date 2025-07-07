/**
 * Formats a date string or Date object into a user-friendly format.
 *
 * @param {string | Date} dateInput - The date to format.
 * @param {object} [options] - Formatting options.
 * @param {'full' | 'dayOfWeek' | 'relativeDay' | 'monthDay'} [options.format='full'] - The desired output format.
 *   - 'full': Returns the full date (e.g., "September 27, 2024").
 *   - 'dayOfWeek': Returns only the full day of the week (e.g., "Friday").
 *   - 'relativeDay': Returns "Today", "Tomorrow", "Yesterday", or the full day of the week.
 *   - 'monthDay': Returns the abbreviated month and day (e.g., "Sep 17").
 * @returns {string} The formatted date string.
 */
export const formatDate = (dateInput, { format = "full" } = {}) => {
  if (!dateInput) {
    return "Invalid Date";
  }

  const date = new Date(dateInput);
  const now = new Date();

  // --- Logic for Relative Day (Today, Tomorrow, Yesterday) ---
  if (format === "relativeDay") {
    const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const diffTime = startOfDate.getTime() - startOfToday.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";

    // Fallback for other days
    return new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date);
  }

  // --- Logic for Day of the Week Only ---
  if (format === "dayOfWeek") {
    const options = { weekday: "long" };
    return new Intl.DateTimeFormat("en-US", options).format(date);
  }

  // --- NEW: Logic for Month and Day Only ---
  if (format === "monthDay") {
    const options = {
      month: "short", // e.g., "Sep"
      day: "numeric", // e.g., "17"
    };
    return new Intl.DateTimeFormat("en-US", options).format(date);
  }

  // --- Default 'full' format ---
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return new Intl.DateTimeFormat("en-US", options).format(date);
};

export default formatDate;
