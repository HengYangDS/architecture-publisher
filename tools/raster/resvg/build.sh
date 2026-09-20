#!/bin/sh
set -eu

if [ "$#" -ne 2 ]; then
  echo "usage: $0 <source-closure.tar.xz> <output-directory>" >&2
  exit 64
fi

archive=$(cd "$(dirname "$1")" && pwd -P)/$(basename "$1")
output=$2
script_dir=$(CDPATH='' cd -- "$(dirname "$0")" && pwd -P)
repo=$(CDPATH='' cd -- "$script_dir/../../.." && pwd -P)
manifest="$script_dir/source.json"
[ -f "$manifest" ] || manifest="$repo/packages/publisher/assets/raster/resvg/source.json"
stage=$(mktemp -d "${TMPDIR:-/tmp}/architecture-resvg-build.XXXXXX")
trap 'rm -rf "$stage"' EXIT HUP INT TERM

hash_file() {
  node -e "const fs=require('node:fs'),c=require('node:crypto');process.stdout.write(c.createHash('sha256').update(fs.readFileSync(process.argv[1])).digest('hex'))" "$1"
}
manifest_value() {
  node -e "const d=require(process.argv[1]);let v=d;for(const k of process.argv[2].split('.'))v=v[k];process.stdout.write(String(v))" "$manifest" "$1"
}

[ "$(hash_file "$archive")" = "$(manifest_value source.archiveSha256)" ] || {
  echo "source closure digest mismatch" >&2
  exit 65
}
tar -xf "$archive" -C "$stage"
set -- "$stage"/ethos-resvg-wasm-*
[ "$#" -eq 1 ] && [ -d "$1" ] || {
  echo "source closure root is not unique" >&2
  exit 65
}
source_root=$(cd "$1" && pwd -P)

node - "$manifest" "$source_root" "$script_dir/build.sh" <<'NODE'
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const manifest = require(process.argv[2]);
const sourceRoot = process.argv[3];
const buildScript = process.argv[4];
for (const selected of manifest.build.inputs) {
  const prefix = 'tools/raster/resvg/';
  if (!selected.path.startsWith(prefix)) process.exit(65);
  const relative = selected.path.slice(prefix.length);
  const source = relative === 'build.sh' ? buildScript : path.join(sourceRoot, relative);
  const bytes = fs.readFileSync(source);
  const digest = crypto.createHash('sha256').update(bytes).digest('hex');
  if (bytes.length !== selected.bytes || digest !== selected.sha256) {
    console.error(`source closure input mismatch: ${selected.path}`);
    process.exit(65);
  }
}
NODE

mkdir -p "$output"
output=$(cd "$output" && pwd -P)
(
  cd "$source_root"
  export RUSTFLAGS="--remap-path-prefix=$source_root=/workspace"
  cargo build --release --target wasm32-unknown-unknown --offline --frozen
  wasm-bindgen \
    target/wasm32-unknown-unknown/release/ethos_resvg_wasm.wasm \
    --target bundler \
    --out-dir "$output" \
    --out-name index \
    --no-typescript \
    --omit-default-module-path
)
mv "$output/index_bg.js" "$output/index.mjs"
rm "$output/index.js"

node - "$manifest" "$output" <<'NODE'
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const manifest = require(process.argv[2]);
for (const selected of manifest.outputs) {
  const output = path.join(process.argv[3], path.basename(selected.path));
  const bytes = fs.readFileSync(output);
  const digest = crypto.createHash('sha256').update(bytes).digest('hex');
  if (bytes.length !== selected.bytes || digest !== selected.sha256) {
    console.error(`generated output mismatch: ${path.basename(selected.path)}`);
    process.exit(65);
  }
  console.log(`${digest}  ${output}`);
}
NODE
