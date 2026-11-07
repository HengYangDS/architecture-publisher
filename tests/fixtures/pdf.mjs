import zlib from "node:zlib";

/**
 * A PDF's streams inflated where they are Flate-compressed, and its text outside them: enough to count a print
 * edition's pages, links and attachments and to find its metadata without a PDF library.
 * @param {Buffer} pdf
 * @returns {{ text: string, streams: Buffer[] }}
 */
export function readPdf(pdf) {
  const streams = [];
  const outside = [];
  let at = 0;
  const marker = /stream\r?\n/gu;
  const source = pdf.toString("latin1");
  for (let match = marker.exec(source); match; match = marker.exec(source)) {
    const start = match.index + match[0].length;
    const end = source.indexOf("endstream", start);
    if (end < 0) break;
    outside.push(source.slice(at, match.index));
    const raw = pdf.subarray(start, end);
    try {
      streams.push(zlib.inflateSync(raw));
    } catch {
      streams.push(raw);
    }
    at = end + "endstream".length;
    marker.lastIndex = at;
  }
  outside.push(source.slice(at));
  return {
    text: [...outside, ...streams.map((stream) => stream.toString("latin1"))].join("\n"),
    streams,
  };
}

/**
 * How many times a pattern occurs in a PDF's text and inflated streams.
 * @param {Buffer} pdf
 * @param {RegExp} pattern a global pattern
 */
export const countIn = (pdf, pattern) => [...readPdf(pdf).text.matchAll(pattern)].length;
