/**
 * A private IPv4 address as RFC 1918 reserves them: four numbers, not part of
 * a longer run of numbers and dots such as a version string.
 */
const PRIVATE_IPV4 =
  /(?<!\d)(?<!\d\.)(?:10\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])|192\.168)\.\d{1,3}\.\d{1,3}(?!\d|\.\d)/;

/**
 * The lines of a text that name a private IPv4 address, counted from one.
 * @param {string} text
 * @returns {number[]}
 */
export function privateAddressLines(text) {
  return text.split("\n").flatMap((line, index) => (PRIVATE_IPV4.test(line) ? [index + 1] : []));
}
