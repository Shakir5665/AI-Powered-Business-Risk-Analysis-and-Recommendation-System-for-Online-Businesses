/**
 * Extracts a human-readable error message from an Axios error.
 * Handles backend ApiResponse error format: { success, message, data, meta }
 *
 * @param {Error} err - The caught Axios error object
 * @returns {string} A readable error message
 */
export function parseError(err) {
  // Network error (no response from server)
  if (!err.response) {
    return "Unable to connect to the server. Please check your connection.";
  }

  const { data, status } = err.response;

  // Backend ApiResponse format: { success: false, message: "..." }
  if (data?.message) {
    return data.message;
  }

  // FastAPI validation error format: { detail: [...] }
  if (data?.detail) {
    if (typeof data.detail === "string") return data.detail;
    if (Array.isArray(data.detail)) {
      return data.detail.map((d) => d.msg || JSON.stringify(d)).join(", ");
    }
  }

  // HTTP status fallbacks
  const statusMessages = {
    400: "Bad request. Please check your input.",
    401: "Incorrect email/username or password. Please check your credentials.",
    403: "You do not have permission to perform this action.",
    404: "The requested resource was not found.",
    409: "A conflict occurred. This resource may already exist.",
    422: "Validation failed. Please check your input.",
    429: "Too many requests. Please try again later.",
    500: "An internal server error occurred. Please try again.",
    503: "The service is temporarily unavailable.",
  };

  return statusMessages[status] || `Unexpected error (${status}).`;
}

/**
 * Formats an ISO date string into a human-readable format.
 * @param {string} isoString
 * @returns {string}
 */
export function formatDate(isoString) {
  if (!isoString) return "N/A";
  return new Date(isoString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Returns a colour class string based on a risk level string.
 * @param {string} level - e.g. "LOW", "MEDIUM", "HIGH", "CRITICAL", "VERY_LOW"
 * @returns {string}
 */
export function getRiskColor(level) {
  const map = {
    VERY_LOW: "text-emerald-400",
    LOW: "text-green-400",
    MEDIUM: "text-yellow-400",
    HIGH: "text-orange-400",
    CRITICAL: "text-red-500",
  };
  return map[String(level).toUpperCase()] || "text-gray-400";
}

/**
 * Truncates a string to a max length and appends ellipsis.
 * @param {string} str
 * @param {number} maxLength
 * @returns {string}
 */
export function truncate(str, maxLength = 80) {
  if (!str) return "";
  return str.length <= maxLength ? str : `${str.slice(0, maxLength)}…`;
}
