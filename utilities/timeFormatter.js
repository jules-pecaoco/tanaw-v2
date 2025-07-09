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

export { convertUnixToISO, formatTo12HourTime };
