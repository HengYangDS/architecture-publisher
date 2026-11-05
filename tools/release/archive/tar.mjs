import { gunzipSync, gzipSync } from "node:zlib";

/**
 * Deterministic ustar archives. Entries are written sorted by path, owned by 0 with
 * one modification time, so the same entries always give the same bytes.
 */

const BLOCK = 512;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

/** Split a path into ustar's 155-byte prefix and 100-byte name, or refuse it. */
function split(name) {
  const bytes = encoder.encode(name);
  if (bytes.length <= 100) return { name: bytes, prefix: new Uint8Array() };
  for (let at = bytes.length - 1; at > 0; at -= 1) {
    if (bytes[at] === 0x2f && at <= 155 && bytes.length - at - 1 <= 100)
      return { name: bytes.subarray(at + 1), prefix: bytes.subarray(0, at) };
  }
  throw Error(`archive_path_too_long:${name}`);
}

/** Write `value` as zero-padded octal of `width - 1` digits and a NUL. */
function octal(header, offset, width, value) {
  header.set(encoder.encode(`${value.toString(8).padStart(width - 1, "0")}\0`), offset);
}

function header({ path, mode, data }, mtime) {
  const block = new Uint8Array(BLOCK);
  const { name, prefix } = split(path);
  block.set(name, 0);
  octal(block, 100, 8, mode);
  octal(block, 108, 8, 0);
  octal(block, 116, 8, 0);
  octal(block, 124, 12, data ? data.length : 0);
  octal(block, 136, 12, mtime);
  block.fill(0x20, 148, 156);
  block[156] = data ? 0x30 : 0x35;
  block.set(encoder.encode("ustar\u000000"), 257);
  block.set(prefix, 345);
  const sum = block.reduce((total, byte) => total + byte, 0);
  block.set(encoder.encode(`${sum.toString(8).padStart(6, "0")}\0 `), 148);
  return block;
}

/**
 * One ustar archive of `entries`, sorted by path. A directory has no data and a path
 * ending in "/".
 * @param {{ path: string, mode: number, data?: Uint8Array }[]} entries
 * @param {number} mtime seconds since the epoch
 */
export function writeTar(entries, mtime = 0) {
  const sorted = [...entries].sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  const parts = [];
  for (const entry of sorted) {
    parts.push(header(entry, mtime));
    if (entry.data) {
      parts.push(entry.data);
      const padding = (BLOCK - (entry.data.length % BLOCK)) % BLOCK;
      if (padding) parts.push(new Uint8Array(padding));
    }
  }
  parts.push(new Uint8Array(2 * BLOCK));
  return Buffer.concat(parts);
}

function text(block, offset, width) {
  const field = block.subarray(offset, offset + width);
  const end = field.indexOf(0);
  return decoder.decode(end === -1 ? field : field.subarray(0, end));
}

function number(block, offset, width) {
  return Number.parseInt(text(block, offset, width).trim() || "0", 8);
}

/** The path a pax extended header sets, if any. */
function paxPath(data) {
  for (const record of decoder.decode(data).split("\n")) {
    const match = /^\d+ path=(.*)$/u.exec(record);
    if (match) return match[1];
  }
  return null;
}

/**
 * The regular files and directories of a ustar archive, in archive order. A pax
 * header may set the next entry's path; any other entry type is refused.
 * @param {Uint8Array} bytes
 */
export function readTar(bytes) {
  const entries = [];
  let offset = 0;
  let pending = null;
  while (offset + BLOCK <= bytes.length) {
    const block = bytes.subarray(offset, offset + BLOCK);
    if (block.every((byte) => byte === 0)) break;
    const size = number(block, 124, 12);
    const type = String.fromCharCode(block[156] || 0x30);
    const data = bytes.subarray(offset + BLOCK, offset + BLOCK + size);
    offset += BLOCK + Math.ceil(size / BLOCK) * BLOCK;
    if (type === "x") {
      pending = paxPath(data);
      continue;
    }
    if (type === "g") continue;
    const prefix = text(block, 345, 155);
    const name = pending ?? (prefix ? `${prefix}/${text(block, 0, 100)}` : text(block, 0, 100));
    pending = null;
    if (type === "5")
      entries.push({ path: name.endsWith("/") ? name : `${name}/`, mode: number(block, 100, 8) });
    else if (type === "0")
      entries.push({ path: name, mode: number(block, 100, 8), data: Uint8Array.from(data) });
    else throw Error(`archive_entry_unsupported:${name}`);
  }
  return entries;
}

/** gzip at level 9 with no modification time and no operating system in its header. */
export function gzip(bytes) {
  const packed = gzipSync(bytes, { level: 9 });
  packed.fill(0, 4, 8);
  packed[9] = 255;
  return packed;
}

export function gunzip(bytes) {
  return gunzipSync(bytes);
}
