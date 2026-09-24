// Generated from edition/schema.mjs by tools/generate-authoring-validators.mjs.
// Generator license: edition/generated/LICENSE.schemasafe.
// @ts-nocheck
export const buildRequestValid = (function() {
'use strict'
const hasOwn = Function.prototype.call.bind(Object.prototype.hasOwnProperty);
const stringLength = (string) =>
  /[\uD800-\uDFFF]/.test(string) ? [...string].length : string.length;
const pattern0 = new RegExp("^[^\\\\\\u0000-\\u001f\\u007f]+$", "u");
const pointerPart = (s) => (/~\//.test(s) ? `${s}`.replace(/~/g, '~0').replace(/\//g, '~1') : s);
const pattern1 = new RegExp("^[a-z][a-z0-9-]{0,79}$", "u");
const pattern2 = new RegExp("^(?!\\s)(?!.*\\s$)[^\\u0000-\\u001f\\u007f]+$", "u");
const pattern3 = new RegExp("^[a-f0-9]{64}$", "u");
const unique = (array) => {
  if (array.length < 2) return true
  if (array.length === 2) return !deepEqual(array[0], array[1])
  const objects = []
  const primitives = array.length > 20 ? new Set() : null
  let primitivesCount = 0
  let pos = 0
  for (const item of array) {
    if (typeof item === 'object') {
      objects.push(item)
    } else if (primitives) {
      primitives.add(item)
      if (primitives.size !== ++primitivesCount) return false
    } else {
      if (array.indexOf(item, pos + 1) !== -1) return false
    }
    pos++
  }
  for (let i = 1; i < objects.length; i++)
    for (let j = 0; j < i; j++) if (deepEqual(objects[i], objects[j])) return false
  return true
};
const deepEqual = (obj, obj2) => {
  if (obj === obj2) return true
  if (!obj || !obj2 || typeof obj !== typeof obj2) return false
  if (obj !== obj2 && typeof obj !== 'object') return false

  const proto = Object.getPrototypeOf(obj)
  if (proto !== Object.getPrototypeOf(obj2)) return false

  if (proto === Array.prototype) {
    if (!Array.isArray(obj) || !Array.isArray(obj2)) return false
    if (obj.length !== obj2.length) return false
    return obj.every((x, i) => deepEqual(x, obj2[i]))
  } else if (proto === Object.prototype) {
    const [keys, keys2] = [Object.keys(obj), Object.keys(obj2)]
    if (keys.length !== keys2.length) return false
    const keyset2 = new Set([...keys, ...keys2])
    return keyset2.size === keys.length && keys.every((key) => deepEqual(obj[key], obj2[key]))
  }
  return false
};
const ref0 = function validate(data) {
  validate.errors = null
  if (!(typeof data === "object" && data && !Array.isArray(data))) {
    validate.errors = [{ keywordLocation: "#/type", instanceLocation: "#" }]
    return false
  }
  if (!("schema" in data && hasOwn(data, "schema"))) {
    validate.errors = [{ keywordLocation: "#/required", instanceLocation: "#/schema" }]
    return false
  }
  if (!("edition" in data && hasOwn(data, "edition"))) {
    validate.errors = [{ keywordLocation: "#/required", instanceLocation: "#/edition" }]
    return false
  }
  if (!("sources" in data && hasOwn(data, "sources"))) {
    validate.errors = [{ keywordLocation: "#/required", instanceLocation: "#/sources" }]
    return false
  }
  if (!("providers" in data && hasOwn(data, "providers"))) {
    validate.errors = [{ keywordLocation: "#/required", instanceLocation: "#/providers" }]
    return false
  }
  if (!("media" in data && hasOwn(data, "media"))) {
    validate.errors = [{ keywordLocation: "#/required", instanceLocation: "#/media" }]
    return false
  }
  if (!("toolchain" in data && hasOwn(data, "toolchain"))) {
    validate.errors = [{ keywordLocation: "#/required", instanceLocation: "#/toolchain" }]
    return false
  }
  if (!(data.schema === "architecture.build-request/v1")) {
    validate.errors = [{ keywordLocation: "#/properties/schema/const", instanceLocation: "#/schema" }]
    return false
  }
  let passes0 = 0
  const sub0 = (() => {
    if (!(typeof data.edition === "object" && data.edition && !Array.isArray(data.edition))) return false
    if (!("kind" in data.edition && hasOwn(data.edition, "kind"))) return false
    if (!("root" in data.edition && hasOwn(data.edition, "root"))) return false
    if (!("manifest" in data.edition && hasOwn(data.edition, "manifest"))) return false
    if (!(data.edition.kind === "direct")) return false
    if (!(typeof data.edition.root === "string")) return false
    if (data.edition.root.length > 2048 && stringLength(data.edition.root) > 2048) return false
    if (data.edition.root.length < 1 || stringLength(data.edition.root) < 1) return false
    if (!pattern0.test(data.edition.root)) return false
    if (!(typeof data.edition.manifest === "string")) return false
    if (data.edition.manifest.length > 2048 && stringLength(data.edition.manifest) > 2048) return false
    if (data.edition.manifest.length < 1 || stringLength(data.edition.manifest) < 1) return false
    if (!pattern0.test(data.edition.manifest)) return false
    for (const key0 of Object.keys(data.edition)) {
      if (key0 !== "kind" && key0 !== "root" && key0 !== "manifest") return false
    }
    return true
  })()
  if (sub0) passes0++
  const sub1 = (() => {
    if (!(typeof data.edition === "object" && data.edition && !Array.isArray(data.edition))) return false
    if (!("kind" in data.edition && hasOwn(data.edition, "kind"))) return false
    if (!("provider" in data.edition && hasOwn(data.edition, "provider"))) return false
    if (!("root" in data.edition && hasOwn(data.edition, "root"))) return false
    if (!("manifest" in data.edition && hasOwn(data.edition, "manifest"))) return false
    if (!(data.edition.kind === "provider")) return false
    if (!(typeof data.edition.provider === "string")) return false
    if (!pattern1.test(data.edition.provider)) return false
    if (!(typeof data.edition.root === "string")) return false
    if (data.edition.root.length > 2048 && stringLength(data.edition.root) > 2048) return false
    if (data.edition.root.length < 1 || stringLength(data.edition.root) < 1) return false
    if (!pattern0.test(data.edition.root)) return false
    if (!(typeof data.edition.manifest === "string")) return false
    if (data.edition.manifest.length > 2048 && stringLength(data.edition.manifest) > 2048) return false
    if (data.edition.manifest.length < 1 || stringLength(data.edition.manifest) < 1) return false
    if (!pattern0.test(data.edition.manifest)) return false
    for (const key1 of Object.keys(data.edition)) {
      if (key1 !== "kind" && key1 !== "provider" && key1 !== "root" && key1 !== "manifest") return false
    }
    return true
  })()
  if (sub1) passes0++
  if (passes0 !== 1) {
    validate.errors = [{ keywordLocation: "#/properties/edition/oneOf", instanceLocation: "#/edition" }]
    return false
  }
  if (!Array.isArray(data.sources)) {
    validate.errors = [{ keywordLocation: "#/properties/sources/type", instanceLocation: "#/sources" }]
    return false
  }
  if (data.sources.length > 256) {
    validate.errors = [{ keywordLocation: "#/properties/sources/maxItems", instanceLocation: "#/sources" }]
    return false
  }
  for (let i = 0; i < data.sources.length; i++) {
    if (i in data.sources && hasOwn(data.sources, i)) {
      if (!(typeof data.sources[i] === "object" && data.sources[i] && !Array.isArray(data.sources[i]))) {
        validate.errors = [{ keywordLocation: "#/properties/sources/items/type", instanceLocation: "#/sources/"+i }]
        return false
      }
      if (!("id" in data.sources[i] && hasOwn(data.sources[i], "id"))) {
        validate.errors = [{ keywordLocation: "#/properties/sources/items/required", instanceLocation: "#/sources/"+i+"/id" }]
        return false
      }
      if (!("namespace" in data.sources[i] && hasOwn(data.sources[i], "namespace"))) {
        validate.errors = [{ keywordLocation: "#/properties/sources/items/required", instanceLocation: "#/sources/"+i+"/namespace" }]
        return false
      }
      if (!("format" in data.sources[i] && hasOwn(data.sources[i], "format"))) {
        validate.errors = [{ keywordLocation: "#/properties/sources/items/required", instanceLocation: "#/sources/"+i+"/format" }]
        return false
      }
      if (!("claimant" in data.sources[i] && hasOwn(data.sources[i], "claimant"))) {
        validate.errors = [{ keywordLocation: "#/properties/sources/items/required", instanceLocation: "#/sources/"+i+"/claimant" }]
        return false
      }
      if (!("revision" in data.sources[i] && hasOwn(data.sources[i], "revision"))) {
        validate.errors = [{ keywordLocation: "#/properties/sources/items/required", instanceLocation: "#/sources/"+i+"/revision" }]
        return false
      }
      if (!("input" in data.sources[i] && hasOwn(data.sources[i], "input"))) {
        validate.errors = [{ keywordLocation: "#/properties/sources/items/required", instanceLocation: "#/sources/"+i+"/input" }]
        return false
      }
      if (!(typeof data.sources[i].id === "string")) {
        validate.errors = [{ keywordLocation: "#/properties/sources/items/properties/id/type", instanceLocation: "#/sources/"+i+"/id" }]
        return false
      }
      if (!(pattern1.test(data.sources[i].id))) {
        validate.errors = [{ keywordLocation: "#/properties/sources/items/properties/id/pattern", instanceLocation: "#/sources/"+i+"/id" }]
        return false
      }
      if (!(typeof data.sources[i].namespace === "string")) {
        validate.errors = [{ keywordLocation: "#/properties/sources/items/properties/namespace/type", instanceLocation: "#/sources/"+i+"/namespace" }]
        return false
      }
      if (data.sources[i].namespace.length > 2048 && stringLength(data.sources[i].namespace) > 2048) {
        validate.errors = [{ keywordLocation: "#/properties/sources/items/properties/namespace/maxLength", instanceLocation: "#/sources/"+i+"/namespace" }]
        return false
      }
      if (data.sources[i].namespace.length < 1 || stringLength(data.sources[i].namespace) < 1) {
        validate.errors = [{ keywordLocation: "#/properties/sources/items/properties/namespace/minLength", instanceLocation: "#/sources/"+i+"/namespace" }]
        return false
      }
      if (!(pattern2.test(data.sources[i].namespace))) {
        validate.errors = [{ keywordLocation: "#/properties/sources/items/properties/namespace/pattern", instanceLocation: "#/sources/"+i+"/namespace" }]
        return false
      }
      if (!(typeof data.sources[i].format === "object" && data.sources[i].format && !Array.isArray(data.sources[i].format))) {
        validate.errors = [{ keywordLocation: "#/properties/sources/items/properties/format/type", instanceLocation: "#/sources/"+i+"/format" }]
        return false
      }
      if (!("id" in data.sources[i].format && hasOwn(data.sources[i].format, "id"))) {
        validate.errors = [{ keywordLocation: "#/properties/sources/items/properties/format/required", instanceLocation: "#/sources/"+i+"/format/id" }]
        return false
      }
      if (!("version" in data.sources[i].format && hasOwn(data.sources[i].format, "version"))) {
        validate.errors = [{ keywordLocation: "#/properties/sources/items/properties/format/required", instanceLocation: "#/sources/"+i+"/format/version" }]
        return false
      }
      if (!(typeof data.sources[i].format.id === "string")) {
        validate.errors = [{ keywordLocation: "#/properties/sources/items/properties/format/properties/id/type", instanceLocation: "#/sources/"+i+"/format/id" }]
        return false
      }
      if (data.sources[i].format.id.length > 2048 && stringLength(data.sources[i].format.id) > 2048) {
        validate.errors = [{ keywordLocation: "#/properties/sources/items/properties/format/properties/id/maxLength", instanceLocation: "#/sources/"+i+"/format/id" }]
        return false
      }
      if (data.sources[i].format.id.length < 1 || stringLength(data.sources[i].format.id) < 1) {
        validate.errors = [{ keywordLocation: "#/properties/sources/items/properties/format/properties/id/minLength", instanceLocation: "#/sources/"+i+"/format/id" }]
        return false
      }
      if (!(pattern2.test(data.sources[i].format.id))) {
        validate.errors = [{ keywordLocation: "#/properties/sources/items/properties/format/properties/id/pattern", instanceLocation: "#/sources/"+i+"/format/id" }]
        return false
      }
      if (!(typeof data.sources[i].format.version === "string")) {
        validate.errors = [{ keywordLocation: "#/properties/sources/items/properties/format/properties/version/type", instanceLocation: "#/sources/"+i+"/format/version" }]
        return false
      }
      if (data.sources[i].format.version.length > 2048 && stringLength(data.sources[i].format.version) > 2048) {
        validate.errors = [{ keywordLocation: "#/properties/sources/items/properties/format/properties/version/maxLength", instanceLocation: "#/sources/"+i+"/format/version" }]
        return false
      }
      if (data.sources[i].format.version.length < 1 || stringLength(data.sources[i].format.version) < 1) {
        validate.errors = [{ keywordLocation: "#/properties/sources/items/properties/format/properties/version/minLength", instanceLocation: "#/sources/"+i+"/format/version" }]
        return false
      }
      if (!(pattern2.test(data.sources[i].format.version))) {
        validate.errors = [{ keywordLocation: "#/properties/sources/items/properties/format/properties/version/pattern", instanceLocation: "#/sources/"+i+"/format/version" }]
        return false
      }
      for (const key2 of Object.keys(data.sources[i].format)) {
        if (key2 !== "id" && key2 !== "version") {
          validate.errors = [{ keywordLocation: "#/properties/sources/items/properties/format/additionalProperties", instanceLocation: "#/sources/"+i+"format/"+pointerPart(key2) }]
          return false
        }
      }
      if (!(typeof data.sources[i].claimant === "string")) {
        validate.errors = [{ keywordLocation: "#/properties/sources/items/properties/claimant/type", instanceLocation: "#/sources/"+i+"/claimant" }]
        return false
      }
      if (data.sources[i].claimant.length > 2048 && stringLength(data.sources[i].claimant) > 2048) {
        validate.errors = [{ keywordLocation: "#/properties/sources/items/properties/claimant/maxLength", instanceLocation: "#/sources/"+i+"/claimant" }]
        return false
      }
      if (data.sources[i].claimant.length < 1 || stringLength(data.sources[i].claimant) < 1) {
        validate.errors = [{ keywordLocation: "#/properties/sources/items/properties/claimant/minLength", instanceLocation: "#/sources/"+i+"/claimant" }]
        return false
      }
      if (!(pattern2.test(data.sources[i].claimant))) {
        validate.errors = [{ keywordLocation: "#/properties/sources/items/properties/claimant/pattern", instanceLocation: "#/sources/"+i+"/claimant" }]
        return false
      }
      let passes1 = 0
      const sub2 = (() => {
        if (!(typeof data.sources[i].revision === "object" && data.sources[i].revision && !Array.isArray(data.sources[i].revision))) return false
        if (!("kind" in data.sources[i].revision && hasOwn(data.sources[i].revision, "kind"))) return false
        if (!("algorithm" in data.sources[i].revision && hasOwn(data.sources[i].revision, "algorithm"))) return false
        if (!(data.sources[i].revision.kind === "content")) return false
        if (!(data.sources[i].revision.algorithm === "sha256")) return false
        if ("canonicalization" in data.sources[i].revision && hasOwn(data.sources[i].revision, "canonicalization")) {
          if (!(data.sources[i].revision.canonicalization === "raw-bytes/v1" || data.sources[i].revision.canonicalization === "publisher-json/v1")) return false
        }
        for (const key3 of Object.keys(data.sources[i].revision)) {
          if (key3 !== "kind" && key3 !== "algorithm" && key3 !== "canonicalization") return false
        }
        return true
      })()
      if (sub2) passes1++
      const sub3 = (() => {
        if (!(typeof data.sources[i].revision === "object" && data.sources[i].revision && !Array.isArray(data.sources[i].revision))) return false
        if (!("kind" in data.sources[i].revision && hasOwn(data.sources[i].revision, "kind"))) return false
        if (!("repository" in data.sources[i].revision && hasOwn(data.sources[i].revision, "repository"))) return false
        if (!("ref" in data.sources[i].revision && hasOwn(data.sources[i].revision, "ref"))) return false
        if (!(data.sources[i].revision.kind === "vcs")) return false
        const sub4 = (() => {
          if (!(data.sources[i].revision.repository === ".")) return false
          return true
        })()
        if (!sub4) {
          const sub5 = (() => {
            if (!(typeof data.sources[i].revision.repository === "string")) return false
            if (data.sources[i].revision.repository.length > 2048 && stringLength(data.sources[i].revision.repository) > 2048) return false
            if (data.sources[i].revision.repository.length < 1 || stringLength(data.sources[i].revision.repository) < 1) return false
            if (!(pattern0.test(data.sources[i].revision.repository))) return false
            return true
          })()
          if (!sub5) return false
        }
        if (!(typeof data.sources[i].revision.ref === "string")) return false
        if (data.sources[i].revision.ref.length > 2048 && stringLength(data.sources[i].revision.ref) > 2048) return false
        if (data.sources[i].revision.ref.length < 1 || stringLength(data.sources[i].revision.ref) < 1) return false
        if (!(pattern2.test(data.sources[i].revision.ref))) return false
        for (const key4 of Object.keys(data.sources[i].revision)) {
          if (key4 !== "kind" && key4 !== "repository" && key4 !== "ref") return false
        }
        return true
      })()
      if (sub3) passes1++
      const sub6 = (() => {
        if (!(typeof data.sources[i].revision === "object" && data.sources[i].revision && !Array.isArray(data.sources[i].revision))) return false
        if (!("kind" in data.sources[i].revision && hasOwn(data.sources[i].revision, "kind"))) return false
        if (!("value" in data.sources[i].revision && hasOwn(data.sources[i].revision, "value"))) return false
        if (!(data.sources[i].revision.kind === "opaque")) return false
        if (!(typeof data.sources[i].revision.value === "string")) return false
        if (data.sources[i].revision.value.length > 2048 && stringLength(data.sources[i].revision.value) > 2048) return false
        if (data.sources[i].revision.value.length < 1 || stringLength(data.sources[i].revision.value) < 1) return false
        if (!(pattern2.test(data.sources[i].revision.value))) return false
        for (const key5 of Object.keys(data.sources[i].revision)) {
          if (key5 !== "kind" && key5 !== "value") return false
        }
        return true
      })()
      if (sub6) passes1++
      if (passes1 !== 1) {
        validate.errors = [{ keywordLocation: "#/properties/sources/items/properties/revision/oneOf", instanceLocation: "#/sources/"+i+"/revision" }]
        return false
      }
      let passes2 = 0
      const sub7 = (() => {
        if (!(typeof data.sources[i].input === "object" && data.sources[i].input && !Array.isArray(data.sources[i].input))) return false
        if (!("kind" in data.sources[i].input && hasOwn(data.sources[i].input, "kind"))) return false
        if (!("path" in data.sources[i].input && hasOwn(data.sources[i].input, "path"))) return false
        if (!(data.sources[i].input.kind === "locator")) return false
        if (!(typeof data.sources[i].input.path === "string")) return false
        if (data.sources[i].input.path.length > 2048 && stringLength(data.sources[i].input.path) > 2048) return false
        if (data.sources[i].input.path.length < 1 || stringLength(data.sources[i].input.path) < 1) return false
        if (!(pattern0.test(data.sources[i].input.path))) return false
        for (const key6 of Object.keys(data.sources[i].input)) {
          if (key6 !== "kind" && key6 !== "path") return false
        }
        return true
      })()
      if (sub7) passes2++
      const sub8 = (() => {
        if (!(typeof data.sources[i].input === "object" && data.sources[i].input && !Array.isArray(data.sources[i].input))) return false
        if (!("kind" in data.sources[i].input && hasOwn(data.sources[i].input, "kind"))) return false
        if (!("path" in data.sources[i].input && hasOwn(data.sources[i].input, "path"))) return false
        if (!("sha256" in data.sources[i].input && hasOwn(data.sources[i].input, "sha256"))) return false
        if (!(data.sources[i].input.kind === "pin")) return false
        if (!(typeof data.sources[i].input.path === "string")) return false
        if (data.sources[i].input.path.length > 2048 && stringLength(data.sources[i].input.path) > 2048) return false
        if (data.sources[i].input.path.length < 1 || stringLength(data.sources[i].input.path) < 1) return false
        if (!(pattern0.test(data.sources[i].input.path))) return false
        if (!(typeof data.sources[i].input.sha256 === "string")) return false
        if (!(pattern3.test(data.sources[i].input.sha256))) return false
        for (const key7 of Object.keys(data.sources[i].input)) {
          if (key7 !== "kind" && key7 !== "path" && key7 !== "sha256") return false
        }
        return true
      })()
      if (sub8) passes2++
      if (passes2 !== 1) {
        validate.errors = [{ keywordLocation: "#/properties/sources/items/properties/input/oneOf", instanceLocation: "#/sources/"+i+"/input" }]
        return false
      }
      for (const key8 of Object.keys(data.sources[i])) {
        if (key8 !== "id" && key8 !== "namespace" && key8 !== "format" && key8 !== "claimant" && key8 !== "revision" && key8 !== "input") {
          validate.errors = [{ keywordLocation: "#/properties/sources/items/additionalProperties", instanceLocation: "#/sources/"+i+"/"+pointerPart(key8) }]
          return false
        }
      }
    }
  }
  if (!Array.isArray(data.providers)) {
    validate.errors = [{ keywordLocation: "#/properties/providers/type", instanceLocation: "#/providers" }]
    return false
  }
  if (data.providers.length > 256) {
    validate.errors = [{ keywordLocation: "#/properties/providers/maxItems", instanceLocation: "#/providers" }]
    return false
  }
  for (let j = 0; j < data.providers.length; j++) {
    if (j in data.providers && hasOwn(data.providers, j)) {
      if (!(typeof data.providers[j] === "object" && data.providers[j] && !Array.isArray(data.providers[j]))) {
        validate.errors = [{ keywordLocation: "#/properties/providers/items/type", instanceLocation: "#/providers/"+j }]
        return false
      }
      if (!("id" in data.providers[j] && hasOwn(data.providers[j], "id"))) {
        validate.errors = [{ keywordLocation: "#/properties/providers/items/required", instanceLocation: "#/providers/"+j+"/id" }]
        return false
      }
      if (!("manifest" in data.providers[j] && hasOwn(data.providers[j], "manifest"))) {
        validate.errors = [{ keywordLocation: "#/properties/providers/items/required", instanceLocation: "#/providers/"+j+"/manifest" }]
        return false
      }
      if (!("sha256" in data.providers[j] && hasOwn(data.providers[j], "sha256"))) {
        validate.errors = [{ keywordLocation: "#/properties/providers/items/required", instanceLocation: "#/providers/"+j+"/sha256" }]
        return false
      }
      if (!(typeof data.providers[j].id === "string")) {
        validate.errors = [{ keywordLocation: "#/properties/providers/items/properties/id/type", instanceLocation: "#/providers/"+j+"/id" }]
        return false
      }
      if (!(pattern1.test(data.providers[j].id))) {
        validate.errors = [{ keywordLocation: "#/properties/providers/items/properties/id/pattern", instanceLocation: "#/providers/"+j+"/id" }]
        return false
      }
      if (!(typeof data.providers[j].manifest === "string")) {
        validate.errors = [{ keywordLocation: "#/properties/providers/items/properties/manifest/type", instanceLocation: "#/providers/"+j+"/manifest" }]
        return false
      }
      if (data.providers[j].manifest.length > 2048 && stringLength(data.providers[j].manifest) > 2048) {
        validate.errors = [{ keywordLocation: "#/properties/providers/items/properties/manifest/maxLength", instanceLocation: "#/providers/"+j+"/manifest" }]
        return false
      }
      if (data.providers[j].manifest.length < 1 || stringLength(data.providers[j].manifest) < 1) {
        validate.errors = [{ keywordLocation: "#/properties/providers/items/properties/manifest/minLength", instanceLocation: "#/providers/"+j+"/manifest" }]
        return false
      }
      if (!(pattern0.test(data.providers[j].manifest))) {
        validate.errors = [{ keywordLocation: "#/properties/providers/items/properties/manifest/pattern", instanceLocation: "#/providers/"+j+"/manifest" }]
        return false
      }
      if (!(typeof data.providers[j].sha256 === "string")) {
        validate.errors = [{ keywordLocation: "#/properties/providers/items/properties/sha256/type", instanceLocation: "#/providers/"+j+"/sha256" }]
        return false
      }
      if (!(pattern3.test(data.providers[j].sha256))) {
        validate.errors = [{ keywordLocation: "#/properties/providers/items/properties/sha256/pattern", instanceLocation: "#/providers/"+j+"/sha256" }]
        return false
      }
      if ("packageRoot" in data.providers[j] && hasOwn(data.providers[j], "packageRoot")) {
        if (!(typeof data.providers[j].packageRoot === "string")) {
          validate.errors = [{ keywordLocation: "#/properties/providers/items/properties/packageRoot/type", instanceLocation: "#/providers/"+j+"/packageRoot" }]
          return false
        }
        if (data.providers[j].packageRoot.length > 2048 && stringLength(data.providers[j].packageRoot) > 2048) {
          validate.errors = [{ keywordLocation: "#/properties/providers/items/properties/packageRoot/maxLength", instanceLocation: "#/providers/"+j+"/packageRoot" }]
          return false
        }
        if (data.providers[j].packageRoot.length < 1 || stringLength(data.providers[j].packageRoot) < 1) {
          validate.errors = [{ keywordLocation: "#/properties/providers/items/properties/packageRoot/minLength", instanceLocation: "#/providers/"+j+"/packageRoot" }]
          return false
        }
        if (!(pattern0.test(data.providers[j].packageRoot))) {
          validate.errors = [{ keywordLocation: "#/properties/providers/items/properties/packageRoot/pattern", instanceLocation: "#/providers/"+j+"/packageRoot" }]
          return false
        }
      }
      for (const key9 of Object.keys(data.providers[j])) {
        if (key9 !== "id" && key9 !== "manifest" && key9 !== "sha256" && key9 !== "packageRoot") {
          validate.errors = [{ keywordLocation: "#/properties/providers/items/additionalProperties", instanceLocation: "#/providers/"+j+"/"+pointerPart(key9) }]
          return false
        }
      }
    }
  }
  if (!Array.isArray(data.media)) {
    validate.errors = [{ keywordLocation: "#/properties/media/type", instanceLocation: "#/media" }]
    return false
  }
  if (data.media.length > 2) {
    validate.errors = [{ keywordLocation: "#/properties/media/maxItems", instanceLocation: "#/media" }]
    return false
  }
  if (data.media.length < 1) {
    validate.errors = [{ keywordLocation: "#/properties/media/minItems", instanceLocation: "#/media" }]
    return false
  }
  for (let k = 0; k < data.media.length; k++) {
    if (k in data.media && hasOwn(data.media, k)) {
      if (!(data.media[k] === "static" || data.media[k] === "interactive")) {
        validate.errors = [{ keywordLocation: "#/properties/media/items/enum", instanceLocation: "#/media/"+k }]
        return false
      }
    }
  }
  if (!unique(data.media)) {
    validate.errors = [{ keywordLocation: "#/properties/media/uniqueItems", instanceLocation: "#/media" }]
    return false
  }
  if (!(typeof data.toolchain === "object" && data.toolchain && !Array.isArray(data.toolchain))) {
    validate.errors = [{ keywordLocation: "#/properties/toolchain/type", instanceLocation: "#/toolchain" }]
    return false
  }
  if (!("profile" in data.toolchain && hasOwn(data.toolchain, "profile"))) {
    validate.errors = [{ keywordLocation: "#/properties/toolchain/required", instanceLocation: "#/toolchain/profile" }]
    return false
  }
  if (!(typeof data.toolchain.profile === "string")) {
    validate.errors = [{ keywordLocation: "#/properties/toolchain/properties/profile/type", instanceLocation: "#/toolchain/profile" }]
    return false
  }
  if (!pattern1.test(data.toolchain.profile)) {
    validate.errors = [{ keywordLocation: "#/properties/toolchain/properties/profile/pattern", instanceLocation: "#/toolchain/profile" }]
    return false
  }
  for (const key10 of Object.keys(data.toolchain)) {
    if (key10 !== "profile") {
      validate.errors = [{ keywordLocation: "#/properties/toolchain/additionalProperties", instanceLocation: "#/toolchain/"+pointerPart(key10) }]
      return false
    }
  }
  for (const key11 of Object.keys(data)) {
    if (key11 !== "schema" && key11 !== "edition" && key11 !== "sources" && key11 !== "providers" && key11 !== "media" && key11 !== "toolchain") {
      validate.errors = [{ keywordLocation: "#/additionalProperties", instanceLocation: "#/"+pointerPart(key11) }]
      return false
    }
  }
  return true
};
return ref0})();;
export const editionProjectValid = (function() {
'use strict'
const hasOwn = Function.prototype.call.bind(Object.prototype.hasOwnProperty);
const pattern0 = new RegExp("^[a-z][a-z0-9-]{0,79}$", "u");
const stringLength = (string) =>
  /[\uD800-\uDFFF]/.test(string) ? [...string].length : string.length;
const pattern1 = new RegExp("^(?!\\s)(?!.*\\s$)[^\\u0000-\\u001f\\u007f]+$", "u");
const pointerPart = (s) => (/~\//.test(s) ? `${s}`.replace(/~/g, '~0').replace(/\//g, '~1') : s);
const unique = (array) => {
  if (array.length < 2) return true
  if (array.length === 2) return !deepEqual(array[0], array[1])
  const objects = []
  const primitives = array.length > 20 ? new Set() : null
  let primitivesCount = 0
  let pos = 0
  for (const item of array) {
    if (typeof item === 'object') {
      objects.push(item)
    } else if (primitives) {
      primitives.add(item)
      if (primitives.size !== ++primitivesCount) return false
    } else {
      if (array.indexOf(item, pos + 1) !== -1) return false
    }
    pos++
  }
  for (let i = 1; i < objects.length; i++)
    for (let j = 0; j < i; j++) if (deepEqual(objects[i], objects[j])) return false
  return true
};
const deepEqual = (obj, obj2) => {
  if (obj === obj2) return true
  if (!obj || !obj2 || typeof obj !== typeof obj2) return false
  if (obj !== obj2 && typeof obj !== 'object') return false

  const proto = Object.getPrototypeOf(obj)
  if (proto !== Object.getPrototypeOf(obj2)) return false

  if (proto === Array.prototype) {
    if (!Array.isArray(obj) || !Array.isArray(obj2)) return false
    if (obj.length !== obj2.length) return false
    return obj.every((x, i) => deepEqual(x, obj2[i]))
  } else if (proto === Object.prototype) {
    const [keys, keys2] = [Object.keys(obj), Object.keys(obj2)]
    if (keys.length !== keys2.length) return false
    const keyset2 = new Set([...keys, ...keys2])
    return keyset2.size === keys.length && keys.every((key) => deepEqual(obj[key], obj2[key]))
  }
  return false
};
const pattern2 = new RegExp("^[^\\\\\\u0000-\\u001f\\u007f]+$", "u");
const ref0 = function validate(data) {
  validate.errors = null
  if (!(typeof data === "object" && data && !Array.isArray(data))) {
    validate.errors = [{ keywordLocation: "#/type", instanceLocation: "#" }]
    return false
  }
  if (!("schema" in data && hasOwn(data, "schema"))) {
    validate.errors = [{ keywordLocation: "#/required", instanceLocation: "#/schema" }]
    return false
  }
  if (!("id" in data && hasOwn(data, "id"))) {
    validate.errors = [{ keywordLocation: "#/required", instanceLocation: "#/id" }]
    return false
  }
  if (!("editor" in data && hasOwn(data, "editor"))) {
    validate.errors = [{ keywordLocation: "#/required", instanceLocation: "#/editor" }]
    return false
  }
  if (!("title" in data && hasOwn(data, "title"))) {
    validate.errors = [{ keywordLocation: "#/required", instanceLocation: "#/title" }]
    return false
  }
  if (!("audiences" in data && hasOwn(data, "audiences"))) {
    validate.errors = [{ keywordLocation: "#/required", instanceLocation: "#/audiences" }]
    return false
  }
  if (!("questions" in data && hasOwn(data, "questions"))) {
    validate.errors = [{ keywordLocation: "#/required", instanceLocation: "#/questions" }]
    return false
  }
  if (!("scope" in data && hasOwn(data, "scope"))) {
    validate.errors = [{ keywordLocation: "#/required", instanceLocation: "#/scope" }]
    return false
  }
  if (!("requiredAssertions" in data && hasOwn(data, "requiredAssertions"))) {
    validate.errors = [{ keywordLocation: "#/required", instanceLocation: "#/requiredAssertions" }]
    return false
  }
  if (!("omissions" in data && hasOwn(data, "omissions"))) {
    validate.errors = [{ keywordLocation: "#/required", instanceLocation: "#/omissions" }]
    return false
  }
  if (!("transformations" in data && hasOwn(data, "transformations"))) {
    validate.errors = [{ keywordLocation: "#/required", instanceLocation: "#/transformations" }]
    return false
  }
  if (!("narrative" in data && hasOwn(data, "narrative"))) {
    validate.errors = [{ keywordLocation: "#/required", instanceLocation: "#/narrative" }]
    return false
  }
  if (!("presentation" in data && hasOwn(data, "presentation"))) {
    validate.errors = [{ keywordLocation: "#/required", instanceLocation: "#/presentation" }]
    return false
  }
  if (!("visualPolicy" in data && hasOwn(data, "visualPolicy"))) {
    validate.errors = [{ keywordLocation: "#/required", instanceLocation: "#/visualPolicy" }]
    return false
  }
  if (!(data.schema === "architecture.edition-project/v1")) {
    validate.errors = [{ keywordLocation: "#/properties/schema/const", instanceLocation: "#/schema" }]
    return false
  }
  if (!(typeof data.id === "string")) {
    validate.errors = [{ keywordLocation: "#/properties/id/type", instanceLocation: "#/id" }]
    return false
  }
  if (!pattern0.test(data.id)) {
    validate.errors = [{ keywordLocation: "#/properties/id/pattern", instanceLocation: "#/id" }]
    return false
  }
  if (!(typeof data.editor === "string")) {
    validate.errors = [{ keywordLocation: "#/properties/editor/type", instanceLocation: "#/editor" }]
    return false
  }
  if (data.editor.length > 2048 && stringLength(data.editor) > 2048) {
    validate.errors = [{ keywordLocation: "#/properties/editor/maxLength", instanceLocation: "#/editor" }]
    return false
  }
  if (data.editor.length < 1 || stringLength(data.editor) < 1) {
    validate.errors = [{ keywordLocation: "#/properties/editor/minLength", instanceLocation: "#/editor" }]
    return false
  }
  if (!pattern1.test(data.editor)) {
    validate.errors = [{ keywordLocation: "#/properties/editor/pattern", instanceLocation: "#/editor" }]
    return false
  }
  if (!(typeof data.title === "string")) {
    validate.errors = [{ keywordLocation: "#/properties/title/type", instanceLocation: "#/title" }]
    return false
  }
  if (data.title.length > 2048 && stringLength(data.title) > 2048) {
    validate.errors = [{ keywordLocation: "#/properties/title/maxLength", instanceLocation: "#/title" }]
    return false
  }
  if (data.title.length < 1 || stringLength(data.title) < 1) {
    validate.errors = [{ keywordLocation: "#/properties/title/minLength", instanceLocation: "#/title" }]
    return false
  }
  if (!pattern1.test(data.title)) {
    validate.errors = [{ keywordLocation: "#/properties/title/pattern", instanceLocation: "#/title" }]
    return false
  }
  if (!Array.isArray(data.audiences)) {
    validate.errors = [{ keywordLocation: "#/properties/audiences/type", instanceLocation: "#/audiences" }]
    return false
  }
  if (data.audiences.length > 64) {
    validate.errors = [{ keywordLocation: "#/properties/audiences/maxItems", instanceLocation: "#/audiences" }]
    return false
  }
  if (data.audiences.length < 1) {
    validate.errors = [{ keywordLocation: "#/properties/audiences/minItems", instanceLocation: "#/audiences" }]
    return false
  }
  for (let i = 0; i < data.audiences.length; i++) {
    if (i in data.audiences && hasOwn(data.audiences, i)) {
      if (!(typeof data.audiences[i] === "object" && data.audiences[i] && !Array.isArray(data.audiences[i]))) {
        validate.errors = [{ keywordLocation: "#/properties/audiences/items/type", instanceLocation: "#/audiences/"+i }]
        return false
      }
      if (!("id" in data.audiences[i] && hasOwn(data.audiences[i], "id"))) {
        validate.errors = [{ keywordLocation: "#/properties/audiences/items/required", instanceLocation: "#/audiences/"+i+"/id" }]
        return false
      }
      if (!("label" in data.audiences[i] && hasOwn(data.audiences[i], "label"))) {
        validate.errors = [{ keywordLocation: "#/properties/audiences/items/required", instanceLocation: "#/audiences/"+i+"/label" }]
        return false
      }
      if (!(typeof data.audiences[i].id === "string")) {
        validate.errors = [{ keywordLocation: "#/properties/audiences/items/properties/id/type", instanceLocation: "#/audiences/"+i+"/id" }]
        return false
      }
      if (!(pattern0.test(data.audiences[i].id))) {
        validate.errors = [{ keywordLocation: "#/properties/audiences/items/properties/id/pattern", instanceLocation: "#/audiences/"+i+"/id" }]
        return false
      }
      if (!(typeof data.audiences[i].label === "string")) {
        validate.errors = [{ keywordLocation: "#/properties/audiences/items/properties/label/type", instanceLocation: "#/audiences/"+i+"/label" }]
        return false
      }
      if (data.audiences[i].label.length > 2048 && stringLength(data.audiences[i].label) > 2048) {
        validate.errors = [{ keywordLocation: "#/properties/audiences/items/properties/label/maxLength", instanceLocation: "#/audiences/"+i+"/label" }]
        return false
      }
      if (data.audiences[i].label.length < 1 || stringLength(data.audiences[i].label) < 1) {
        validate.errors = [{ keywordLocation: "#/properties/audiences/items/properties/label/minLength", instanceLocation: "#/audiences/"+i+"/label" }]
        return false
      }
      if (!(pattern1.test(data.audiences[i].label))) {
        validate.errors = [{ keywordLocation: "#/properties/audiences/items/properties/label/pattern", instanceLocation: "#/audiences/"+i+"/label" }]
        return false
      }
      for (const key0 of Object.keys(data.audiences[i])) {
        if (key0 !== "id" && key0 !== "label") {
          validate.errors = [{ keywordLocation: "#/properties/audiences/items/additionalProperties", instanceLocation: "#/audiences/"+i+"/"+pointerPart(key0) }]
          return false
        }
      }
    }
  }
  if (!Array.isArray(data.questions)) {
    validate.errors = [{ keywordLocation: "#/properties/questions/type", instanceLocation: "#/questions" }]
    return false
  }
  if (data.questions.length > 256) {
    validate.errors = [{ keywordLocation: "#/properties/questions/maxItems", instanceLocation: "#/questions" }]
    return false
  }
  if (data.questions.length < 1) {
    validate.errors = [{ keywordLocation: "#/properties/questions/minItems", instanceLocation: "#/questions" }]
    return false
  }
  for (let j = 0; j < data.questions.length; j++) {
    if (j in data.questions && hasOwn(data.questions, j)) {
      if (!(typeof data.questions[j] === "object" && data.questions[j] && !Array.isArray(data.questions[j]))) {
        validate.errors = [{ keywordLocation: "#/properties/questions/items/type", instanceLocation: "#/questions/"+j }]
        return false
      }
      if (!("id" in data.questions[j] && hasOwn(data.questions[j], "id"))) {
        validate.errors = [{ keywordLocation: "#/properties/questions/items/required", instanceLocation: "#/questions/"+j+"/id" }]
        return false
      }
      if (!("audience" in data.questions[j] && hasOwn(data.questions[j], "audience"))) {
        validate.errors = [{ keywordLocation: "#/properties/questions/items/required", instanceLocation: "#/questions/"+j+"/audience" }]
        return false
      }
      if (!("text" in data.questions[j] && hasOwn(data.questions[j], "text"))) {
        validate.errors = [{ keywordLocation: "#/properties/questions/items/required", instanceLocation: "#/questions/"+j+"/text" }]
        return false
      }
      if (!(typeof data.questions[j].id === "string")) {
        validate.errors = [{ keywordLocation: "#/properties/questions/items/properties/id/type", instanceLocation: "#/questions/"+j+"/id" }]
        return false
      }
      if (!(pattern0.test(data.questions[j].id))) {
        validate.errors = [{ keywordLocation: "#/properties/questions/items/properties/id/pattern", instanceLocation: "#/questions/"+j+"/id" }]
        return false
      }
      if (!(typeof data.questions[j].audience === "string")) {
        validate.errors = [{ keywordLocation: "#/properties/questions/items/properties/audience/type", instanceLocation: "#/questions/"+j+"/audience" }]
        return false
      }
      if (!(pattern0.test(data.questions[j].audience))) {
        validate.errors = [{ keywordLocation: "#/properties/questions/items/properties/audience/pattern", instanceLocation: "#/questions/"+j+"/audience" }]
        return false
      }
      if (!(typeof data.questions[j].text === "string")) {
        validate.errors = [{ keywordLocation: "#/properties/questions/items/properties/text/type", instanceLocation: "#/questions/"+j+"/text" }]
        return false
      }
      if (data.questions[j].text.length > 2048 && stringLength(data.questions[j].text) > 2048) {
        validate.errors = [{ keywordLocation: "#/properties/questions/items/properties/text/maxLength", instanceLocation: "#/questions/"+j+"/text" }]
        return false
      }
      if (data.questions[j].text.length < 1 || stringLength(data.questions[j].text) < 1) {
        validate.errors = [{ keywordLocation: "#/properties/questions/items/properties/text/minLength", instanceLocation: "#/questions/"+j+"/text" }]
        return false
      }
      if (!(pattern1.test(data.questions[j].text))) {
        validate.errors = [{ keywordLocation: "#/properties/questions/items/properties/text/pattern", instanceLocation: "#/questions/"+j+"/text" }]
        return false
      }
      for (const key1 of Object.keys(data.questions[j])) {
        if (key1 !== "id" && key1 !== "audience" && key1 !== "text") {
          validate.errors = [{ keywordLocation: "#/properties/questions/items/additionalProperties", instanceLocation: "#/questions/"+j+"/"+pointerPart(key1) }]
          return false
        }
      }
    }
  }
  if (!(typeof data.scope === "object" && data.scope && !Array.isArray(data.scope))) {
    validate.errors = [{ keywordLocation: "#/properties/scope/type", instanceLocation: "#/scope" }]
    return false
  }
  if (!("sourceNamespaces" in data.scope && hasOwn(data.scope, "sourceNamespaces"))) {
    validate.errors = [{ keywordLocation: "#/properties/scope/required", instanceLocation: "#/scope/sourceNamespaces" }]
    return false
  }
  if (!("selections" in data.scope && hasOwn(data.scope, "selections"))) {
    validate.errors = [{ keywordLocation: "#/properties/scope/required", instanceLocation: "#/scope/selections" }]
    return false
  }
  if (!("limits" in data.scope && hasOwn(data.scope, "limits"))) {
    validate.errors = [{ keywordLocation: "#/properties/scope/required", instanceLocation: "#/scope/limits" }]
    return false
  }
  if (!Array.isArray(data.scope.sourceNamespaces)) {
    validate.errors = [{ keywordLocation: "#/properties/scope/properties/sourceNamespaces/type", instanceLocation: "#/scope/sourceNamespaces" }]
    return false
  }
  if (data.scope.sourceNamespaces.length < 1) {
    validate.errors = [{ keywordLocation: "#/properties/scope/properties/sourceNamespaces/minItems", instanceLocation: "#/scope/sourceNamespaces" }]
    return false
  }
  for (let k = 0; k < data.scope.sourceNamespaces.length; k++) {
    if (k in data.scope.sourceNamespaces && hasOwn(data.scope.sourceNamespaces, k)) {
      if (!(typeof data.scope.sourceNamespaces[k] === "string")) {
        validate.errors = [{ keywordLocation: "#/properties/scope/properties/sourceNamespaces/items/type", instanceLocation: "#/scope/sourceNamespaces/"+k }]
        return false
      }
      if (data.scope.sourceNamespaces[k].length > 2048 && stringLength(data.scope.sourceNamespaces[k]) > 2048) {
        validate.errors = [{ keywordLocation: "#/properties/scope/properties/sourceNamespaces/items/maxLength", instanceLocation: "#/scope/sourceNamespaces/"+k }]
        return false
      }
      if (data.scope.sourceNamespaces[k].length < 1 || stringLength(data.scope.sourceNamespaces[k]) < 1) {
        validate.errors = [{ keywordLocation: "#/properties/scope/properties/sourceNamespaces/items/minLength", instanceLocation: "#/scope/sourceNamespaces/"+k }]
        return false
      }
      if (!(pattern1.test(data.scope.sourceNamespaces[k]))) {
        validate.errors = [{ keywordLocation: "#/properties/scope/properties/sourceNamespaces/items/pattern", instanceLocation: "#/scope/sourceNamespaces/"+k }]
        return false
      }
    }
  }
  if (!unique(data.scope.sourceNamespaces)) {
    validate.errors = [{ keywordLocation: "#/properties/scope/properties/sourceNamespaces/uniqueItems", instanceLocation: "#/scope/sourceNamespaces" }]
    return false
  }
  if (!Array.isArray(data.scope.selections)) {
    validate.errors = [{ keywordLocation: "#/properties/scope/properties/selections/type", instanceLocation: "#/scope/selections" }]
    return false
  }
  if (data.scope.selections.length > 4096) {
    validate.errors = [{ keywordLocation: "#/properties/scope/properties/selections/maxItems", instanceLocation: "#/scope/selections" }]
    return false
  }
  if (data.scope.selections.length < 1) {
    validate.errors = [{ keywordLocation: "#/properties/scope/properties/selections/minItems", instanceLocation: "#/scope/selections" }]
    return false
  }
  for (let l = 0; l < data.scope.selections.length; l++) {
    if (l in data.scope.selections && hasOwn(data.scope.selections, l)) {
      let passes0 = 0
      const sub0 = (() => {
        if (!(typeof data.scope.selections[l] === "object" && data.scope.selections[l] && !Array.isArray(data.scope.selections[l]))) return false
        if (!("id" in data.scope.selections[l] && hasOwn(data.scope.selections[l], "id"))) return false
        if (!("namespace" in data.scope.selections[l] && hasOwn(data.scope.selections[l], "namespace"))) return false
        if (!("kind" in data.scope.selections[l] && hasOwn(data.scope.selections[l], "kind"))) return false
        if (!("reference" in data.scope.selections[l] && hasOwn(data.scope.selections[l], "reference"))) return false
        if (!(typeof data.scope.selections[l].id === "string")) return false
        if (!(pattern0.test(data.scope.selections[l].id))) return false
        if (!(typeof data.scope.selections[l].namespace === "string")) return false
        if (data.scope.selections[l].namespace.length > 2048 && stringLength(data.scope.selections[l].namespace) > 2048) return false
        if (data.scope.selections[l].namespace.length < 1 || stringLength(data.scope.selections[l].namespace) < 1) return false
        if (!(pattern1.test(data.scope.selections[l].namespace))) return false
        if (!(data.scope.selections[l].kind === "reference")) return false
        if (!(typeof data.scope.selections[l].reference === "string")) return false
        if (data.scope.selections[l].reference.length > 2048 && stringLength(data.scope.selections[l].reference) > 2048) return false
        if (data.scope.selections[l].reference.length < 1 || stringLength(data.scope.selections[l].reference) < 1) return false
        if (!(pattern1.test(data.scope.selections[l].reference))) return false
        for (const key2 of Object.keys(data.scope.selections[l])) {
          if (key2 !== "id" && key2 !== "namespace" && key2 !== "kind" && key2 !== "reference") return false
        }
        return true
      })()
      if (sub0) passes0++
      const sub1 = (() => {
        if (!(typeof data.scope.selections[l] === "object" && data.scope.selections[l] && !Array.isArray(data.scope.selections[l]))) return false
        if (!("id" in data.scope.selections[l] && hasOwn(data.scope.selections[l], "id"))) return false
        if (!("namespace" in data.scope.selections[l] && hasOwn(data.scope.selections[l], "namespace"))) return false
        if (!("kind" in data.scope.selections[l] && hasOwn(data.scope.selections[l], "kind"))) return false
        if (!("language" in data.scope.selections[l] && hasOwn(data.scope.selections[l], "language"))) return false
        if (!("expression" in data.scope.selections[l] && hasOwn(data.scope.selections[l], "expression"))) return false
        if (!(typeof data.scope.selections[l].id === "string")) return false
        if (!(pattern0.test(data.scope.selections[l].id))) return false
        if (!(typeof data.scope.selections[l].namespace === "string")) return false
        if (data.scope.selections[l].namespace.length > 2048 && stringLength(data.scope.selections[l].namespace) > 2048) return false
        if (data.scope.selections[l].namespace.length < 1 || stringLength(data.scope.selections[l].namespace) < 1) return false
        if (!(pattern1.test(data.scope.selections[l].namespace))) return false
        if (!(data.scope.selections[l].kind === "query")) return false
        if (!(typeof data.scope.selections[l].language === "string")) return false
        if (data.scope.selections[l].language.length > 2048 && stringLength(data.scope.selections[l].language) > 2048) return false
        if (data.scope.selections[l].language.length < 1 || stringLength(data.scope.selections[l].language) < 1) return false
        if (!(pattern1.test(data.scope.selections[l].language))) return false
        if (!(typeof data.scope.selections[l].expression === "string")) return false
        if (data.scope.selections[l].expression.length > 2048 && stringLength(data.scope.selections[l].expression) > 2048) return false
        if (data.scope.selections[l].expression.length < 1 || stringLength(data.scope.selections[l].expression) < 1) return false
        if (!(pattern1.test(data.scope.selections[l].expression))) return false
        for (const key3 of Object.keys(data.scope.selections[l])) {
          if (key3 !== "id" && key3 !== "namespace" && key3 !== "kind" && key3 !== "language" && key3 !== "expression") return false
        }
        return true
      })()
      if (sub1) passes0++
      if (passes0 !== 1) {
        validate.errors = [{ keywordLocation: "#/properties/scope/properties/selections/items/oneOf", instanceLocation: "#/scope/selections/"+l }]
        return false
      }
    }
  }
  if (!Array.isArray(data.scope.limits)) {
    validate.errors = [{ keywordLocation: "#/properties/scope/properties/limits/type", instanceLocation: "#/scope/limits" }]
    return false
  }
  if (data.scope.limits.length > 4096) {
    validate.errors = [{ keywordLocation: "#/properties/scope/properties/limits/maxItems", instanceLocation: "#/scope/limits" }]
    return false
  }
  for (let m = 0; m < data.scope.limits.length; m++) {
    if (m in data.scope.limits && hasOwn(data.scope.limits, m)) {
      if (!(typeof data.scope.limits[m] === "object" && data.scope.limits[m] && !Array.isArray(data.scope.limits[m]))) {
        validate.errors = [{ keywordLocation: "#/properties/scope/properties/limits/items/type", instanceLocation: "#/scope/limits/"+m }]
        return false
      }
      if (!("question" in data.scope.limits[m] && hasOwn(data.scope.limits[m], "question"))) {
        validate.errors = [{ keywordLocation: "#/properties/scope/properties/limits/items/required", instanceLocation: "#/scope/limits/"+m+"/question" }]
        return false
      }
      if (!("reason" in data.scope.limits[m] && hasOwn(data.scope.limits[m], "reason"))) {
        validate.errors = [{ keywordLocation: "#/properties/scope/properties/limits/items/required", instanceLocation: "#/scope/limits/"+m+"/reason" }]
        return false
      }
      if (!(typeof data.scope.limits[m].question === "string")) {
        validate.errors = [{ keywordLocation: "#/properties/scope/properties/limits/items/properties/question/type", instanceLocation: "#/scope/limits/"+m+"/question" }]
        return false
      }
      if (!(pattern0.test(data.scope.limits[m].question))) {
        validate.errors = [{ keywordLocation: "#/properties/scope/properties/limits/items/properties/question/pattern", instanceLocation: "#/scope/limits/"+m+"/question" }]
        return false
      }
      if (!(typeof data.scope.limits[m].reason === "string")) {
        validate.errors = [{ keywordLocation: "#/properties/scope/properties/limits/items/properties/reason/type", instanceLocation: "#/scope/limits/"+m+"/reason" }]
        return false
      }
      if (data.scope.limits[m].reason.length > 2048 && stringLength(data.scope.limits[m].reason) > 2048) {
        validate.errors = [{ keywordLocation: "#/properties/scope/properties/limits/items/properties/reason/maxLength", instanceLocation: "#/scope/limits/"+m+"/reason" }]
        return false
      }
      if (data.scope.limits[m].reason.length < 1 || stringLength(data.scope.limits[m].reason) < 1) {
        validate.errors = [{ keywordLocation: "#/properties/scope/properties/limits/items/properties/reason/minLength", instanceLocation: "#/scope/limits/"+m+"/reason" }]
        return false
      }
      if (!(pattern1.test(data.scope.limits[m].reason))) {
        validate.errors = [{ keywordLocation: "#/properties/scope/properties/limits/items/properties/reason/pattern", instanceLocation: "#/scope/limits/"+m+"/reason" }]
        return false
      }
      for (const key4 of Object.keys(data.scope.limits[m])) {
        if (key4 !== "question" && key4 !== "reason") {
          validate.errors = [{ keywordLocation: "#/properties/scope/properties/limits/items/additionalProperties", instanceLocation: "#/scope/limits/"+m+"/"+pointerPart(key4) }]
          return false
        }
      }
    }
  }
  for (const key5 of Object.keys(data.scope)) {
    if (key5 !== "sourceNamespaces" && key5 !== "selections" && key5 !== "limits") {
      validate.errors = [{ keywordLocation: "#/properties/scope/additionalProperties", instanceLocation: "#/scope/"+pointerPart(key5) }]
      return false
    }
  }
  if (!Array.isArray(data.requiredAssertions)) {
    validate.errors = [{ keywordLocation: "#/properties/requiredAssertions/type", instanceLocation: "#/requiredAssertions" }]
    return false
  }
  if (data.requiredAssertions.length > 8192) {
    validate.errors = [{ keywordLocation: "#/properties/requiredAssertions/maxItems", instanceLocation: "#/requiredAssertions" }]
    return false
  }
  if (data.requiredAssertions.length < 1) {
    validate.errors = [{ keywordLocation: "#/properties/requiredAssertions/minItems", instanceLocation: "#/requiredAssertions" }]
    return false
  }
  for (let n = 0; n < data.requiredAssertions.length; n++) {
    if (n in data.requiredAssertions && hasOwn(data.requiredAssertions, n)) {
      let passes1 = 0
      const sub2 = (() => {
        if (!(typeof data.requiredAssertions[n] === "object" && data.requiredAssertions[n] && !Array.isArray(data.requiredAssertions[n]))) return false
        if (!("id" in data.requiredAssertions[n] && hasOwn(data.requiredAssertions[n], "id"))) return false
        if (!("kind" in data.requiredAssertions[n] && hasOwn(data.requiredAssertions[n], "kind"))) return false
        if (!("selection" in data.requiredAssertions[n] && hasOwn(data.requiredAssertions[n], "selection"))) return false
        if (!("questions" in data.requiredAssertions[n] && hasOwn(data.requiredAssertions[n], "questions"))) return false
        if (!(typeof data.requiredAssertions[n].id === "string")) return false
        if (!(pattern0.test(data.requiredAssertions[n].id))) return false
        if (!(data.requiredAssertions[n].kind === "source")) return false
        if (!(typeof data.requiredAssertions[n].selection === "string")) return false
        if (!(pattern0.test(data.requiredAssertions[n].selection))) return false
        if (!(Array.isArray(data.requiredAssertions[n].questions))) return false
        if (data.requiredAssertions[n].questions.length < 1) return false
        for (let o = 0; o < data.requiredAssertions[n].questions.length; o++) {
          if (o in data.requiredAssertions[n].questions && hasOwn(data.requiredAssertions[n].questions, o)) {
            if (!(typeof data.requiredAssertions[n].questions[o] === "string")) return false
            if (!(pattern0.test(data.requiredAssertions[n].questions[o]))) return false
          }
        }
        if (!unique(data.requiredAssertions[n].questions)) return false
        for (const key6 of Object.keys(data.requiredAssertions[n])) {
          if (key6 !== "id" && key6 !== "kind" && key6 !== "selection" && key6 !== "questions") return false
        }
        return true
      })()
      if (sub2) passes1++
      const sub3 = (() => {
        if (!(typeof data.requiredAssertions[n] === "object" && data.requiredAssertions[n] && !Array.isArray(data.requiredAssertions[n]))) return false
        if (!("id" in data.requiredAssertions[n] && hasOwn(data.requiredAssertions[n], "id"))) return false
        if (!("kind" in data.requiredAssertions[n] && hasOwn(data.requiredAssertions[n], "kind"))) return false
        if (!("statement" in data.requiredAssertions[n] && hasOwn(data.requiredAssertions[n], "statement"))) return false
        if (!("proponent" in data.requiredAssertions[n] && hasOwn(data.requiredAssertions[n], "proponent"))) return false
        if (!("basis" in data.requiredAssertions[n] && hasOwn(data.requiredAssertions[n], "basis"))) return false
        if (!("questions" in data.requiredAssertions[n] && hasOwn(data.requiredAssertions[n], "questions"))) return false
        if (!(typeof data.requiredAssertions[n].id === "string")) return false
        if (!(pattern0.test(data.requiredAssertions[n].id))) return false
        if (!(data.requiredAssertions[n].kind === "editorial")) return false
        if (!(typeof data.requiredAssertions[n].statement === "string")) return false
        if (data.requiredAssertions[n].statement.length > 2048 && stringLength(data.requiredAssertions[n].statement) > 2048) return false
        if (data.requiredAssertions[n].statement.length < 1 || stringLength(data.requiredAssertions[n].statement) < 1) return false
        if (!(pattern1.test(data.requiredAssertions[n].statement))) return false
        if (!(typeof data.requiredAssertions[n].proponent === "string")) return false
        if (data.requiredAssertions[n].proponent.length > 2048 && stringLength(data.requiredAssertions[n].proponent) > 2048) return false
        if (data.requiredAssertions[n].proponent.length < 1 || stringLength(data.requiredAssertions[n].proponent) < 1) return false
        if (!(pattern1.test(data.requiredAssertions[n].proponent))) return false
        if (!(Array.isArray(data.requiredAssertions[n].basis))) return false
        if (data.requiredAssertions[n].basis.length < 1) return false
        for (let p = 0; p < data.requiredAssertions[n].basis.length; p++) {
          if (p in data.requiredAssertions[n].basis && hasOwn(data.requiredAssertions[n].basis, p)) {
            if (!(typeof data.requiredAssertions[n].basis[p] === "string")) return false
            if (!(pattern0.test(data.requiredAssertions[n].basis[p]))) return false
          }
        }
        if (!unique(data.requiredAssertions[n].basis)) return false
        if (!(Array.isArray(data.requiredAssertions[n].questions))) return false
        if (data.requiredAssertions[n].questions.length < 1) return false
        for (let q = 0; q < data.requiredAssertions[n].questions.length; q++) {
          if (q in data.requiredAssertions[n].questions && hasOwn(data.requiredAssertions[n].questions, q)) {
            if (!(typeof data.requiredAssertions[n].questions[q] === "string")) return false
            if (!(pattern0.test(data.requiredAssertions[n].questions[q]))) return false
          }
        }
        if (!unique(data.requiredAssertions[n].questions)) return false
        for (const key7 of Object.keys(data.requiredAssertions[n])) {
          if (key7 !== "id" && key7 !== "kind" && key7 !== "statement" && key7 !== "proponent" && key7 !== "basis" && key7 !== "questions") return false
        }
        return true
      })()
      if (sub3) passes1++
      if (passes1 !== 1) {
        validate.errors = [{ keywordLocation: "#/properties/requiredAssertions/items/oneOf", instanceLocation: "#/requiredAssertions/"+n }]
        return false
      }
    }
  }
  if (!Array.isArray(data.omissions)) {
    validate.errors = [{ keywordLocation: "#/properties/omissions/type", instanceLocation: "#/omissions" }]
    return false
  }
  if (data.omissions.length > 8192) {
    validate.errors = [{ keywordLocation: "#/properties/omissions/maxItems", instanceLocation: "#/omissions" }]
    return false
  }
  for (let r = 0; r < data.omissions.length; r++) {
    if (r in data.omissions && hasOwn(data.omissions, r)) {
      let passes2 = 0
      const sub4 = (() => {
        if (!(typeof data.omissions[r] === "object" && data.omissions[r] && !Array.isArray(data.omissions[r]))) return false
        if (!("selection" in data.omissions[r] && hasOwn(data.omissions[r], "selection"))) return false
        if (!("question" in data.omissions[r] && hasOwn(data.omissions[r], "question"))) return false
        if (!("disposition" in data.omissions[r] && hasOwn(data.omissions[r], "disposition"))) return false
        if (!("view" in data.omissions[r] && hasOwn(data.omissions[r], "view"))) return false
        if (!("reason" in data.omissions[r] && hasOwn(data.omissions[r], "reason"))) return false
        if (!(typeof data.omissions[r].selection === "string")) return false
        if (!(pattern0.test(data.omissions[r].selection))) return false
        if (!(typeof data.omissions[r].question === "string")) return false
        if (!(pattern0.test(data.omissions[r].question))) return false
        if (!(data.omissions[r].disposition === "outside-question" || data.omissions[r].disposition === "explicit-limit")) return false
        const sub5 = (() => {
          if (!(typeof data.omissions[r].view === "string")) return false
          if (data.omissions[r].view.length > 2048 && stringLength(data.omissions[r].view) > 2048) return false
          if (data.omissions[r].view.length < 1 || stringLength(data.omissions[r].view) < 1) return false
          if (!(pattern1.test(data.omissions[r].view))) return false
          return true
        })()
        if (!sub5) {
          const sub6 = (() => {
            if (!(data.omissions[r].view === null)) return false
            return true
          })()
          if (!sub6) return false
        }
        if (!(typeof data.omissions[r].reason === "string")) return false
        if (data.omissions[r].reason.length > 2048 && stringLength(data.omissions[r].reason) > 2048) return false
        if (data.omissions[r].reason.length < 1 || stringLength(data.omissions[r].reason) < 1) return false
        if (!(pattern1.test(data.omissions[r].reason))) return false
        for (const key8 of Object.keys(data.omissions[r])) {
          if (key8 !== "selection" && key8 !== "question" && key8 !== "disposition" && key8 !== "view" && key8 !== "reason") return false
        }
        return true
      })()
      if (sub4) passes2++
      const sub7 = (() => {
        if (!(typeof data.omissions[r] === "object" && data.omissions[r] && !Array.isArray(data.omissions[r]))) return false
        if (!("selection" in data.omissions[r] && hasOwn(data.omissions[r], "selection"))) return false
        if (!("question" in data.omissions[r] && hasOwn(data.omissions[r], "question"))) return false
        if (!("disposition" in data.omissions[r] && hasOwn(data.omissions[r], "disposition"))) return false
        if (!("view" in data.omissions[r] && hasOwn(data.omissions[r], "view"))) return false
        if (!("coveredIn" in data.omissions[r] && hasOwn(data.omissions[r], "coveredIn"))) return false
        if (!("reason" in data.omissions[r] && hasOwn(data.omissions[r], "reason"))) return false
        if (!(typeof data.omissions[r].selection === "string")) return false
        if (!(pattern0.test(data.omissions[r].selection))) return false
        if (!(typeof data.omissions[r].question === "string")) return false
        if (!(pattern0.test(data.omissions[r].question))) return false
        if (!(data.omissions[r].disposition === "covered-elsewhere")) return false
        if (!(typeof data.omissions[r].view === "string")) return false
        if (data.omissions[r].view.length > 2048 && stringLength(data.omissions[r].view) > 2048) return false
        if (data.omissions[r].view.length < 1 || stringLength(data.omissions[r].view) < 1) return false
        if (!(pattern1.test(data.omissions[r].view))) return false
        if (!(typeof data.omissions[r].coveredIn === "string")) return false
        if (data.omissions[r].coveredIn.length > 2048 && stringLength(data.omissions[r].coveredIn) > 2048) return false
        if (data.omissions[r].coveredIn.length < 1 || stringLength(data.omissions[r].coveredIn) < 1) return false
        if (!(pattern1.test(data.omissions[r].coveredIn))) return false
        if (!(typeof data.omissions[r].reason === "string")) return false
        if (data.omissions[r].reason.length > 2048 && stringLength(data.omissions[r].reason) > 2048) return false
        if (data.omissions[r].reason.length < 1 || stringLength(data.omissions[r].reason) < 1) return false
        if (!(pattern1.test(data.omissions[r].reason))) return false
        for (const key9 of Object.keys(data.omissions[r])) {
          if (key9 !== "selection" && key9 !== "question" && key9 !== "disposition" && key9 !== "view" && key9 !== "coveredIn" && key9 !== "reason") return false
        }
        return true
      })()
      if (sub7) passes2++
      if (passes2 !== 1) {
        validate.errors = [{ keywordLocation: "#/properties/omissions/items/oneOf", instanceLocation: "#/omissions/"+r }]
        return false
      }
    }
  }
  if (!Array.isArray(data.transformations)) {
    validate.errors = [{ keywordLocation: "#/properties/transformations/type", instanceLocation: "#/transformations" }]
    return false
  }
  if (data.transformations.length > 4096) {
    validate.errors = [{ keywordLocation: "#/properties/transformations/maxItems", instanceLocation: "#/transformations" }]
    return false
  }
  for (let s = 0; s < data.transformations.length; s++) {
    if (s in data.transformations && hasOwn(data.transformations, s)) {
      if (!(typeof data.transformations[s] === "object" && data.transformations[s] && !Array.isArray(data.transformations[s]))) {
        validate.errors = [{ keywordLocation: "#/properties/transformations/items/type", instanceLocation: "#/transformations/"+s }]
        return false
      }
      if (!("id" in data.transformations[s] && hasOwn(data.transformations[s], "id"))) {
        validate.errors = [{ keywordLocation: "#/properties/transformations/items/required", instanceLocation: "#/transformations/"+s+"/id" }]
        return false
      }
      if (!("kind" in data.transformations[s] && hasOwn(data.transformations[s], "kind"))) {
        validate.errors = [{ keywordLocation: "#/properties/transformations/items/required", instanceLocation: "#/transformations/"+s+"/kind" }]
        return false
      }
      if (!("inputs" in data.transformations[s] && hasOwn(data.transformations[s], "inputs"))) {
        validate.errors = [{ keywordLocation: "#/properties/transformations/items/required", instanceLocation: "#/transformations/"+s+"/inputs" }]
        return false
      }
      if (!("output" in data.transformations[s] && hasOwn(data.transformations[s], "output"))) {
        validate.errors = [{ keywordLocation: "#/properties/transformations/items/required", instanceLocation: "#/transformations/"+s+"/output" }]
        return false
      }
      if (!("proponent" in data.transformations[s] && hasOwn(data.transformations[s], "proponent"))) {
        validate.errors = [{ keywordLocation: "#/properties/transformations/items/required", instanceLocation: "#/transformations/"+s+"/proponent" }]
        return false
      }
      if (!("rule" in data.transformations[s] && hasOwn(data.transformations[s], "rule"))) {
        validate.errors = [{ keywordLocation: "#/properties/transformations/items/required", instanceLocation: "#/transformations/"+s+"/rule" }]
        return false
      }
      if (!(typeof data.transformations[s].id === "string")) {
        validate.errors = [{ keywordLocation: "#/properties/transformations/items/properties/id/type", instanceLocation: "#/transformations/"+s+"/id" }]
        return false
      }
      if (!(pattern0.test(data.transformations[s].id))) {
        validate.errors = [{ keywordLocation: "#/properties/transformations/items/properties/id/pattern", instanceLocation: "#/transformations/"+s+"/id" }]
        return false
      }
      if (!(data.transformations[s].kind === "group" || data.transformations[s].kind === "aggregate" || data.transformations[s].kind === "compare" || data.transformations[s].kind === "rephrase")) {
        validate.errors = [{ keywordLocation: "#/properties/transformations/items/properties/kind/enum", instanceLocation: "#/transformations/"+s+"/kind" }]
        return false
      }
      if (!(Array.isArray(data.transformations[s].inputs))) {
        validate.errors = [{ keywordLocation: "#/properties/transformations/items/properties/inputs/type", instanceLocation: "#/transformations/"+s+"/inputs" }]
        return false
      }
      if (data.transformations[s].inputs.length < 1) {
        validate.errors = [{ keywordLocation: "#/properties/transformations/items/properties/inputs/minItems", instanceLocation: "#/transformations/"+s+"/inputs" }]
        return false
      }
      for (let t = 0; t < data.transformations[s].inputs.length; t++) {
        if (t in data.transformations[s].inputs && hasOwn(data.transformations[s].inputs, t)) {
          if (!(typeof data.transformations[s].inputs[t] === "string")) {
            validate.errors = [{ keywordLocation: "#/properties/transformations/items/properties/inputs/items/type", instanceLocation: "#/transformations/"+s+"inputs/"+t }]
            return false
          }
          if (!(pattern0.test(data.transformations[s].inputs[t]))) {
            validate.errors = [{ keywordLocation: "#/properties/transformations/items/properties/inputs/items/pattern", instanceLocation: "#/transformations/"+s+"inputs/"+t }]
            return false
          }
        }
      }
      if (!unique(data.transformations[s].inputs)) {
        validate.errors = [{ keywordLocation: "#/properties/transformations/items/properties/inputs/uniqueItems", instanceLocation: "#/transformations/"+s+"/inputs" }]
        return false
      }
      if (!(typeof data.transformations[s].output === "string")) {
        validate.errors = [{ keywordLocation: "#/properties/transformations/items/properties/output/type", instanceLocation: "#/transformations/"+s+"/output" }]
        return false
      }
      if (!(pattern0.test(data.transformations[s].output))) {
        validate.errors = [{ keywordLocation: "#/properties/transformations/items/properties/output/pattern", instanceLocation: "#/transformations/"+s+"/output" }]
        return false
      }
      if (!(typeof data.transformations[s].proponent === "string")) {
        validate.errors = [{ keywordLocation: "#/properties/transformations/items/properties/proponent/type", instanceLocation: "#/transformations/"+s+"/proponent" }]
        return false
      }
      if (data.transformations[s].proponent.length > 2048 && stringLength(data.transformations[s].proponent) > 2048) {
        validate.errors = [{ keywordLocation: "#/properties/transformations/items/properties/proponent/maxLength", instanceLocation: "#/transformations/"+s+"/proponent" }]
        return false
      }
      if (data.transformations[s].proponent.length < 1 || stringLength(data.transformations[s].proponent) < 1) {
        validate.errors = [{ keywordLocation: "#/properties/transformations/items/properties/proponent/minLength", instanceLocation: "#/transformations/"+s+"/proponent" }]
        return false
      }
      if (!(pattern1.test(data.transformations[s].proponent))) {
        validate.errors = [{ keywordLocation: "#/properties/transformations/items/properties/proponent/pattern", instanceLocation: "#/transformations/"+s+"/proponent" }]
        return false
      }
      if (!(typeof data.transformations[s].rule === "string")) {
        validate.errors = [{ keywordLocation: "#/properties/transformations/items/properties/rule/type", instanceLocation: "#/transformations/"+s+"/rule" }]
        return false
      }
      if (data.transformations[s].rule.length > 2048 && stringLength(data.transformations[s].rule) > 2048) {
        validate.errors = [{ keywordLocation: "#/properties/transformations/items/properties/rule/maxLength", instanceLocation: "#/transformations/"+s+"/rule" }]
        return false
      }
      if (data.transformations[s].rule.length < 1 || stringLength(data.transformations[s].rule) < 1) {
        validate.errors = [{ keywordLocation: "#/properties/transformations/items/properties/rule/minLength", instanceLocation: "#/transformations/"+s+"/rule" }]
        return false
      }
      if (!(pattern1.test(data.transformations[s].rule))) {
        validate.errors = [{ keywordLocation: "#/properties/transformations/items/properties/rule/pattern", instanceLocation: "#/transformations/"+s+"/rule" }]
        return false
      }
      for (const key10 of Object.keys(data.transformations[s])) {
        if (key10 !== "id" && key10 !== "kind" && key10 !== "inputs" && key10 !== "output" && key10 !== "proponent" && key10 !== "rule") {
          validate.errors = [{ keywordLocation: "#/properties/transformations/items/additionalProperties", instanceLocation: "#/transformations/"+s+"/"+pointerPart(key10) }]
          return false
        }
      }
    }
  }
  if (!(typeof data.narrative === "object" && data.narrative && !Array.isArray(data.narrative))) {
    validate.errors = [{ keywordLocation: "#/properties/narrative/type", instanceLocation: "#/narrative" }]
    return false
  }
  if (!("summary" in data.narrative && hasOwn(data.narrative, "summary"))) {
    validate.errors = [{ keywordLocation: "#/properties/narrative/required", instanceLocation: "#/narrative/summary" }]
    return false
  }
  if (!("readingOrder" in data.narrative && hasOwn(data.narrative, "readingOrder"))) {
    validate.errors = [{ keywordLocation: "#/properties/narrative/required", instanceLocation: "#/narrative/readingOrder" }]
    return false
  }
  if (!(typeof data.narrative.summary === "string")) {
    validate.errors = [{ keywordLocation: "#/properties/narrative/properties/summary/type", instanceLocation: "#/narrative/summary" }]
    return false
  }
  if (data.narrative.summary.length > 2048 && stringLength(data.narrative.summary) > 2048) {
    validate.errors = [{ keywordLocation: "#/properties/narrative/properties/summary/maxLength", instanceLocation: "#/narrative/summary" }]
    return false
  }
  if (data.narrative.summary.length < 1 || stringLength(data.narrative.summary) < 1) {
    validate.errors = [{ keywordLocation: "#/properties/narrative/properties/summary/minLength", instanceLocation: "#/narrative/summary" }]
    return false
  }
  if (!pattern1.test(data.narrative.summary)) {
    validate.errors = [{ keywordLocation: "#/properties/narrative/properties/summary/pattern", instanceLocation: "#/narrative/summary" }]
    return false
  }
  if (!Array.isArray(data.narrative.readingOrder)) {
    validate.errors = [{ keywordLocation: "#/properties/narrative/properties/readingOrder/type", instanceLocation: "#/narrative/readingOrder" }]
    return false
  }
  if (data.narrative.readingOrder.length < 1) {
    validate.errors = [{ keywordLocation: "#/properties/narrative/properties/readingOrder/minItems", instanceLocation: "#/narrative/readingOrder" }]
    return false
  }
  for (let u = 0; u < data.narrative.readingOrder.length; u++) {
    if (u in data.narrative.readingOrder && hasOwn(data.narrative.readingOrder, u)) {
      if (!(typeof data.narrative.readingOrder[u] === "string")) {
        validate.errors = [{ keywordLocation: "#/properties/narrative/properties/readingOrder/items/type", instanceLocation: "#/narrative/readingOrder/"+u }]
        return false
      }
      if (!(pattern0.test(data.narrative.readingOrder[u]))) {
        validate.errors = [{ keywordLocation: "#/properties/narrative/properties/readingOrder/items/pattern", instanceLocation: "#/narrative/readingOrder/"+u }]
        return false
      }
    }
  }
  if (!unique(data.narrative.readingOrder)) {
    validate.errors = [{ keywordLocation: "#/properties/narrative/properties/readingOrder/uniqueItems", instanceLocation: "#/narrative/readingOrder" }]
    return false
  }
  for (const key11 of Object.keys(data.narrative)) {
    if (key11 !== "summary" && key11 !== "readingOrder") {
      validate.errors = [{ keywordLocation: "#/properties/narrative/additionalProperties", instanceLocation: "#/narrative/"+pointerPart(key11) }]
      return false
    }
  }
  if (!(typeof data.presentation === "object" && data.presentation && !Array.isArray(data.presentation))) {
    validate.errors = [{ keywordLocation: "#/properties/presentation/type", instanceLocation: "#/presentation" }]
    return false
  }
  if (!("static" in data.presentation && hasOwn(data.presentation, "static"))) {
    validate.errors = [{ keywordLocation: "#/properties/presentation/required", instanceLocation: "#/presentation/static" }]
    return false
  }
  if (!("interactive" in data.presentation && hasOwn(data.presentation, "interactive"))) {
    validate.errors = [{ keywordLocation: "#/properties/presentation/required", instanceLocation: "#/presentation/interactive" }]
    return false
  }
  if (!(typeof data.presentation.static === "object" && data.presentation.static && !Array.isArray(data.presentation.static))) {
    validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/type", instanceLocation: "#/presentation/static" }]
    return false
  }
  if (!("questions" in data.presentation.static && hasOwn(data.presentation.static, "questions"))) {
    validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/required", instanceLocation: "#/presentation/static/questions" }]
    return false
  }
  if (!("intent" in data.presentation.static && hasOwn(data.presentation.static, "intent"))) {
    validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/required", instanceLocation: "#/presentation/static/intent" }]
    return false
  }
  if (!Array.isArray(data.presentation.static.questions)) {
    validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/questions/type", instanceLocation: "#/presentation/static/questions" }]
    return false
  }
  if (data.presentation.static.questions.length < 1) {
    validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/questions/minItems", instanceLocation: "#/presentation/static/questions" }]
    return false
  }
  for (let v = 0; v < data.presentation.static.questions.length; v++) {
    if (v in data.presentation.static.questions && hasOwn(data.presentation.static.questions, v)) {
      if (!(typeof data.presentation.static.questions[v] === "string")) {
        validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/questions/items/type", instanceLocation: "#/presentation/static/questions/"+v }]
        return false
      }
      if (!(pattern0.test(data.presentation.static.questions[v]))) {
        validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/questions/items/pattern", instanceLocation: "#/presentation/static/questions/"+v }]
        return false
      }
    }
  }
  if (!unique(data.presentation.static.questions)) {
    validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/questions/uniqueItems", instanceLocation: "#/presentation/static/questions" }]
    return false
  }
  if (!(typeof data.presentation.static.intent === "string")) {
    validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/intent/type", instanceLocation: "#/presentation/static/intent" }]
    return false
  }
  if (data.presentation.static.intent.length > 2048 && stringLength(data.presentation.static.intent) > 2048) {
    validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/intent/maxLength", instanceLocation: "#/presentation/static/intent" }]
    return false
  }
  if (data.presentation.static.intent.length < 1 || stringLength(data.presentation.static.intent) < 1) {
    validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/intent/minLength", instanceLocation: "#/presentation/static/intent" }]
    return false
  }
  if (!pattern1.test(data.presentation.static.intent)) {
    validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/intent/pattern", instanceLocation: "#/presentation/static/intent" }]
    return false
  }
  if ("width" in data.presentation.static && hasOwn(data.presentation.static, "width")) {
    if (!Number.isInteger(data.presentation.static.width)) {
      validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/width/type", instanceLocation: "#/presentation/static/width" }]
      return false
    }
    if (!(320 <= data.presentation.static.width)) {
      validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/width/minimum", instanceLocation: "#/presentation/static/width" }]
      return false
    }
    if (!(12000 >= data.presentation.static.width)) {
      validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/width/maximum", instanceLocation: "#/presentation/static/width" }]
      return false
    }
  }
  for (const key12 of Object.keys(data.presentation.static)) {
    if (key12 !== "questions" && key12 !== "intent" && key12 !== "width") {
      validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/additionalProperties", instanceLocation: "#/presentation/static/"+pointerPart(key12) }]
      return false
    }
  }
  if (!(typeof data.presentation.interactive === "object" && data.presentation.interactive && !Array.isArray(data.presentation.interactive))) {
    validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/type", instanceLocation: "#/presentation/interactive" }]
    return false
  }
  if (!("questions" in data.presentation.interactive && hasOwn(data.presentation.interactive, "questions"))) {
    validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/required", instanceLocation: "#/presentation/interactive/questions" }]
    return false
  }
  if (!("intent" in data.presentation.interactive && hasOwn(data.presentation.interactive, "intent"))) {
    validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/required", instanceLocation: "#/presentation/interactive/intent" }]
    return false
  }
  if (!Array.isArray(data.presentation.interactive.questions)) {
    validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/questions/type", instanceLocation: "#/presentation/interactive/questions" }]
    return false
  }
  if (data.presentation.interactive.questions.length < 1) {
    validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/questions/minItems", instanceLocation: "#/presentation/interactive/questions" }]
    return false
  }
  for (let x = 0; x < data.presentation.interactive.questions.length; x++) {
    if (x in data.presentation.interactive.questions && hasOwn(data.presentation.interactive.questions, x)) {
      if (!(typeof data.presentation.interactive.questions[x] === "string")) {
        validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/questions/items/type", instanceLocation: "#/presentation/interactive/questions/"+x }]
        return false
      }
      if (!(pattern0.test(data.presentation.interactive.questions[x]))) {
        validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/questions/items/pattern", instanceLocation: "#/presentation/interactive/questions/"+x }]
        return false
      }
    }
  }
  if (!unique(data.presentation.interactive.questions)) {
    validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/questions/uniqueItems", instanceLocation: "#/presentation/interactive/questions" }]
    return false
  }
  if (!(typeof data.presentation.interactive.intent === "string")) {
    validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/intent/type", instanceLocation: "#/presentation/interactive/intent" }]
    return false
  }
  if (data.presentation.interactive.intent.length > 2048 && stringLength(data.presentation.interactive.intent) > 2048) {
    validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/intent/maxLength", instanceLocation: "#/presentation/interactive/intent" }]
    return false
  }
  if (data.presentation.interactive.intent.length < 1 || stringLength(data.presentation.interactive.intent) < 1) {
    validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/intent/minLength", instanceLocation: "#/presentation/interactive/intent" }]
    return false
  }
  if (!pattern1.test(data.presentation.interactive.intent)) {
    validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/intent/pattern", instanceLocation: "#/presentation/interactive/intent" }]
    return false
  }
  for (const key13 of Object.keys(data.presentation.interactive)) {
    if (key13 !== "questions" && key13 !== "intent") {
      validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/additionalProperties", instanceLocation: "#/presentation/interactive/"+pointerPart(key13) }]
      return false
    }
  }
  for (const key14 of Object.keys(data.presentation)) {
    if (key14 !== "static" && key14 !== "interactive") {
      validate.errors = [{ keywordLocation: "#/properties/presentation/additionalProperties", instanceLocation: "#/presentation/"+pointerPart(key14) }]
      return false
    }
  }
  if (!(typeof data.visualPolicy === "object" && data.visualPolicy && !Array.isArray(data.visualPolicy))) {
    validate.errors = [{ keywordLocation: "#/properties/visualPolicy/type", instanceLocation: "#/visualPolicy" }]
    return false
  }
  if (!("profile" in data.visualPolicy && hasOwn(data.visualPolicy, "profile"))) {
    validate.errors = [{ keywordLocation: "#/properties/visualPolicy/required", instanceLocation: "#/visualPolicy/profile" }]
    return false
  }
  if (!(typeof data.visualPolicy.profile === "string")) {
    validate.errors = [{ keywordLocation: "#/properties/visualPolicy/properties/profile/type", instanceLocation: "#/visualPolicy/profile" }]
    return false
  }
  if (!pattern0.test(data.visualPolicy.profile)) {
    validate.errors = [{ keywordLocation: "#/properties/visualPolicy/properties/profile/pattern", instanceLocation: "#/visualPolicy/profile" }]
    return false
  }
  if ("override" in data.visualPolicy && hasOwn(data.visualPolicy, "override")) {
    const sub8 = (() => {
      if (!(typeof data.visualPolicy.override === "string")) return false
      if (data.visualPolicy.override.length > 2048 && stringLength(data.visualPolicy.override) > 2048) return false
      if (data.visualPolicy.override.length < 1 || stringLength(data.visualPolicy.override) < 1) return false
      if (!pattern2.test(data.visualPolicy.override)) return false
      return true
    })()
    if (!sub8) {
      const sub9 = (() => {
        if (!(data.visualPolicy.override === null)) return false
        return true
      })()
      if (!sub9) {
        validate.errors = [{ keywordLocation: "#/properties/visualPolicy/properties/override/anyOf", instanceLocation: "#/visualPolicy/override" }]
        return false
      }
    }
  }
  for (const key15 of Object.keys(data.visualPolicy)) {
    if (key15 !== "profile" && key15 !== "override") {
      validate.errors = [{ keywordLocation: "#/properties/visualPolicy/additionalProperties", instanceLocation: "#/visualPolicy/"+pointerPart(key15) }]
      return false
    }
  }
  for (const key16 of Object.keys(data)) {
    if (key16 !== "schema" && key16 !== "id" && key16 !== "editor" && key16 !== "title" && key16 !== "audiences" && key16 !== "questions" && key16 !== "scope" && key16 !== "requiredAssertions" && key16 !== "omissions" && key16 !== "transformations" && key16 !== "narrative" && key16 !== "presentation" && key16 !== "visualPolicy") {
      validate.errors = [{ keywordLocation: "#/additionalProperties", instanceLocation: "#/"+pointerPart(key16) }]
      return false
    }
  }
  return true
};
return ref0})();;
