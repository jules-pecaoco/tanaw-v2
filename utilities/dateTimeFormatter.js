/**
 * Converts a Unix timestamp (in seconds) to an ISO 8601 string in UTC.
 *
 * @param {number} unixTimestamp - The Unix timestamp in seconds.
 * @returns {string} The date and time as an ISO 8601 string (e.g., "2024-09-27T15:20:00.000Z").
 *                   Returns 'Invalid Date' if the input is not a valid number.
 */
const convertUnixToISO = (unixTimestamp) => {
  if (typeof unixTimestamp !== "number" || isNaN(unixTimestamp)) {
    return "Invalid Timestamp";
  }

  const milliseconds = unixTimestamp * 1000;

  const dateObject = new Date(milliseconds);

  return dateObject.toISOString();
};

/**
 * Formats a date string or Date object into a 12-hour time format (e.g., "9 PM" or "9:45 AM").
 *
 * @param {string | Date} dateInput - The date to format.
 * @param {object} [options] - Formatting options.
 * @param {boolean} [options.showMinutes=true] - Whether to show minutes in the output.
 * @returns {string} The formatted time string.
 */
const formatTo12HourTime = (dateInput, { showMinutes = true } = {}) => {
  if (!dateInput) {
    return "Invalid Time";
  }

  const dateObject = new Date(dateInput);

  // Define the options for the Intl.DateTimeFormat constructor
  const timeOptions = {
    hour: "numeric", // e.g., "9"
    minute: showMinutes ? "2-digit" : undefined, // e.g., "45" or undefined
    hour12: true, // This is the key to getting AM/PM format
  };

  const formattedTime = new Intl.DateTimeFormat("en-US", timeOptions).format(dateObject);

  return formattedTime;
};

/**
 * Formats hourly weather data for use in a chart.
 * Each item in the array should have a 'date' and 'heat_index' property.
 *
 * @param {Array} hourlyData - Array of hourly weather data objects.
 * @returns {Array} Formatted data for charting, with each item containing 'value', 'label', and 'customDataPoint'.
 */
const formatHourlyDataForChart = (hourlyData) => {
  if (!hourlyData) return [];
  return hourlyData.map((item) => {
    const date = new Date(item.date);
    return {
      value: Math.floor(item.heat_index),
      label: formatTo12HourTime(date, { showMinutes: false }),
      dataPointText: Math.floor(item.heat_index),
    };
  });
};

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
const formatDate = (dateInput, { format = "full" } = {}) => {
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

export { convertUnixToISO, formatDate, formatHourlyDataForChart, formatTo12HourTime };
