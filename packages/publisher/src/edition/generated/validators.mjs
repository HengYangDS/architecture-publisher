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
    if (!(data.edition.kind === "provider")) return false
    if (!(typeof data.edition.provider === "string")) return false
    if (!pattern1.test(data.edition.provider)) return false
    for (const key1 of Object.keys(data.edition)) {
      if (key1 !== "kind" && key1 !== "provider") return false
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
const pattern3 = new RegExp("^lucide:[a-z0-9-]+$", "u");
const pattern4 = new RegExp("^[a-f0-9]{64}$", "u");
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
  if (!("omissions" in data && hasOwn(data, "omissions"))) {
    validate.errors = [{ keywordLocation: "#/required", instanceLocation: "#/omissions" }]
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
  if ("projectionNamespaces" in data.scope && hasOwn(data.scope, "projectionNamespaces")) {
    if (!Array.isArray(data.scope.projectionNamespaces)) {
      validate.errors = [{ keywordLocation: "#/properties/scope/properties/projectionNamespaces/type", instanceLocation: "#/scope/projectionNamespaces" }]
      return false
    }
    if (data.scope.projectionNamespaces.length > 256) {
      validate.errors = [{ keywordLocation: "#/properties/scope/properties/projectionNamespaces/maxItems", instanceLocation: "#/scope/projectionNamespaces" }]
      return false
    }
    for (let l = 0; l < data.scope.projectionNamespaces.length; l++) {
      if (l in data.scope.projectionNamespaces && hasOwn(data.scope.projectionNamespaces, l)) {
        if (!(typeof data.scope.projectionNamespaces[l] === "string")) {
          validate.errors = [{ keywordLocation: "#/properties/scope/properties/projectionNamespaces/items/type", instanceLocation: "#/scope/projectionNamespaces/"+l }]
          return false
        }
        if (data.scope.projectionNamespaces[l].length > 2048 && stringLength(data.scope.projectionNamespaces[l]) > 2048) {
          validate.errors = [{ keywordLocation: "#/properties/scope/properties/projectionNamespaces/items/maxLength", instanceLocation: "#/scope/projectionNamespaces/"+l }]
          return false
        }
        if (data.scope.projectionNamespaces[l].length < 1 || stringLength(data.scope.projectionNamespaces[l]) < 1) {
          validate.errors = [{ keywordLocation: "#/properties/scope/properties/projectionNamespaces/items/minLength", instanceLocation: "#/scope/projectionNamespaces/"+l }]
          return false
        }
        if (!(pattern1.test(data.scope.projectionNamespaces[l]))) {
          validate.errors = [{ keywordLocation: "#/properties/scope/properties/projectionNamespaces/items/pattern", instanceLocation: "#/scope/projectionNamespaces/"+l }]
          return false
        }
      }
    }
    if (!unique(data.scope.projectionNamespaces)) {
      validate.errors = [{ keywordLocation: "#/properties/scope/properties/projectionNamespaces/uniqueItems", instanceLocation: "#/scope/projectionNamespaces" }]
      return false
    }
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
  for (let m = 0; m < data.scope.selections.length; m++) {
    if (m in data.scope.selections && hasOwn(data.scope.selections, m)) {
      if (!(typeof data.scope.selections[m] === "object" && data.scope.selections[m] && !Array.isArray(data.scope.selections[m]))) {
        validate.errors = [{ keywordLocation: "#/properties/scope/properties/selections/items/type", instanceLocation: "#/scope/selections/"+m }]
        return false
      }
      if (!("id" in data.scope.selections[m] && hasOwn(data.scope.selections[m], "id"))) {
        validate.errors = [{ keywordLocation: "#/properties/scope/properties/selections/items/required", instanceLocation: "#/scope/selections/"+m+"/id" }]
        return false
      }
      if (!("namespace" in data.scope.selections[m] && hasOwn(data.scope.selections[m], "namespace"))) {
        validate.errors = [{ keywordLocation: "#/properties/scope/properties/selections/items/required", instanceLocation: "#/scope/selections/"+m+"/namespace" }]
        return false
      }
      if (!("kind" in data.scope.selections[m] && hasOwn(data.scope.selections[m], "kind"))) {
        validate.errors = [{ keywordLocation: "#/properties/scope/properties/selections/items/required", instanceLocation: "#/scope/selections/"+m+"/kind" }]
        return false
      }
      if (!("reference" in data.scope.selections[m] && hasOwn(data.scope.selections[m], "reference"))) {
        validate.errors = [{ keywordLocation: "#/properties/scope/properties/selections/items/required", instanceLocation: "#/scope/selections/"+m+"/reference" }]
        return false
      }
      if (!(typeof data.scope.selections[m].id === "string")) {
        validate.errors = [{ keywordLocation: "#/properties/scope/properties/selections/items/properties/id/type", instanceLocation: "#/scope/selections/"+m+"/id" }]
        return false
      }
      if (!(pattern0.test(data.scope.selections[m].id))) {
        validate.errors = [{ keywordLocation: "#/properties/scope/properties/selections/items/properties/id/pattern", instanceLocation: "#/scope/selections/"+m+"/id" }]
        return false
      }
      if (!(typeof data.scope.selections[m].namespace === "string")) {
        validate.errors = [{ keywordLocation: "#/properties/scope/properties/selections/items/properties/namespace/type", instanceLocation: "#/scope/selections/"+m+"/namespace" }]
        return false
      }
      if (data.scope.selections[m].namespace.length > 2048 && stringLength(data.scope.selections[m].namespace) > 2048) {
        validate.errors = [{ keywordLocation: "#/properties/scope/properties/selections/items/properties/namespace/maxLength", instanceLocation: "#/scope/selections/"+m+"/namespace" }]
        return false
      }
      if (data.scope.selections[m].namespace.length < 1 || stringLength(data.scope.selections[m].namespace) < 1) {
        validate.errors = [{ keywordLocation: "#/properties/scope/properties/selections/items/properties/namespace/minLength", instanceLocation: "#/scope/selections/"+m+"/namespace" }]
        return false
      }
      if (!(pattern1.test(data.scope.selections[m].namespace))) {
        validate.errors = [{ keywordLocation: "#/properties/scope/properties/selections/items/properties/namespace/pattern", instanceLocation: "#/scope/selections/"+m+"/namespace" }]
        return false
      }
      if (!(data.scope.selections[m].kind === "reference")) {
        validate.errors = [{ keywordLocation: "#/properties/scope/properties/selections/items/properties/kind/const", instanceLocation: "#/scope/selections/"+m+"/kind" }]
        return false
      }
      if (!(typeof data.scope.selections[m].reference === "string")) {
        validate.errors = [{ keywordLocation: "#/properties/scope/properties/selections/items/properties/reference/type", instanceLocation: "#/scope/selections/"+m+"/reference" }]
        return false
      }
      if (data.scope.selections[m].reference.length > 2048 && stringLength(data.scope.selections[m].reference) > 2048) {
        validate.errors = [{ keywordLocation: "#/properties/scope/properties/selections/items/properties/reference/maxLength", instanceLocation: "#/scope/selections/"+m+"/reference" }]
        return false
      }
      if (data.scope.selections[m].reference.length < 1 || stringLength(data.scope.selections[m].reference) < 1) {
        validate.errors = [{ keywordLocation: "#/properties/scope/properties/selections/items/properties/reference/minLength", instanceLocation: "#/scope/selections/"+m+"/reference" }]
        return false
      }
      if (!(pattern1.test(data.scope.selections[m].reference))) {
        validate.errors = [{ keywordLocation: "#/properties/scope/properties/selections/items/properties/reference/pattern", instanceLocation: "#/scope/selections/"+m+"/reference" }]
        return false
      }
      if ("questions" in data.scope.selections[m] && hasOwn(data.scope.selections[m], "questions")) {
        if (!(Array.isArray(data.scope.selections[m].questions))) {
          validate.errors = [{ keywordLocation: "#/properties/scope/properties/selections/items/properties/questions/type", instanceLocation: "#/scope/selections/"+m+"/questions" }]
          return false
        }
        if (data.scope.selections[m].questions.length < 1) {
          validate.errors = [{ keywordLocation: "#/properties/scope/properties/selections/items/properties/questions/minItems", instanceLocation: "#/scope/selections/"+m+"/questions" }]
          return false
        }
        for (let n = 0; n < data.scope.selections[m].questions.length; n++) {
          if (n in data.scope.selections[m].questions && hasOwn(data.scope.selections[m].questions, n)) {
            if (!(typeof data.scope.selections[m].questions[n] === "string")) {
              validate.errors = [{ keywordLocation: "#/properties/scope/properties/selections/items/properties/questions/items/type", instanceLocation: "#/scope/selections/"+m+"questions/"+n }]
              return false
            }
            if (!(pattern0.test(data.scope.selections[m].questions[n]))) {
              validate.errors = [{ keywordLocation: "#/properties/scope/properties/selections/items/properties/questions/items/pattern", instanceLocation: "#/scope/selections/"+m+"questions/"+n }]
              return false
            }
          }
        }
        if (!unique(data.scope.selections[m].questions)) {
          validate.errors = [{ keywordLocation: "#/properties/scope/properties/selections/items/properties/questions/uniqueItems", instanceLocation: "#/scope/selections/"+m+"/questions" }]
          return false
        }
      }
      for (const key2 of Object.keys(data.scope.selections[m])) {
        if (key2 !== "id" && key2 !== "namespace" && key2 !== "kind" && key2 !== "reference" && key2 !== "questions") {
          validate.errors = [{ keywordLocation: "#/properties/scope/properties/selections/items/additionalProperties", instanceLocation: "#/scope/selections/"+m+"/"+pointerPart(key2) }]
          return false
        }
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
  for (let o = 0; o < data.scope.limits.length; o++) {
    if (o in data.scope.limits && hasOwn(data.scope.limits, o)) {
      if (!(typeof data.scope.limits[o] === "object" && data.scope.limits[o] && !Array.isArray(data.scope.limits[o]))) {
        validate.errors = [{ keywordLocation: "#/properties/scope/properties/limits/items/type", instanceLocation: "#/scope/limits/"+o }]
        return false
      }
      if (!("question" in data.scope.limits[o] && hasOwn(data.scope.limits[o], "question"))) {
        validate.errors = [{ keywordLocation: "#/properties/scope/properties/limits/items/required", instanceLocation: "#/scope/limits/"+o+"/question" }]
        return false
      }
      if (!("reason" in data.scope.limits[o] && hasOwn(data.scope.limits[o], "reason"))) {
        validate.errors = [{ keywordLocation: "#/properties/scope/properties/limits/items/required", instanceLocation: "#/scope/limits/"+o+"/reason" }]
        return false
      }
      if (!(typeof data.scope.limits[o].question === "string")) {
        validate.errors = [{ keywordLocation: "#/properties/scope/properties/limits/items/properties/question/type", instanceLocation: "#/scope/limits/"+o+"/question" }]
        return false
      }
      if (!(pattern0.test(data.scope.limits[o].question))) {
        validate.errors = [{ keywordLocation: "#/properties/scope/properties/limits/items/properties/question/pattern", instanceLocation: "#/scope/limits/"+o+"/question" }]
        return false
      }
      if (!(typeof data.scope.limits[o].reason === "string")) {
        validate.errors = [{ keywordLocation: "#/properties/scope/properties/limits/items/properties/reason/type", instanceLocation: "#/scope/limits/"+o+"/reason" }]
        return false
      }
      if (data.scope.limits[o].reason.length > 2048 && stringLength(data.scope.limits[o].reason) > 2048) {
        validate.errors = [{ keywordLocation: "#/properties/scope/properties/limits/items/properties/reason/maxLength", instanceLocation: "#/scope/limits/"+o+"/reason" }]
        return false
      }
      if (data.scope.limits[o].reason.length < 1 || stringLength(data.scope.limits[o].reason) < 1) {
        validate.errors = [{ keywordLocation: "#/properties/scope/properties/limits/items/properties/reason/minLength", instanceLocation: "#/scope/limits/"+o+"/reason" }]
        return false
      }
      if (!(pattern1.test(data.scope.limits[o].reason))) {
        validate.errors = [{ keywordLocation: "#/properties/scope/properties/limits/items/properties/reason/pattern", instanceLocation: "#/scope/limits/"+o+"/reason" }]
        return false
      }
      for (const key3 of Object.keys(data.scope.limits[o])) {
        if (key3 !== "question" && key3 !== "reason") {
          validate.errors = [{ keywordLocation: "#/properties/scope/properties/limits/items/additionalProperties", instanceLocation: "#/scope/limits/"+o+"/"+pointerPart(key3) }]
          return false
        }
      }
    }
  }
  for (const key4 of Object.keys(data.scope)) {
    if (key4 !== "sourceNamespaces" && key4 !== "projectionNamespaces" && key4 !== "selections" && key4 !== "limits") {
      validate.errors = [{ keywordLocation: "#/properties/scope/additionalProperties", instanceLocation: "#/scope/"+pointerPart(key4) }]
      return false
    }
  }
  if ("editorialAssertions" in data && hasOwn(data, "editorialAssertions")) {
    if (!Array.isArray(data.editorialAssertions)) {
      validate.errors = [{ keywordLocation: "#/properties/editorialAssertions/type", instanceLocation: "#/editorialAssertions" }]
      return false
    }
    if (data.editorialAssertions.length > 4096) {
      validate.errors = [{ keywordLocation: "#/properties/editorialAssertions/maxItems", instanceLocation: "#/editorialAssertions" }]
      return false
    }
    for (let p = 0; p < data.editorialAssertions.length; p++) {
      if (p in data.editorialAssertions && hasOwn(data.editorialAssertions, p)) {
        if (!(typeof data.editorialAssertions[p] === "object" && data.editorialAssertions[p] && !Array.isArray(data.editorialAssertions[p]))) {
          validate.errors = [{ keywordLocation: "#/properties/editorialAssertions/items/type", instanceLocation: "#/editorialAssertions/"+p }]
          return false
        }
        if (!("id" in data.editorialAssertions[p] && hasOwn(data.editorialAssertions[p], "id"))) {
          validate.errors = [{ keywordLocation: "#/properties/editorialAssertions/items/required", instanceLocation: "#/editorialAssertions/"+p+"/id" }]
          return false
        }
        if (!("statement" in data.editorialAssertions[p] && hasOwn(data.editorialAssertions[p], "statement"))) {
          validate.errors = [{ keywordLocation: "#/properties/editorialAssertions/items/required", instanceLocation: "#/editorialAssertions/"+p+"/statement" }]
          return false
        }
        if (!("proponent" in data.editorialAssertions[p] && hasOwn(data.editorialAssertions[p], "proponent"))) {
          validate.errors = [{ keywordLocation: "#/properties/editorialAssertions/items/required", instanceLocation: "#/editorialAssertions/"+p+"/proponent" }]
          return false
        }
        if (!("basis" in data.editorialAssertions[p] && hasOwn(data.editorialAssertions[p], "basis"))) {
          validate.errors = [{ keywordLocation: "#/properties/editorialAssertions/items/required", instanceLocation: "#/editorialAssertions/"+p+"/basis" }]
          return false
        }
        if (!("questions" in data.editorialAssertions[p] && hasOwn(data.editorialAssertions[p], "questions"))) {
          validate.errors = [{ keywordLocation: "#/properties/editorialAssertions/items/required", instanceLocation: "#/editorialAssertions/"+p+"/questions" }]
          return false
        }
        if (!(typeof data.editorialAssertions[p].id === "string")) {
          validate.errors = [{ keywordLocation: "#/properties/editorialAssertions/items/properties/id/type", instanceLocation: "#/editorialAssertions/"+p+"/id" }]
          return false
        }
        if (!(pattern0.test(data.editorialAssertions[p].id))) {
          validate.errors = [{ keywordLocation: "#/properties/editorialAssertions/items/properties/id/pattern", instanceLocation: "#/editorialAssertions/"+p+"/id" }]
          return false
        }
        if (!(typeof data.editorialAssertions[p].statement === "string")) {
          validate.errors = [{ keywordLocation: "#/properties/editorialAssertions/items/properties/statement/type", instanceLocation: "#/editorialAssertions/"+p+"/statement" }]
          return false
        }
        if (data.editorialAssertions[p].statement.length > 2048 && stringLength(data.editorialAssertions[p].statement) > 2048) {
          validate.errors = [{ keywordLocation: "#/properties/editorialAssertions/items/properties/statement/maxLength", instanceLocation: "#/editorialAssertions/"+p+"/statement" }]
          return false
        }
        if (data.editorialAssertions[p].statement.length < 1 || stringLength(data.editorialAssertions[p].statement) < 1) {
          validate.errors = [{ keywordLocation: "#/properties/editorialAssertions/items/properties/statement/minLength", instanceLocation: "#/editorialAssertions/"+p+"/statement" }]
          return false
        }
        if (!(pattern1.test(data.editorialAssertions[p].statement))) {
          validate.errors = [{ keywordLocation: "#/properties/editorialAssertions/items/properties/statement/pattern", instanceLocation: "#/editorialAssertions/"+p+"/statement" }]
          return false
        }
        if (!(typeof data.editorialAssertions[p].proponent === "string")) {
          validate.errors = [{ keywordLocation: "#/properties/editorialAssertions/items/properties/proponent/type", instanceLocation: "#/editorialAssertions/"+p+"/proponent" }]
          return false
        }
        if (data.editorialAssertions[p].proponent.length > 2048 && stringLength(data.editorialAssertions[p].proponent) > 2048) {
          validate.errors = [{ keywordLocation: "#/properties/editorialAssertions/items/properties/proponent/maxLength", instanceLocation: "#/editorialAssertions/"+p+"/proponent" }]
          return false
        }
        if (data.editorialAssertions[p].proponent.length < 1 || stringLength(data.editorialAssertions[p].proponent) < 1) {
          validate.errors = [{ keywordLocation: "#/properties/editorialAssertions/items/properties/proponent/minLength", instanceLocation: "#/editorialAssertions/"+p+"/proponent" }]
          return false
        }
        if (!(pattern1.test(data.editorialAssertions[p].proponent))) {
          validate.errors = [{ keywordLocation: "#/properties/editorialAssertions/items/properties/proponent/pattern", instanceLocation: "#/editorialAssertions/"+p+"/proponent" }]
          return false
        }
        if (!(Array.isArray(data.editorialAssertions[p].basis))) {
          validate.errors = [{ keywordLocation: "#/properties/editorialAssertions/items/properties/basis/type", instanceLocation: "#/editorialAssertions/"+p+"/basis" }]
          return false
        }
        if (data.editorialAssertions[p].basis.length < 1) {
          validate.errors = [{ keywordLocation: "#/properties/editorialAssertions/items/properties/basis/minItems", instanceLocation: "#/editorialAssertions/"+p+"/basis" }]
          return false
        }
        for (let q = 0; q < data.editorialAssertions[p].basis.length; q++) {
          if (q in data.editorialAssertions[p].basis && hasOwn(data.editorialAssertions[p].basis, q)) {
            if (!(typeof data.editorialAssertions[p].basis[q] === "string")) {
              validate.errors = [{ keywordLocation: "#/properties/editorialAssertions/items/properties/basis/items/type", instanceLocation: "#/editorialAssertions/"+p+"basis/"+q }]
              return false
            }
            if (!(pattern0.test(data.editorialAssertions[p].basis[q]))) {
              validate.errors = [{ keywordLocation: "#/properties/editorialAssertions/items/properties/basis/items/pattern", instanceLocation: "#/editorialAssertions/"+p+"basis/"+q }]
              return false
            }
          }
        }
        if (!unique(data.editorialAssertions[p].basis)) {
          validate.errors = [{ keywordLocation: "#/properties/editorialAssertions/items/properties/basis/uniqueItems", instanceLocation: "#/editorialAssertions/"+p+"/basis" }]
          return false
        }
        if (!(Array.isArray(data.editorialAssertions[p].questions))) {
          validate.errors = [{ keywordLocation: "#/properties/editorialAssertions/items/properties/questions/type", instanceLocation: "#/editorialAssertions/"+p+"/questions" }]
          return false
        }
        if (data.editorialAssertions[p].questions.length < 1) {
          validate.errors = [{ keywordLocation: "#/properties/editorialAssertions/items/properties/questions/minItems", instanceLocation: "#/editorialAssertions/"+p+"/questions" }]
          return false
        }
        for (let r = 0; r < data.editorialAssertions[p].questions.length; r++) {
          if (r in data.editorialAssertions[p].questions && hasOwn(data.editorialAssertions[p].questions, r)) {
            if (!(typeof data.editorialAssertions[p].questions[r] === "string")) {
              validate.errors = [{ keywordLocation: "#/properties/editorialAssertions/items/properties/questions/items/type", instanceLocation: "#/editorialAssertions/"+p+"questions/"+r }]
              return false
            }
            if (!(pattern0.test(data.editorialAssertions[p].questions[r]))) {
              validate.errors = [{ keywordLocation: "#/properties/editorialAssertions/items/properties/questions/items/pattern", instanceLocation: "#/editorialAssertions/"+p+"questions/"+r }]
              return false
            }
          }
        }
        if (!unique(data.editorialAssertions[p].questions)) {
          validate.errors = [{ keywordLocation: "#/properties/editorialAssertions/items/properties/questions/uniqueItems", instanceLocation: "#/editorialAssertions/"+p+"/questions" }]
          return false
        }
        for (const key5 of Object.keys(data.editorialAssertions[p])) {
          if (key5 !== "id" && key5 !== "statement" && key5 !== "proponent" && key5 !== "basis" && key5 !== "questions") {
            validate.errors = [{ keywordLocation: "#/properties/editorialAssertions/items/additionalProperties", instanceLocation: "#/editorialAssertions/"+p+"/"+pointerPart(key5) }]
            return false
          }
        }
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
  for (let s = 0; s < data.omissions.length; s++) {
    if (s in data.omissions && hasOwn(data.omissions, s)) {
      let passes0 = 0
      const sub0 = (() => {
        if (!(typeof data.omissions[s] === "object" && data.omissions[s] && !Array.isArray(data.omissions[s]))) return false
        if (!("selection" in data.omissions[s] && hasOwn(data.omissions[s], "selection"))) return false
        if (!("question" in data.omissions[s] && hasOwn(data.omissions[s], "question"))) return false
        if (!("medium" in data.omissions[s] && hasOwn(data.omissions[s], "medium"))) return false
        if (!("disposition" in data.omissions[s] && hasOwn(data.omissions[s], "disposition"))) return false
        if (!("view" in data.omissions[s] && hasOwn(data.omissions[s], "view"))) return false
        if (!("reason" in data.omissions[s] && hasOwn(data.omissions[s], "reason"))) return false
        if (!(typeof data.omissions[s].selection === "string")) return false
        if (!(pattern0.test(data.omissions[s].selection))) return false
        if (!(typeof data.omissions[s].question === "string")) return false
        if (!(pattern0.test(data.omissions[s].question))) return false
        if (!(data.omissions[s].medium === "static" || data.omissions[s].medium === "interactive")) return false
        if (!(data.omissions[s].disposition === "outside-question" || data.omissions[s].disposition === "explicit-limit")) return false
        if (!(typeof data.omissions[s].view === "string")) return false
        if (!(pattern0.test(data.omissions[s].view))) return false
        if (!(typeof data.omissions[s].reason === "string")) return false
        if (data.omissions[s].reason.length > 2048 && stringLength(data.omissions[s].reason) > 2048) return false
        if (data.omissions[s].reason.length < 1 || stringLength(data.omissions[s].reason) < 1) return false
        if (!(pattern1.test(data.omissions[s].reason))) return false
        for (const key6 of Object.keys(data.omissions[s])) {
          if (key6 !== "selection" && key6 !== "question" && key6 !== "medium" && key6 !== "disposition" && key6 !== "view" && key6 !== "reason") return false
        }
        return true
      })()
      if (sub0) passes0++
      const sub1 = (() => {
        if (!(typeof data.omissions[s] === "object" && data.omissions[s] && !Array.isArray(data.omissions[s]))) return false
        if (!("selection" in data.omissions[s] && hasOwn(data.omissions[s], "selection"))) return false
        if (!("question" in data.omissions[s] && hasOwn(data.omissions[s], "question"))) return false
        if (!("medium" in data.omissions[s] && hasOwn(data.omissions[s], "medium"))) return false
        if (!("disposition" in data.omissions[s] && hasOwn(data.omissions[s], "disposition"))) return false
        if (!("view" in data.omissions[s] && hasOwn(data.omissions[s], "view"))) return false
        if (!("coveredIn" in data.omissions[s] && hasOwn(data.omissions[s], "coveredIn"))) return false
        if (!("reason" in data.omissions[s] && hasOwn(data.omissions[s], "reason"))) return false
        if (!(typeof data.omissions[s].selection === "string")) return false
        if (!(pattern0.test(data.omissions[s].selection))) return false
        if (!(typeof data.omissions[s].question === "string")) return false
        if (!(pattern0.test(data.omissions[s].question))) return false
        if (!(data.omissions[s].medium === "static" || data.omissions[s].medium === "interactive")) return false
        if (!(data.omissions[s].disposition === "covered-elsewhere")) return false
        if (!(typeof data.omissions[s].view === "string")) return false
        if (!(pattern0.test(data.omissions[s].view))) return false
        if (!(typeof data.omissions[s].coveredIn === "string")) return false
        if (!(pattern0.test(data.omissions[s].coveredIn))) return false
        if (!(typeof data.omissions[s].reason === "string")) return false
        if (data.omissions[s].reason.length > 2048 && stringLength(data.omissions[s].reason) > 2048) return false
        if (data.omissions[s].reason.length < 1 || stringLength(data.omissions[s].reason) < 1) return false
        if (!(pattern1.test(data.omissions[s].reason))) return false
        for (const key7 of Object.keys(data.omissions[s])) {
          if (key7 !== "selection" && key7 !== "question" && key7 !== "medium" && key7 !== "disposition" && key7 !== "view" && key7 !== "coveredIn" && key7 !== "reason") return false
        }
        return true
      })()
      if (sub1) passes0++
      if (passes0 !== 1) {
        validate.errors = [{ keywordLocation: "#/properties/omissions/items/oneOf", instanceLocation: "#/omissions/"+s }]
        return false
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
  for (const key8 of Object.keys(data.narrative)) {
    if (key8 !== "summary") {
      validate.errors = [{ keywordLocation: "#/properties/narrative/additionalProperties", instanceLocation: "#/narrative/"+pointerPart(key8) }]
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
  if (!("views" in data.presentation.static && hasOwn(data.presentation.static, "views"))) {
    validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/required", instanceLocation: "#/presentation/static/views" }]
    return false
  }
  if (!Array.isArray(data.presentation.static.views)) {
    validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/type", instanceLocation: "#/presentation/static/views" }]
    return false
  }
  if (data.presentation.static.views.length > 256) {
    validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/maxItems", instanceLocation: "#/presentation/static/views" }]
    return false
  }
  if (data.presentation.static.views.length < 1) {
    validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/minItems", instanceLocation: "#/presentation/static/views" }]
    return false
  }
  for (let t = 0; t < data.presentation.static.views.length; t++) {
    if (t in data.presentation.static.views && hasOwn(data.presentation.static.views, t)) {
      if (!(typeof data.presentation.static.views[t] === "object" && data.presentation.static.views[t] && !Array.isArray(data.presentation.static.views[t]))) {
        validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/type", instanceLocation: "#/presentation/static/views/"+t }]
        return false
      }
      if (!("id" in data.presentation.static.views[t] && hasOwn(data.presentation.static.views[t], "id"))) {
        validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/required", instanceLocation: "#/presentation/static/views/"+t+"/id" }]
        return false
      }
      if (!("questions" in data.presentation.static.views[t] && hasOwn(data.presentation.static.views[t], "questions"))) {
        validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/required", instanceLocation: "#/presentation/static/views/"+t+"/questions" }]
        return false
      }
      if (!(typeof data.presentation.static.views[t].id === "string")) {
        validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/id/type", instanceLocation: "#/presentation/static/views/"+t+"/id" }]
        return false
      }
      if (!(pattern0.test(data.presentation.static.views[t].id))) {
        validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/id/pattern", instanceLocation: "#/presentation/static/views/"+t+"/id" }]
        return false
      }
      if (!(Array.isArray(data.presentation.static.views[t].questions))) {
        validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/questions/type", instanceLocation: "#/presentation/static/views/"+t+"/questions" }]
        return false
      }
      if (data.presentation.static.views[t].questions.length < 1) {
        validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/questions/minItems", instanceLocation: "#/presentation/static/views/"+t+"/questions" }]
        return false
      }
      for (let u = 0; u < data.presentation.static.views[t].questions.length; u++) {
        if (u in data.presentation.static.views[t].questions && hasOwn(data.presentation.static.views[t].questions, u)) {
          if (!(typeof data.presentation.static.views[t].questions[u] === "string")) {
            validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/questions/items/type", instanceLocation: "#/presentation/static/views/"+t+"questions/"+u }]
            return false
          }
          if (!(pattern0.test(data.presentation.static.views[t].questions[u]))) {
            validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/questions/items/pattern", instanceLocation: "#/presentation/static/views/"+t+"questions/"+u }]
            return false
          }
        }
      }
      if (!unique(data.presentation.static.views[t].questions)) {
        validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/questions/uniqueItems", instanceLocation: "#/presentation/static/views/"+t+"/questions" }]
        return false
      }
      if ("form" in data.presentation.static.views[t] && hasOwn(data.presentation.static.views[t], "form")) {
        if (!(typeof data.presentation.static.views[t].form === "object" && data.presentation.static.views[t].form && !Array.isArray(data.presentation.static.views[t].form))) {
          validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/form/type", instanceLocation: "#/presentation/static/views/"+t+"/form" }]
          return false
        }
        if (!("schema" in data.presentation.static.views[t].form && hasOwn(data.presentation.static.views[t].form, "schema"))) {
          validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/form/required", instanceLocation: "#/presentation/static/views/"+t+"/form/schema" }]
          return false
        }
        if (!("kind" in data.presentation.static.views[t].form && hasOwn(data.presentation.static.views[t].form, "kind"))) {
          validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/form/required", instanceLocation: "#/presentation/static/views/"+t+"/form/kind" }]
          return false
        }
        if (!("roles" in data.presentation.static.views[t].form && hasOwn(data.presentation.static.views[t].form, "roles"))) {
          validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/form/required", instanceLocation: "#/presentation/static/views/"+t+"/form/roles" }]
          return false
        }
        if (!("handoffs" in data.presentation.static.views[t].form && hasOwn(data.presentation.static.views[t].form, "handoffs"))) {
          validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/form/required", instanceLocation: "#/presentation/static/views/"+t+"/form/handoffs" }]
          return false
        }
        if (!(data.presentation.static.views[t].form.schema === "architecture.visual-form/v1")) {
          validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/form/properties/schema/const", instanceLocation: "#/presentation/static/views/"+t+"/form/schema" }]
          return false
        }
        if (!(data.presentation.static.views[t].form.kind === "responsibility")) {
          validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/form/properties/kind/const", instanceLocation: "#/presentation/static/views/"+t+"/form/kind" }]
          return false
        }
        if (!(Array.isArray(data.presentation.static.views[t].form.roles))) {
          validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/form/properties/roles/type", instanceLocation: "#/presentation/static/views/"+t+"/form/roles" }]
          return false
        }
        if (data.presentation.static.views[t].form.roles.length > 256) {
          validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/form/properties/roles/maxItems", instanceLocation: "#/presentation/static/views/"+t+"/form/roles" }]
          return false
        }
        if (data.presentation.static.views[t].form.roles.length < 1) {
          validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/form/properties/roles/minItems", instanceLocation: "#/presentation/static/views/"+t+"/form/roles" }]
          return false
        }
        for (let v = 0; v < data.presentation.static.views[t].form.roles.length; v++) {
          if (v in data.presentation.static.views[t].form.roles && hasOwn(data.presentation.static.views[t].form.roles, v)) {
            if (!(typeof data.presentation.static.views[t].form.roles[v] === "object" && data.presentation.static.views[t].form.roles[v] && !Array.isArray(data.presentation.static.views[t].form.roles[v]))) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/form/properties/roles/items/type", instanceLocation: "#/presentation/static/views/"+t+"form/roles/"+v }]
              return false
            }
            if (!("group" in data.presentation.static.views[t].form.roles[v] && hasOwn(data.presentation.static.views[t].form.roles[v], "group"))) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/form/properties/roles/items/required", instanceLocation: "#/presentation/static/views/"+t+"form/roles/"+v+"/group" }]
              return false
            }
            if (!("basis" in data.presentation.static.views[t].form.roles[v] && hasOwn(data.presentation.static.views[t].form.roles[v], "basis"))) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/form/properties/roles/items/required", instanceLocation: "#/presentation/static/views/"+t+"form/roles/"+v+"/basis" }]
              return false
            }
            if (!(typeof data.presentation.static.views[t].form.roles[v].group === "string")) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/form/properties/roles/items/properties/group/type", instanceLocation: "#/presentation/static/views/"+t+"form/roles/"+v+"/group" }]
              return false
            }
            if (!(pattern0.test(data.presentation.static.views[t].form.roles[v].group))) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/form/properties/roles/items/properties/group/pattern", instanceLocation: "#/presentation/static/views/"+t+"form/roles/"+v+"/group" }]
              return false
            }
            if (!(typeof data.presentation.static.views[t].form.roles[v].basis === "string")) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/form/properties/roles/items/properties/basis/type", instanceLocation: "#/presentation/static/views/"+t+"form/roles/"+v+"/basis" }]
              return false
            }
            if (!(pattern0.test(data.presentation.static.views[t].form.roles[v].basis))) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/form/properties/roles/items/properties/basis/pattern", instanceLocation: "#/presentation/static/views/"+t+"form/roles/"+v+"/basis" }]
              return false
            }
            for (const key9 of Object.keys(data.presentation.static.views[t].form.roles[v])) {
              if (key9 !== "group" && key9 !== "basis") {
                validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/form/properties/roles/items/additionalProperties", instanceLocation: "#/presentation/static/views/"+t+"form/roles/"+v+"/"+pointerPart(key9) }]
                return false
              }
            }
          }
        }
        if (!(Array.isArray(data.presentation.static.views[t].form.handoffs))) {
          validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/form/properties/handoffs/type", instanceLocation: "#/presentation/static/views/"+t+"/form/handoffs" }]
          return false
        }
        if (data.presentation.static.views[t].form.handoffs.length > 4096) {
          validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/form/properties/handoffs/maxItems", instanceLocation: "#/presentation/static/views/"+t+"/form/handoffs" }]
          return false
        }
        for (let x = 0; x < data.presentation.static.views[t].form.handoffs.length; x++) {
          if (x in data.presentation.static.views[t].form.handoffs && hasOwn(data.presentation.static.views[t].form.handoffs, x)) {
            if (!(typeof data.presentation.static.views[t].form.handoffs[x] === "object" && data.presentation.static.views[t].form.handoffs[x] && !Array.isArray(data.presentation.static.views[t].form.handoffs[x]))) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/form/properties/handoffs/items/type", instanceLocation: "#/presentation/static/views/"+t+"form/handoffs/"+x }]
              return false
            }
            if (!("from" in data.presentation.static.views[t].form.handoffs[x] && hasOwn(data.presentation.static.views[t].form.handoffs[x], "from"))) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/form/properties/handoffs/items/required", instanceLocation: "#/presentation/static/views/"+t+"form/handoffs/"+x+"/from" }]
              return false
            }
            if (!("to" in data.presentation.static.views[t].form.handoffs[x] && hasOwn(data.presentation.static.views[t].form.handoffs[x], "to"))) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/form/properties/handoffs/items/required", instanceLocation: "#/presentation/static/views/"+t+"form/handoffs/"+x+"/to" }]
              return false
            }
            if (!("basis" in data.presentation.static.views[t].form.handoffs[x] && hasOwn(data.presentation.static.views[t].form.handoffs[x], "basis"))) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/form/properties/handoffs/items/required", instanceLocation: "#/presentation/static/views/"+t+"form/handoffs/"+x+"/basis" }]
              return false
            }
            if (!(typeof data.presentation.static.views[t].form.handoffs[x].from === "string")) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/form/properties/handoffs/items/properties/from/type", instanceLocation: "#/presentation/static/views/"+t+"form/handoffs/"+x+"/from" }]
              return false
            }
            if (!(pattern0.test(data.presentation.static.views[t].form.handoffs[x].from))) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/form/properties/handoffs/items/properties/from/pattern", instanceLocation: "#/presentation/static/views/"+t+"form/handoffs/"+x+"/from" }]
              return false
            }
            if (!(typeof data.presentation.static.views[t].form.handoffs[x].to === "string")) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/form/properties/handoffs/items/properties/to/type", instanceLocation: "#/presentation/static/views/"+t+"form/handoffs/"+x+"/to" }]
              return false
            }
            if (!(pattern0.test(data.presentation.static.views[t].form.handoffs[x].to))) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/form/properties/handoffs/items/properties/to/pattern", instanceLocation: "#/presentation/static/views/"+t+"form/handoffs/"+x+"/to" }]
              return false
            }
            if (!(typeof data.presentation.static.views[t].form.handoffs[x].basis === "string")) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/form/properties/handoffs/items/properties/basis/type", instanceLocation: "#/presentation/static/views/"+t+"form/handoffs/"+x+"/basis" }]
              return false
            }
            if (!(pattern0.test(data.presentation.static.views[t].form.handoffs[x].basis))) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/form/properties/handoffs/items/properties/basis/pattern", instanceLocation: "#/presentation/static/views/"+t+"form/handoffs/"+x+"/basis" }]
              return false
            }
            for (const key10 of Object.keys(data.presentation.static.views[t].form.handoffs[x])) {
              if (key10 !== "from" && key10 !== "to" && key10 !== "basis") {
                validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/form/properties/handoffs/items/additionalProperties", instanceLocation: "#/presentation/static/views/"+t+"form/handoffs/"+x+"/"+pointerPart(key10) }]
                return false
              }
            }
          }
        }
        for (const key11 of Object.keys(data.presentation.static.views[t].form)) {
          if (key11 !== "schema" && key11 !== "kind" && key11 !== "roles" && key11 !== "handoffs") {
            validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/form/additionalProperties", instanceLocation: "#/presentation/static/views/"+t+"form/"+pointerPart(key11) }]
            return false
          }
        }
      }
      if ("groups" in data.presentation.static.views[t] && hasOwn(data.presentation.static.views[t], "groups")) {
        if (!(Array.isArray(data.presentation.static.views[t].groups))) {
          validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/groups/type", instanceLocation: "#/presentation/static/views/"+t+"/groups" }]
          return false
        }
        if (data.presentation.static.views[t].groups.length > 256) {
          validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/groups/maxItems", instanceLocation: "#/presentation/static/views/"+t+"/groups" }]
          return false
        }
        if (data.presentation.static.views[t].groups.length < 1) {
          validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/groups/minItems", instanceLocation: "#/presentation/static/views/"+t+"/groups" }]
          return false
        }
        for (let y = 0; y < data.presentation.static.views[t].groups.length; y++) {
          if (y in data.presentation.static.views[t].groups && hasOwn(data.presentation.static.views[t].groups, y)) {
            if (!(typeof data.presentation.static.views[t].groups[y] === "object" && data.presentation.static.views[t].groups[y] && !Array.isArray(data.presentation.static.views[t].groups[y]))) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/groups/items/type", instanceLocation: "#/presentation/static/views/"+t+"groups/"+y }]
              return false
            }
            if (!("id" in data.presentation.static.views[t].groups[y] && hasOwn(data.presentation.static.views[t].groups[y], "id"))) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/groups/items/required", instanceLocation: "#/presentation/static/views/"+t+"groups/"+y+"/id" }]
              return false
            }
            if (!("label" in data.presentation.static.views[t].groups[y] && hasOwn(data.presentation.static.views[t].groups[y], "label"))) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/groups/items/required", instanceLocation: "#/presentation/static/views/"+t+"groups/"+y+"/label" }]
              return false
            }
            if (!("elements" in data.presentation.static.views[t].groups[y] && hasOwn(data.presentation.static.views[t].groups[y], "elements"))) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/groups/items/required", instanceLocation: "#/presentation/static/views/"+t+"groups/"+y+"/elements" }]
              return false
            }
            if (!(typeof data.presentation.static.views[t].groups[y].id === "string")) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/groups/items/properties/id/type", instanceLocation: "#/presentation/static/views/"+t+"groups/"+y+"/id" }]
              return false
            }
            if (!(pattern0.test(data.presentation.static.views[t].groups[y].id))) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/groups/items/properties/id/pattern", instanceLocation: "#/presentation/static/views/"+t+"groups/"+y+"/id" }]
              return false
            }
            if (!(typeof data.presentation.static.views[t].groups[y].label === "string")) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/groups/items/properties/label/type", instanceLocation: "#/presentation/static/views/"+t+"groups/"+y+"/label" }]
              return false
            }
            if (data.presentation.static.views[t].groups[y].label.length > 2048 && stringLength(data.presentation.static.views[t].groups[y].label) > 2048) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/groups/items/properties/label/maxLength", instanceLocation: "#/presentation/static/views/"+t+"groups/"+y+"/label" }]
              return false
            }
            if (data.presentation.static.views[t].groups[y].label.length < 1 || stringLength(data.presentation.static.views[t].groups[y].label) < 1) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/groups/items/properties/label/minLength", instanceLocation: "#/presentation/static/views/"+t+"groups/"+y+"/label" }]
              return false
            }
            if (!(pattern1.test(data.presentation.static.views[t].groups[y].label))) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/groups/items/properties/label/pattern", instanceLocation: "#/presentation/static/views/"+t+"groups/"+y+"/label" }]
              return false
            }
            if (!(Array.isArray(data.presentation.static.views[t].groups[y].elements))) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/groups/items/properties/elements/type", instanceLocation: "#/presentation/static/views/"+t+"groups/"+y+"/elements" }]
              return false
            }
            if (data.presentation.static.views[t].groups[y].elements.length > 4096) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/groups/items/properties/elements/maxItems", instanceLocation: "#/presentation/static/views/"+t+"groups/"+y+"/elements" }]
              return false
            }
            if (data.presentation.static.views[t].groups[y].elements.length < 1) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/groups/items/properties/elements/minItems", instanceLocation: "#/presentation/static/views/"+t+"groups/"+y+"/elements" }]
              return false
            }
            for (let z = 0; z < data.presentation.static.views[t].groups[y].elements.length; z++) {
              if (z in data.presentation.static.views[t].groups[y].elements && hasOwn(data.presentation.static.views[t].groups[y].elements, z)) {
                if (!(typeof data.presentation.static.views[t].groups[y].elements[z] === "object" && data.presentation.static.views[t].groups[y].elements[z] && !Array.isArray(data.presentation.static.views[t].groups[y].elements[z]))) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/groups/items/properties/elements/items/type", instanceLocation: "#/presentation/static/views/"+t+"groups/"+y+"elements/"+z }]
                  return false
                }
                if (!("namespace" in data.presentation.static.views[t].groups[y].elements[z] && hasOwn(data.presentation.static.views[t].groups[y].elements[z], "namespace"))) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/groups/items/properties/elements/items/required", instanceLocation: "#/presentation/static/views/"+t+"groups/"+y+"elements/"+z+"/namespace" }]
                  return false
                }
                if (!("id" in data.presentation.static.views[t].groups[y].elements[z] && hasOwn(data.presentation.static.views[t].groups[y].elements[z], "id"))) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/groups/items/properties/elements/items/required", instanceLocation: "#/presentation/static/views/"+t+"groups/"+y+"elements/"+z+"/id" }]
                  return false
                }
                if (!(typeof data.presentation.static.views[t].groups[y].elements[z].namespace === "string")) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/groups/items/properties/elements/items/properties/namespace/type", instanceLocation: "#/presentation/static/views/"+t+"groups/"+y+"elements/"+z+"/namespace" }]
                  return false
                }
                if (data.presentation.static.views[t].groups[y].elements[z].namespace.length > 2048 && stringLength(data.presentation.static.views[t].groups[y].elements[z].namespace) > 2048) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/groups/items/properties/elements/items/properties/namespace/maxLength", instanceLocation: "#/presentation/static/views/"+t+"groups/"+y+"elements/"+z+"/namespace" }]
                  return false
                }
                if (data.presentation.static.views[t].groups[y].elements[z].namespace.length < 1 || stringLength(data.presentation.static.views[t].groups[y].elements[z].namespace) < 1) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/groups/items/properties/elements/items/properties/namespace/minLength", instanceLocation: "#/presentation/static/views/"+t+"groups/"+y+"elements/"+z+"/namespace" }]
                  return false
                }
                if (!(pattern1.test(data.presentation.static.views[t].groups[y].elements[z].namespace))) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/groups/items/properties/elements/items/properties/namespace/pattern", instanceLocation: "#/presentation/static/views/"+t+"groups/"+y+"elements/"+z+"/namespace" }]
                  return false
                }
                if (!(typeof data.presentation.static.views[t].groups[y].elements[z].id === "string")) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/groups/items/properties/elements/items/properties/id/type", instanceLocation: "#/presentation/static/views/"+t+"groups/"+y+"elements/"+z+"/id" }]
                  return false
                }
                if (data.presentation.static.views[t].groups[y].elements[z].id.length > 2048 && stringLength(data.presentation.static.views[t].groups[y].elements[z].id) > 2048) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/groups/items/properties/elements/items/properties/id/maxLength", instanceLocation: "#/presentation/static/views/"+t+"groups/"+y+"elements/"+z+"/id" }]
                  return false
                }
                if (data.presentation.static.views[t].groups[y].elements[z].id.length < 1 || stringLength(data.presentation.static.views[t].groups[y].elements[z].id) < 1) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/groups/items/properties/elements/items/properties/id/minLength", instanceLocation: "#/presentation/static/views/"+t+"groups/"+y+"elements/"+z+"/id" }]
                  return false
                }
                if (!(pattern1.test(data.presentation.static.views[t].groups[y].elements[z].id))) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/groups/items/properties/elements/items/properties/id/pattern", instanceLocation: "#/presentation/static/views/"+t+"groups/"+y+"elements/"+z+"/id" }]
                  return false
                }
                for (const key12 of Object.keys(data.presentation.static.views[t].groups[y].elements[z])) {
                  if (key12 !== "namespace" && key12 !== "id") {
                    validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/groups/items/properties/elements/items/additionalProperties", instanceLocation: "#/presentation/static/views/"+t+"groups/"+y+"elements/"+z+"/"+pointerPart(key12) }]
                    return false
                  }
                }
              }
            }
            for (const key13 of Object.keys(data.presentation.static.views[t].groups[y])) {
              if (key13 !== "id" && key13 !== "label" && key13 !== "elements") {
                validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/groups/items/additionalProperties", instanceLocation: "#/presentation/static/views/"+t+"groups/"+y+"/"+pointerPart(key13) }]
                return false
              }
            }
          }
        }
      }
      if ("forbiddenGroupPairs" in data.presentation.static.views[t] && hasOwn(data.presentation.static.views[t], "forbiddenGroupPairs")) {
        if (!(Array.isArray(data.presentation.static.views[t].forbiddenGroupPairs))) {
          validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/forbiddenGroupPairs/type", instanceLocation: "#/presentation/static/views/"+t+"/forbiddenGroupPairs" }]
          return false
        }
        if (data.presentation.static.views[t].forbiddenGroupPairs.length > 4096) {
          validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/forbiddenGroupPairs/maxItems", instanceLocation: "#/presentation/static/views/"+t+"/forbiddenGroupPairs" }]
          return false
        }
        for (let ii = 0; ii < data.presentation.static.views[t].forbiddenGroupPairs.length; ii++) {
          if (ii in data.presentation.static.views[t].forbiddenGroupPairs && hasOwn(data.presentation.static.views[t].forbiddenGroupPairs, ii)) {
            if (!(typeof data.presentation.static.views[t].forbiddenGroupPairs[ii] === "object" && data.presentation.static.views[t].forbiddenGroupPairs[ii] && !Array.isArray(data.presentation.static.views[t].forbiddenGroupPairs[ii]))) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/forbiddenGroupPairs/items/type", instanceLocation: "#/presentation/static/views/"+t+"forbiddenGroupPairs/"+ii }]
              return false
            }
            if (!("members" in data.presentation.static.views[t].forbiddenGroupPairs[ii] && hasOwn(data.presentation.static.views[t].forbiddenGroupPairs[ii], "members"))) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/forbiddenGroupPairs/items/required", instanceLocation: "#/presentation/static/views/"+t+"forbiddenGroupPairs/"+ii+"/members" }]
              return false
            }
            if (!("reason" in data.presentation.static.views[t].forbiddenGroupPairs[ii] && hasOwn(data.presentation.static.views[t].forbiddenGroupPairs[ii], "reason"))) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/forbiddenGroupPairs/items/required", instanceLocation: "#/presentation/static/views/"+t+"forbiddenGroupPairs/"+ii+"/reason" }]
              return false
            }
            if (!(Array.isArray(data.presentation.static.views[t].forbiddenGroupPairs[ii].members))) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/forbiddenGroupPairs/items/properties/members/type", instanceLocation: "#/presentation/static/views/"+t+"forbiddenGroupPairs/"+ii+"/members" }]
              return false
            }
            if (data.presentation.static.views[t].forbiddenGroupPairs[ii].members.length > 2) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/forbiddenGroupPairs/items/properties/members/maxItems", instanceLocation: "#/presentation/static/views/"+t+"forbiddenGroupPairs/"+ii+"/members" }]
              return false
            }
            if (data.presentation.static.views[t].forbiddenGroupPairs[ii].members.length < 2) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/forbiddenGroupPairs/items/properties/members/minItems", instanceLocation: "#/presentation/static/views/"+t+"forbiddenGroupPairs/"+ii+"/members" }]
              return false
            }
            for (let jj = 0; jj < data.presentation.static.views[t].forbiddenGroupPairs[ii].members.length; jj++) {
              if (jj in data.presentation.static.views[t].forbiddenGroupPairs[ii].members && hasOwn(data.presentation.static.views[t].forbiddenGroupPairs[ii].members, jj)) {
                if (!(typeof data.presentation.static.views[t].forbiddenGroupPairs[ii].members[jj] === "object" && data.presentation.static.views[t].forbiddenGroupPairs[ii].members[jj] && !Array.isArray(data.presentation.static.views[t].forbiddenGroupPairs[ii].members[jj]))) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/forbiddenGroupPairs/items/properties/members/items/type", instanceLocation: "#/presentation/static/views/"+t+"forbiddenGroupPairs/"+ii+"members/"+jj }]
                  return false
                }
                if (!("namespace" in data.presentation.static.views[t].forbiddenGroupPairs[ii].members[jj] && hasOwn(data.presentation.static.views[t].forbiddenGroupPairs[ii].members[jj], "namespace"))) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/forbiddenGroupPairs/items/properties/members/items/required", instanceLocation: "#/presentation/static/views/"+t+"forbiddenGroupPairs/"+ii+"members/"+jj+"/namespace" }]
                  return false
                }
                if (!("id" in data.presentation.static.views[t].forbiddenGroupPairs[ii].members[jj] && hasOwn(data.presentation.static.views[t].forbiddenGroupPairs[ii].members[jj], "id"))) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/forbiddenGroupPairs/items/properties/members/items/required", instanceLocation: "#/presentation/static/views/"+t+"forbiddenGroupPairs/"+ii+"members/"+jj+"/id" }]
                  return false
                }
                if (!(typeof data.presentation.static.views[t].forbiddenGroupPairs[ii].members[jj].namespace === "string")) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/forbiddenGroupPairs/items/properties/members/items/properties/namespace/type", instanceLocation: "#/presentation/static/views/"+t+"forbiddenGroupPairs/"+ii+"members/"+jj+"/namespace" }]
                  return false
                }
                if (data.presentation.static.views[t].forbiddenGroupPairs[ii].members[jj].namespace.length > 2048 && stringLength(data.presentation.static.views[t].forbiddenGroupPairs[ii].members[jj].namespace) > 2048) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/forbiddenGroupPairs/items/properties/members/items/properties/namespace/maxLength", instanceLocation: "#/presentation/static/views/"+t+"forbiddenGroupPairs/"+ii+"members/"+jj+"/namespace" }]
                  return false
                }
                if (data.presentation.static.views[t].forbiddenGroupPairs[ii].members[jj].namespace.length < 1 || stringLength(data.presentation.static.views[t].forbiddenGroupPairs[ii].members[jj].namespace) < 1) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/forbiddenGroupPairs/items/properties/members/items/properties/namespace/minLength", instanceLocation: "#/presentation/static/views/"+t+"forbiddenGroupPairs/"+ii+"members/"+jj+"/namespace" }]
                  return false
                }
                if (!(pattern1.test(data.presentation.static.views[t].forbiddenGroupPairs[ii].members[jj].namespace))) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/forbiddenGroupPairs/items/properties/members/items/properties/namespace/pattern", instanceLocation: "#/presentation/static/views/"+t+"forbiddenGroupPairs/"+ii+"members/"+jj+"/namespace" }]
                  return false
                }
                if (!(typeof data.presentation.static.views[t].forbiddenGroupPairs[ii].members[jj].id === "string")) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/forbiddenGroupPairs/items/properties/members/items/properties/id/type", instanceLocation: "#/presentation/static/views/"+t+"forbiddenGroupPairs/"+ii+"members/"+jj+"/id" }]
                  return false
                }
                if (data.presentation.static.views[t].forbiddenGroupPairs[ii].members[jj].id.length > 2048 && stringLength(data.presentation.static.views[t].forbiddenGroupPairs[ii].members[jj].id) > 2048) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/forbiddenGroupPairs/items/properties/members/items/properties/id/maxLength", instanceLocation: "#/presentation/static/views/"+t+"forbiddenGroupPairs/"+ii+"members/"+jj+"/id" }]
                  return false
                }
                if (data.presentation.static.views[t].forbiddenGroupPairs[ii].members[jj].id.length < 1 || stringLength(data.presentation.static.views[t].forbiddenGroupPairs[ii].members[jj].id) < 1) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/forbiddenGroupPairs/items/properties/members/items/properties/id/minLength", instanceLocation: "#/presentation/static/views/"+t+"forbiddenGroupPairs/"+ii+"members/"+jj+"/id" }]
                  return false
                }
                if (!(pattern1.test(data.presentation.static.views[t].forbiddenGroupPairs[ii].members[jj].id))) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/forbiddenGroupPairs/items/properties/members/items/properties/id/pattern", instanceLocation: "#/presentation/static/views/"+t+"forbiddenGroupPairs/"+ii+"members/"+jj+"/id" }]
                  return false
                }
                for (const key14 of Object.keys(data.presentation.static.views[t].forbiddenGroupPairs[ii].members[jj])) {
                  if (key14 !== "namespace" && key14 !== "id") {
                    validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/forbiddenGroupPairs/items/properties/members/items/additionalProperties", instanceLocation: "#/presentation/static/views/"+t+"forbiddenGroupPairs/"+ii+"members/"+jj+"/"+pointerPart(key14) }]
                    return false
                  }
                }
              }
            }
            if (!(typeof data.presentation.static.views[t].forbiddenGroupPairs[ii].reason === "string")) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/forbiddenGroupPairs/items/properties/reason/type", instanceLocation: "#/presentation/static/views/"+t+"forbiddenGroupPairs/"+ii+"/reason" }]
              return false
            }
            if (data.presentation.static.views[t].forbiddenGroupPairs[ii].reason.length > 2048 && stringLength(data.presentation.static.views[t].forbiddenGroupPairs[ii].reason) > 2048) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/forbiddenGroupPairs/items/properties/reason/maxLength", instanceLocation: "#/presentation/static/views/"+t+"forbiddenGroupPairs/"+ii+"/reason" }]
              return false
            }
            if (data.presentation.static.views[t].forbiddenGroupPairs[ii].reason.length < 1 || stringLength(data.presentation.static.views[t].forbiddenGroupPairs[ii].reason) < 1) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/forbiddenGroupPairs/items/properties/reason/minLength", instanceLocation: "#/presentation/static/views/"+t+"forbiddenGroupPairs/"+ii+"/reason" }]
              return false
            }
            if (!(pattern1.test(data.presentation.static.views[t].forbiddenGroupPairs[ii].reason))) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/forbiddenGroupPairs/items/properties/reason/pattern", instanceLocation: "#/presentation/static/views/"+t+"forbiddenGroupPairs/"+ii+"/reason" }]
              return false
            }
            for (const key15 of Object.keys(data.presentation.static.views[t].forbiddenGroupPairs[ii])) {
              if (key15 !== "members" && key15 !== "reason") {
                validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/forbiddenGroupPairs/items/additionalProperties", instanceLocation: "#/presentation/static/views/"+t+"forbiddenGroupPairs/"+ii+"/"+pointerPart(key15) }]
                return false
              }
            }
          }
        }
      }
      for (const key16 of Object.keys(data.presentation.static.views[t])) {
        if (key16 !== "id" && key16 !== "questions" && key16 !== "form" && key16 !== "groups" && key16 !== "forbiddenGroupPairs") {
          validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/additionalProperties", instanceLocation: "#/presentation/static/views/"+t+"/"+pointerPart(key16) }]
          return false
        }
      }
    }
  }
  if ("intent" in data.presentation.static && hasOwn(data.presentation.static, "intent")) {
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
  for (const key17 of Object.keys(data.presentation.static)) {
    if (key17 !== "views" && key17 !== "intent" && key17 !== "width") {
      validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/additionalProperties", instanceLocation: "#/presentation/static/"+pointerPart(key17) }]
      return false
    }
  }
  if (!(typeof data.presentation.interactive === "object" && data.presentation.interactive && !Array.isArray(data.presentation.interactive))) {
    validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/type", instanceLocation: "#/presentation/interactive" }]
    return false
  }
  if (!("views" in data.presentation.interactive && hasOwn(data.presentation.interactive, "views"))) {
    validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/required", instanceLocation: "#/presentation/interactive/views" }]
    return false
  }
  if (!Array.isArray(data.presentation.interactive.views)) {
    validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/type", instanceLocation: "#/presentation/interactive/views" }]
    return false
  }
  if (data.presentation.interactive.views.length > 256) {
    validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/maxItems", instanceLocation: "#/presentation/interactive/views" }]
    return false
  }
  if (data.presentation.interactive.views.length < 1) {
    validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/minItems", instanceLocation: "#/presentation/interactive/views" }]
    return false
  }
  for (let kk = 0; kk < data.presentation.interactive.views.length; kk++) {
    if (kk in data.presentation.interactive.views && hasOwn(data.presentation.interactive.views, kk)) {
      if (!(typeof data.presentation.interactive.views[kk] === "object" && data.presentation.interactive.views[kk] && !Array.isArray(data.presentation.interactive.views[kk]))) {
        validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/type", instanceLocation: "#/presentation/interactive/views/"+kk }]
        return false
      }
      if (!("id" in data.presentation.interactive.views[kk] && hasOwn(data.presentation.interactive.views[kk], "id"))) {
        validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/required", instanceLocation: "#/presentation/interactive/views/"+kk+"/id" }]
        return false
      }
      if (!("questions" in data.presentation.interactive.views[kk] && hasOwn(data.presentation.interactive.views[kk], "questions"))) {
        validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/required", instanceLocation: "#/presentation/interactive/views/"+kk+"/questions" }]
        return false
      }
      if (!(typeof data.presentation.interactive.views[kk].id === "string")) {
        validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/id/type", instanceLocation: "#/presentation/interactive/views/"+kk+"/id" }]
        return false
      }
      if (!(pattern0.test(data.presentation.interactive.views[kk].id))) {
        validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/id/pattern", instanceLocation: "#/presentation/interactive/views/"+kk+"/id" }]
        return false
      }
      if (!(Array.isArray(data.presentation.interactive.views[kk].questions))) {
        validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/questions/type", instanceLocation: "#/presentation/interactive/views/"+kk+"/questions" }]
        return false
      }
      if (data.presentation.interactive.views[kk].questions.length < 1) {
        validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/questions/minItems", instanceLocation: "#/presentation/interactive/views/"+kk+"/questions" }]
        return false
      }
      for (let ll = 0; ll < data.presentation.interactive.views[kk].questions.length; ll++) {
        if (ll in data.presentation.interactive.views[kk].questions && hasOwn(data.presentation.interactive.views[kk].questions, ll)) {
          if (!(typeof data.presentation.interactive.views[kk].questions[ll] === "string")) {
            validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/questions/items/type", instanceLocation: "#/presentation/interactive/views/"+kk+"questions/"+ll }]
            return false
          }
          if (!(pattern0.test(data.presentation.interactive.views[kk].questions[ll]))) {
            validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/questions/items/pattern", instanceLocation: "#/presentation/interactive/views/"+kk+"questions/"+ll }]
            return false
          }
        }
      }
      if (!unique(data.presentation.interactive.views[kk].questions)) {
        validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/questions/uniqueItems", instanceLocation: "#/presentation/interactive/views/"+kk+"/questions" }]
        return false
      }
      if ("form" in data.presentation.interactive.views[kk] && hasOwn(data.presentation.interactive.views[kk], "form")) {
        if (!(typeof data.presentation.interactive.views[kk].form === "object" && data.presentation.interactive.views[kk].form && !Array.isArray(data.presentation.interactive.views[kk].form))) {
          validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/form/type", instanceLocation: "#/presentation/interactive/views/"+kk+"/form" }]
          return false
        }
        if (!("schema" in data.presentation.interactive.views[kk].form && hasOwn(data.presentation.interactive.views[kk].form, "schema"))) {
          validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/form/required", instanceLocation: "#/presentation/interactive/views/"+kk+"/form/schema" }]
          return false
        }
        if (!("kind" in data.presentation.interactive.views[kk].form && hasOwn(data.presentation.interactive.views[kk].form, "kind"))) {
          validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/form/required", instanceLocation: "#/presentation/interactive/views/"+kk+"/form/kind" }]
          return false
        }
        if (!("roles" in data.presentation.interactive.views[kk].form && hasOwn(data.presentation.interactive.views[kk].form, "roles"))) {
          validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/form/required", instanceLocation: "#/presentation/interactive/views/"+kk+"/form/roles" }]
          return false
        }
        if (!("handoffs" in data.presentation.interactive.views[kk].form && hasOwn(data.presentation.interactive.views[kk].form, "handoffs"))) {
          validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/form/required", instanceLocation: "#/presentation/interactive/views/"+kk+"/form/handoffs" }]
          return false
        }
        if (!(data.presentation.interactive.views[kk].form.schema === "architecture.visual-form/v1")) {
          validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/form/properties/schema/const", instanceLocation: "#/presentation/interactive/views/"+kk+"/form/schema" }]
          return false
        }
        if (!(data.presentation.interactive.views[kk].form.kind === "responsibility")) {
          validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/form/properties/kind/const", instanceLocation: "#/presentation/interactive/views/"+kk+"/form/kind" }]
          return false
        }
        if (!(Array.isArray(data.presentation.interactive.views[kk].form.roles))) {
          validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/form/properties/roles/type", instanceLocation: "#/presentation/interactive/views/"+kk+"/form/roles" }]
          return false
        }
        if (data.presentation.interactive.views[kk].form.roles.length > 256) {
          validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/form/properties/roles/maxItems", instanceLocation: "#/presentation/interactive/views/"+kk+"/form/roles" }]
          return false
        }
        if (data.presentation.interactive.views[kk].form.roles.length < 1) {
          validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/form/properties/roles/minItems", instanceLocation: "#/presentation/interactive/views/"+kk+"/form/roles" }]
          return false
        }
        for (let mm = 0; mm < data.presentation.interactive.views[kk].form.roles.length; mm++) {
          if (mm in data.presentation.interactive.views[kk].form.roles && hasOwn(data.presentation.interactive.views[kk].form.roles, mm)) {
            if (!(typeof data.presentation.interactive.views[kk].form.roles[mm] === "object" && data.presentation.interactive.views[kk].form.roles[mm] && !Array.isArray(data.presentation.interactive.views[kk].form.roles[mm]))) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/form/properties/roles/items/type", instanceLocation: "#/presentation/interactive/views/"+kk+"form/roles/"+mm }]
              return false
            }
            if (!("group" in data.presentation.interactive.views[kk].form.roles[mm] && hasOwn(data.presentation.interactive.views[kk].form.roles[mm], "group"))) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/form/properties/roles/items/required", instanceLocation: "#/presentation/interactive/views/"+kk+"form/roles/"+mm+"/group" }]
              return false
            }
            if (!("basis" in data.presentation.interactive.views[kk].form.roles[mm] && hasOwn(data.presentation.interactive.views[kk].form.roles[mm], "basis"))) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/form/properties/roles/items/required", instanceLocation: "#/presentation/interactive/views/"+kk+"form/roles/"+mm+"/basis" }]
              return false
            }
            if (!(typeof data.presentation.interactive.views[kk].form.roles[mm].group === "string")) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/form/properties/roles/items/properties/group/type", instanceLocation: "#/presentation/interactive/views/"+kk+"form/roles/"+mm+"/group" }]
              return false
            }
            if (!(pattern0.test(data.presentation.interactive.views[kk].form.roles[mm].group))) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/form/properties/roles/items/properties/group/pattern", instanceLocation: "#/presentation/interactive/views/"+kk+"form/roles/"+mm+"/group" }]
              return false
            }
            if (!(typeof data.presentation.interactive.views[kk].form.roles[mm].basis === "string")) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/form/properties/roles/items/properties/basis/type", instanceLocation: "#/presentation/interactive/views/"+kk+"form/roles/"+mm+"/basis" }]
              return false
            }
            if (!(pattern0.test(data.presentation.interactive.views[kk].form.roles[mm].basis))) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/form/properties/roles/items/properties/basis/pattern", instanceLocation: "#/presentation/interactive/views/"+kk+"form/roles/"+mm+"/basis" }]
              return false
            }
            for (const key18 of Object.keys(data.presentation.interactive.views[kk].form.roles[mm])) {
              if (key18 !== "group" && key18 !== "basis") {
                validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/form/properties/roles/items/additionalProperties", instanceLocation: "#/presentation/interactive/views/"+kk+"form/roles/"+mm+"/"+pointerPart(key18) }]
                return false
              }
            }
          }
        }
        if (!(Array.isArray(data.presentation.interactive.views[kk].form.handoffs))) {
          validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/form/properties/handoffs/type", instanceLocation: "#/presentation/interactive/views/"+kk+"/form/handoffs" }]
          return false
        }
        if (data.presentation.interactive.views[kk].form.handoffs.length > 4096) {
          validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/form/properties/handoffs/maxItems", instanceLocation: "#/presentation/interactive/views/"+kk+"/form/handoffs" }]
          return false
        }
        for (let nn = 0; nn < data.presentation.interactive.views[kk].form.handoffs.length; nn++) {
          if (nn in data.presentation.interactive.views[kk].form.handoffs && hasOwn(data.presentation.interactive.views[kk].form.handoffs, nn)) {
            if (!(typeof data.presentation.interactive.views[kk].form.handoffs[nn] === "object" && data.presentation.interactive.views[kk].form.handoffs[nn] && !Array.isArray(data.presentation.interactive.views[kk].form.handoffs[nn]))) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/form/properties/handoffs/items/type", instanceLocation: "#/presentation/interactive/views/"+kk+"form/handoffs/"+nn }]
              return false
            }
            if (!("from" in data.presentation.interactive.views[kk].form.handoffs[nn] && hasOwn(data.presentation.interactive.views[kk].form.handoffs[nn], "from"))) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/form/properties/handoffs/items/required", instanceLocation: "#/presentation/interactive/views/"+kk+"form/handoffs/"+nn+"/from" }]
              return false
            }
            if (!("to" in data.presentation.interactive.views[kk].form.handoffs[nn] && hasOwn(data.presentation.interactive.views[kk].form.handoffs[nn], "to"))) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/form/properties/handoffs/items/required", instanceLocation: "#/presentation/interactive/views/"+kk+"form/handoffs/"+nn+"/to" }]
              return false
            }
            if (!("basis" in data.presentation.interactive.views[kk].form.handoffs[nn] && hasOwn(data.presentation.interactive.views[kk].form.handoffs[nn], "basis"))) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/form/properties/handoffs/items/required", instanceLocation: "#/presentation/interactive/views/"+kk+"form/handoffs/"+nn+"/basis" }]
              return false
            }
            if (!(typeof data.presentation.interactive.views[kk].form.handoffs[nn].from === "string")) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/form/properties/handoffs/items/properties/from/type", instanceLocation: "#/presentation/interactive/views/"+kk+"form/handoffs/"+nn+"/from" }]
              return false
            }
            if (!(pattern0.test(data.presentation.interactive.views[kk].form.handoffs[nn].from))) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/form/properties/handoffs/items/properties/from/pattern", instanceLocation: "#/presentation/interactive/views/"+kk+"form/handoffs/"+nn+"/from" }]
              return false
            }
            if (!(typeof data.presentation.interactive.views[kk].form.handoffs[nn].to === "string")) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/form/properties/handoffs/items/properties/to/type", instanceLocation: "#/presentation/interactive/views/"+kk+"form/handoffs/"+nn+"/to" }]
              return false
            }
            if (!(pattern0.test(data.presentation.interactive.views[kk].form.handoffs[nn].to))) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/form/properties/handoffs/items/properties/to/pattern", instanceLocation: "#/presentation/interactive/views/"+kk+"form/handoffs/"+nn+"/to" }]
              return false
            }
            if (!(typeof data.presentation.interactive.views[kk].form.handoffs[nn].basis === "string")) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/form/properties/handoffs/items/properties/basis/type", instanceLocation: "#/presentation/interactive/views/"+kk+"form/handoffs/"+nn+"/basis" }]
              return false
            }
            if (!(pattern0.test(data.presentation.interactive.views[kk].form.handoffs[nn].basis))) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/form/properties/handoffs/items/properties/basis/pattern", instanceLocation: "#/presentation/interactive/views/"+kk+"form/handoffs/"+nn+"/basis" }]
              return false
            }
            for (const key19 of Object.keys(data.presentation.interactive.views[kk].form.handoffs[nn])) {
              if (key19 !== "from" && key19 !== "to" && key19 !== "basis") {
                validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/form/properties/handoffs/items/additionalProperties", instanceLocation: "#/presentation/interactive/views/"+kk+"form/handoffs/"+nn+"/"+pointerPart(key19) }]
                return false
              }
            }
          }
        }
        for (const key20 of Object.keys(data.presentation.interactive.views[kk].form)) {
          if (key20 !== "schema" && key20 !== "kind" && key20 !== "roles" && key20 !== "handoffs") {
            validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/form/additionalProperties", instanceLocation: "#/presentation/interactive/views/"+kk+"form/"+pointerPart(key20) }]
            return false
          }
        }
      }
      if ("groups" in data.presentation.interactive.views[kk] && hasOwn(data.presentation.interactive.views[kk], "groups")) {
        if (!(Array.isArray(data.presentation.interactive.views[kk].groups))) {
          validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/groups/type", instanceLocation: "#/presentation/interactive/views/"+kk+"/groups" }]
          return false
        }
        if (data.presentation.interactive.views[kk].groups.length > 256) {
          validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/groups/maxItems", instanceLocation: "#/presentation/interactive/views/"+kk+"/groups" }]
          return false
        }
        if (data.presentation.interactive.views[kk].groups.length < 1) {
          validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/groups/minItems", instanceLocation: "#/presentation/interactive/views/"+kk+"/groups" }]
          return false
        }
        for (let oo = 0; oo < data.presentation.interactive.views[kk].groups.length; oo++) {
          if (oo in data.presentation.interactive.views[kk].groups && hasOwn(data.presentation.interactive.views[kk].groups, oo)) {
            if (!(typeof data.presentation.interactive.views[kk].groups[oo] === "object" && data.presentation.interactive.views[kk].groups[oo] && !Array.isArray(data.presentation.interactive.views[kk].groups[oo]))) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/groups/items/type", instanceLocation: "#/presentation/interactive/views/"+kk+"groups/"+oo }]
              return false
            }
            if (!("id" in data.presentation.interactive.views[kk].groups[oo] && hasOwn(data.presentation.interactive.views[kk].groups[oo], "id"))) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/groups/items/required", instanceLocation: "#/presentation/interactive/views/"+kk+"groups/"+oo+"/id" }]
              return false
            }
            if (!("label" in data.presentation.interactive.views[kk].groups[oo] && hasOwn(data.presentation.interactive.views[kk].groups[oo], "label"))) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/groups/items/required", instanceLocation: "#/presentation/interactive/views/"+kk+"groups/"+oo+"/label" }]
              return false
            }
            if (!("elements" in data.presentation.interactive.views[kk].groups[oo] && hasOwn(data.presentation.interactive.views[kk].groups[oo], "elements"))) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/groups/items/required", instanceLocation: "#/presentation/interactive/views/"+kk+"groups/"+oo+"/elements" }]
              return false
            }
            if (!(typeof data.presentation.interactive.views[kk].groups[oo].id === "string")) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/groups/items/properties/id/type", instanceLocation: "#/presentation/interactive/views/"+kk+"groups/"+oo+"/id" }]
              return false
            }
            if (!(pattern0.test(data.presentation.interactive.views[kk].groups[oo].id))) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/groups/items/properties/id/pattern", instanceLocation: "#/presentation/interactive/views/"+kk+"groups/"+oo+"/id" }]
              return false
            }
            if (!(typeof data.presentation.interactive.views[kk].groups[oo].label === "string")) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/groups/items/properties/label/type", instanceLocation: "#/presentation/interactive/views/"+kk+"groups/"+oo+"/label" }]
              return false
            }
            if (data.presentation.interactive.views[kk].groups[oo].label.length > 2048 && stringLength(data.presentation.interactive.views[kk].groups[oo].label) > 2048) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/groups/items/properties/label/maxLength", instanceLocation: "#/presentation/interactive/views/"+kk+"groups/"+oo+"/label" }]
              return false
            }
            if (data.presentation.interactive.views[kk].groups[oo].label.length < 1 || stringLength(data.presentation.interactive.views[kk].groups[oo].label) < 1) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/groups/items/properties/label/minLength", instanceLocation: "#/presentation/interactive/views/"+kk+"groups/"+oo+"/label" }]
              return false
            }
            if (!(pattern1.test(data.presentation.interactive.views[kk].groups[oo].label))) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/groups/items/properties/label/pattern", instanceLocation: "#/presentation/interactive/views/"+kk+"groups/"+oo+"/label" }]
              return false
            }
            if (!(Array.isArray(data.presentation.interactive.views[kk].groups[oo].elements))) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/groups/items/properties/elements/type", instanceLocation: "#/presentation/interactive/views/"+kk+"groups/"+oo+"/elements" }]
              return false
            }
            if (data.presentation.interactive.views[kk].groups[oo].elements.length > 4096) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/groups/items/properties/elements/maxItems", instanceLocation: "#/presentation/interactive/views/"+kk+"groups/"+oo+"/elements" }]
              return false
            }
            if (data.presentation.interactive.views[kk].groups[oo].elements.length < 1) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/groups/items/properties/elements/minItems", instanceLocation: "#/presentation/interactive/views/"+kk+"groups/"+oo+"/elements" }]
              return false
            }
            for (let pp = 0; pp < data.presentation.interactive.views[kk].groups[oo].elements.length; pp++) {
              if (pp in data.presentation.interactive.views[kk].groups[oo].elements && hasOwn(data.presentation.interactive.views[kk].groups[oo].elements, pp)) {
                if (!(typeof data.presentation.interactive.views[kk].groups[oo].elements[pp] === "object" && data.presentation.interactive.views[kk].groups[oo].elements[pp] && !Array.isArray(data.presentation.interactive.views[kk].groups[oo].elements[pp]))) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/groups/items/properties/elements/items/type", instanceLocation: "#/presentation/interactive/views/"+kk+"groups/"+oo+"elements/"+pp }]
                  return false
                }
                if (!("namespace" in data.presentation.interactive.views[kk].groups[oo].elements[pp] && hasOwn(data.presentation.interactive.views[kk].groups[oo].elements[pp], "namespace"))) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/groups/items/properties/elements/items/required", instanceLocation: "#/presentation/interactive/views/"+kk+"groups/"+oo+"elements/"+pp+"/namespace" }]
                  return false
                }
                if (!("id" in data.presentation.interactive.views[kk].groups[oo].elements[pp] && hasOwn(data.presentation.interactive.views[kk].groups[oo].elements[pp], "id"))) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/groups/items/properties/elements/items/required", instanceLocation: "#/presentation/interactive/views/"+kk+"groups/"+oo+"elements/"+pp+"/id" }]
                  return false
                }
                if (!(typeof data.presentation.interactive.views[kk].groups[oo].elements[pp].namespace === "string")) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/groups/items/properties/elements/items/properties/namespace/type", instanceLocation: "#/presentation/interactive/views/"+kk+"groups/"+oo+"elements/"+pp+"/namespace" }]
                  return false
                }
                if (data.presentation.interactive.views[kk].groups[oo].elements[pp].namespace.length > 2048 && stringLength(data.presentation.interactive.views[kk].groups[oo].elements[pp].namespace) > 2048) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/groups/items/properties/elements/items/properties/namespace/maxLength", instanceLocation: "#/presentation/interactive/views/"+kk+"groups/"+oo+"elements/"+pp+"/namespace" }]
                  return false
                }
                if (data.presentation.interactive.views[kk].groups[oo].elements[pp].namespace.length < 1 || stringLength(data.presentation.interactive.views[kk].groups[oo].elements[pp].namespace) < 1) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/groups/items/properties/elements/items/properties/namespace/minLength", instanceLocation: "#/presentation/interactive/views/"+kk+"groups/"+oo+"elements/"+pp+"/namespace" }]
                  return false
                }
                if (!(pattern1.test(data.presentation.interactive.views[kk].groups[oo].elements[pp].namespace))) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/groups/items/properties/elements/items/properties/namespace/pattern", instanceLocation: "#/presentation/interactive/views/"+kk+"groups/"+oo+"elements/"+pp+"/namespace" }]
                  return false
                }
                if (!(typeof data.presentation.interactive.views[kk].groups[oo].elements[pp].id === "string")) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/groups/items/properties/elements/items/properties/id/type", instanceLocation: "#/presentation/interactive/views/"+kk+"groups/"+oo+"elements/"+pp+"/id" }]
                  return false
                }
                if (data.presentation.interactive.views[kk].groups[oo].elements[pp].id.length > 2048 && stringLength(data.presentation.interactive.views[kk].groups[oo].elements[pp].id) > 2048) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/groups/items/properties/elements/items/properties/id/maxLength", instanceLocation: "#/presentation/interactive/views/"+kk+"groups/"+oo+"elements/"+pp+"/id" }]
                  return false
                }
                if (data.presentation.interactive.views[kk].groups[oo].elements[pp].id.length < 1 || stringLength(data.presentation.interactive.views[kk].groups[oo].elements[pp].id) < 1) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/groups/items/properties/elements/items/properties/id/minLength", instanceLocation: "#/presentation/interactive/views/"+kk+"groups/"+oo+"elements/"+pp+"/id" }]
                  return false
                }
                if (!(pattern1.test(data.presentation.interactive.views[kk].groups[oo].elements[pp].id))) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/groups/items/properties/elements/items/properties/id/pattern", instanceLocation: "#/presentation/interactive/views/"+kk+"groups/"+oo+"elements/"+pp+"/id" }]
                  return false
                }
                for (const key21 of Object.keys(data.presentation.interactive.views[kk].groups[oo].elements[pp])) {
                  if (key21 !== "namespace" && key21 !== "id") {
                    validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/groups/items/properties/elements/items/additionalProperties", instanceLocation: "#/presentation/interactive/views/"+kk+"groups/"+oo+"elements/"+pp+"/"+pointerPart(key21) }]
                    return false
                  }
                }
              }
            }
            for (const key22 of Object.keys(data.presentation.interactive.views[kk].groups[oo])) {
              if (key22 !== "id" && key22 !== "label" && key22 !== "elements") {
                validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/groups/items/additionalProperties", instanceLocation: "#/presentation/interactive/views/"+kk+"groups/"+oo+"/"+pointerPart(key22) }]
                return false
              }
            }
          }
        }
      }
      if ("forbiddenGroupPairs" in data.presentation.interactive.views[kk] && hasOwn(data.presentation.interactive.views[kk], "forbiddenGroupPairs")) {
        if (!(Array.isArray(data.presentation.interactive.views[kk].forbiddenGroupPairs))) {
          validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/forbiddenGroupPairs/type", instanceLocation: "#/presentation/interactive/views/"+kk+"/forbiddenGroupPairs" }]
          return false
        }
        if (data.presentation.interactive.views[kk].forbiddenGroupPairs.length > 4096) {
          validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/forbiddenGroupPairs/maxItems", instanceLocation: "#/presentation/interactive/views/"+kk+"/forbiddenGroupPairs" }]
          return false
        }
        for (let qq = 0; qq < data.presentation.interactive.views[kk].forbiddenGroupPairs.length; qq++) {
          if (qq in data.presentation.interactive.views[kk].forbiddenGroupPairs && hasOwn(data.presentation.interactive.views[kk].forbiddenGroupPairs, qq)) {
            if (!(typeof data.presentation.interactive.views[kk].forbiddenGroupPairs[qq] === "object" && data.presentation.interactive.views[kk].forbiddenGroupPairs[qq] && !Array.isArray(data.presentation.interactive.views[kk].forbiddenGroupPairs[qq]))) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/forbiddenGroupPairs/items/type", instanceLocation: "#/presentation/interactive/views/"+kk+"forbiddenGroupPairs/"+qq }]
              return false
            }
            if (!("members" in data.presentation.interactive.views[kk].forbiddenGroupPairs[qq] && hasOwn(data.presentation.interactive.views[kk].forbiddenGroupPairs[qq], "members"))) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/forbiddenGroupPairs/items/required", instanceLocation: "#/presentation/interactive/views/"+kk+"forbiddenGroupPairs/"+qq+"/members" }]
              return false
            }
            if (!("reason" in data.presentation.interactive.views[kk].forbiddenGroupPairs[qq] && hasOwn(data.presentation.interactive.views[kk].forbiddenGroupPairs[qq], "reason"))) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/forbiddenGroupPairs/items/required", instanceLocation: "#/presentation/interactive/views/"+kk+"forbiddenGroupPairs/"+qq+"/reason" }]
              return false
            }
            if (!(Array.isArray(data.presentation.interactive.views[kk].forbiddenGroupPairs[qq].members))) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/forbiddenGroupPairs/items/properties/members/type", instanceLocation: "#/presentation/interactive/views/"+kk+"forbiddenGroupPairs/"+qq+"/members" }]
              return false
            }
            if (data.presentation.interactive.views[kk].forbiddenGroupPairs[qq].members.length > 2) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/forbiddenGroupPairs/items/properties/members/maxItems", instanceLocation: "#/presentation/interactive/views/"+kk+"forbiddenGroupPairs/"+qq+"/members" }]
              return false
            }
            if (data.presentation.interactive.views[kk].forbiddenGroupPairs[qq].members.length < 2) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/forbiddenGroupPairs/items/properties/members/minItems", instanceLocation: "#/presentation/interactive/views/"+kk+"forbiddenGroupPairs/"+qq+"/members" }]
              return false
            }
            for (let rr = 0; rr < data.presentation.interactive.views[kk].forbiddenGroupPairs[qq].members.length; rr++) {
              if (rr in data.presentation.interactive.views[kk].forbiddenGroupPairs[qq].members && hasOwn(data.presentation.interactive.views[kk].forbiddenGroupPairs[qq].members, rr)) {
                if (!(typeof data.presentation.interactive.views[kk].forbiddenGroupPairs[qq].members[rr] === "object" && data.presentation.interactive.views[kk].forbiddenGroupPairs[qq].members[rr] && !Array.isArray(data.presentation.interactive.views[kk].forbiddenGroupPairs[qq].members[rr]))) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/forbiddenGroupPairs/items/properties/members/items/type", instanceLocation: "#/presentation/interactive/views/"+kk+"forbiddenGroupPairs/"+qq+"members/"+rr }]
                  return false
                }
                if (!("namespace" in data.presentation.interactive.views[kk].forbiddenGroupPairs[qq].members[rr] && hasOwn(data.presentation.interactive.views[kk].forbiddenGroupPairs[qq].members[rr], "namespace"))) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/forbiddenGroupPairs/items/properties/members/items/required", instanceLocation: "#/presentation/interactive/views/"+kk+"forbiddenGroupPairs/"+qq+"members/"+rr+"/namespace" }]
                  return false
                }
                if (!("id" in data.presentation.interactive.views[kk].forbiddenGroupPairs[qq].members[rr] && hasOwn(data.presentation.interactive.views[kk].forbiddenGroupPairs[qq].members[rr], "id"))) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/forbiddenGroupPairs/items/properties/members/items/required", instanceLocation: "#/presentation/interactive/views/"+kk+"forbiddenGroupPairs/"+qq+"members/"+rr+"/id" }]
                  return false
                }
                if (!(typeof data.presentation.interactive.views[kk].forbiddenGroupPairs[qq].members[rr].namespace === "string")) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/forbiddenGroupPairs/items/properties/members/items/properties/namespace/type", instanceLocation: "#/presentation/interactive/views/"+kk+"forbiddenGroupPairs/"+qq+"members/"+rr+"/namespace" }]
                  return false
                }
                if (data.presentation.interactive.views[kk].forbiddenGroupPairs[qq].members[rr].namespace.length > 2048 && stringLength(data.presentation.interactive.views[kk].forbiddenGroupPairs[qq].members[rr].namespace) > 2048) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/forbiddenGroupPairs/items/properties/members/items/properties/namespace/maxLength", instanceLocation: "#/presentation/interactive/views/"+kk+"forbiddenGroupPairs/"+qq+"members/"+rr+"/namespace" }]
                  return false
                }
                if (data.presentation.interactive.views[kk].forbiddenGroupPairs[qq].members[rr].namespace.length < 1 || stringLength(data.presentation.interactive.views[kk].forbiddenGroupPairs[qq].members[rr].namespace) < 1) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/forbiddenGroupPairs/items/properties/members/items/properties/namespace/minLength", instanceLocation: "#/presentation/interactive/views/"+kk+"forbiddenGroupPairs/"+qq+"members/"+rr+"/namespace" }]
                  return false
                }
                if (!(pattern1.test(data.presentation.interactive.views[kk].forbiddenGroupPairs[qq].members[rr].namespace))) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/forbiddenGroupPairs/items/properties/members/items/properties/namespace/pattern", instanceLocation: "#/presentation/interactive/views/"+kk+"forbiddenGroupPairs/"+qq+"members/"+rr+"/namespace" }]
                  return false
                }
                if (!(typeof data.presentation.interactive.views[kk].forbiddenGroupPairs[qq].members[rr].id === "string")) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/forbiddenGroupPairs/items/properties/members/items/properties/id/type", instanceLocation: "#/presentation/interactive/views/"+kk+"forbiddenGroupPairs/"+qq+"members/"+rr+"/id" }]
                  return false
                }
                if (data.presentation.interactive.views[kk].forbiddenGroupPairs[qq].members[rr].id.length > 2048 && stringLength(data.presentation.interactive.views[kk].forbiddenGroupPairs[qq].members[rr].id) > 2048) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/forbiddenGroupPairs/items/properties/members/items/properties/id/maxLength", instanceLocation: "#/presentation/interactive/views/"+kk+"forbiddenGroupPairs/"+qq+"members/"+rr+"/id" }]
                  return false
                }
                if (data.presentation.interactive.views[kk].forbiddenGroupPairs[qq].members[rr].id.length < 1 || stringLength(data.presentation.interactive.views[kk].forbiddenGroupPairs[qq].members[rr].id) < 1) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/forbiddenGroupPairs/items/properties/members/items/properties/id/minLength", instanceLocation: "#/presentation/interactive/views/"+kk+"forbiddenGroupPairs/"+qq+"members/"+rr+"/id" }]
                  return false
                }
                if (!(pattern1.test(data.presentation.interactive.views[kk].forbiddenGroupPairs[qq].members[rr].id))) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/forbiddenGroupPairs/items/properties/members/items/properties/id/pattern", instanceLocation: "#/presentation/interactive/views/"+kk+"forbiddenGroupPairs/"+qq+"members/"+rr+"/id" }]
                  return false
                }
                for (const key23 of Object.keys(data.presentation.interactive.views[kk].forbiddenGroupPairs[qq].members[rr])) {
                  if (key23 !== "namespace" && key23 !== "id") {
                    validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/forbiddenGroupPairs/items/properties/members/items/additionalProperties", instanceLocation: "#/presentation/interactive/views/"+kk+"forbiddenGroupPairs/"+qq+"members/"+rr+"/"+pointerPart(key23) }]
                    return false
                  }
                }
              }
            }
            if (!(typeof data.presentation.interactive.views[kk].forbiddenGroupPairs[qq].reason === "string")) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/forbiddenGroupPairs/items/properties/reason/type", instanceLocation: "#/presentation/interactive/views/"+kk+"forbiddenGroupPairs/"+qq+"/reason" }]
              return false
            }
            if (data.presentation.interactive.views[kk].forbiddenGroupPairs[qq].reason.length > 2048 && stringLength(data.presentation.interactive.views[kk].forbiddenGroupPairs[qq].reason) > 2048) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/forbiddenGroupPairs/items/properties/reason/maxLength", instanceLocation: "#/presentation/interactive/views/"+kk+"forbiddenGroupPairs/"+qq+"/reason" }]
              return false
            }
            if (data.presentation.interactive.views[kk].forbiddenGroupPairs[qq].reason.length < 1 || stringLength(data.presentation.interactive.views[kk].forbiddenGroupPairs[qq].reason) < 1) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/forbiddenGroupPairs/items/properties/reason/minLength", instanceLocation: "#/presentation/interactive/views/"+kk+"forbiddenGroupPairs/"+qq+"/reason" }]
              return false
            }
            if (!(pattern1.test(data.presentation.interactive.views[kk].forbiddenGroupPairs[qq].reason))) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/forbiddenGroupPairs/items/properties/reason/pattern", instanceLocation: "#/presentation/interactive/views/"+kk+"forbiddenGroupPairs/"+qq+"/reason" }]
              return false
            }
            for (const key24 of Object.keys(data.presentation.interactive.views[kk].forbiddenGroupPairs[qq])) {
              if (key24 !== "members" && key24 !== "reason") {
                validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/forbiddenGroupPairs/items/additionalProperties", instanceLocation: "#/presentation/interactive/views/"+kk+"forbiddenGroupPairs/"+qq+"/"+pointerPart(key24) }]
                return false
              }
            }
          }
        }
      }
      for (const key25 of Object.keys(data.presentation.interactive.views[kk])) {
        if (key25 !== "id" && key25 !== "questions" && key25 !== "form" && key25 !== "groups" && key25 !== "forbiddenGroupPairs") {
          validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/additionalProperties", instanceLocation: "#/presentation/interactive/views/"+kk+"/"+pointerPart(key25) }]
          return false
        }
      }
    }
  }
  if ("intent" in data.presentation.interactive && hasOwn(data.presentation.interactive, "intent")) {
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
  }
  if ("appearance" in data.presentation.interactive && hasOwn(data.presentation.interactive, "appearance")) {
    if (!(typeof data.presentation.interactive.appearance === "object" && data.presentation.interactive.appearance && !Array.isArray(data.presentation.interactive.appearance))) {
      validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/appearance/type", instanceLocation: "#/presentation/interactive/appearance" }]
      return false
    }
    if (!("style" in data.presentation.interactive.appearance && hasOwn(data.presentation.interactive.appearance, "style"))) {
      validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/appearance/required", instanceLocation: "#/presentation/interactive/appearance/style" }]
      return false
    }
    if (!("theme" in data.presentation.interactive.appearance && hasOwn(data.presentation.interactive.appearance, "theme"))) {
      validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/appearance/required", instanceLocation: "#/presentation/interactive/appearance/theme" }]
      return false
    }
    if (!(data.presentation.interactive.appearance.style === "editorial" || data.presentation.interactive.appearance.style === "blueprint" || data.presentation.interactive.appearance.style === "classic" || data.presentation.interactive.appearance.style === "signal-flow")) {
      validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/appearance/properties/style/enum", instanceLocation: "#/presentation/interactive/appearance/style" }]
      return false
    }
    if (!(data.presentation.interactive.appearance.theme === "light" || data.presentation.interactive.appearance.theme === "dark")) {
      validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/appearance/properties/theme/enum", instanceLocation: "#/presentation/interactive/appearance/theme" }]
      return false
    }
    for (const key26 of Object.keys(data.presentation.interactive.appearance)) {
      if (key26 !== "style" && key26 !== "theme") {
        validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/appearance/additionalProperties", instanceLocation: "#/presentation/interactive/appearance/"+pointerPart(key26) }]
        return false
      }
    }
  }
  for (const key27 of Object.keys(data.presentation.interactive)) {
    if (key27 !== "views" && key27 !== "intent" && key27 !== "appearance") {
      validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/additionalProperties", instanceLocation: "#/presentation/interactive/"+pointerPart(key27) }]
      return false
    }
  }
  for (const key28 of Object.keys(data.presentation)) {
    if (key28 !== "static" && key28 !== "interactive") {
      validate.errors = [{ keywordLocation: "#/properties/presentation/additionalProperties", instanceLocation: "#/presentation/"+pointerPart(key28) }]
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
    const sub2 = (() => {
      if (!(typeof data.visualPolicy.override === "string")) return false
      if (data.visualPolicy.override.length > 2048 && stringLength(data.visualPolicy.override) > 2048) return false
      if (data.visualPolicy.override.length < 1 || stringLength(data.visualPolicy.override) < 1) return false
      if (!pattern2.test(data.visualPolicy.override)) return false
      return true
    })()
    if (!sub2) {
      const sub3 = (() => {
        if (!(data.visualPolicy.override === null)) return false
        return true
      })()
      if (!sub3) {
        validate.errors = [{ keywordLocation: "#/properties/visualPolicy/properties/override/anyOf", instanceLocation: "#/visualPolicy/override" }]
        return false
      }
    }
  }
  if ("figureTypes" in data.visualPolicy && hasOwn(data.visualPolicy, "figureTypes")) {
    if (!(typeof data.visualPolicy.figureTypes === "object" && data.visualPolicy.figureTypes && !Array.isArray(data.visualPolicy.figureTypes))) {
      validate.errors = [{ keywordLocation: "#/properties/visualPolicy/properties/figureTypes/type", instanceLocation: "#/visualPolicy/figureTypes" }]
      return false
    }
    if (Object.keys(data.visualPolicy.figureTypes).length > 512) {
      validate.errors = [{ keywordLocation: "#/properties/visualPolicy/properties/figureTypes/maxProperties", instanceLocation: "#/visualPolicy/figureTypes" }]
      return false
    }
    if (Object.keys(data.visualPolicy.figureTypes).length < 1) {
      validate.errors = [{ keywordLocation: "#/properties/visualPolicy/properties/figureTypes/minProperties", instanceLocation: "#/visualPolicy/figureTypes" }]
      return false
    }
    for (const key29 of Object.keys(data.visualPolicy.figureTypes)) {
      if (key29.length > 2048 && stringLength(key29) > 2048) {
        validate.errors = [{ keywordLocation: "#/properties/visualPolicy/properties/figureTypes/propertyNames/maxLength", instanceLocation: "#/visualPolicy/figureTypes/"+pointerPart(key29) }]
        return false
      }
      if (key29.length < 1 || stringLength(key29) < 1) {
        validate.errors = [{ keywordLocation: "#/properties/visualPolicy/properties/figureTypes/propertyNames/minLength", instanceLocation: "#/visualPolicy/figureTypes/"+pointerPart(key29) }]
        return false
      }
      if (!pattern1.test(key29)) {
        validate.errors = [{ keywordLocation: "#/properties/visualPolicy/properties/figureTypes/propertyNames/pattern", instanceLocation: "#/visualPolicy/figureTypes/"+pointerPart(key29) }]
        return false
      }
    }
    for (const key30 of Object.keys(data.visualPolicy.figureTypes)) {
      if (data.visualPolicy.figureTypes[key30] !== undefined) {
        if (!(typeof data.visualPolicy.figureTypes[key30] === "string")) {
          validate.errors = [{ keywordLocation: "#/properties/visualPolicy/properties/figureTypes/additionalProperties/type", instanceLocation: "#/visualPolicy/figureTypes/"+pointerPart(key30) }]
          return false
        }
        if (!(pattern3.test(data.visualPolicy.figureTypes[key30]))) {
          validate.errors = [{ keywordLocation: "#/properties/visualPolicy/properties/figureTypes/additionalProperties/pattern", instanceLocation: "#/visualPolicy/figureTypes/"+pointerPart(key30) }]
          return false
        }
      }
    }
  }
  if ("fonts" in data.visualPolicy && hasOwn(data.visualPolicy, "fonts")) {
    if (!Array.isArray(data.visualPolicy.fonts)) {
      validate.errors = [{ keywordLocation: "#/properties/visualPolicy/properties/fonts/type", instanceLocation: "#/visualPolicy/fonts" }]
      return false
    }
    if (data.visualPolicy.fonts.length > 16) {
      validate.errors = [{ keywordLocation: "#/properties/visualPolicy/properties/fonts/maxItems", instanceLocation: "#/visualPolicy/fonts" }]
      return false
    }
    if (data.visualPolicy.fonts.length < 1) {
      validate.errors = [{ keywordLocation: "#/properties/visualPolicy/properties/fonts/minItems", instanceLocation: "#/visualPolicy/fonts" }]
      return false
    }
    for (let ss = 0; ss < data.visualPolicy.fonts.length; ss++) {
      if (ss in data.visualPolicy.fonts && hasOwn(data.visualPolicy.fonts, ss)) {
        if (!(typeof data.visualPolicy.fonts[ss] === "object" && data.visualPolicy.fonts[ss] && !Array.isArray(data.visualPolicy.fonts[ss]))) {
          validate.errors = [{ keywordLocation: "#/properties/visualPolicy/properties/fonts/items/type", instanceLocation: "#/visualPolicy/fonts/"+ss }]
          return false
        }
        if (!("id" in data.visualPolicy.fonts[ss] && hasOwn(data.visualPolicy.fonts[ss], "id"))) {
          validate.errors = [{ keywordLocation: "#/properties/visualPolicy/properties/fonts/items/required", instanceLocation: "#/visualPolicy/fonts/"+ss+"/id" }]
          return false
        }
        if (!("family" in data.visualPolicy.fonts[ss] && hasOwn(data.visualPolicy.fonts[ss], "family"))) {
          validate.errors = [{ keywordLocation: "#/properties/visualPolicy/properties/fonts/items/required", instanceLocation: "#/visualPolicy/fonts/"+ss+"/family" }]
          return false
        }
        if (!("faces" in data.visualPolicy.fonts[ss] && hasOwn(data.visualPolicy.fonts[ss], "faces"))) {
          validate.errors = [{ keywordLocation: "#/properties/visualPolicy/properties/fonts/items/required", instanceLocation: "#/visualPolicy/fonts/"+ss+"/faces" }]
          return false
        }
        if (!("distribution" in data.visualPolicy.fonts[ss] && hasOwn(data.visualPolicy.fonts[ss], "distribution"))) {
          validate.errors = [{ keywordLocation: "#/properties/visualPolicy/properties/fonts/items/required", instanceLocation: "#/visualPolicy/fonts/"+ss+"/distribution" }]
          return false
        }
        if (!(typeof data.visualPolicy.fonts[ss].id === "string")) {
          validate.errors = [{ keywordLocation: "#/properties/visualPolicy/properties/fonts/items/properties/id/type", instanceLocation: "#/visualPolicy/fonts/"+ss+"/id" }]
          return false
        }
        if (!(pattern0.test(data.visualPolicy.fonts[ss].id))) {
          validate.errors = [{ keywordLocation: "#/properties/visualPolicy/properties/fonts/items/properties/id/pattern", instanceLocation: "#/visualPolicy/fonts/"+ss+"/id" }]
          return false
        }
        if (!(typeof data.visualPolicy.fonts[ss].family === "string")) {
          validate.errors = [{ keywordLocation: "#/properties/visualPolicy/properties/fonts/items/properties/family/type", instanceLocation: "#/visualPolicy/fonts/"+ss+"/family" }]
          return false
        }
        if (data.visualPolicy.fonts[ss].family.length > 128 && stringLength(data.visualPolicy.fonts[ss].family) > 128) {
          validate.errors = [{ keywordLocation: "#/properties/visualPolicy/properties/fonts/items/properties/family/maxLength", instanceLocation: "#/visualPolicy/fonts/"+ss+"/family" }]
          return false
        }
        if (data.visualPolicy.fonts[ss].family.length < 1 || stringLength(data.visualPolicy.fonts[ss].family) < 1) {
          validate.errors = [{ keywordLocation: "#/properties/visualPolicy/properties/fonts/items/properties/family/minLength", instanceLocation: "#/visualPolicy/fonts/"+ss+"/family" }]
          return false
        }
        if (!(pattern1.test(data.visualPolicy.fonts[ss].family))) {
          validate.errors = [{ keywordLocation: "#/properties/visualPolicy/properties/fonts/items/properties/family/pattern", instanceLocation: "#/visualPolicy/fonts/"+ss+"/family" }]
          return false
        }
        if (!(Array.isArray(data.visualPolicy.fonts[ss].faces))) {
          validate.errors = [{ keywordLocation: "#/properties/visualPolicy/properties/fonts/items/properties/faces/type", instanceLocation: "#/visualPolicy/fonts/"+ss+"/faces" }]
          return false
        }
        if (data.visualPolicy.fonts[ss].faces.length > 4) {
          validate.errors = [{ keywordLocation: "#/properties/visualPolicy/properties/fonts/items/properties/faces/maxItems", instanceLocation: "#/visualPolicy/fonts/"+ss+"/faces" }]
          return false
        }
        if (data.visualPolicy.fonts[ss].faces.length < 1) {
          validate.errors = [{ keywordLocation: "#/properties/visualPolicy/properties/fonts/items/properties/faces/minItems", instanceLocation: "#/visualPolicy/fonts/"+ss+"/faces" }]
          return false
        }
        for (let tt = 0; tt < data.visualPolicy.fonts[ss].faces.length; tt++) {
          if (tt in data.visualPolicy.fonts[ss].faces && hasOwn(data.visualPolicy.fonts[ss].faces, tt)) {
            if (!(typeof data.visualPolicy.fonts[ss].faces[tt] === "object" && data.visualPolicy.fonts[ss].faces[tt] && !Array.isArray(data.visualPolicy.fonts[ss].faces[tt]))) {
              validate.errors = [{ keywordLocation: "#/properties/visualPolicy/properties/fonts/items/properties/faces/items/type", instanceLocation: "#/visualPolicy/fonts/"+ss+"faces/"+tt }]
              return false
            }
            if (!("weight" in data.visualPolicy.fonts[ss].faces[tt] && hasOwn(data.visualPolicy.fonts[ss].faces[tt], "weight"))) {
              validate.errors = [{ keywordLocation: "#/properties/visualPolicy/properties/fonts/items/properties/faces/items/required", instanceLocation: "#/visualPolicy/fonts/"+ss+"faces/"+tt+"/weight" }]
              return false
            }
            if (!("ref" in data.visualPolicy.fonts[ss].faces[tt] && hasOwn(data.visualPolicy.fonts[ss].faces[tt], "ref"))) {
              validate.errors = [{ keywordLocation: "#/properties/visualPolicy/properties/fonts/items/properties/faces/items/required", instanceLocation: "#/visualPolicy/fonts/"+ss+"faces/"+tt+"/ref" }]
              return false
            }
            if (!("sha256" in data.visualPolicy.fonts[ss].faces[tt] && hasOwn(data.visualPolicy.fonts[ss].faces[tt], "sha256"))) {
              validate.errors = [{ keywordLocation: "#/properties/visualPolicy/properties/fonts/items/properties/faces/items/required", instanceLocation: "#/visualPolicy/fonts/"+ss+"faces/"+tt+"/sha256" }]
              return false
            }
            if (!(data.visualPolicy.fonts[ss].faces[tt].weight === "400" || data.visualPolicy.fonts[ss].faces[tt].weight === "500" || data.visualPolicy.fonts[ss].faces[tt].weight === "600" || data.visualPolicy.fonts[ss].faces[tt].weight === "700")) {
              validate.errors = [{ keywordLocation: "#/properties/visualPolicy/properties/fonts/items/properties/faces/items/properties/weight/enum", instanceLocation: "#/visualPolicy/fonts/"+ss+"faces/"+tt+"/weight" }]
              return false
            }
            if (!(typeof data.visualPolicy.fonts[ss].faces[tt].ref === "string")) {
              validate.errors = [{ keywordLocation: "#/properties/visualPolicy/properties/fonts/items/properties/faces/items/properties/ref/type", instanceLocation: "#/visualPolicy/fonts/"+ss+"faces/"+tt+"/ref" }]
              return false
            }
            if (data.visualPolicy.fonts[ss].faces[tt].ref.length > 2048 && stringLength(data.visualPolicy.fonts[ss].faces[tt].ref) > 2048) {
              validate.errors = [{ keywordLocation: "#/properties/visualPolicy/properties/fonts/items/properties/faces/items/properties/ref/maxLength", instanceLocation: "#/visualPolicy/fonts/"+ss+"faces/"+tt+"/ref" }]
              return false
            }
            if (data.visualPolicy.fonts[ss].faces[tt].ref.length < 1 || stringLength(data.visualPolicy.fonts[ss].faces[tt].ref) < 1) {
              validate.errors = [{ keywordLocation: "#/properties/visualPolicy/properties/fonts/items/properties/faces/items/properties/ref/minLength", instanceLocation: "#/visualPolicy/fonts/"+ss+"faces/"+tt+"/ref" }]
              return false
            }
            if (!(pattern2.test(data.visualPolicy.fonts[ss].faces[tt].ref))) {
              validate.errors = [{ keywordLocation: "#/properties/visualPolicy/properties/fonts/items/properties/faces/items/properties/ref/pattern", instanceLocation: "#/visualPolicy/fonts/"+ss+"faces/"+tt+"/ref" }]
              return false
            }
            if (!(typeof data.visualPolicy.fonts[ss].faces[tt].sha256 === "string")) {
              validate.errors = [{ keywordLocation: "#/properties/visualPolicy/properties/fonts/items/properties/faces/items/properties/sha256/type", instanceLocation: "#/visualPolicy/fonts/"+ss+"faces/"+tt+"/sha256" }]
              return false
            }
            if (!(pattern4.test(data.visualPolicy.fonts[ss].faces[tt].sha256))) {
              validate.errors = [{ keywordLocation: "#/properties/visualPolicy/properties/fonts/items/properties/faces/items/properties/sha256/pattern", instanceLocation: "#/visualPolicy/fonts/"+ss+"faces/"+tt+"/sha256" }]
              return false
            }
            for (const key31 of Object.keys(data.visualPolicy.fonts[ss].faces[tt])) {
              if (key31 !== "weight" && key31 !== "ref" && key31 !== "sha256") {
                validate.errors = [{ keywordLocation: "#/properties/visualPolicy/properties/fonts/items/properties/faces/items/additionalProperties", instanceLocation: "#/visualPolicy/fonts/"+ss+"faces/"+tt+"/"+pointerPart(key31) }]
                return false
              }
            }
          }
        }
        if (!(Array.isArray(data.visualPolicy.fonts[ss].distribution))) {
          validate.errors = [{ keywordLocation: "#/properties/visualPolicy/properties/fonts/items/properties/distribution/type", instanceLocation: "#/visualPolicy/fonts/"+ss+"/distribution" }]
          return false
        }
        if (data.visualPolicy.fonts[ss].distribution.length > 16) {
          validate.errors = [{ keywordLocation: "#/properties/visualPolicy/properties/fonts/items/properties/distribution/maxItems", instanceLocation: "#/visualPolicy/fonts/"+ss+"/distribution" }]
          return false
        }
        if (data.visualPolicy.fonts[ss].distribution.length < 1) {
          validate.errors = [{ keywordLocation: "#/properties/visualPolicy/properties/fonts/items/properties/distribution/minItems", instanceLocation: "#/visualPolicy/fonts/"+ss+"/distribution" }]
          return false
        }
        for (let uu = 0; uu < data.visualPolicy.fonts[ss].distribution.length; uu++) {
          if (uu in data.visualPolicy.fonts[ss].distribution && hasOwn(data.visualPolicy.fonts[ss].distribution, uu)) {
            if (!(typeof data.visualPolicy.fonts[ss].distribution[uu] === "object" && data.visualPolicy.fonts[ss].distribution[uu] && !Array.isArray(data.visualPolicy.fonts[ss].distribution[uu]))) {
              validate.errors = [{ keywordLocation: "#/properties/visualPolicy/properties/fonts/items/properties/distribution/items/type", instanceLocation: "#/visualPolicy/fonts/"+ss+"distribution/"+uu }]
              return false
            }
            if (!("ref" in data.visualPolicy.fonts[ss].distribution[uu] && hasOwn(data.visualPolicy.fonts[ss].distribution[uu], "ref"))) {
              validate.errors = [{ keywordLocation: "#/properties/visualPolicy/properties/fonts/items/properties/distribution/items/required", instanceLocation: "#/visualPolicy/fonts/"+ss+"distribution/"+uu+"/ref" }]
              return false
            }
            if (!("sha256" in data.visualPolicy.fonts[ss].distribution[uu] && hasOwn(data.visualPolicy.fonts[ss].distribution[uu], "sha256"))) {
              validate.errors = [{ keywordLocation: "#/properties/visualPolicy/properties/fonts/items/properties/distribution/items/required", instanceLocation: "#/visualPolicy/fonts/"+ss+"distribution/"+uu+"/sha256" }]
              return false
            }
            if (!(typeof data.visualPolicy.fonts[ss].distribution[uu].ref === "string")) {
              validate.errors = [{ keywordLocation: "#/properties/visualPolicy/properties/fonts/items/properties/distribution/items/properties/ref/type", instanceLocation: "#/visualPolicy/fonts/"+ss+"distribution/"+uu+"/ref" }]
              return false
            }
            if (data.visualPolicy.fonts[ss].distribution[uu].ref.length > 2048 && stringLength(data.visualPolicy.fonts[ss].distribution[uu].ref) > 2048) {
              validate.errors = [{ keywordLocation: "#/properties/visualPolicy/properties/fonts/items/properties/distribution/items/properties/ref/maxLength", instanceLocation: "#/visualPolicy/fonts/"+ss+"distribution/"+uu+"/ref" }]
              return false
            }
            if (data.visualPolicy.fonts[ss].distribution[uu].ref.length < 1 || stringLength(data.visualPolicy.fonts[ss].distribution[uu].ref) < 1) {
              validate.errors = [{ keywordLocation: "#/properties/visualPolicy/properties/fonts/items/properties/distribution/items/properties/ref/minLength", instanceLocation: "#/visualPolicy/fonts/"+ss+"distribution/"+uu+"/ref" }]
              return false
            }
            if (!(pattern2.test(data.visualPolicy.fonts[ss].distribution[uu].ref))) {
              validate.errors = [{ keywordLocation: "#/properties/visualPolicy/properties/fonts/items/properties/distribution/items/properties/ref/pattern", instanceLocation: "#/visualPolicy/fonts/"+ss+"distribution/"+uu+"/ref" }]
              return false
            }
            if (!(typeof data.visualPolicy.fonts[ss].distribution[uu].sha256 === "string")) {
              validate.errors = [{ keywordLocation: "#/properties/visualPolicy/properties/fonts/items/properties/distribution/items/properties/sha256/type", instanceLocation: "#/visualPolicy/fonts/"+ss+"distribution/"+uu+"/sha256" }]
              return false
            }
            if (!(pattern4.test(data.visualPolicy.fonts[ss].distribution[uu].sha256))) {
              validate.errors = [{ keywordLocation: "#/properties/visualPolicy/properties/fonts/items/properties/distribution/items/properties/sha256/pattern", instanceLocation: "#/visualPolicy/fonts/"+ss+"distribution/"+uu+"/sha256" }]
              return false
            }
            for (const key32 of Object.keys(data.visualPolicy.fonts[ss].distribution[uu])) {
              if (key32 !== "ref" && key32 !== "sha256") {
                validate.errors = [{ keywordLocation: "#/properties/visualPolicy/properties/fonts/items/properties/distribution/items/additionalProperties", instanceLocation: "#/visualPolicy/fonts/"+ss+"distribution/"+uu+"/"+pointerPart(key32) }]
                return false
              }
            }
          }
        }
        for (const key33 of Object.keys(data.visualPolicy.fonts[ss])) {
          if (key33 !== "id" && key33 !== "family" && key33 !== "faces" && key33 !== "distribution") {
            validate.errors = [{ keywordLocation: "#/properties/visualPolicy/properties/fonts/items/additionalProperties", instanceLocation: "#/visualPolicy/fonts/"+ss+"/"+pointerPart(key33) }]
            return false
          }
        }
      }
    }
  }
  for (const key34 of Object.keys(data.visualPolicy)) {
    if (key34 !== "profile" && key34 !== "override" && key34 !== "figureTypes" && key34 !== "fonts") {
      validate.errors = [{ keywordLocation: "#/properties/visualPolicy/additionalProperties", instanceLocation: "#/visualPolicy/"+pointerPart(key34) }]
      return false
    }
  }
  for (const key35 of Object.keys(data)) {
    if (key35 !== "schema" && key35 !== "id" && key35 !== "editor" && key35 !== "title" && key35 !== "audiences" && key35 !== "questions" && key35 !== "scope" && key35 !== "editorialAssertions" && key35 !== "omissions" && key35 !== "narrative" && key35 !== "presentation" && key35 !== "visualPolicy") {
      validate.errors = [{ keywordLocation: "#/additionalProperties", instanceLocation: "#/"+pointerPart(key35) }]
      return false
    }
  }
  return true
};
return ref0})();;
export const sceneRefinementValid = (function() {
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
const pattern2 = new RegExp("^#[0-9a-fA-F]{6}$", "u");
const pattern3 = new RegExp("^[a-f0-9]{64}$", "u");
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
  if (!("media" in data && hasOwn(data, "media"))) {
    validate.errors = [{ keywordLocation: "#/required", instanceLocation: "#/media" }]
    return false
  }
  if (!(data.schema === "architecture.scene-refinement/v1")) {
    validate.errors = [{ keywordLocation: "#/properties/schema/const", instanceLocation: "#/schema" }]
    return false
  }
  if (!(typeof data.media === "object" && data.media && !Array.isArray(data.media))) {
    validate.errors = [{ keywordLocation: "#/properties/media/type", instanceLocation: "#/media" }]
    return false
  }
  if (Object.keys(data.media).length < 1) {
    validate.errors = [{ keywordLocation: "#/properties/media/minProperties", instanceLocation: "#/media" }]
    return false
  }
  if ("static" in data.media && hasOwn(data.media, "static")) {
    let passes0 = 0
    const sub0 = (() => {
      if (!(typeof data.media.static === "object" && data.media.static && !Array.isArray(data.media.static))) return false
      if (!("view" in data.media.static && hasOwn(data.media.static, "view"))) return false
      if (!("nodes" in data.media.static && hasOwn(data.media.static, "nodes"))) return false
      if (!("edges" in data.media.static && hasOwn(data.media.static, "edges"))) return false
      if (!("groups" in data.media.static && hasOwn(data.media.static, "groups"))) return false
      if (!(typeof data.media.static.view === "string")) return false
      if (!pattern0.test(data.media.static.view)) return false
      if (!Array.isArray(data.media.static.nodes)) return false
      if (data.media.static.nodes.length > 4096) return false
      for (let i = 0; i < data.media.static.nodes.length; i++) {
        if (i in data.media.static.nodes && hasOwn(data.media.static.nodes, i)) {
          if (!(typeof data.media.static.nodes[i] === "object" && data.media.static.nodes[i] && !Array.isArray(data.media.static.nodes[i]))) return false
          if (!("namespace" in data.media.static.nodes[i] && hasOwn(data.media.static.nodes[i], "namespace"))) return false
          if (!("id" in data.media.static.nodes[i] && hasOwn(data.media.static.nodes[i], "id"))) return false
          if (!("x" in data.media.static.nodes[i] && hasOwn(data.media.static.nodes[i], "x"))) return false
          if (!("y" in data.media.static.nodes[i] && hasOwn(data.media.static.nodes[i], "y"))) return false
          if (!("width" in data.media.static.nodes[i] && hasOwn(data.media.static.nodes[i], "width"))) return false
          if (!("height" in data.media.static.nodes[i] && hasOwn(data.media.static.nodes[i], "height"))) return false
          if (!(typeof data.media.static.nodes[i].namespace === "string")) return false
          if (data.media.static.nodes[i].namespace.length > 2048 && stringLength(data.media.static.nodes[i].namespace) > 2048) return false
          if (data.media.static.nodes[i].namespace.length < 1 || stringLength(data.media.static.nodes[i].namespace) < 1) return false
          if (!(pattern1.test(data.media.static.nodes[i].namespace))) return false
          if (!(typeof data.media.static.nodes[i].id === "string")) return false
          if (data.media.static.nodes[i].id.length > 2048 && stringLength(data.media.static.nodes[i].id) > 2048) return false
          if (data.media.static.nodes[i].id.length < 1 || stringLength(data.media.static.nodes[i].id) < 1) return false
          if (!(pattern1.test(data.media.static.nodes[i].id))) return false
          if (!(typeof data.media.static.nodes[i].x === "number")) return false
          if (!(-12000 <= data.media.static.nodes[i].x)) return false
          if (!(12000 >= data.media.static.nodes[i].x)) return false
          if (!(typeof data.media.static.nodes[i].y === "number")) return false
          if (!(-12000 <= data.media.static.nodes[i].y)) return false
          if (!(12000 >= data.media.static.nodes[i].y)) return false
          if (!(typeof data.media.static.nodes[i].width === "number")) return false
          if (!(96 <= data.media.static.nodes[i].width)) return false
          if (!(12000 >= data.media.static.nodes[i].width)) return false
          if (!(typeof data.media.static.nodes[i].height === "number")) return false
          if (!(64 <= data.media.static.nodes[i].height)) return false
          if (!(12000 >= data.media.static.nodes[i].height)) return false
          for (const key0 of Object.keys(data.media.static.nodes[i])) {
            if (key0 !== "namespace" && key0 !== "id" && key0 !== "x" && key0 !== "y" && key0 !== "width" && key0 !== "height") return false
          }
        }
      }
      if (!Array.isArray(data.media.static.edges)) return false
      if (data.media.static.edges.length > 8192) return false
      for (let j = 0; j < data.media.static.edges.length; j++) {
        if (j in data.media.static.edges && hasOwn(data.media.static.edges, j)) {
          if (!(typeof data.media.static.edges[j] === "object" && data.media.static.edges[j] && !Array.isArray(data.media.static.edges[j]))) return false
          if (!("from" in data.media.static.edges[j] && hasOwn(data.media.static.edges[j], "from"))) return false
          if (!("to" in data.media.static.edges[j] && hasOwn(data.media.static.edges[j], "to"))) return false
          if (!("relations" in data.media.static.edges[j] && hasOwn(data.media.static.edges[j], "relations"))) return false
          if (!("points" in data.media.static.edges[j] && hasOwn(data.media.static.edges[j], "points"))) return false
          if (!(typeof data.media.static.edges[j].from === "object" && data.media.static.edges[j].from && !Array.isArray(data.media.static.edges[j].from))) return false
          if (!("namespace" in data.media.static.edges[j].from && hasOwn(data.media.static.edges[j].from, "namespace"))) return false
          if (!("id" in data.media.static.edges[j].from && hasOwn(data.media.static.edges[j].from, "id"))) return false
          if (!(typeof data.media.static.edges[j].from.namespace === "string")) return false
          if (data.media.static.edges[j].from.namespace.length > 2048 && stringLength(data.media.static.edges[j].from.namespace) > 2048) return false
          if (data.media.static.edges[j].from.namespace.length < 1 || stringLength(data.media.static.edges[j].from.namespace) < 1) return false
          if (!(pattern1.test(data.media.static.edges[j].from.namespace))) return false
          if (!(typeof data.media.static.edges[j].from.id === "string")) return false
          if (data.media.static.edges[j].from.id.length > 2048 && stringLength(data.media.static.edges[j].from.id) > 2048) return false
          if (data.media.static.edges[j].from.id.length < 1 || stringLength(data.media.static.edges[j].from.id) < 1) return false
          if (!(pattern1.test(data.media.static.edges[j].from.id))) return false
          for (const key1 of Object.keys(data.media.static.edges[j].from)) {
            if (key1 !== "namespace" && key1 !== "id") return false
          }
          if (!(typeof data.media.static.edges[j].to === "object" && data.media.static.edges[j].to && !Array.isArray(data.media.static.edges[j].to))) return false
          if (!("namespace" in data.media.static.edges[j].to && hasOwn(data.media.static.edges[j].to, "namespace"))) return false
          if (!("id" in data.media.static.edges[j].to && hasOwn(data.media.static.edges[j].to, "id"))) return false
          if (!(typeof data.media.static.edges[j].to.namespace === "string")) return false
          if (data.media.static.edges[j].to.namespace.length > 2048 && stringLength(data.media.static.edges[j].to.namespace) > 2048) return false
          if (data.media.static.edges[j].to.namespace.length < 1 || stringLength(data.media.static.edges[j].to.namespace) < 1) return false
          if (!(pattern1.test(data.media.static.edges[j].to.namespace))) return false
          if (!(typeof data.media.static.edges[j].to.id === "string")) return false
          if (data.media.static.edges[j].to.id.length > 2048 && stringLength(data.media.static.edges[j].to.id) > 2048) return false
          if (data.media.static.edges[j].to.id.length < 1 || stringLength(data.media.static.edges[j].to.id) < 1) return false
          if (!(pattern1.test(data.media.static.edges[j].to.id))) return false
          for (const key2 of Object.keys(data.media.static.edges[j].to)) {
            if (key2 !== "namespace" && key2 !== "id") return false
          }
          if (!(Array.isArray(data.media.static.edges[j].relations))) return false
          if (data.media.static.edges[j].relations.length > 2048) return false
          if (data.media.static.edges[j].relations.length < 1) return false
          for (let k = 0; k < data.media.static.edges[j].relations.length; k++) {
            if (k in data.media.static.edges[j].relations && hasOwn(data.media.static.edges[j].relations, k)) {
              if (!(typeof data.media.static.edges[j].relations[k] === "object" && data.media.static.edges[j].relations[k] && !Array.isArray(data.media.static.edges[j].relations[k]))) return false
              if (!("namespace" in data.media.static.edges[j].relations[k] && hasOwn(data.media.static.edges[j].relations[k], "namespace"))) return false
              if (!("reference" in data.media.static.edges[j].relations[k] && hasOwn(data.media.static.edges[j].relations[k], "reference"))) return false
              if (!(typeof data.media.static.edges[j].relations[k].namespace === "string")) return false
              if (data.media.static.edges[j].relations[k].namespace.length > 2048 && stringLength(data.media.static.edges[j].relations[k].namespace) > 2048) return false
              if (data.media.static.edges[j].relations[k].namespace.length < 1 || stringLength(data.media.static.edges[j].relations[k].namespace) < 1) return false
              if (!(pattern1.test(data.media.static.edges[j].relations[k].namespace))) return false
              if (!(typeof data.media.static.edges[j].relations[k].reference === "string")) return false
              if (data.media.static.edges[j].relations[k].reference.length > 2048 && stringLength(data.media.static.edges[j].relations[k].reference) > 2048) return false
              if (data.media.static.edges[j].relations[k].reference.length < 1 || stringLength(data.media.static.edges[j].relations[k].reference) < 1) return false
              if (!(pattern1.test(data.media.static.edges[j].relations[k].reference))) return false
              for (const key3 of Object.keys(data.media.static.edges[j].relations[k])) {
                if (key3 !== "namespace" && key3 !== "reference") return false
              }
            }
          }
          if (!(Array.isArray(data.media.static.edges[j].points))) return false
          if (data.media.static.edges[j].points.length > 2048) return false
          if (data.media.static.edges[j].points.length < 2) return false
          for (let l = 0; l < data.media.static.edges[j].points.length; l++) {
            if (l in data.media.static.edges[j].points && hasOwn(data.media.static.edges[j].points, l)) {
              if (!(Array.isArray(data.media.static.edges[j].points[l]))) return false
              if (data.media.static.edges[j].points[l].length > 2) return false
              if (data.media.static.edges[j].points[l].length < 2) return false
              for (let m = 0; m < data.media.static.edges[j].points[l].length; m++) {
                if (m in data.media.static.edges[j].points[l] && hasOwn(data.media.static.edges[j].points[l], m)) {
                  if (!(typeof data.media.static.edges[j].points[l][m] === "number")) return false
                  if (!(-12000 <= data.media.static.edges[j].points[l][m])) return false
                  if (!(12000 >= data.media.static.edges[j].points[l][m])) return false
                }
              }
            }
          }
          for (const key4 of Object.keys(data.media.static.edges[j])) {
            if (key4 !== "from" && key4 !== "to" && key4 !== "relations" && key4 !== "points") return false
          }
        }
      }
      if (!Array.isArray(data.media.static.groups)) return false
      if (data.media.static.groups.length > 256) return false
      for (let n = 0; n < data.media.static.groups.length; n++) {
        if (n in data.media.static.groups && hasOwn(data.media.static.groups, n)) {
          if (!(typeof data.media.static.groups[n] === "object" && data.media.static.groups[n] && !Array.isArray(data.media.static.groups[n]))) return false
          if (!("id" in data.media.static.groups[n] && hasOwn(data.media.static.groups[n], "id"))) return false
          if (!("x" in data.media.static.groups[n] && hasOwn(data.media.static.groups[n], "x"))) return false
          if (!("y" in data.media.static.groups[n] && hasOwn(data.media.static.groups[n], "y"))) return false
          if (!("width" in data.media.static.groups[n] && hasOwn(data.media.static.groups[n], "width"))) return false
          if (!("height" in data.media.static.groups[n] && hasOwn(data.media.static.groups[n], "height"))) return false
          if (!(typeof data.media.static.groups[n].id === "string")) return false
          if (!(pattern0.test(data.media.static.groups[n].id))) return false
          if (!(typeof data.media.static.groups[n].x === "number")) return false
          if (!(-12000 <= data.media.static.groups[n].x)) return false
          if (!(12000 >= data.media.static.groups[n].x)) return false
          if (!(typeof data.media.static.groups[n].y === "number")) return false
          if (!(-12000 <= data.media.static.groups[n].y)) return false
          if (!(12000 >= data.media.static.groups[n].y)) return false
          if (!(typeof data.media.static.groups[n].width === "number")) return false
          if (!(0 < data.media.static.groups[n].width)) return false
          if (!(12000 >= data.media.static.groups[n].width)) return false
          if (!(typeof data.media.static.groups[n].height === "number")) return false
          if (!(0 < data.media.static.groups[n].height)) return false
          if (!(12000 >= data.media.static.groups[n].height)) return false
          for (const key5 of Object.keys(data.media.static.groups[n])) {
            if (key5 !== "id" && key5 !== "x" && key5 !== "y" && key5 !== "width" && key5 !== "height") return false
          }
        }
      }
      for (const key6 of Object.keys(data.media.static)) {
        if (key6 !== "view" && key6 !== "nodes" && key6 !== "edges" && key6 !== "groups") return false
      }
      return true
    })()
    if (sub0) passes0++
    const sub1 = (() => {
      if (!(typeof data.media.static === "object" && data.media.static && !Array.isArray(data.media.static))) return false
      if (!("kind" in data.media.static && hasOwn(data.media.static, "kind"))) return false
      if (!("scene" in data.media.static && hasOwn(data.media.static, "scene"))) return false
      if (!(data.media.static.kind === "authored-canvas")) return false
      if ("font" in data.media.static && hasOwn(data.media.static, "font")) {
        if (!(typeof data.media.static.font === "string")) return false
        if (!pattern0.test(data.media.static.font)) return false
      }
      if (!(typeof data.media.static.scene === "object" && data.media.static.scene && !Array.isArray(data.media.static.scene))) return false
      if (!("schema" in data.media.static.scene && hasOwn(data.media.static.scene, "schema"))) return false
      if (!("title" in data.media.static.scene && hasOwn(data.media.static.scene, "title"))) return false
      if (!("subtitle" in data.media.static.scene && hasOwn(data.media.static.scene, "subtitle"))) return false
      if (!("width" in data.media.static.scene && hasOwn(data.media.static.scene, "width"))) return false
      if (!("height" in data.media.static.scene && hasOwn(data.media.static.scene, "height"))) return false
      if (!("referenceWidth" in data.media.static.scene && hasOwn(data.media.static.scene, "referenceWidth"))) return false
      if (!("spine" in data.media.static.scene && hasOwn(data.media.static.scene, "spine"))) return false
      if (!("paint" in data.media.static.scene && hasOwn(data.media.static.scene, "paint"))) return false
      if (!("nodes" in data.media.static.scene && hasOwn(data.media.static.scene, "nodes"))) return false
      if (!("texts" in data.media.static.scene && hasOwn(data.media.static.scene, "texts"))) return false
      if (!("edges" in data.media.static.scene && hasOwn(data.media.static.scene, "edges"))) return false
      if (!("decorations" in data.media.static.scene && hasOwn(data.media.static.scene, "decorations"))) return false
      if (!("requiredSemanticIds" in data.media.static.scene && hasOwn(data.media.static.scene, "requiredSemanticIds"))) return false
      if (!(data.media.static.scene.schema === "architecture.authored-static-scene/v1")) return false
      if (!(typeof data.media.static.scene.title === "string")) return false
      if (data.media.static.scene.title.length > 2048 && stringLength(data.media.static.scene.title) > 2048) return false
      if (data.media.static.scene.title.length < 1 || stringLength(data.media.static.scene.title) < 1) return false
      if (!pattern1.test(data.media.static.scene.title)) return false
      if (!(typeof data.media.static.scene.subtitle === "string")) return false
      if (data.media.static.scene.subtitle.length > 2048 && stringLength(data.media.static.scene.subtitle) > 2048) return false
      if (data.media.static.scene.subtitle.length < 1 || stringLength(data.media.static.scene.subtitle) < 1) return false
      if (!pattern1.test(data.media.static.scene.subtitle)) return false
      if ("description" in data.media.static.scene && hasOwn(data.media.static.scene, "description")) {
        if (!(typeof data.media.static.scene.description === "string")) return false
        if (data.media.static.scene.description.length > 2048 && stringLength(data.media.static.scene.description) > 2048) return false
        if (data.media.static.scene.description.length < 1 || stringLength(data.media.static.scene.description) < 1) return false
        if (!pattern1.test(data.media.static.scene.description)) return false
      }
      if (!(typeof data.media.static.scene.width === "number")) return false
      if (!(320 <= data.media.static.scene.width)) return false
      if (!(12000 >= data.media.static.scene.width)) return false
      if (!(typeof data.media.static.scene.height === "number")) return false
      if (!(320 <= data.media.static.scene.height)) return false
      if (!(12000 >= data.media.static.scene.height)) return false
      if (!(typeof data.media.static.scene.referenceWidth === "number")) return false
      if (!(320 <= data.media.static.scene.referenceWidth)) return false
      if (!(12000 >= data.media.static.scene.referenceWidth)) return false
      if (!Array.isArray(data.media.static.scene.spine)) return false
      if (data.media.static.scene.spine.length > 512) return false
      for (let o = 0; o < data.media.static.scene.spine.length; o++) {
        if (o in data.media.static.scene.spine && hasOwn(data.media.static.scene.spine, o)) {
          if (!(typeof data.media.static.scene.spine[o] === "string")) return false
          if (!(pattern0.test(data.media.static.scene.spine[o]))) return false
        }
      }
      if (!unique(data.media.static.scene.spine)) return false
      if (!(typeof data.media.static.scene.paint === "object" && data.media.static.scene.paint && !Array.isArray(data.media.static.scene.paint))) return false
      if (Object.keys(data.media.static.scene.paint).length > 32) return false
      if (Object.keys(data.media.static.scene.paint).length < 1) return false
      if (!("paper" in data.media.static.scene.paint && hasOwn(data.media.static.scene.paint, "paper"))) return false
      for (const key7 of Object.keys(data.media.static.scene.paint)) {
        if (pattern0.test(key7)) {
          if (data.media.static.scene.paint[key7] !== undefined) {
            if (!(typeof data.media.static.scene.paint[key7] === "string")) return false
            if (!(pattern2.test(data.media.static.scene.paint[key7]))) return false
          }
        }
      }
      for (const key8 of Object.keys(data.media.static.scene.paint)) {
        if (!pattern0.test(key8)) return false
      }
      if (!Array.isArray(data.media.static.scene.nodes)) return false
      if (data.media.static.scene.nodes.length > 512) return false
      for (let p = 0; p < data.media.static.scene.nodes.length; p++) {
        if (p in data.media.static.scene.nodes && hasOwn(data.media.static.scene.nodes, p)) {
          let passes1 = 0
          const sub2 = (() => {
            if (!(typeof data.media.static.scene.nodes[p] === "object" && data.media.static.scene.nodes[p] && !Array.isArray(data.media.static.scene.nodes[p]))) return false
            if (!("id" in data.media.static.scene.nodes[p] && hasOwn(data.media.static.scene.nodes[p], "id"))) return false
            if (!("kind" in data.media.static.scene.nodes[p] && hasOwn(data.media.static.scene.nodes[p], "kind"))) return false
            if (!("tone" in data.media.static.scene.nodes[p] && hasOwn(data.media.static.scene.nodes[p], "tone"))) return false
            if (!("center" in data.media.static.scene.nodes[p] && hasOwn(data.media.static.scene.nodes[p], "center"))) return false
            if (!("radius" in data.media.static.scene.nodes[p] && hasOwn(data.media.static.scene.nodes[p], "radius"))) return false
            if (!("box" in data.media.static.scene.nodes[p] && hasOwn(data.media.static.scene.nodes[p], "box"))) return false
            if (!("paintBox" in data.media.static.scene.nodes[p] && hasOwn(data.media.static.scene.nodes[p], "paintBox"))) return false
            if (!("strokeWidth" in data.media.static.scene.nodes[p] && hasOwn(data.media.static.scene.nodes[p], "strokeWidth"))) return false
            if (!("semanticIds" in data.media.static.scene.nodes[p] && hasOwn(data.media.static.scene.nodes[p], "semanticIds"))) return false
            if (!(typeof data.media.static.scene.nodes[p].id === "string")) return false
            if (!(pattern0.test(data.media.static.scene.nodes[p].id))) return false
            if (!(typeof data.media.static.scene.nodes[p].kind === "string")) return false
            if (data.media.static.scene.nodes[p].kind.length > 2048 && stringLength(data.media.static.scene.nodes[p].kind) > 2048) return false
            if (data.media.static.scene.nodes[p].kind.length < 1 || stringLength(data.media.static.scene.nodes[p].kind) < 1) return false
            if (!(pattern1.test(data.media.static.scene.nodes[p].kind))) return false
            if (!(typeof data.media.static.scene.nodes[p].tone === "string")) return false
            if (!(pattern0.test(data.media.static.scene.nodes[p].tone))) return false
            if (!(typeof data.media.static.scene.nodes[p].center === "object" && data.media.static.scene.nodes[p].center && !Array.isArray(data.media.static.scene.nodes[p].center))) return false
            if (!("x" in data.media.static.scene.nodes[p].center && hasOwn(data.media.static.scene.nodes[p].center, "x"))) return false
            if (!("y" in data.media.static.scene.nodes[p].center && hasOwn(data.media.static.scene.nodes[p].center, "y"))) return false
            if (!(typeof data.media.static.scene.nodes[p].center.x === "number")) return false
            if (!(-12000 <= data.media.static.scene.nodes[p].center.x)) return false
            if (!(12000 >= data.media.static.scene.nodes[p].center.x)) return false
            if (!(typeof data.media.static.scene.nodes[p].center.y === "number")) return false
            if (!(-12000 <= data.media.static.scene.nodes[p].center.y)) return false
            if (!(12000 >= data.media.static.scene.nodes[p].center.y)) return false
            for (const key9 of Object.keys(data.media.static.scene.nodes[p].center)) {
              if (key9 !== "x" && key9 !== "y") return false
            }
            if (!(typeof data.media.static.scene.nodes[p].radius === "number")) return false
            if (!(0 < data.media.static.scene.nodes[p].radius)) return false
            if (!(12000 >= data.media.static.scene.nodes[p].radius)) return false
            if (!(typeof data.media.static.scene.nodes[p].box === "object" && data.media.static.scene.nodes[p].box && !Array.isArray(data.media.static.scene.nodes[p].box))) return false
            if (!("x" in data.media.static.scene.nodes[p].box && hasOwn(data.media.static.scene.nodes[p].box, "x"))) return false
            if (!("y" in data.media.static.scene.nodes[p].box && hasOwn(data.media.static.scene.nodes[p].box, "y"))) return false
            if (!("width" in data.media.static.scene.nodes[p].box && hasOwn(data.media.static.scene.nodes[p].box, "width"))) return false
            if (!("height" in data.media.static.scene.nodes[p].box && hasOwn(data.media.static.scene.nodes[p].box, "height"))) return false
            if (!(typeof data.media.static.scene.nodes[p].box.x === "number")) return false
            if (!(-12000 <= data.media.static.scene.nodes[p].box.x)) return false
            if (!(12000 >= data.media.static.scene.nodes[p].box.x)) return false
            if (!(typeof data.media.static.scene.nodes[p].box.y === "number")) return false
            if (!(-12000 <= data.media.static.scene.nodes[p].box.y)) return false
            if (!(12000 >= data.media.static.scene.nodes[p].box.y)) return false
            if (!(typeof data.media.static.scene.nodes[p].box.width === "number")) return false
            if (!(0 < data.media.static.scene.nodes[p].box.width)) return false
            if (!(12000 >= data.media.static.scene.nodes[p].box.width)) return false
            if (!(typeof data.media.static.scene.nodes[p].box.height === "number")) return false
            if (!(0 < data.media.static.scene.nodes[p].box.height)) return false
            if (!(12000 >= data.media.static.scene.nodes[p].box.height)) return false
            for (const key10 of Object.keys(data.media.static.scene.nodes[p].box)) {
              if (key10 !== "x" && key10 !== "y" && key10 !== "width" && key10 !== "height") return false
            }
            if (!(typeof data.media.static.scene.nodes[p].paintBox === "object" && data.media.static.scene.nodes[p].paintBox && !Array.isArray(data.media.static.scene.nodes[p].paintBox))) return false
            if (!("x" in data.media.static.scene.nodes[p].paintBox && hasOwn(data.media.static.scene.nodes[p].paintBox, "x"))) return false
            if (!("y" in data.media.static.scene.nodes[p].paintBox && hasOwn(data.media.static.scene.nodes[p].paintBox, "y"))) return false
            if (!("width" in data.media.static.scene.nodes[p].paintBox && hasOwn(data.media.static.scene.nodes[p].paintBox, "width"))) return false
            if (!("height" in data.media.static.scene.nodes[p].paintBox && hasOwn(data.media.static.scene.nodes[p].paintBox, "height"))) return false
            if (!(typeof data.media.static.scene.nodes[p].paintBox.x === "number")) return false
            if (!(-12000 <= data.media.static.scene.nodes[p].paintBox.x)) return false
            if (!(12000 >= data.media.static.scene.nodes[p].paintBox.x)) return false
            if (!(typeof data.media.static.scene.nodes[p].paintBox.y === "number")) return false
            if (!(-12000 <= data.media.static.scene.nodes[p].paintBox.y)) return false
            if (!(12000 >= data.media.static.scene.nodes[p].paintBox.y)) return false
            if (!(typeof data.media.static.scene.nodes[p].paintBox.width === "number")) return false
            if (!(0 < data.media.static.scene.nodes[p].paintBox.width)) return false
            if (!(12000 >= data.media.static.scene.nodes[p].paintBox.width)) return false
            if (!(typeof data.media.static.scene.nodes[p].paintBox.height === "number")) return false
            if (!(0 < data.media.static.scene.nodes[p].paintBox.height)) return false
            if (!(12000 >= data.media.static.scene.nodes[p].paintBox.height)) return false
            for (const key11 of Object.keys(data.media.static.scene.nodes[p].paintBox)) {
              if (key11 !== "x" && key11 !== "y" && key11 !== "width" && key11 !== "height") return false
            }
            if (!(typeof data.media.static.scene.nodes[p].strokeWidth === "number")) return false
            if (!(0 <= data.media.static.scene.nodes[p].strokeWidth)) return false
            if (!(100 >= data.media.static.scene.nodes[p].strokeWidth)) return false
            if (!(Array.isArray(data.media.static.scene.nodes[p].semanticIds))) return false
            if (data.media.static.scene.nodes[p].semanticIds.length > 4096) return false
            if (data.media.static.scene.nodes[p].semanticIds.length < 1) return false
            for (let q = 0; q < data.media.static.scene.nodes[p].semanticIds.length; q++) {
              if (q in data.media.static.scene.nodes[p].semanticIds && hasOwn(data.media.static.scene.nodes[p].semanticIds, q)) {
                if (!(typeof data.media.static.scene.nodes[p].semanticIds[q] === "string")) return false
                if (data.media.static.scene.nodes[p].semanticIds[q].length > 2048 && stringLength(data.media.static.scene.nodes[p].semanticIds[q]) > 2048) return false
                if (data.media.static.scene.nodes[p].semanticIds[q].length < 1 || stringLength(data.media.static.scene.nodes[p].semanticIds[q]) < 1) return false
                if (!(pattern1.test(data.media.static.scene.nodes[p].semanticIds[q]))) return false
              }
            }
            if (!unique(data.media.static.scene.nodes[p].semanticIds)) return false
            for (const key12 of Object.keys(data.media.static.scene.nodes[p])) {
              if (key12 !== "id" && key12 !== "kind" && key12 !== "tone" && key12 !== "center" && key12 !== "radius" && key12 !== "box" && key12 !== "paintBox" && key12 !== "strokeWidth" && key12 !== "semanticIds") return false
            }
            return true
          })()
          if (sub2) passes1++
          const sub3 = (() => {
            if (!(typeof data.media.static.scene.nodes[p] === "object" && data.media.static.scene.nodes[p] && !Array.isArray(data.media.static.scene.nodes[p]))) return false
            if (!("id" in data.media.static.scene.nodes[p] && hasOwn(data.media.static.scene.nodes[p], "id"))) return false
            if (!("box" in data.media.static.scene.nodes[p] && hasOwn(data.media.static.scene.nodes[p], "box"))) return false
            if (!("semanticIds" in data.media.static.scene.nodes[p] && hasOwn(data.media.static.scene.nodes[p], "semanticIds"))) return false
            if (!("primitives" in data.media.static.scene.nodes[p] && hasOwn(data.media.static.scene.nodes[p], "primitives"))) return false
            if (!(typeof data.media.static.scene.nodes[p].id === "string")) return false
            if (!(pattern0.test(data.media.static.scene.nodes[p].id))) return false
            if (!(Array.isArray(data.media.static.scene.nodes[p].semanticIds))) return false
            if (data.media.static.scene.nodes[p].semanticIds.length > 4096) return false
            for (let r = 0; r < data.media.static.scene.nodes[p].semanticIds.length; r++) {
              if (r in data.media.static.scene.nodes[p].semanticIds && hasOwn(data.media.static.scene.nodes[p].semanticIds, r)) {
                if (!(typeof data.media.static.scene.nodes[p].semanticIds[r] === "string")) return false
                if (data.media.static.scene.nodes[p].semanticIds[r].length > 2048 && stringLength(data.media.static.scene.nodes[p].semanticIds[r]) > 2048) return false
                if (data.media.static.scene.nodes[p].semanticIds[r].length < 1 || stringLength(data.media.static.scene.nodes[p].semanticIds[r]) < 1) return false
                if (!(pattern1.test(data.media.static.scene.nodes[p].semanticIds[r]))) return false
              }
            }
            if (!unique(data.media.static.scene.nodes[p].semanticIds)) return false
            if (!(Array.isArray(data.media.static.scene.nodes[p].primitives))) return false
            if (data.media.static.scene.nodes[p].primitives.length > 32) return false
            if (data.media.static.scene.nodes[p].primitives.length < 1) return false
            for (let s = 0; s < data.media.static.scene.nodes[p].primitives.length; s++) {
              if (s in data.media.static.scene.nodes[p].primitives && hasOwn(data.media.static.scene.nodes[p].primitives, s)) {
                let passes2 = 0
                const sub4 = (() => {
                  if (!(typeof data.media.static.scene.nodes[p].primitives[s] === "object" && data.media.static.scene.nodes[p].primitives[s] && !Array.isArray(data.media.static.scene.nodes[p].primitives[s]))) return false
                  if (!("kind" in data.media.static.scene.nodes[p].primitives[s] && hasOwn(data.media.static.scene.nodes[p].primitives[s], "kind"))) return false
                  if (!("center" in data.media.static.scene.nodes[p].primitives[s] && hasOwn(data.media.static.scene.nodes[p].primitives[s], "center"))) return false
                  if (!("radius" in data.media.static.scene.nodes[p].primitives[s] && hasOwn(data.media.static.scene.nodes[p].primitives[s], "radius"))) return false
                  if (!("fill" in data.media.static.scene.nodes[p].primitives[s] && hasOwn(data.media.static.scene.nodes[p].primitives[s], "fill"))) return false
                  if (!("stroke" in data.media.static.scene.nodes[p].primitives[s] && hasOwn(data.media.static.scene.nodes[p].primitives[s], "stroke"))) return false
                  if (!("strokeWidth" in data.media.static.scene.nodes[p].primitives[s] && hasOwn(data.media.static.scene.nodes[p].primitives[s], "strokeWidth"))) return false
                  if (!(data.media.static.scene.nodes[p].primitives[s].kind === "circle")) return false
                  if (!(typeof data.media.static.scene.nodes[p].primitives[s].center === "object" && data.media.static.scene.nodes[p].primitives[s].center && !Array.isArray(data.media.static.scene.nodes[p].primitives[s].center))) return false
                  if (!("x" in data.media.static.scene.nodes[p].primitives[s].center && hasOwn(data.media.static.scene.nodes[p].primitives[s].center, "x"))) return false
                  if (!("y" in data.media.static.scene.nodes[p].primitives[s].center && hasOwn(data.media.static.scene.nodes[p].primitives[s].center, "y"))) return false
                  if (!(typeof data.media.static.scene.nodes[p].primitives[s].center.x === "number")) return false
                  if (!(-12000 <= data.media.static.scene.nodes[p].primitives[s].center.x)) return false
                  if (!(12000 >= data.media.static.scene.nodes[p].primitives[s].center.x)) return false
                  if (!(typeof data.media.static.scene.nodes[p].primitives[s].center.y === "number")) return false
                  if (!(-12000 <= data.media.static.scene.nodes[p].primitives[s].center.y)) return false
                  if (!(12000 >= data.media.static.scene.nodes[p].primitives[s].center.y)) return false
                  for (const key13 of Object.keys(data.media.static.scene.nodes[p].primitives[s].center)) {
                    if (key13 !== "x" && key13 !== "y") return false
                  }
                  if (!(typeof data.media.static.scene.nodes[p].primitives[s].radius === "number")) return false
                  if (!(0 < data.media.static.scene.nodes[p].primitives[s].radius)) return false
                  if (!(12000 >= data.media.static.scene.nodes[p].primitives[s].radius)) return false
                  const sub5 = (() => {
                    if (!(typeof data.media.static.scene.nodes[p].primitives[s].fill === "string")) return false
                    if (!(pattern0.test(data.media.static.scene.nodes[p].primitives[s].fill))) return false
                    return true
                  })()
                  if (!sub5) {
                    const sub6 = (() => {
                      if (!(data.media.static.scene.nodes[p].primitives[s].fill === null)) return false
                      return true
                    })()
                    if (!sub6) return false
                  }
                  const sub7 = (() => {
                    if (!(typeof data.media.static.scene.nodes[p].primitives[s].stroke === "string")) return false
                    if (!(pattern0.test(data.media.static.scene.nodes[p].primitives[s].stroke))) return false
                    return true
                  })()
                  if (!sub7) {
                    const sub8 = (() => {
                      if (!(data.media.static.scene.nodes[p].primitives[s].stroke === null)) return false
                      return true
                    })()
                    if (!sub8) return false
                  }
                  if (!(typeof data.media.static.scene.nodes[p].primitives[s].strokeWidth === "number")) return false
                  if (!(0 <= data.media.static.scene.nodes[p].primitives[s].strokeWidth)) return false
                  if (!(100 >= data.media.static.scene.nodes[p].primitives[s].strokeWidth)) return false
                  for (const key14 of Object.keys(data.media.static.scene.nodes[p].primitives[s])) {
                    if (key14 !== "kind" && key14 !== "center" && key14 !== "radius" && key14 !== "fill" && key14 !== "stroke" && key14 !== "strokeWidth") return false
                  }
                  return true
                })()
                if (sub4) passes2++
                const sub9 = (() => {
                  if (!(typeof data.media.static.scene.nodes[p].primitives[s] === "object" && data.media.static.scene.nodes[p].primitives[s] && !Array.isArray(data.media.static.scene.nodes[p].primitives[s]))) return false
                  if (!("kind" in data.media.static.scene.nodes[p].primitives[s] && hasOwn(data.media.static.scene.nodes[p].primitives[s], "kind"))) return false
                  if (!("box" in data.media.static.scene.nodes[p].primitives[s] && hasOwn(data.media.static.scene.nodes[p].primitives[s], "box"))) return false
                  if (!("fill" in data.media.static.scene.nodes[p].primitives[s] && hasOwn(data.media.static.scene.nodes[p].primitives[s], "fill"))) return false
                  if (!("stroke" in data.media.static.scene.nodes[p].primitives[s] && hasOwn(data.media.static.scene.nodes[p].primitives[s], "stroke"))) return false
                  if (!("strokeWidth" in data.media.static.scene.nodes[p].primitives[s] && hasOwn(data.media.static.scene.nodes[p].primitives[s], "strokeWidth"))) return false
                  if (!(data.media.static.scene.nodes[p].primitives[s].kind === "rect")) return false
                  if (!(typeof data.media.static.scene.nodes[p].primitives[s].box === "object" && data.media.static.scene.nodes[p].primitives[s].box && !Array.isArray(data.media.static.scene.nodes[p].primitives[s].box))) return false
                  if (!("x" in data.media.static.scene.nodes[p].primitives[s].box && hasOwn(data.media.static.scene.nodes[p].primitives[s].box, "x"))) return false
                  if (!("y" in data.media.static.scene.nodes[p].primitives[s].box && hasOwn(data.media.static.scene.nodes[p].primitives[s].box, "y"))) return false
                  if (!("width" in data.media.static.scene.nodes[p].primitives[s].box && hasOwn(data.media.static.scene.nodes[p].primitives[s].box, "width"))) return false
                  if (!("height" in data.media.static.scene.nodes[p].primitives[s].box && hasOwn(data.media.static.scene.nodes[p].primitives[s].box, "height"))) return false
                  if (!(typeof data.media.static.scene.nodes[p].primitives[s].box.x === "number")) return false
                  if (!(-12000 <= data.media.static.scene.nodes[p].primitives[s].box.x)) return false
                  if (!(12000 >= data.media.static.scene.nodes[p].primitives[s].box.x)) return false
                  if (!(typeof data.media.static.scene.nodes[p].primitives[s].box.y === "number")) return false
                  if (!(-12000 <= data.media.static.scene.nodes[p].primitives[s].box.y)) return false
                  if (!(12000 >= data.media.static.scene.nodes[p].primitives[s].box.y)) return false
                  if (!(typeof data.media.static.scene.nodes[p].primitives[s].box.width === "number")) return false
                  if (!(0 < data.media.static.scene.nodes[p].primitives[s].box.width)) return false
                  if (!(12000 >= data.media.static.scene.nodes[p].primitives[s].box.width)) return false
                  if (!(typeof data.media.static.scene.nodes[p].primitives[s].box.height === "number")) return false
                  if (!(0 < data.media.static.scene.nodes[p].primitives[s].box.height)) return false
                  if (!(12000 >= data.media.static.scene.nodes[p].primitives[s].box.height)) return false
                  for (const key15 of Object.keys(data.media.static.scene.nodes[p].primitives[s].box)) {
                    if (key15 !== "x" && key15 !== "y" && key15 !== "width" && key15 !== "height") return false
                  }
                  const sub10 = (() => {
                    if (!(typeof data.media.static.scene.nodes[p].primitives[s].fill === "string")) return false
                    if (!(pattern0.test(data.media.static.scene.nodes[p].primitives[s].fill))) return false
                    return true
                  })()
                  if (!sub10) {
                    const sub11 = (() => {
                      if (!(data.media.static.scene.nodes[p].primitives[s].fill === null)) return false
                      return true
                    })()
                    if (!sub11) return false
                  }
                  const sub12 = (() => {
                    if (!(typeof data.media.static.scene.nodes[p].primitives[s].stroke === "string")) return false
                    if (!(pattern0.test(data.media.static.scene.nodes[p].primitives[s].stroke))) return false
                    return true
                  })()
                  if (!sub12) {
                    const sub13 = (() => {
                      if (!(data.media.static.scene.nodes[p].primitives[s].stroke === null)) return false
                      return true
                    })()
                    if (!sub13) return false
                  }
                  if (!(typeof data.media.static.scene.nodes[p].primitives[s].strokeWidth === "number")) return false
                  if (!(0 <= data.media.static.scene.nodes[p].primitives[s].strokeWidth)) return false
                  if (!(100 >= data.media.static.scene.nodes[p].primitives[s].strokeWidth)) return false
                  for (const key16 of Object.keys(data.media.static.scene.nodes[p].primitives[s])) {
                    if (key16 !== "kind" && key16 !== "box" && key16 !== "fill" && key16 !== "stroke" && key16 !== "strokeWidth") return false
                  }
                  return true
                })()
                if (sub9) passes2++
                const sub14 = (() => {
                  if (!(typeof data.media.static.scene.nodes[p].primitives[s] === "object" && data.media.static.scene.nodes[p].primitives[s] && !Array.isArray(data.media.static.scene.nodes[p].primitives[s]))) return false
                  if (!("kind" in data.media.static.scene.nodes[p].primitives[s] && hasOwn(data.media.static.scene.nodes[p].primitives[s], "kind"))) return false
                  if (!("start" in data.media.static.scene.nodes[p].primitives[s] && hasOwn(data.media.static.scene.nodes[p].primitives[s], "start"))) return false
                  if (!("end" in data.media.static.scene.nodes[p].primitives[s] && hasOwn(data.media.static.scene.nodes[p].primitives[s], "end"))) return false
                  if (!("fill" in data.media.static.scene.nodes[p].primitives[s] && hasOwn(data.media.static.scene.nodes[p].primitives[s], "fill"))) return false
                  if (!("stroke" in data.media.static.scene.nodes[p].primitives[s] && hasOwn(data.media.static.scene.nodes[p].primitives[s], "stroke"))) return false
                  if (!("strokeWidth" in data.media.static.scene.nodes[p].primitives[s] && hasOwn(data.media.static.scene.nodes[p].primitives[s], "strokeWidth"))) return false
                  if (!(data.media.static.scene.nodes[p].primitives[s].kind === "line")) return false
                  if (!(typeof data.media.static.scene.nodes[p].primitives[s].start === "object" && data.media.static.scene.nodes[p].primitives[s].start && !Array.isArray(data.media.static.scene.nodes[p].primitives[s].start))) return false
                  if (!("x" in data.media.static.scene.nodes[p].primitives[s].start && hasOwn(data.media.static.scene.nodes[p].primitives[s].start, "x"))) return false
                  if (!("y" in data.media.static.scene.nodes[p].primitives[s].start && hasOwn(data.media.static.scene.nodes[p].primitives[s].start, "y"))) return false
                  if (!(typeof data.media.static.scene.nodes[p].primitives[s].start.x === "number")) return false
                  if (!(-12000 <= data.media.static.scene.nodes[p].primitives[s].start.x)) return false
                  if (!(12000 >= data.media.static.scene.nodes[p].primitives[s].start.x)) return false
                  if (!(typeof data.media.static.scene.nodes[p].primitives[s].start.y === "number")) return false
                  if (!(-12000 <= data.media.static.scene.nodes[p].primitives[s].start.y)) return false
                  if (!(12000 >= data.media.static.scene.nodes[p].primitives[s].start.y)) return false
                  for (const key17 of Object.keys(data.media.static.scene.nodes[p].primitives[s].start)) {
                    if (key17 !== "x" && key17 !== "y") return false
                  }
                  if (!(typeof data.media.static.scene.nodes[p].primitives[s].end === "object" && data.media.static.scene.nodes[p].primitives[s].end && !Array.isArray(data.media.static.scene.nodes[p].primitives[s].end))) return false
                  if (!("x" in data.media.static.scene.nodes[p].primitives[s].end && hasOwn(data.media.static.scene.nodes[p].primitives[s].end, "x"))) return false
                  if (!("y" in data.media.static.scene.nodes[p].primitives[s].end && hasOwn(data.media.static.scene.nodes[p].primitives[s].end, "y"))) return false
                  if (!(typeof data.media.static.scene.nodes[p].primitives[s].end.x === "number")) return false
                  if (!(-12000 <= data.media.static.scene.nodes[p].primitives[s].end.x)) return false
                  if (!(12000 >= data.media.static.scene.nodes[p].primitives[s].end.x)) return false
                  if (!(typeof data.media.static.scene.nodes[p].primitives[s].end.y === "number")) return false
                  if (!(-12000 <= data.media.static.scene.nodes[p].primitives[s].end.y)) return false
                  if (!(12000 >= data.media.static.scene.nodes[p].primitives[s].end.y)) return false
                  for (const key18 of Object.keys(data.media.static.scene.nodes[p].primitives[s].end)) {
                    if (key18 !== "x" && key18 !== "y") return false
                  }
                  if (!(data.media.static.scene.nodes[p].primitives[s].fill === null)) return false
                  const sub15 = (() => {
                    if (!(typeof data.media.static.scene.nodes[p].primitives[s].stroke === "string")) return false
                    if (!(pattern0.test(data.media.static.scene.nodes[p].primitives[s].stroke))) return false
                    return true
                  })()
                  if (!sub15) {
                    const sub16 = (() => {
                      if (!(data.media.static.scene.nodes[p].primitives[s].stroke === null)) return false
                      return true
                    })()
                    if (!sub16) return false
                  }
                  if (!(typeof data.media.static.scene.nodes[p].primitives[s].strokeWidth === "number")) return false
                  if (!(0 <= data.media.static.scene.nodes[p].primitives[s].strokeWidth)) return false
                  if (!(100 >= data.media.static.scene.nodes[p].primitives[s].strokeWidth)) return false
                  for (const key19 of Object.keys(data.media.static.scene.nodes[p].primitives[s])) {
                    if (key19 !== "kind" && key19 !== "start" && key19 !== "end" && key19 !== "fill" && key19 !== "stroke" && key19 !== "strokeWidth") return false
                  }
                  return true
                })()
                if (sub14) passes2++
                const sub17 = (() => {
                  if (!(typeof data.media.static.scene.nodes[p].primitives[s] === "object" && data.media.static.scene.nodes[p].primitives[s] && !Array.isArray(data.media.static.scene.nodes[p].primitives[s]))) return false
                  if (!("kind" in data.media.static.scene.nodes[p].primitives[s] && hasOwn(data.media.static.scene.nodes[p].primitives[s], "kind"))) return false
                  if (!("points" in data.media.static.scene.nodes[p].primitives[s] && hasOwn(data.media.static.scene.nodes[p].primitives[s], "points"))) return false
                  if (!("closed" in data.media.static.scene.nodes[p].primitives[s] && hasOwn(data.media.static.scene.nodes[p].primitives[s], "closed"))) return false
                  if (!("fill" in data.media.static.scene.nodes[p].primitives[s] && hasOwn(data.media.static.scene.nodes[p].primitives[s], "fill"))) return false
                  if (!("stroke" in data.media.static.scene.nodes[p].primitives[s] && hasOwn(data.media.static.scene.nodes[p].primitives[s], "stroke"))) return false
                  if (!("strokeWidth" in data.media.static.scene.nodes[p].primitives[s] && hasOwn(data.media.static.scene.nodes[p].primitives[s], "strokeWidth"))) return false
                  if (!(data.media.static.scene.nodes[p].primitives[s].kind === "polyline")) return false
                  if (!(Array.isArray(data.media.static.scene.nodes[p].primitives[s].points))) return false
                  if (data.media.static.scene.nodes[p].primitives[s].points.length > 64) return false
                  if (data.media.static.scene.nodes[p].primitives[s].points.length < 2) return false
                  for (let t = 0; t < data.media.static.scene.nodes[p].primitives[s].points.length; t++) {
                    if (t in data.media.static.scene.nodes[p].primitives[s].points && hasOwn(data.media.static.scene.nodes[p].primitives[s].points, t)) {
                      if (!(typeof data.media.static.scene.nodes[p].primitives[s].points[t] === "object" && data.media.static.scene.nodes[p].primitives[s].points[t] && !Array.isArray(data.media.static.scene.nodes[p].primitives[s].points[t]))) return false
                      if (!("x" in data.media.static.scene.nodes[p].primitives[s].points[t] && hasOwn(data.media.static.scene.nodes[p].primitives[s].points[t], "x"))) return false
                      if (!("y" in data.media.static.scene.nodes[p].primitives[s].points[t] && hasOwn(data.media.static.scene.nodes[p].primitives[s].points[t], "y"))) return false
                      if (!(typeof data.media.static.scene.nodes[p].primitives[s].points[t].x === "number")) return false
                      if (!(-12000 <= data.media.static.scene.nodes[p].primitives[s].points[t].x)) return false
                      if (!(12000 >= data.media.static.scene.nodes[p].primitives[s].points[t].x)) return false
                      if (!(typeof data.media.static.scene.nodes[p].primitives[s].points[t].y === "number")) return false
                      if (!(-12000 <= data.media.static.scene.nodes[p].primitives[s].points[t].y)) return false
                      if (!(12000 >= data.media.static.scene.nodes[p].primitives[s].points[t].y)) return false
                      for (const key20 of Object.keys(data.media.static.scene.nodes[p].primitives[s].points[t])) {
                        if (key20 !== "x" && key20 !== "y") return false
                      }
                    }
                  }
                  if (!(typeof data.media.static.scene.nodes[p].primitives[s].closed === "boolean")) return false
                  const sub18 = (() => {
                    if (!(typeof data.media.static.scene.nodes[p].primitives[s].fill === "string")) return false
                    if (!(pattern0.test(data.media.static.scene.nodes[p].primitives[s].fill))) return false
                    return true
                  })()
                  if (!sub18) {
                    const sub19 = (() => {
                      if (!(data.media.static.scene.nodes[p].primitives[s].fill === null)) return false
                      return true
                    })()
                    if (!sub19) return false
                  }
                  const sub20 = (() => {
                    if (!(typeof data.media.static.scene.nodes[p].primitives[s].stroke === "string")) return false
                    if (!(pattern0.test(data.media.static.scene.nodes[p].primitives[s].stroke))) return false
                    return true
                  })()
                  if (!sub20) {
                    const sub21 = (() => {
                      if (!(data.media.static.scene.nodes[p].primitives[s].stroke === null)) return false
                      return true
                    })()
                    if (!sub21) return false
                  }
                  if (!(typeof data.media.static.scene.nodes[p].primitives[s].strokeWidth === "number")) return false
                  if (!(0 <= data.media.static.scene.nodes[p].primitives[s].strokeWidth)) return false
                  if (!(100 >= data.media.static.scene.nodes[p].primitives[s].strokeWidth)) return false
                  for (const key21 of Object.keys(data.media.static.scene.nodes[p].primitives[s])) {
                    if (key21 !== "kind" && key21 !== "points" && key21 !== "closed" && key21 !== "fill" && key21 !== "stroke" && key21 !== "strokeWidth") return false
                  }
                  return true
                })()
                if (sub17) passes2++
                if (passes2 !== 1) return false
              }
            }
            if ("paintBox" in data.media.static.scene.nodes[p] && hasOwn(data.media.static.scene.nodes[p], "paintBox")) {
              if (!(typeof data.media.static.scene.nodes[p].paintBox === "object" && data.media.static.scene.nodes[p].paintBox && !Array.isArray(data.media.static.scene.nodes[p].paintBox))) return false
              if (!("x" in data.media.static.scene.nodes[p].paintBox && hasOwn(data.media.static.scene.nodes[p].paintBox, "x"))) return false
              if (!("y" in data.media.static.scene.nodes[p].paintBox && hasOwn(data.media.static.scene.nodes[p].paintBox, "y"))) return false
              if (!("width" in data.media.static.scene.nodes[p].paintBox && hasOwn(data.media.static.scene.nodes[p].paintBox, "width"))) return false
              if (!("height" in data.media.static.scene.nodes[p].paintBox && hasOwn(data.media.static.scene.nodes[p].paintBox, "height"))) return false
              if (!(typeof data.media.static.scene.nodes[p].paintBox.x === "number")) return false
              if (!(-12000 <= data.media.static.scene.nodes[p].paintBox.x)) return false
              if (!(12000 >= data.media.static.scene.nodes[p].paintBox.x)) return false
              if (!(typeof data.media.static.scene.nodes[p].paintBox.y === "number")) return false
              if (!(-12000 <= data.media.static.scene.nodes[p].paintBox.y)) return false
              if (!(12000 >= data.media.static.scene.nodes[p].paintBox.y)) return false
              if (!(typeof data.media.static.scene.nodes[p].paintBox.width === "number")) return false
              if (!(0 < data.media.static.scene.nodes[p].paintBox.width)) return false
              if (!(12000 >= data.media.static.scene.nodes[p].paintBox.width)) return false
              if (!(typeof data.media.static.scene.nodes[p].paintBox.height === "number")) return false
              if (!(0 < data.media.static.scene.nodes[p].paintBox.height)) return false
              if (!(12000 >= data.media.static.scene.nodes[p].paintBox.height)) return false
              for (const key22 of Object.keys(data.media.static.scene.nodes[p].paintBox)) {
                if (key22 !== "x" && key22 !== "y" && key22 !== "width" && key22 !== "height") return false
              }
            }
            if ("adornment" in data.media.static.scene.nodes[p] && hasOwn(data.media.static.scene.nodes[p], "adornment")) {
              if (!(data.media.static.scene.nodes[p].adornment === true)) return false
            }
            if (!(typeof data.media.static.scene.nodes[p].box === "object" && data.media.static.scene.nodes[p].box && !Array.isArray(data.media.static.scene.nodes[p].box))) return false
            if (!("x" in data.media.static.scene.nodes[p].box && hasOwn(data.media.static.scene.nodes[p].box, "x"))) return false
            if (!("y" in data.media.static.scene.nodes[p].box && hasOwn(data.media.static.scene.nodes[p].box, "y"))) return false
            if (!("width" in data.media.static.scene.nodes[p].box && hasOwn(data.media.static.scene.nodes[p].box, "width"))) return false
            if (!("height" in data.media.static.scene.nodes[p].box && hasOwn(data.media.static.scene.nodes[p].box, "height"))) return false
            if (!(typeof data.media.static.scene.nodes[p].box.x === "number")) return false
            if (!(-12000 <= data.media.static.scene.nodes[p].box.x)) return false
            if (!(12000 >= data.media.static.scene.nodes[p].box.x)) return false
            if (!(typeof data.media.static.scene.nodes[p].box.y === "number")) return false
            if (!(-12000 <= data.media.static.scene.nodes[p].box.y)) return false
            if (!(12000 >= data.media.static.scene.nodes[p].box.y)) return false
            if (!(typeof data.media.static.scene.nodes[p].box.width === "number")) return false
            if (!(0 < data.media.static.scene.nodes[p].box.width)) return false
            if (!(12000 >= data.media.static.scene.nodes[p].box.width)) return false
            if (!(typeof data.media.static.scene.nodes[p].box.height === "number")) return false
            if (!(0 < data.media.static.scene.nodes[p].box.height)) return false
            if (!(12000 >= data.media.static.scene.nodes[p].box.height)) return false
            for (const key23 of Object.keys(data.media.static.scene.nodes[p].box)) {
              if (key23 !== "x" && key23 !== "y" && key23 !== "width" && key23 !== "height") return false
            }
            for (const key24 of Object.keys(data.media.static.scene.nodes[p])) {
              if (key24 !== "id" && key24 !== "semanticIds" && key24 !== "primitives" && key24 !== "paintBox" && key24 !== "adornment" && key24 !== "box") return false
            }
            return true
          })()
          if (sub3) passes1++
          if (passes1 !== 1) return false
        }
      }
      if (!Array.isArray(data.media.static.scene.texts)) return false
      if (data.media.static.scene.texts.length > 4096) return false
      for (let u = 0; u < data.media.static.scene.texts.length; u++) {
        if (u in data.media.static.scene.texts && hasOwn(data.media.static.scene.texts, u)) {
          if (!(typeof data.media.static.scene.texts[u] === "object" && data.media.static.scene.texts[u] && !Array.isArray(data.media.static.scene.texts[u]))) return false
          if (!("id" in data.media.static.scene.texts[u] && hasOwn(data.media.static.scene.texts[u], "id"))) return false
          if (!("text" in data.media.static.scene.texts[u] && hasOwn(data.media.static.scene.texts[u], "text"))) return false
          if (!("fontSize" in data.media.static.scene.texts[u] && hasOwn(data.media.static.scene.texts[u], "fontSize"))) return false
          if (!("weight" in data.media.static.scene.texts[u] && hasOwn(data.media.static.scene.texts[u], "weight"))) return false
          if (!("anchor" in data.media.static.scene.texts[u] && hasOwn(data.media.static.scene.texts[u], "anchor"))) return false
          if (!("tone" in data.media.static.scene.texts[u] && hasOwn(data.media.static.scene.texts[u], "tone"))) return false
          if (!("x" in data.media.static.scene.texts[u] && hasOwn(data.media.static.scene.texts[u], "x"))) return false
          if (!("baseline" in data.media.static.scene.texts[u] && hasOwn(data.media.static.scene.texts[u], "baseline"))) return false
          if (!("visible" in data.media.static.scene.texts[u] && hasOwn(data.media.static.scene.texts[u], "visible"))) return false
          if (!("semanticIds" in data.media.static.scene.texts[u] && hasOwn(data.media.static.scene.texts[u], "semanticIds"))) return false
          if (!("box" in data.media.static.scene.texts[u] && hasOwn(data.media.static.scene.texts[u], "box"))) return false
          if (!(typeof data.media.static.scene.texts[u].id === "string")) return false
          if (!(pattern0.test(data.media.static.scene.texts[u].id))) return false
          if (!(typeof data.media.static.scene.texts[u].text === "string")) return false
          if (data.media.static.scene.texts[u].text.length > 2048 && stringLength(data.media.static.scene.texts[u].text) > 2048) return false
          if (data.media.static.scene.texts[u].text.length < 1 || stringLength(data.media.static.scene.texts[u].text) < 1) return false
          if (!(pattern1.test(data.media.static.scene.texts[u].text))) return false
          if (!(typeof data.media.static.scene.texts[u].fontSize === "number")) return false
          if (!(0 < data.media.static.scene.texts[u].fontSize)) return false
          if (!(300 >= data.media.static.scene.texts[u].fontSize)) return false
          if (!(data.media.static.scene.texts[u].weight === "400" || data.media.static.scene.texts[u].weight === "500" || data.media.static.scene.texts[u].weight === "600" || data.media.static.scene.texts[u].weight === "700")) return false
          if ("font" in data.media.static.scene.texts[u] && hasOwn(data.media.static.scene.texts[u], "font")) {
            if (!(typeof data.media.static.scene.texts[u].font === "string")) return false
            if (!(pattern0.test(data.media.static.scene.texts[u].font))) return false
          }
          if ("owner" in data.media.static.scene.texts[u] && hasOwn(data.media.static.scene.texts[u], "owner")) {
            if (!(typeof data.media.static.scene.texts[u].owner === "string")) return false
            if (!(pattern0.test(data.media.static.scene.texts[u].owner))) return false
          }
          if (!(data.media.static.scene.texts[u].anchor === "start" || data.media.static.scene.texts[u].anchor === "middle" || data.media.static.scene.texts[u].anchor === "end")) return false
          if (!(typeof data.media.static.scene.texts[u].tone === "string")) return false
          if (!(pattern0.test(data.media.static.scene.texts[u].tone))) return false
          if (!(typeof data.media.static.scene.texts[u].x === "number")) return false
          if (!(-12000 <= data.media.static.scene.texts[u].x)) return false
          if (!(12000 >= data.media.static.scene.texts[u].x)) return false
          if (!(typeof data.media.static.scene.texts[u].baseline === "number")) return false
          if (!(-12000 <= data.media.static.scene.texts[u].baseline)) return false
          if (!(12000 >= data.media.static.scene.texts[u].baseline)) return false
          if (!(typeof data.media.static.scene.texts[u].visible === "boolean")) return false
          if (!(Array.isArray(data.media.static.scene.texts[u].semanticIds))) return false
          if (data.media.static.scene.texts[u].semanticIds.length > 4096) return false
          for (let v = 0; v < data.media.static.scene.texts[u].semanticIds.length; v++) {
            if (v in data.media.static.scene.texts[u].semanticIds && hasOwn(data.media.static.scene.texts[u].semanticIds, v)) {
              if (!(typeof data.media.static.scene.texts[u].semanticIds[v] === "string")) return false
              if (data.media.static.scene.texts[u].semanticIds[v].length > 2048 && stringLength(data.media.static.scene.texts[u].semanticIds[v]) > 2048) return false
              if (data.media.static.scene.texts[u].semanticIds[v].length < 1 || stringLength(data.media.static.scene.texts[u].semanticIds[v]) < 1) return false
              if (!(pattern1.test(data.media.static.scene.texts[u].semanticIds[v]))) return false
            }
          }
          if (!unique(data.media.static.scene.texts[u].semanticIds)) return false
          if (!(typeof data.media.static.scene.texts[u].box === "object" && data.media.static.scene.texts[u].box && !Array.isArray(data.media.static.scene.texts[u].box))) return false
          if (!("x" in data.media.static.scene.texts[u].box && hasOwn(data.media.static.scene.texts[u].box, "x"))) return false
          if (!("y" in data.media.static.scene.texts[u].box && hasOwn(data.media.static.scene.texts[u].box, "y"))) return false
          if (!("width" in data.media.static.scene.texts[u].box && hasOwn(data.media.static.scene.texts[u].box, "width"))) return false
          if (!("height" in data.media.static.scene.texts[u].box && hasOwn(data.media.static.scene.texts[u].box, "height"))) return false
          if (!(typeof data.media.static.scene.texts[u].box.x === "number")) return false
          if (!(-12000 <= data.media.static.scene.texts[u].box.x)) return false
          if (!(12000 >= data.media.static.scene.texts[u].box.x)) return false
          if (!(typeof data.media.static.scene.texts[u].box.y === "number")) return false
          if (!(-12000 <= data.media.static.scene.texts[u].box.y)) return false
          if (!(12000 >= data.media.static.scene.texts[u].box.y)) return false
          if (!(typeof data.media.static.scene.texts[u].box.width === "number")) return false
          if (!(0 < data.media.static.scene.texts[u].box.width)) return false
          if (!(12000 >= data.media.static.scene.texts[u].box.width)) return false
          if (!(typeof data.media.static.scene.texts[u].box.height === "number")) return false
          if (!(0 < data.media.static.scene.texts[u].box.height)) return false
          if (!(12000 >= data.media.static.scene.texts[u].box.height)) return false
          for (const key25 of Object.keys(data.media.static.scene.texts[u].box)) {
            if (key25 !== "x" && key25 !== "y" && key25 !== "width" && key25 !== "height") return false
          }
          for (const key26 of Object.keys(data.media.static.scene.texts[u])) {
            if (key26 !== "id" && key26 !== "text" && key26 !== "fontSize" && key26 !== "weight" && key26 !== "font" && key26 !== "owner" && key26 !== "anchor" && key26 !== "tone" && key26 !== "x" && key26 !== "baseline" && key26 !== "visible" && key26 !== "semanticIds" && key26 !== "box") return false
          }
        }
      }
      if (!Array.isArray(data.media.static.scene.edges)) return false
      if (data.media.static.scene.edges.length > 8192) return false
      for (let x = 0; x < data.media.static.scene.edges.length; x++) {
        if (x in data.media.static.scene.edges && hasOwn(data.media.static.scene.edges, x)) {
          let passes3 = 0
          const sub22 = (() => {
            if (!(typeof data.media.static.scene.edges[x] === "object" && data.media.static.scene.edges[x] && !Array.isArray(data.media.static.scene.edges[x]))) return false
            if (!("id" in data.media.static.scene.edges[x] && hasOwn(data.media.static.scene.edges[x], "id"))) return false
            if (!("kind" in data.media.static.scene.edges[x] && hasOwn(data.media.static.scene.edges[x], "kind"))) return false
            if (!("source" in data.media.static.scene.edges[x] && hasOwn(data.media.static.scene.edges[x], "source"))) return false
            if (!("target" in data.media.static.scene.edges[x] && hasOwn(data.media.static.scene.edges[x], "target"))) return false
            if (!("points" in data.media.static.scene.edges[x] && hasOwn(data.media.static.scene.edges[x], "points"))) return false
            if (!("strokeWidth" in data.media.static.scene.edges[x] && hasOwn(data.media.static.scene.edges[x], "strokeWidth"))) return false
            if (!("arrow" in data.media.static.scene.edges[x] && hasOwn(data.media.static.scene.edges[x], "arrow"))) return false
            if (!("arrowGeometry" in data.media.static.scene.edges[x] && hasOwn(data.media.static.scene.edges[x], "arrowGeometry"))) return false
            if (!("semanticIds" in data.media.static.scene.edges[x] && hasOwn(data.media.static.scene.edges[x], "semanticIds"))) return false
            if (!("strokeTone" in data.media.static.scene.edges[x] && hasOwn(data.media.static.scene.edges[x], "strokeTone"))) return false
            if (!(typeof data.media.static.scene.edges[x].id === "string")) return false
            if (!(pattern0.test(data.media.static.scene.edges[x].id))) return false
            if (!(typeof data.media.static.scene.edges[x].kind === "string")) return false
            if (data.media.static.scene.edges[x].kind.length > 2048 && stringLength(data.media.static.scene.edges[x].kind) > 2048) return false
            if (data.media.static.scene.edges[x].kind.length < 1 || stringLength(data.media.static.scene.edges[x].kind) < 1) return false
            if (!(pattern1.test(data.media.static.scene.edges[x].kind))) return false
            if (!(typeof data.media.static.scene.edges[x].source === "string")) return false
            if (!(pattern0.test(data.media.static.scene.edges[x].source))) return false
            if (!(typeof data.media.static.scene.edges[x].target === "string")) return false
            if (!(pattern0.test(data.media.static.scene.edges[x].target))) return false
            if (!(Array.isArray(data.media.static.scene.edges[x].points))) return false
            if (data.media.static.scene.edges[x].points.length > 2048) return false
            if (data.media.static.scene.edges[x].points.length < 2) return false
            for (let y = 0; y < data.media.static.scene.edges[x].points.length; y++) {
              if (y in data.media.static.scene.edges[x].points && hasOwn(data.media.static.scene.edges[x].points, y)) {
                if (!(typeof data.media.static.scene.edges[x].points[y] === "object" && data.media.static.scene.edges[x].points[y] && !Array.isArray(data.media.static.scene.edges[x].points[y]))) return false
                if (!("x" in data.media.static.scene.edges[x].points[y] && hasOwn(data.media.static.scene.edges[x].points[y], "x"))) return false
                if (!("y" in data.media.static.scene.edges[x].points[y] && hasOwn(data.media.static.scene.edges[x].points[y], "y"))) return false
                if (!(typeof data.media.static.scene.edges[x].points[y].x === "number")) return false
                if (!(-12000 <= data.media.static.scene.edges[x].points[y].x)) return false
                if (!(12000 >= data.media.static.scene.edges[x].points[y].x)) return false
                if (!(typeof data.media.static.scene.edges[x].points[y].y === "number")) return false
                if (!(-12000 <= data.media.static.scene.edges[x].points[y].y)) return false
                if (!(12000 >= data.media.static.scene.edges[x].points[y].y)) return false
                for (const key27 of Object.keys(data.media.static.scene.edges[x].points[y])) {
                  if (key27 !== "x" && key27 !== "y") return false
                }
              }
            }
            if (!(typeof data.media.static.scene.edges[x].strokeWidth === "number")) return false
            if (!(0 <= data.media.static.scene.edges[x].strokeWidth)) return false
            if (!(100 >= data.media.static.scene.edges[x].strokeWidth)) return false
            if (!(typeof data.media.static.scene.edges[x].arrow === "boolean")) return false
            if (!(typeof data.media.static.scene.edges[x].arrowGeometry === "object" && data.media.static.scene.edges[x].arrowGeometry && !Array.isArray(data.media.static.scene.edges[x].arrowGeometry))) return false
            if (!("length" in data.media.static.scene.edges[x].arrowGeometry && hasOwn(data.media.static.scene.edges[x].arrowGeometry, "length"))) return false
            if (!("halfWidth" in data.media.static.scene.edges[x].arrowGeometry && hasOwn(data.media.static.scene.edges[x].arrowGeometry, "halfWidth"))) return false
            if (!("strokeWidth" in data.media.static.scene.edges[x].arrowGeometry && hasOwn(data.media.static.scene.edges[x].arrowGeometry, "strokeWidth"))) return false
            if (!(typeof data.media.static.scene.edges[x].arrowGeometry.length === "number")) return false
            if (!(0 <= data.media.static.scene.edges[x].arrowGeometry.length)) return false
            if (!(100 >= data.media.static.scene.edges[x].arrowGeometry.length)) return false
            if (!(typeof data.media.static.scene.edges[x].arrowGeometry.halfWidth === "number")) return false
            if (!(0 <= data.media.static.scene.edges[x].arrowGeometry.halfWidth)) return false
            if (!(100 >= data.media.static.scene.edges[x].arrowGeometry.halfWidth)) return false
            if (!(typeof data.media.static.scene.edges[x].arrowGeometry.strokeWidth === "number")) return false
            if (!(0 <= data.media.static.scene.edges[x].arrowGeometry.strokeWidth)) return false
            if (!(100 >= data.media.static.scene.edges[x].arrowGeometry.strokeWidth)) return false
            for (const key28 of Object.keys(data.media.static.scene.edges[x].arrowGeometry)) {
              if (key28 !== "length" && key28 !== "halfWidth" && key28 !== "strokeWidth") return false
            }
            if (!(Array.isArray(data.media.static.scene.edges[x].semanticIds))) return false
            if (data.media.static.scene.edges[x].semanticIds.length > 4096) return false
            for (let z = 0; z < data.media.static.scene.edges[x].semanticIds.length; z++) {
              if (z in data.media.static.scene.edges[x].semanticIds && hasOwn(data.media.static.scene.edges[x].semanticIds, z)) {
                if (!(typeof data.media.static.scene.edges[x].semanticIds[z] === "string")) return false
                if (data.media.static.scene.edges[x].semanticIds[z].length > 2048 && stringLength(data.media.static.scene.edges[x].semanticIds[z]) > 2048) return false
                if (data.media.static.scene.edges[x].semanticIds[z].length < 1 || stringLength(data.media.static.scene.edges[x].semanticIds[z]) < 1) return false
                if (!(pattern1.test(data.media.static.scene.edges[x].semanticIds[z]))) return false
              }
            }
            if (!unique(data.media.static.scene.edges[x].semanticIds)) return false
            if (!(typeof data.media.static.scene.edges[x].strokeTone === "string")) return false
            if (!(pattern0.test(data.media.static.scene.edges[x].strokeTone))) return false
            for (const key29 of Object.keys(data.media.static.scene.edges[x])) {
              if (key29 !== "id" && key29 !== "kind" && key29 !== "source" && key29 !== "target" && key29 !== "points" && key29 !== "strokeWidth" && key29 !== "arrow" && key29 !== "arrowGeometry" && key29 !== "semanticIds" && key29 !== "strokeTone") return false
            }
            return true
          })()
          if (sub22) passes3++
          const sub23 = (() => {
            if (!(typeof data.media.static.scene.edges[x] === "object" && data.media.static.scene.edges[x] && !Array.isArray(data.media.static.scene.edges[x]))) return false
            if (!("id" in data.media.static.scene.edges[x] && hasOwn(data.media.static.scene.edges[x], "id"))) return false
            if (!("source" in data.media.static.scene.edges[x] && hasOwn(data.media.static.scene.edges[x], "source"))) return false
            if (!("target" in data.media.static.scene.edges[x] && hasOwn(data.media.static.scene.edges[x], "target"))) return false
            if (!("points" in data.media.static.scene.edges[x] && hasOwn(data.media.static.scene.edges[x], "points"))) return false
            if (!("strokeWidth" in data.media.static.scene.edges[x] && hasOwn(data.media.static.scene.edges[x], "strokeWidth"))) return false
            if (!("strokeTone" in data.media.static.scene.edges[x] && hasOwn(data.media.static.scene.edges[x], "strokeTone"))) return false
            if (!("arrow" in data.media.static.scene.edges[x] && hasOwn(data.media.static.scene.edges[x], "arrow"))) return false
            if (!("arrowGeometry" in data.media.static.scene.edges[x] && hasOwn(data.media.static.scene.edges[x], "arrowGeometry"))) return false
            if (!("semanticIds" in data.media.static.scene.edges[x] && hasOwn(data.media.static.scene.edges[x], "semanticIds"))) return false
            if (!("adornment" in data.media.static.scene.edges[x] && hasOwn(data.media.static.scene.edges[x], "adornment"))) return false
            if (!(typeof data.media.static.scene.edges[x].id === "string")) return false
            if (!(pattern0.test(data.media.static.scene.edges[x].id))) return false
            if (!(typeof data.media.static.scene.edges[x].source === "string")) return false
            if (!(pattern0.test(data.media.static.scene.edges[x].source))) return false
            if (!(typeof data.media.static.scene.edges[x].target === "string")) return false
            if (!(pattern0.test(data.media.static.scene.edges[x].target))) return false
            if (!(data.media.static.scene.edges[x].adornment === true)) return false
            if (!(Array.isArray(data.media.static.scene.edges[x].semanticIds))) return false
            if (data.media.static.scene.edges[x].semanticIds.length > 0) return false
            for (let ii = 0; ii < data.media.static.scene.edges[x].semanticIds.length; ii++) {
              if (ii in data.media.static.scene.edges[x].semanticIds && hasOwn(data.media.static.scene.edges[x].semanticIds, ii)) {
                if (!(typeof data.media.static.scene.edges[x].semanticIds[ii] === "string")) return false
                if (data.media.static.scene.edges[x].semanticIds[ii].length > 2048 && stringLength(data.media.static.scene.edges[x].semanticIds[ii]) > 2048) return false
                if (data.media.static.scene.edges[x].semanticIds[ii].length < 1 || stringLength(data.media.static.scene.edges[x].semanticIds[ii]) < 1) return false
                if (!(pattern1.test(data.media.static.scene.edges[x].semanticIds[ii]))) return false
              }
            }
            if (!(Array.isArray(data.media.static.scene.edges[x].points))) return false
            if (data.media.static.scene.edges[x].points.length > 2048) return false
            if (data.media.static.scene.edges[x].points.length < 2) return false
            for (let jj = 0; jj < data.media.static.scene.edges[x].points.length; jj++) {
              if (jj in data.media.static.scene.edges[x].points && hasOwn(data.media.static.scene.edges[x].points, jj)) {
                if (!(typeof data.media.static.scene.edges[x].points[jj] === "object" && data.media.static.scene.edges[x].points[jj] && !Array.isArray(data.media.static.scene.edges[x].points[jj]))) return false
                if (!("x" in data.media.static.scene.edges[x].points[jj] && hasOwn(data.media.static.scene.edges[x].points[jj], "x"))) return false
                if (!("y" in data.media.static.scene.edges[x].points[jj] && hasOwn(data.media.static.scene.edges[x].points[jj], "y"))) return false
                if (!(typeof data.media.static.scene.edges[x].points[jj].x === "number")) return false
                if (!(-12000 <= data.media.static.scene.edges[x].points[jj].x)) return false
                if (!(12000 >= data.media.static.scene.edges[x].points[jj].x)) return false
                if (!(typeof data.media.static.scene.edges[x].points[jj].y === "number")) return false
                if (!(-12000 <= data.media.static.scene.edges[x].points[jj].y)) return false
                if (!(12000 >= data.media.static.scene.edges[x].points[jj].y)) return false
                for (const key30 of Object.keys(data.media.static.scene.edges[x].points[jj])) {
                  if (key30 !== "x" && key30 !== "y") return false
                }
              }
            }
            if (!(typeof data.media.static.scene.edges[x].strokeWidth === "number")) return false
            if (!(0 < data.media.static.scene.edges[x].strokeWidth)) return false
            if (!(100 >= data.media.static.scene.edges[x].strokeWidth)) return false
            if (!(typeof data.media.static.scene.edges[x].strokeTone === "string")) return false
            if (!(pattern0.test(data.media.static.scene.edges[x].strokeTone))) return false
            if (!(typeof data.media.static.scene.edges[x].arrow === "boolean")) return false
            if (!(typeof data.media.static.scene.edges[x].arrowGeometry === "object" && data.media.static.scene.edges[x].arrowGeometry && !Array.isArray(data.media.static.scene.edges[x].arrowGeometry))) return false
            if (!("length" in data.media.static.scene.edges[x].arrowGeometry && hasOwn(data.media.static.scene.edges[x].arrowGeometry, "length"))) return false
            if (!("halfWidth" in data.media.static.scene.edges[x].arrowGeometry && hasOwn(data.media.static.scene.edges[x].arrowGeometry, "halfWidth"))) return false
            if (!("strokeWidth" in data.media.static.scene.edges[x].arrowGeometry && hasOwn(data.media.static.scene.edges[x].arrowGeometry, "strokeWidth"))) return false
            if (!(typeof data.media.static.scene.edges[x].arrowGeometry.length === "number")) return false
            if (!(0 <= data.media.static.scene.edges[x].arrowGeometry.length)) return false
            if (!(100 >= data.media.static.scene.edges[x].arrowGeometry.length)) return false
            if (!(typeof data.media.static.scene.edges[x].arrowGeometry.halfWidth === "number")) return false
            if (!(0 <= data.media.static.scene.edges[x].arrowGeometry.halfWidth)) return false
            if (!(100 >= data.media.static.scene.edges[x].arrowGeometry.halfWidth)) return false
            if (!(typeof data.media.static.scene.edges[x].arrowGeometry.strokeWidth === "number")) return false
            if (!(0 <= data.media.static.scene.edges[x].arrowGeometry.strokeWidth)) return false
            if (!(100 >= data.media.static.scene.edges[x].arrowGeometry.strokeWidth)) return false
            for (const key31 of Object.keys(data.media.static.scene.edges[x].arrowGeometry)) {
              if (key31 !== "length" && key31 !== "halfWidth" && key31 !== "strokeWidth") return false
            }
            for (const key32 of Object.keys(data.media.static.scene.edges[x])) {
              if (key32 !== "id" && key32 !== "source" && key32 !== "target" && key32 !== "adornment" && key32 !== "semanticIds" && key32 !== "points" && key32 !== "strokeWidth" && key32 !== "strokeTone" && key32 !== "arrow" && key32 !== "arrowGeometry") return false
            }
            return true
          })()
          if (sub23) passes3++
          if (passes3 !== 1) return false
        }
      }
      if ("routes" in data.media.static.scene && hasOwn(data.media.static.scene, "routes")) {
        if (!Array.isArray(data.media.static.scene.routes)) return false
        if (data.media.static.scene.routes.length > 2048) return false
        for (let kk = 0; kk < data.media.static.scene.routes.length; kk++) {
          if (kk in data.media.static.scene.routes && hasOwn(data.media.static.scene.routes, kk)) {
            if (!(typeof data.media.static.scene.routes[kk] === "object" && data.media.static.scene.routes[kk] && !Array.isArray(data.media.static.scene.routes[kk]))) return false
            if (!("id" in data.media.static.scene.routes[kk] && hasOwn(data.media.static.scene.routes[kk], "id"))) return false
            if (!("reference" in data.media.static.scene.routes[kk] && hasOwn(data.media.static.scene.routes[kk], "reference"))) return false
            if (!("source" in data.media.static.scene.routes[kk] && hasOwn(data.media.static.scene.routes[kk], "source"))) return false
            if (!("target" in data.media.static.scene.routes[kk] && hasOwn(data.media.static.scene.routes[kk], "target"))) return false
            if (!("traversals" in data.media.static.scene.routes[kk] && hasOwn(data.media.static.scene.routes[kk], "traversals"))) return false
            if (!(typeof data.media.static.scene.routes[kk].id === "string")) return false
            if (!(pattern0.test(data.media.static.scene.routes[kk].id))) return false
            if (!(typeof data.media.static.scene.routes[kk].reference === "string")) return false
            if (data.media.static.scene.routes[kk].reference.length > 2048 && stringLength(data.media.static.scene.routes[kk].reference) > 2048) return false
            if (data.media.static.scene.routes[kk].reference.length < 1 || stringLength(data.media.static.scene.routes[kk].reference) < 1) return false
            if (!(pattern1.test(data.media.static.scene.routes[kk].reference))) return false
            if (!(typeof data.media.static.scene.routes[kk].source === "string")) return false
            if (!(pattern0.test(data.media.static.scene.routes[kk].source))) return false
            if (!(typeof data.media.static.scene.routes[kk].target === "string")) return false
            if (!(pattern0.test(data.media.static.scene.routes[kk].target))) return false
            if ("editionSha256" in data.media.static.scene.routes[kk] && hasOwn(data.media.static.scene.routes[kk], "editionSha256")) {
              if (!(typeof data.media.static.scene.routes[kk].editionSha256 === "string")) return false
              if (!(pattern3.test(data.media.static.scene.routes[kk].editionSha256))) return false
            }
            if (!(Array.isArray(data.media.static.scene.routes[kk].traversals))) return false
            if (data.media.static.scene.routes[kk].traversals.length > 2048) return false
            if (data.media.static.scene.routes[kk].traversals.length < 1) return false
            for (let ll = 0; ll < data.media.static.scene.routes[kk].traversals.length; ll++) {
              if (ll in data.media.static.scene.routes[kk].traversals && hasOwn(data.media.static.scene.routes[kk].traversals, ll)) {
                if (!(typeof data.media.static.scene.routes[kk].traversals[ll] === "object" && data.media.static.scene.routes[kk].traversals[ll] && !Array.isArray(data.media.static.scene.routes[kk].traversals[ll]))) return false
                if (!("edge" in data.media.static.scene.routes[kk].traversals[ll] && hasOwn(data.media.static.scene.routes[kk].traversals[ll], "edge"))) return false
                if (!("direction" in data.media.static.scene.routes[kk].traversals[ll] && hasOwn(data.media.static.scene.routes[kk].traversals[ll], "direction"))) return false
                if (!(typeof data.media.static.scene.routes[kk].traversals[ll].edge === "string")) return false
                if (!(pattern0.test(data.media.static.scene.routes[kk].traversals[ll].edge))) return false
                if (!(data.media.static.scene.routes[kk].traversals[ll].direction === "forward" || data.media.static.scene.routes[kk].traversals[ll].direction === "reverse")) return false
                for (const key33 of Object.keys(data.media.static.scene.routes[kk].traversals[ll])) {
                  if (key33 !== "edge" && key33 !== "direction") return false
                }
              }
            }
            for (const key34 of Object.keys(data.media.static.scene.routes[kk])) {
              if (key34 !== "id" && key34 !== "reference" && key34 !== "source" && key34 !== "target" && key34 !== "editionSha256" && key34 !== "traversals") return false
            }
          }
        }
      }
      if (!Array.isArray(data.media.static.scene.decorations)) return false
      if (data.media.static.scene.decorations.length > 4096) return false
      for (let mm = 0; mm < data.media.static.scene.decorations.length; mm++) {
        if (mm in data.media.static.scene.decorations && hasOwn(data.media.static.scene.decorations, mm)) {
          if (!(typeof data.media.static.scene.decorations[mm] === "object" && data.media.static.scene.decorations[mm] && !Array.isArray(data.media.static.scene.decorations[mm]))) return false
          if (!("id" in data.media.static.scene.decorations[mm] && hasOwn(data.media.static.scene.decorations[mm], "id"))) return false
          if (!("role" in data.media.static.scene.decorations[mm] && hasOwn(data.media.static.scene.decorations[mm], "role"))) return false
          if (!("tone" in data.media.static.scene.decorations[mm] && hasOwn(data.media.static.scene.decorations[mm], "tone"))) return false
          if (!("points" in data.media.static.scene.decorations[mm] && hasOwn(data.media.static.scene.decorations[mm], "points"))) return false
          if (!("strokeWidth" in data.media.static.scene.decorations[mm] && hasOwn(data.media.static.scene.decorations[mm], "strokeWidth"))) return false
          if (!(typeof data.media.static.scene.decorations[mm].id === "string")) return false
          if (!(pattern0.test(data.media.static.scene.decorations[mm].id))) return false
          if (!(typeof data.media.static.scene.decorations[mm].role === "string")) return false
          if (data.media.static.scene.decorations[mm].role.length > 2048 && stringLength(data.media.static.scene.decorations[mm].role) > 2048) return false
          if (data.media.static.scene.decorations[mm].role.length < 1 || stringLength(data.media.static.scene.decorations[mm].role) < 1) return false
          if (!(pattern1.test(data.media.static.scene.decorations[mm].role))) return false
          if (!(typeof data.media.static.scene.decorations[mm].tone === "string")) return false
          if (!(pattern0.test(data.media.static.scene.decorations[mm].tone))) return false
          if (!(Array.isArray(data.media.static.scene.decorations[mm].points))) return false
          if (data.media.static.scene.decorations[mm].points.length > 2048) return false
          if (data.media.static.scene.decorations[mm].points.length < 2) return false
          for (let nn = 0; nn < data.media.static.scene.decorations[mm].points.length; nn++) {
            if (nn in data.media.static.scene.decorations[mm].points && hasOwn(data.media.static.scene.decorations[mm].points, nn)) {
              if (!(typeof data.media.static.scene.decorations[mm].points[nn] === "object" && data.media.static.scene.decorations[mm].points[nn] && !Array.isArray(data.media.static.scene.decorations[mm].points[nn]))) return false
              if (!("x" in data.media.static.scene.decorations[mm].points[nn] && hasOwn(data.media.static.scene.decorations[mm].points[nn], "x"))) return false
              if (!("y" in data.media.static.scene.decorations[mm].points[nn] && hasOwn(data.media.static.scene.decorations[mm].points[nn], "y"))) return false
              if (!(typeof data.media.static.scene.decorations[mm].points[nn].x === "number")) return false
              if (!(-12000 <= data.media.static.scene.decorations[mm].points[nn].x)) return false
              if (!(12000 >= data.media.static.scene.decorations[mm].points[nn].x)) return false
              if (!(typeof data.media.static.scene.decorations[mm].points[nn].y === "number")) return false
              if (!(-12000 <= data.media.static.scene.decorations[mm].points[nn].y)) return false
              if (!(12000 >= data.media.static.scene.decorations[mm].points[nn].y)) return false
              for (const key35 of Object.keys(data.media.static.scene.decorations[mm].points[nn])) {
                if (key35 !== "x" && key35 !== "y") return false
              }
            }
          }
          if (!(typeof data.media.static.scene.decorations[mm].strokeWidth === "number")) return false
          if (!(0 <= data.media.static.scene.decorations[mm].strokeWidth)) return false
          if (!(100 >= data.media.static.scene.decorations[mm].strokeWidth)) return false
          for (const key36 of Object.keys(data.media.static.scene.decorations[mm])) {
            if (key36 !== "id" && key36 !== "role" && key36 !== "tone" && key36 !== "points" && key36 !== "strokeWidth") return false
          }
        }
      }
      if (!Array.isArray(data.media.static.scene.requiredSemanticIds)) return false
      if (data.media.static.scene.requiredSemanticIds.length > 8192) return false
      if (data.media.static.scene.requiredSemanticIds.length < 1) return false
      for (let oo = 0; oo < data.media.static.scene.requiredSemanticIds.length; oo++) {
        if (oo in data.media.static.scene.requiredSemanticIds && hasOwn(data.media.static.scene.requiredSemanticIds, oo)) {
          if (!(typeof data.media.static.scene.requiredSemanticIds[oo] === "string")) return false
          if (data.media.static.scene.requiredSemanticIds[oo].length > 2048 && stringLength(data.media.static.scene.requiredSemanticIds[oo]) > 2048) return false
          if (data.media.static.scene.requiredSemanticIds[oo].length < 1 || stringLength(data.media.static.scene.requiredSemanticIds[oo]) < 1) return false
          if (!(pattern1.test(data.media.static.scene.requiredSemanticIds[oo]))) return false
        }
      }
      if (!unique(data.media.static.scene.requiredSemanticIds)) return false
      for (const key37 of Object.keys(data.media.static.scene)) {
        if (key37 !== "schema" && key37 !== "title" && key37 !== "subtitle" && key37 !== "description" && key37 !== "width" && key37 !== "height" && key37 !== "referenceWidth" && key37 !== "spine" && key37 !== "paint" && key37 !== "nodes" && key37 !== "texts" && key37 !== "edges" && key37 !== "routes" && key37 !== "decorations" && key37 !== "requiredSemanticIds") return false
      }
      for (const key38 of Object.keys(data.media.static)) {
        if (key38 !== "kind" && key38 !== "font" && key38 !== "scene") return false
      }
      return true
    })()
    if (sub1) passes0++
    const sub24 = (() => {
      if (!(typeof data.media.static === "object" && data.media.static && !Array.isArray(data.media.static))) return false
      if (!("kind" in data.media.static && hasOwn(data.media.static, "kind"))) return false
      if (!(data.media.static.kind === "neutral")) return false
      for (const key39 of Object.keys(data.media.static)) {
        if (key39 !== "kind") return false
      }
      return true
    })()
    if (sub24) passes0++
    if (passes0 !== 1) {
      validate.errors = [{ keywordLocation: "#/properties/media/properties/static/oneOf", instanceLocation: "#/media/static" }]
      return false
    }
  }
  if ("interactive" in data.media && hasOwn(data.media, "interactive")) {
    let passes4 = 0
    const sub25 = (() => {
      if (!(typeof data.media.interactive === "object" && data.media.interactive && !Array.isArray(data.media.interactive))) return false
      if (!("kind" in data.media.interactive && hasOwn(data.media.interactive, "kind"))) return false
      if (!("pages" in data.media.interactive && hasOwn(data.media.interactive, "pages"))) return false
      if (!(data.media.interactive.kind === "authored-architecture")) return false
      if ("font" in data.media.interactive && hasOwn(data.media.interactive, "font")) {
        if (!(typeof data.media.interactive.font === "string")) return false
        if (!pattern0.test(data.media.interactive.font)) return false
      }
      if (!Array.isArray(data.media.interactive.pages)) return false
      if (data.media.interactive.pages.length > 64) return false
      if (data.media.interactive.pages.length < 1) return false
      for (let pp = 0; pp < data.media.interactive.pages.length; pp++) {
        if (pp in data.media.interactive.pages && hasOwn(data.media.interactive.pages, pp)) {
          if (!(typeof data.media.interactive.pages[pp] === "object" && data.media.interactive.pages[pp] && !Array.isArray(data.media.interactive.pages[pp]))) return false
          if (!("id" in data.media.interactive.pages[pp] && hasOwn(data.media.interactive.pages[pp], "id"))) return false
          if (!("label" in data.media.interactive.pages[pp] && hasOwn(data.media.interactive.pages[pp], "label"))) return false
          if (!("purpose" in data.media.interactive.pages[pp] && hasOwn(data.media.interactive.pages[pp], "purpose"))) return false
          if (!("scene" in data.media.interactive.pages[pp] && hasOwn(data.media.interactive.pages[pp], "scene"))) return false
          if (!(typeof data.media.interactive.pages[pp].id === "string")) return false
          if (!(pattern0.test(data.media.interactive.pages[pp].id))) return false
          if (!(typeof data.media.interactive.pages[pp].label === "string")) return false
          if (data.media.interactive.pages[pp].label.length > 2048 && stringLength(data.media.interactive.pages[pp].label) > 2048) return false
          if (data.media.interactive.pages[pp].label.length < 1 || stringLength(data.media.interactive.pages[pp].label) < 1) return false
          if (!(pattern1.test(data.media.interactive.pages[pp].label))) return false
          if (!(data.media.interactive.pages[pp].purpose === "overview" || data.media.interactive.pages[pp].purpose === "mechanism")) return false
          if (!(typeof data.media.interactive.pages[pp].scene === "object" && data.media.interactive.pages[pp].scene && !Array.isArray(data.media.interactive.pages[pp].scene))) return false
          if (!("schema" in data.media.interactive.pages[pp].scene && hasOwn(data.media.interactive.pages[pp].scene, "schema"))) return false
          if (!("id" in data.media.interactive.pages[pp].scene && hasOwn(data.media.interactive.pages[pp].scene, "id"))) return false
          if (!("title" in data.media.interactive.pages[pp].scene && hasOwn(data.media.interactive.pages[pp].scene, "title"))) return false
          if (!("subtitle" in data.media.interactive.pages[pp].scene && hasOwn(data.media.interactive.pages[pp].scene, "subtitle"))) return false
          if (!("viewport" in data.media.interactive.pages[pp].scene && hasOwn(data.media.interactive.pages[pp].scene, "viewport"))) return false
          if (!("nodes" in data.media.interactive.pages[pp].scene && hasOwn(data.media.interactive.pages[pp].scene, "nodes"))) return false
          if (!("groups" in data.media.interactive.pages[pp].scene && hasOwn(data.media.interactive.pages[pp].scene, "groups"))) return false
          if (!("edges" in data.media.interactive.pages[pp].scene && hasOwn(data.media.interactive.pages[pp].scene, "edges"))) return false
          if (!(data.media.interactive.pages[pp].scene.schema === "architecture.interactive-scene/v1")) return false
          if (!(typeof data.media.interactive.pages[pp].scene.id === "string")) return false
          if (!(pattern0.test(data.media.interactive.pages[pp].scene.id))) return false
          if (!(typeof data.media.interactive.pages[pp].scene.title === "string")) return false
          if (data.media.interactive.pages[pp].scene.title.length > 2048 && stringLength(data.media.interactive.pages[pp].scene.title) > 2048) return false
          if (data.media.interactive.pages[pp].scene.title.length < 1 || stringLength(data.media.interactive.pages[pp].scene.title) < 1) return false
          if (!(pattern1.test(data.media.interactive.pages[pp].scene.title))) return false
          if (!(typeof data.media.interactive.pages[pp].scene.subtitle === "string")) return false
          if (data.media.interactive.pages[pp].scene.subtitle.length > 2048 && stringLength(data.media.interactive.pages[pp].scene.subtitle) > 2048) return false
          if (data.media.interactive.pages[pp].scene.subtitle.length < 1 || stringLength(data.media.interactive.pages[pp].scene.subtitle) < 1) return false
          if (!(pattern1.test(data.media.interactive.pages[pp].scene.subtitle))) return false
          if (!(typeof data.media.interactive.pages[pp].scene.viewport === "object" && data.media.interactive.pages[pp].scene.viewport && !Array.isArray(data.media.interactive.pages[pp].scene.viewport))) return false
          if (!("width" in data.media.interactive.pages[pp].scene.viewport && hasOwn(data.media.interactive.pages[pp].scene.viewport, "width"))) return false
          if (!("height" in data.media.interactive.pages[pp].scene.viewport && hasOwn(data.media.interactive.pages[pp].scene.viewport, "height"))) return false
          if (!(typeof data.media.interactive.pages[pp].scene.viewport.width === "number")) return false
          if (!(0 < data.media.interactive.pages[pp].scene.viewport.width)) return false
          if (!(12000 >= data.media.interactive.pages[pp].scene.viewport.width)) return false
          if (!(typeof data.media.interactive.pages[pp].scene.viewport.height === "number")) return false
          if (!(0 < data.media.interactive.pages[pp].scene.viewport.height)) return false
          if (!(12000 >= data.media.interactive.pages[pp].scene.viewport.height)) return false
          for (const key40 of Object.keys(data.media.interactive.pages[pp].scene.viewport)) {
            if (key40 !== "width" && key40 !== "height") return false
          }
          if (!(Array.isArray(data.media.interactive.pages[pp].scene.nodes))) return false
          if (data.media.interactive.pages[pp].scene.nodes.length > 512) return false
          for (let qq = 0; qq < data.media.interactive.pages[pp].scene.nodes.length; qq++) {
            if (qq in data.media.interactive.pages[pp].scene.nodes && hasOwn(data.media.interactive.pages[pp].scene.nodes, qq)) {
              let passes5 = 0
              const sub26 = (() => {
                if (!(typeof data.media.interactive.pages[pp].scene.nodes[qq] === "object" && data.media.interactive.pages[pp].scene.nodes[qq] && !Array.isArray(data.media.interactive.pages[pp].scene.nodes[qq]))) return false
                if (!("id" in data.media.interactive.pages[pp].scene.nodes[qq] && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq], "id"))) return false
                if (!("label" in data.media.interactive.pages[pp].scene.nodes[qq] && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq], "label"))) return false
                if (!("visualRole" in data.media.interactive.pages[pp].scene.nodes[qq] && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq], "visualRole"))) return false
                if (!("position" in data.media.interactive.pages[pp].scene.nodes[qq] && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq], "position"))) return false
                if (!("size" in data.media.interactive.pages[pp].scene.nodes[qq] && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq], "size"))) return false
                if (!(typeof data.media.interactive.pages[pp].scene.nodes[qq].id === "string")) return false
                if (!(pattern0.test(data.media.interactive.pages[pp].scene.nodes[qq].id))) return false
                if (!(typeof data.media.interactive.pages[pp].scene.nodes[qq].label === "string")) return false
                if (data.media.interactive.pages[pp].scene.nodes[qq].label.length > 2048 && stringLength(data.media.interactive.pages[pp].scene.nodes[qq].label) > 2048) return false
                if (data.media.interactive.pages[pp].scene.nodes[qq].label.length < 1 || stringLength(data.media.interactive.pages[pp].scene.nodes[qq].label) < 1) return false
                if (!(pattern1.test(data.media.interactive.pages[pp].scene.nodes[qq].label))) return false
                if (!(typeof data.media.interactive.pages[pp].scene.nodes[qq].visualRole === "string")) return false
                if (data.media.interactive.pages[pp].scene.nodes[qq].visualRole.length > 2048 && stringLength(data.media.interactive.pages[pp].scene.nodes[qq].visualRole) > 2048) return false
                if (data.media.interactive.pages[pp].scene.nodes[qq].visualRole.length < 1 || stringLength(data.media.interactive.pages[pp].scene.nodes[qq].visualRole) < 1) return false
                if (!(pattern1.test(data.media.interactive.pages[pp].scene.nodes[qq].visualRole))) return false
                if (!(typeof data.media.interactive.pages[pp].scene.nodes[qq].position === "object" && data.media.interactive.pages[pp].scene.nodes[qq].position && !Array.isArray(data.media.interactive.pages[pp].scene.nodes[qq].position))) return false
                if (!("x" in data.media.interactive.pages[pp].scene.nodes[qq].position && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq].position, "x"))) return false
                if (!("y" in data.media.interactive.pages[pp].scene.nodes[qq].position && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq].position, "y"))) return false
                if (!(typeof data.media.interactive.pages[pp].scene.nodes[qq].position.x === "number")) return false
                if (!(-12000 <= data.media.interactive.pages[pp].scene.nodes[qq].position.x)) return false
                if (!(12000 >= data.media.interactive.pages[pp].scene.nodes[qq].position.x)) return false
                if (!(typeof data.media.interactive.pages[pp].scene.nodes[qq].position.y === "number")) return false
                if (!(-12000 <= data.media.interactive.pages[pp].scene.nodes[qq].position.y)) return false
                if (!(12000 >= data.media.interactive.pages[pp].scene.nodes[qq].position.y)) return false
                for (const key41 of Object.keys(data.media.interactive.pages[pp].scene.nodes[qq].position)) {
                  if (key41 !== "x" && key41 !== "y") return false
                }
                if (!(typeof data.media.interactive.pages[pp].scene.nodes[qq].size === "object" && data.media.interactive.pages[pp].scene.nodes[qq].size && !Array.isArray(data.media.interactive.pages[pp].scene.nodes[qq].size))) return false
                if (!("width" in data.media.interactive.pages[pp].scene.nodes[qq].size && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq].size, "width"))) return false
                if (!("height" in data.media.interactive.pages[pp].scene.nodes[qq].size && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq].size, "height"))) return false
                if (!(typeof data.media.interactive.pages[pp].scene.nodes[qq].size.width === "number")) return false
                if (!(0 < data.media.interactive.pages[pp].scene.nodes[qq].size.width)) return false
                if (!(12000 >= data.media.interactive.pages[pp].scene.nodes[qq].size.width)) return false
                if (!(typeof data.media.interactive.pages[pp].scene.nodes[qq].size.height === "number")) return false
                if (!(0 < data.media.interactive.pages[pp].scene.nodes[qq].size.height)) return false
                if (!(12000 >= data.media.interactive.pages[pp].scene.nodes[qq].size.height)) return false
                for (const key42 of Object.keys(data.media.interactive.pages[pp].scene.nodes[qq].size)) {
                  if (key42 !== "width" && key42 !== "height") return false
                }
                if ("detail" in data.media.interactive.pages[pp].scene.nodes[qq] && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq], "detail")) {
                  if (!(typeof data.media.interactive.pages[pp].scene.nodes[qq].detail === "string")) return false
                  if (data.media.interactive.pages[pp].scene.nodes[qq].detail.length > 2048 && stringLength(data.media.interactive.pages[pp].scene.nodes[qq].detail) > 2048) return false
                  if (data.media.interactive.pages[pp].scene.nodes[qq].detail.length < 1 || stringLength(data.media.interactive.pages[pp].scene.nodes[qq].detail) < 1) return false
                  if (!(pattern1.test(data.media.interactive.pages[pp].scene.nodes[qq].detail))) return false
                }
                if ("figureKind" in data.media.interactive.pages[pp].scene.nodes[qq] && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq], "figureKind")) {
                  if (!(typeof data.media.interactive.pages[pp].scene.nodes[qq].figureKind === "string")) return false
                  if (data.media.interactive.pages[pp].scene.nodes[qq].figureKind.length > 2048 && stringLength(data.media.interactive.pages[pp].scene.nodes[qq].figureKind) > 2048) return false
                  if (data.media.interactive.pages[pp].scene.nodes[qq].figureKind.length < 1 || stringLength(data.media.interactive.pages[pp].scene.nodes[qq].figureKind) < 1) return false
                  if (!(pattern1.test(data.media.interactive.pages[pp].scene.nodes[qq].figureKind))) return false
                }
                if ("semanticIds" in data.media.interactive.pages[pp].scene.nodes[qq] && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq], "semanticIds")) {
                  if (!(Array.isArray(data.media.interactive.pages[pp].scene.nodes[qq].semanticIds))) return false
                  if (data.media.interactive.pages[pp].scene.nodes[qq].semanticIds.length > 4096) return false
                  if (data.media.interactive.pages[pp].scene.nodes[qq].semanticIds.length < 1) return false
                  for (let rr = 0; rr < data.media.interactive.pages[pp].scene.nodes[qq].semanticIds.length; rr++) {
                    if (rr in data.media.interactive.pages[pp].scene.nodes[qq].semanticIds && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq].semanticIds, rr)) {
                      if (!(typeof data.media.interactive.pages[pp].scene.nodes[qq].semanticIds[rr] === "string")) return false
                      if (data.media.interactive.pages[pp].scene.nodes[qq].semanticIds[rr].length > 2048 && stringLength(data.media.interactive.pages[pp].scene.nodes[qq].semanticIds[rr]) > 2048) return false
                      if (data.media.interactive.pages[pp].scene.nodes[qq].semanticIds[rr].length < 1 || stringLength(data.media.interactive.pages[pp].scene.nodes[qq].semanticIds[rr]) < 1) return false
                      if (!(pattern1.test(data.media.interactive.pages[pp].scene.nodes[qq].semanticIds[rr]))) return false
                    }
                  }
                  if (!unique(data.media.interactive.pages[pp].scene.nodes[qq].semanticIds)) return false
                }
                for (const key43 of Object.keys(data.media.interactive.pages[pp].scene.nodes[qq])) {
                  if (key43 !== "id" && key43 !== "label" && key43 !== "visualRole" && key43 !== "position" && key43 !== "size" && key43 !== "detail" && key43 !== "figureKind" && key43 !== "semanticIds") return false
                }
                return true
              })()
              if (sub26) passes5++
              const sub27 = (() => {
                if (!(typeof data.media.interactive.pages[pp].scene.nodes[qq] === "object" && data.media.interactive.pages[pp].scene.nodes[qq] && !Array.isArray(data.media.interactive.pages[pp].scene.nodes[qq]))) return false
                if (!("id" in data.media.interactive.pages[pp].scene.nodes[qq] && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq], "id"))) return false
                if (!("position" in data.media.interactive.pages[pp].scene.nodes[qq] && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq], "position"))) return false
                if (!("size" in data.media.interactive.pages[pp].scene.nodes[qq] && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq], "size"))) return false
                if (!("semanticIds" in data.media.interactive.pages[pp].scene.nodes[qq] && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq], "semanticIds"))) return false
                if (!("primitives" in data.media.interactive.pages[pp].scene.nodes[qq] && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq], "primitives"))) return false
                if (!(typeof data.media.interactive.pages[pp].scene.nodes[qq].id === "string")) return false
                if (!(pattern0.test(data.media.interactive.pages[pp].scene.nodes[qq].id))) return false
                if (!(Array.isArray(data.media.interactive.pages[pp].scene.nodes[qq].semanticIds))) return false
                if (data.media.interactive.pages[pp].scene.nodes[qq].semanticIds.length > 4096) return false
                for (let ss = 0; ss < data.media.interactive.pages[pp].scene.nodes[qq].semanticIds.length; ss++) {
                  if (ss in data.media.interactive.pages[pp].scene.nodes[qq].semanticIds && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq].semanticIds, ss)) {
                    if (!(typeof data.media.interactive.pages[pp].scene.nodes[qq].semanticIds[ss] === "string")) return false
                    if (data.media.interactive.pages[pp].scene.nodes[qq].semanticIds[ss].length > 2048 && stringLength(data.media.interactive.pages[pp].scene.nodes[qq].semanticIds[ss]) > 2048) return false
                    if (data.media.interactive.pages[pp].scene.nodes[qq].semanticIds[ss].length < 1 || stringLength(data.media.interactive.pages[pp].scene.nodes[qq].semanticIds[ss]) < 1) return false
                    if (!(pattern1.test(data.media.interactive.pages[pp].scene.nodes[qq].semanticIds[ss]))) return false
                  }
                }
                if (!unique(data.media.interactive.pages[pp].scene.nodes[qq].semanticIds)) return false
                if (!(Array.isArray(data.media.interactive.pages[pp].scene.nodes[qq].primitives))) return false
                if (data.media.interactive.pages[pp].scene.nodes[qq].primitives.length > 32) return false
                if (data.media.interactive.pages[pp].scene.nodes[qq].primitives.length < 1) return false
                for (let tt = 0; tt < data.media.interactive.pages[pp].scene.nodes[qq].primitives.length; tt++) {
                  if (tt in data.media.interactive.pages[pp].scene.nodes[qq].primitives && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq].primitives, tt)) {
                    let passes6 = 0
                    const sub28 = (() => {
                      if (!(typeof data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt] === "object" && data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt] && !Array.isArray(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt]))) return false
                      if (!("kind" in data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt] && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt], "kind"))) return false
                      if (!("center" in data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt] && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt], "center"))) return false
                      if (!("radius" in data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt] && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt], "radius"))) return false
                      if (!("fill" in data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt] && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt], "fill"))) return false
                      if (!("stroke" in data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt] && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt], "stroke"))) return false
                      if (!("strokeWidth" in data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt] && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt], "strokeWidth"))) return false
                      if (!(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].kind === "circle")) return false
                      if (!(typeof data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].center === "object" && data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].center && !Array.isArray(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].center))) return false
                      if (!("x" in data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].center && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].center, "x"))) return false
                      if (!("y" in data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].center && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].center, "y"))) return false
                      if (!(typeof data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].center.x === "number")) return false
                      if (!(-12000 <= data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].center.x)) return false
                      if (!(12000 >= data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].center.x)) return false
                      if (!(typeof data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].center.y === "number")) return false
                      if (!(-12000 <= data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].center.y)) return false
                      if (!(12000 >= data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].center.y)) return false
                      for (const key44 of Object.keys(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].center)) {
                        if (key44 !== "x" && key44 !== "y") return false
                      }
                      if (!(typeof data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].radius === "number")) return false
                      if (!(0 < data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].radius)) return false
                      if (!(12000 >= data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].radius)) return false
                      const sub29 = (() => {
                        if (!(typeof data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].fill === "string")) return false
                        if (!(pattern0.test(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].fill))) return false
                        return true
                      })()
                      if (!sub29) {
                        const sub30 = (() => {
                          if (!(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].fill === null)) return false
                          return true
                        })()
                        if (!sub30) return false
                      }
                      const sub31 = (() => {
                        if (!(typeof data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].stroke === "string")) return false
                        if (!(pattern0.test(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].stroke))) return false
                        return true
                      })()
                      if (!sub31) {
                        const sub32 = (() => {
                          if (!(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].stroke === null)) return false
                          return true
                        })()
                        if (!sub32) return false
                      }
                      if (!(typeof data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].strokeWidth === "number")) return false
                      if (!(0 <= data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].strokeWidth)) return false
                      if (!(100 >= data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].strokeWidth)) return false
                      for (const key45 of Object.keys(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt])) {
                        if (key45 !== "kind" && key45 !== "center" && key45 !== "radius" && key45 !== "fill" && key45 !== "stroke" && key45 !== "strokeWidth") return false
                      }
                      return true
                    })()
                    if (sub28) passes6++
                    const sub33 = (() => {
                      if (!(typeof data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt] === "object" && data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt] && !Array.isArray(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt]))) return false
                      if (!("kind" in data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt] && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt], "kind"))) return false
                      if (!("box" in data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt] && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt], "box"))) return false
                      if (!("fill" in data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt] && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt], "fill"))) return false
                      if (!("stroke" in data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt] && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt], "stroke"))) return false
                      if (!("strokeWidth" in data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt] && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt], "strokeWidth"))) return false
                      if (!(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].kind === "rect")) return false
                      if (!(typeof data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].box === "object" && data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].box && !Array.isArray(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].box))) return false
                      if (!("x" in data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].box && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].box, "x"))) return false
                      if (!("y" in data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].box && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].box, "y"))) return false
                      if (!("width" in data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].box && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].box, "width"))) return false
                      if (!("height" in data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].box && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].box, "height"))) return false
                      if (!(typeof data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].box.x === "number")) return false
                      if (!(-12000 <= data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].box.x)) return false
                      if (!(12000 >= data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].box.x)) return false
                      if (!(typeof data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].box.y === "number")) return false
                      if (!(-12000 <= data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].box.y)) return false
                      if (!(12000 >= data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].box.y)) return false
                      if (!(typeof data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].box.width === "number")) return false
                      if (!(0 < data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].box.width)) return false
                      if (!(12000 >= data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].box.width)) return false
                      if (!(typeof data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].box.height === "number")) return false
                      if (!(0 < data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].box.height)) return false
                      if (!(12000 >= data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].box.height)) return false
                      for (const key46 of Object.keys(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].box)) {
                        if (key46 !== "x" && key46 !== "y" && key46 !== "width" && key46 !== "height") return false
                      }
                      const sub34 = (() => {
                        if (!(typeof data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].fill === "string")) return false
                        if (!(pattern0.test(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].fill))) return false
                        return true
                      })()
                      if (!sub34) {
                        const sub35 = (() => {
                          if (!(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].fill === null)) return false
                          return true
                        })()
                        if (!sub35) return false
                      }
                      const sub36 = (() => {
                        if (!(typeof data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].stroke === "string")) return false
                        if (!(pattern0.test(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].stroke))) return false
                        return true
                      })()
                      if (!sub36) {
                        const sub37 = (() => {
                          if (!(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].stroke === null)) return false
                          return true
                        })()
                        if (!sub37) return false
                      }
                      if (!(typeof data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].strokeWidth === "number")) return false
                      if (!(0 <= data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].strokeWidth)) return false
                      if (!(100 >= data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].strokeWidth)) return false
                      for (const key47 of Object.keys(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt])) {
                        if (key47 !== "kind" && key47 !== "box" && key47 !== "fill" && key47 !== "stroke" && key47 !== "strokeWidth") return false
                      }
                      return true
                    })()
                    if (sub33) passes6++
                    const sub38 = (() => {
                      if (!(typeof data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt] === "object" && data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt] && !Array.isArray(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt]))) return false
                      if (!("kind" in data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt] && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt], "kind"))) return false
                      if (!("start" in data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt] && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt], "start"))) return false
                      if (!("end" in data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt] && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt], "end"))) return false
                      if (!("fill" in data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt] && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt], "fill"))) return false
                      if (!("stroke" in data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt] && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt], "stroke"))) return false
                      if (!("strokeWidth" in data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt] && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt], "strokeWidth"))) return false
                      if (!(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].kind === "line")) return false
                      if (!(typeof data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].start === "object" && data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].start && !Array.isArray(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].start))) return false
                      if (!("x" in data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].start && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].start, "x"))) return false
                      if (!("y" in data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].start && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].start, "y"))) return false
                      if (!(typeof data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].start.x === "number")) return false
                      if (!(-12000 <= data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].start.x)) return false
                      if (!(12000 >= data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].start.x)) return false
                      if (!(typeof data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].start.y === "number")) return false
                      if (!(-12000 <= data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].start.y)) return false
                      if (!(12000 >= data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].start.y)) return false
                      for (const key48 of Object.keys(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].start)) {
                        if (key48 !== "x" && key48 !== "y") return false
                      }
                      if (!(typeof data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].end === "object" && data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].end && !Array.isArray(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].end))) return false
                      if (!("x" in data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].end && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].end, "x"))) return false
                      if (!("y" in data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].end && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].end, "y"))) return false
                      if (!(typeof data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].end.x === "number")) return false
                      if (!(-12000 <= data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].end.x)) return false
                      if (!(12000 >= data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].end.x)) return false
                      if (!(typeof data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].end.y === "number")) return false
                      if (!(-12000 <= data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].end.y)) return false
                      if (!(12000 >= data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].end.y)) return false
                      for (const key49 of Object.keys(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].end)) {
                        if (key49 !== "x" && key49 !== "y") return false
                      }
                      if (!(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].fill === null)) return false
                      const sub39 = (() => {
                        if (!(typeof data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].stroke === "string")) return false
                        if (!(pattern0.test(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].stroke))) return false
                        return true
                      })()
                      if (!sub39) {
                        const sub40 = (() => {
                          if (!(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].stroke === null)) return false
                          return true
                        })()
                        if (!sub40) return false
                      }
                      if (!(typeof data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].strokeWidth === "number")) return false
                      if (!(0 <= data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].strokeWidth)) return false
                      if (!(100 >= data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].strokeWidth)) return false
                      for (const key50 of Object.keys(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt])) {
                        if (key50 !== "kind" && key50 !== "start" && key50 !== "end" && key50 !== "fill" && key50 !== "stroke" && key50 !== "strokeWidth") return false
                      }
                      return true
                    })()
                    if (sub38) passes6++
                    const sub41 = (() => {
                      if (!(typeof data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt] === "object" && data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt] && !Array.isArray(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt]))) return false
                      if (!("kind" in data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt] && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt], "kind"))) return false
                      if (!("points" in data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt] && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt], "points"))) return false
                      if (!("closed" in data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt] && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt], "closed"))) return false
                      if (!("fill" in data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt] && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt], "fill"))) return false
                      if (!("stroke" in data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt] && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt], "stroke"))) return false
                      if (!("strokeWidth" in data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt] && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt], "strokeWidth"))) return false
                      if (!(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].kind === "polyline")) return false
                      if (!(Array.isArray(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].points))) return false
                      if (data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].points.length > 64) return false
                      if (data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].points.length < 2) return false
                      for (let uu = 0; uu < data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].points.length; uu++) {
                        if (uu in data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].points && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].points, uu)) {
                          if (!(typeof data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].points[uu] === "object" && data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].points[uu] && !Array.isArray(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].points[uu]))) return false
                          if (!("x" in data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].points[uu] && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].points[uu], "x"))) return false
                          if (!("y" in data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].points[uu] && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].points[uu], "y"))) return false
                          if (!(typeof data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].points[uu].x === "number")) return false
                          if (!(-12000 <= data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].points[uu].x)) return false
                          if (!(12000 >= data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].points[uu].x)) return false
                          if (!(typeof data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].points[uu].y === "number")) return false
                          if (!(-12000 <= data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].points[uu].y)) return false
                          if (!(12000 >= data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].points[uu].y)) return false
                          for (const key51 of Object.keys(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].points[uu])) {
                            if (key51 !== "x" && key51 !== "y") return false
                          }
                        }
                      }
                      if (!(typeof data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].closed === "boolean")) return false
                      const sub42 = (() => {
                        if (!(typeof data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].fill === "string")) return false
                        if (!(pattern0.test(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].fill))) return false
                        return true
                      })()
                      if (!sub42) {
                        const sub43 = (() => {
                          if (!(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].fill === null)) return false
                          return true
                        })()
                        if (!sub43) return false
                      }
                      const sub44 = (() => {
                        if (!(typeof data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].stroke === "string")) return false
                        if (!(pattern0.test(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].stroke))) return false
                        return true
                      })()
                      if (!sub44) {
                        const sub45 = (() => {
                          if (!(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].stroke === null)) return false
                          return true
                        })()
                        if (!sub45) return false
                      }
                      if (!(typeof data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].strokeWidth === "number")) return false
                      if (!(0 <= data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].strokeWidth)) return false
                      if (!(100 >= data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt].strokeWidth)) return false
                      for (const key52 of Object.keys(data.media.interactive.pages[pp].scene.nodes[qq].primitives[tt])) {
                        if (key52 !== "kind" && key52 !== "points" && key52 !== "closed" && key52 !== "fill" && key52 !== "stroke" && key52 !== "strokeWidth") return false
                      }
                      return true
                    })()
                    if (sub41) passes6++
                    if (passes6 !== 1) return false
                  }
                }
                if ("paintBox" in data.media.interactive.pages[pp].scene.nodes[qq] && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq], "paintBox")) {
                  if (!(typeof data.media.interactive.pages[pp].scene.nodes[qq].paintBox === "object" && data.media.interactive.pages[pp].scene.nodes[qq].paintBox && !Array.isArray(data.media.interactive.pages[pp].scene.nodes[qq].paintBox))) return false
                  if (!("x" in data.media.interactive.pages[pp].scene.nodes[qq].paintBox && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq].paintBox, "x"))) return false
                  if (!("y" in data.media.interactive.pages[pp].scene.nodes[qq].paintBox && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq].paintBox, "y"))) return false
                  if (!("width" in data.media.interactive.pages[pp].scene.nodes[qq].paintBox && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq].paintBox, "width"))) return false
                  if (!("height" in data.media.interactive.pages[pp].scene.nodes[qq].paintBox && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq].paintBox, "height"))) return false
                  if (!(typeof data.media.interactive.pages[pp].scene.nodes[qq].paintBox.x === "number")) return false
                  if (!(-12000 <= data.media.interactive.pages[pp].scene.nodes[qq].paintBox.x)) return false
                  if (!(12000 >= data.media.interactive.pages[pp].scene.nodes[qq].paintBox.x)) return false
                  if (!(typeof data.media.interactive.pages[pp].scene.nodes[qq].paintBox.y === "number")) return false
                  if (!(-12000 <= data.media.interactive.pages[pp].scene.nodes[qq].paintBox.y)) return false
                  if (!(12000 >= data.media.interactive.pages[pp].scene.nodes[qq].paintBox.y)) return false
                  if (!(typeof data.media.interactive.pages[pp].scene.nodes[qq].paintBox.width === "number")) return false
                  if (!(0 < data.media.interactive.pages[pp].scene.nodes[qq].paintBox.width)) return false
                  if (!(12000 >= data.media.interactive.pages[pp].scene.nodes[qq].paintBox.width)) return false
                  if (!(typeof data.media.interactive.pages[pp].scene.nodes[qq].paintBox.height === "number")) return false
                  if (!(0 < data.media.interactive.pages[pp].scene.nodes[qq].paintBox.height)) return false
                  if (!(12000 >= data.media.interactive.pages[pp].scene.nodes[qq].paintBox.height)) return false
                  for (const key53 of Object.keys(data.media.interactive.pages[pp].scene.nodes[qq].paintBox)) {
                    if (key53 !== "x" && key53 !== "y" && key53 !== "width" && key53 !== "height") return false
                  }
                }
                if ("adornment" in data.media.interactive.pages[pp].scene.nodes[qq] && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq], "adornment")) {
                  if (!(data.media.interactive.pages[pp].scene.nodes[qq].adornment === true)) return false
                }
                if (!(typeof data.media.interactive.pages[pp].scene.nodes[qq].position === "object" && data.media.interactive.pages[pp].scene.nodes[qq].position && !Array.isArray(data.media.interactive.pages[pp].scene.nodes[qq].position))) return false
                if (!("x" in data.media.interactive.pages[pp].scene.nodes[qq].position && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq].position, "x"))) return false
                if (!("y" in data.media.interactive.pages[pp].scene.nodes[qq].position && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq].position, "y"))) return false
                if (!(typeof data.media.interactive.pages[pp].scene.nodes[qq].position.x === "number")) return false
                if (!(-12000 <= data.media.interactive.pages[pp].scene.nodes[qq].position.x)) return false
                if (!(12000 >= data.media.interactive.pages[pp].scene.nodes[qq].position.x)) return false
                if (!(typeof data.media.interactive.pages[pp].scene.nodes[qq].position.y === "number")) return false
                if (!(-12000 <= data.media.interactive.pages[pp].scene.nodes[qq].position.y)) return false
                if (!(12000 >= data.media.interactive.pages[pp].scene.nodes[qq].position.y)) return false
                for (const key54 of Object.keys(data.media.interactive.pages[pp].scene.nodes[qq].position)) {
                  if (key54 !== "x" && key54 !== "y") return false
                }
                if (!(typeof data.media.interactive.pages[pp].scene.nodes[qq].size === "object" && data.media.interactive.pages[pp].scene.nodes[qq].size && !Array.isArray(data.media.interactive.pages[pp].scene.nodes[qq].size))) return false
                if (!("width" in data.media.interactive.pages[pp].scene.nodes[qq].size && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq].size, "width"))) return false
                if (!("height" in data.media.interactive.pages[pp].scene.nodes[qq].size && hasOwn(data.media.interactive.pages[pp].scene.nodes[qq].size, "height"))) return false
                if (!(typeof data.media.interactive.pages[pp].scene.nodes[qq].size.width === "number")) return false
                if (!(0 < data.media.interactive.pages[pp].scene.nodes[qq].size.width)) return false
                if (!(12000 >= data.media.interactive.pages[pp].scene.nodes[qq].size.width)) return false
                if (!(typeof data.media.interactive.pages[pp].scene.nodes[qq].size.height === "number")) return false
                if (!(0 < data.media.interactive.pages[pp].scene.nodes[qq].size.height)) return false
                if (!(12000 >= data.media.interactive.pages[pp].scene.nodes[qq].size.height)) return false
                for (const key55 of Object.keys(data.media.interactive.pages[pp].scene.nodes[qq].size)) {
                  if (key55 !== "width" && key55 !== "height") return false
                }
                for (const key56 of Object.keys(data.media.interactive.pages[pp].scene.nodes[qq])) {
                  if (key56 !== "id" && key56 !== "semanticIds" && key56 !== "primitives" && key56 !== "paintBox" && key56 !== "adornment" && key56 !== "position" && key56 !== "size") return false
                }
                return true
              })()
              if (sub27) passes5++
              if (passes5 !== 1) return false
            }
          }
          if (!(Array.isArray(data.media.interactive.pages[pp].scene.groups))) return false
          if (data.media.interactive.pages[pp].scene.groups.length > 256) return false
          for (let vv = 0; vv < data.media.interactive.pages[pp].scene.groups.length; vv++) {
            if (vv in data.media.interactive.pages[pp].scene.groups && hasOwn(data.media.interactive.pages[pp].scene.groups, vv)) {
              if (!(typeof data.media.interactive.pages[pp].scene.groups[vv] === "object" && data.media.interactive.pages[pp].scene.groups[vv] && !Array.isArray(data.media.interactive.pages[pp].scene.groups[vv]))) return false
              if (!("id" in data.media.interactive.pages[pp].scene.groups[vv] && hasOwn(data.media.interactive.pages[pp].scene.groups[vv], "id"))) return false
              if (!("label" in data.media.interactive.pages[pp].scene.groups[vv] && hasOwn(data.media.interactive.pages[pp].scene.groups[vv], "label"))) return false
              if (!("nodeIds" in data.media.interactive.pages[pp].scene.groups[vv] && hasOwn(data.media.interactive.pages[pp].scene.groups[vv], "nodeIds"))) return false
              if (!("padding" in data.media.interactive.pages[pp].scene.groups[vv] && hasOwn(data.media.interactive.pages[pp].scene.groups[vv], "padding"))) return false
              if (!(typeof data.media.interactive.pages[pp].scene.groups[vv].id === "string")) return false
              if (!(pattern0.test(data.media.interactive.pages[pp].scene.groups[vv].id))) return false
              if (!(typeof data.media.interactive.pages[pp].scene.groups[vv].label === "string")) return false
              if (data.media.interactive.pages[pp].scene.groups[vv].label.length > 2048 && stringLength(data.media.interactive.pages[pp].scene.groups[vv].label) > 2048) return false
              if (data.media.interactive.pages[pp].scene.groups[vv].label.length < 1 || stringLength(data.media.interactive.pages[pp].scene.groups[vv].label) < 1) return false
              if (!(pattern1.test(data.media.interactive.pages[pp].scene.groups[vv].label))) return false
              if (!(Array.isArray(data.media.interactive.pages[pp].scene.groups[vv].nodeIds))) return false
              if (data.media.interactive.pages[pp].scene.groups[vv].nodeIds.length > 512) return false
              if (data.media.interactive.pages[pp].scene.groups[vv].nodeIds.length < 1) return false
              for (let xx = 0; xx < data.media.interactive.pages[pp].scene.groups[vv].nodeIds.length; xx++) {
                if (xx in data.media.interactive.pages[pp].scene.groups[vv].nodeIds && hasOwn(data.media.interactive.pages[pp].scene.groups[vv].nodeIds, xx)) {
                  if (!(typeof data.media.interactive.pages[pp].scene.groups[vv].nodeIds[xx] === "string")) return false
                  if (!(pattern0.test(data.media.interactive.pages[pp].scene.groups[vv].nodeIds[xx]))) return false
                }
              }
              if (!unique(data.media.interactive.pages[pp].scene.groups[vv].nodeIds)) return false
              if (!(typeof data.media.interactive.pages[pp].scene.groups[vv].padding === "number")) return false
              if (!(0 <= data.media.interactive.pages[pp].scene.groups[vv].padding)) return false
              if (!(12000 >= data.media.interactive.pages[pp].scene.groups[vv].padding)) return false
              for (const key57 of Object.keys(data.media.interactive.pages[pp].scene.groups[vv])) {
                if (key57 !== "id" && key57 !== "label" && key57 !== "nodeIds" && key57 !== "padding") return false
              }
            }
          }
          if (!(Array.isArray(data.media.interactive.pages[pp].scene.edges))) return false
          if (data.media.interactive.pages[pp].scene.edges.length > 2048) return false
          for (let yy = 0; yy < data.media.interactive.pages[pp].scene.edges.length; yy++) {
            if (yy in data.media.interactive.pages[pp].scene.edges && hasOwn(data.media.interactive.pages[pp].scene.edges, yy)) {
              let passes7 = 0
              const sub46 = (() => {
                if (!(typeof data.media.interactive.pages[pp].scene.edges[yy] === "object" && data.media.interactive.pages[pp].scene.edges[yy] && !Array.isArray(data.media.interactive.pages[pp].scene.edges[yy]))) return false
                if (!("id" in data.media.interactive.pages[pp].scene.edges[yy] && hasOwn(data.media.interactive.pages[pp].scene.edges[yy], "id"))) return false
                if (!("from" in data.media.interactive.pages[pp].scene.edges[yy] && hasOwn(data.media.interactive.pages[pp].scene.edges[yy], "from"))) return false
                if (!("to" in data.media.interactive.pages[pp].scene.edges[yy] && hasOwn(data.media.interactive.pages[pp].scene.edges[yy], "to"))) return false
                if (!("label" in data.media.interactive.pages[pp].scene.edges[yy] && hasOwn(data.media.interactive.pages[pp].scene.edges[yy], "label"))) return false
                if (!("visualRole" in data.media.interactive.pages[pp].scene.edges[yy] && hasOwn(data.media.interactive.pages[pp].scene.edges[yy], "visualRole"))) return false
                if (!("fromSide" in data.media.interactive.pages[pp].scene.edges[yy] && hasOwn(data.media.interactive.pages[pp].scene.edges[yy], "fromSide"))) return false
                if (!("toSide" in data.media.interactive.pages[pp].scene.edges[yy] && hasOwn(data.media.interactive.pages[pp].scene.edges[yy], "toSide"))) return false
                if (!("route" in data.media.interactive.pages[pp].scene.edges[yy] && hasOwn(data.media.interactive.pages[pp].scene.edges[yy], "route"))) return false
                if (!(typeof data.media.interactive.pages[pp].scene.edges[yy].id === "string")) return false
                if (!(pattern0.test(data.media.interactive.pages[pp].scene.edges[yy].id))) return false
                if (!(typeof data.media.interactive.pages[pp].scene.edges[yy].from === "string")) return false
                if (!(pattern0.test(data.media.interactive.pages[pp].scene.edges[yy].from))) return false
                if (!(typeof data.media.interactive.pages[pp].scene.edges[yy].to === "string")) return false
                if (!(pattern0.test(data.media.interactive.pages[pp].scene.edges[yy].to))) return false
                if (!(typeof data.media.interactive.pages[pp].scene.edges[yy].label === "string")) return false
                if (data.media.interactive.pages[pp].scene.edges[yy].label.length > 2048 && stringLength(data.media.interactive.pages[pp].scene.edges[yy].label) > 2048) return false
                if (data.media.interactive.pages[pp].scene.edges[yy].label.length < 1 || stringLength(data.media.interactive.pages[pp].scene.edges[yy].label) < 1) return false
                if (!(pattern1.test(data.media.interactive.pages[pp].scene.edges[yy].label))) return false
                if (!(typeof data.media.interactive.pages[pp].scene.edges[yy].visualRole === "string")) return false
                if (data.media.interactive.pages[pp].scene.edges[yy].visualRole.length > 2048 && stringLength(data.media.interactive.pages[pp].scene.edges[yy].visualRole) > 2048) return false
                if (data.media.interactive.pages[pp].scene.edges[yy].visualRole.length < 1 || stringLength(data.media.interactive.pages[pp].scene.edges[yy].visualRole) < 1) return false
                if (!(pattern1.test(data.media.interactive.pages[pp].scene.edges[yy].visualRole))) return false
                if (!(data.media.interactive.pages[pp].scene.edges[yy].fromSide === "top" || data.media.interactive.pages[pp].scene.edges[yy].fromSide === "right" || data.media.interactive.pages[pp].scene.edges[yy].fromSide === "bottom" || data.media.interactive.pages[pp].scene.edges[yy].fromSide === "left")) return false
                if (!(data.media.interactive.pages[pp].scene.edges[yy].toSide === "top" || data.media.interactive.pages[pp].scene.edges[yy].toSide === "right" || data.media.interactive.pages[pp].scene.edges[yy].toSide === "bottom" || data.media.interactive.pages[pp].scene.edges[yy].toSide === "left")) return false
                if (!(data.media.interactive.pages[pp].scene.edges[yy].route === "auto" || data.media.interactive.pages[pp].scene.edges[yy].route === "straight" || data.media.interactive.pages[pp].scene.edges[yy].route === "orthogonal-h" || data.media.interactive.pages[pp].scene.edges[yy].route === "orthogonal-v")) return false
                if ("labelPlacement" in data.media.interactive.pages[pp].scene.edges[yy] && hasOwn(data.media.interactive.pages[pp].scene.edges[yy], "labelPlacement")) {
                  if (!(typeof data.media.interactive.pages[pp].scene.edges[yy].labelPlacement === "object" && data.media.interactive.pages[pp].scene.edges[yy].labelPlacement && !Array.isArray(data.media.interactive.pages[pp].scene.edges[yy].labelPlacement))) return false
                  if ("at" in data.media.interactive.pages[pp].scene.edges[yy].labelPlacement && hasOwn(data.media.interactive.pages[pp].scene.edges[yy].labelPlacement, "at")) {
                    if (!(Array.isArray(data.media.interactive.pages[pp].scene.edges[yy].labelPlacement.at))) return false
                    if (data.media.interactive.pages[pp].scene.edges[yy].labelPlacement.at.length > 2) return false
                    if (data.media.interactive.pages[pp].scene.edges[yy].labelPlacement.at.length < 2) return false
                    for (let zz = 0; zz < data.media.interactive.pages[pp].scene.edges[yy].labelPlacement.at.length; zz++) {
                      if (zz in data.media.interactive.pages[pp].scene.edges[yy].labelPlacement.at && hasOwn(data.media.interactive.pages[pp].scene.edges[yy].labelPlacement.at, zz)) {
                        if (!(typeof data.media.interactive.pages[pp].scene.edges[yy].labelPlacement.at[zz] === "number")) return false
                        if (!(-12000 <= data.media.interactive.pages[pp].scene.edges[yy].labelPlacement.at[zz])) return false
                        if (!(12000 >= data.media.interactive.pages[pp].scene.edges[yy].labelPlacement.at[zz])) return false
                      }
                    }
                  }
                  if ("dx" in data.media.interactive.pages[pp].scene.edges[yy].labelPlacement && hasOwn(data.media.interactive.pages[pp].scene.edges[yy].labelPlacement, "dx")) {
                    if (!(typeof data.media.interactive.pages[pp].scene.edges[yy].labelPlacement.dx === "number")) return false
                    if (!(-12000 <= data.media.interactive.pages[pp].scene.edges[yy].labelPlacement.dx)) return false
                    if (!(12000 >= data.media.interactive.pages[pp].scene.edges[yy].labelPlacement.dx)) return false
                  }
                  if ("dy" in data.media.interactive.pages[pp].scene.edges[yy].labelPlacement && hasOwn(data.media.interactive.pages[pp].scene.edges[yy].labelPlacement, "dy")) {
                    if (!(typeof data.media.interactive.pages[pp].scene.edges[yy].labelPlacement.dy === "number")) return false
                    if (!(-12000 <= data.media.interactive.pages[pp].scene.edges[yy].labelPlacement.dy)) return false
                    if (!(12000 >= data.media.interactive.pages[pp].scene.edges[yy].labelPlacement.dy)) return false
                  }
                  if ("segment" in data.media.interactive.pages[pp].scene.edges[yy].labelPlacement && hasOwn(data.media.interactive.pages[pp].scene.edges[yy].labelPlacement, "segment")) {
                    if (!(Number.isInteger(data.media.interactive.pages[pp].scene.edges[yy].labelPlacement.segment))) return false
                    if (!(0 <= data.media.interactive.pages[pp].scene.edges[yy].labelPlacement.segment)) return false
                    if (!(2048 >= data.media.interactive.pages[pp].scene.edges[yy].labelPlacement.segment)) return false
                  }
                  for (const key58 of Object.keys(data.media.interactive.pages[pp].scene.edges[yy].labelPlacement)) {
                    if (key58 !== "at" && key58 !== "dx" && key58 !== "dy" && key58 !== "segment") return false
                  }
                }
                if ("semanticIds" in data.media.interactive.pages[pp].scene.edges[yy] && hasOwn(data.media.interactive.pages[pp].scene.edges[yy], "semanticIds")) {
                  if (!(Array.isArray(data.media.interactive.pages[pp].scene.edges[yy].semanticIds))) return false
                  if (data.media.interactive.pages[pp].scene.edges[yy].semanticIds.length > 4096) return false
                  if (data.media.interactive.pages[pp].scene.edges[yy].semanticIds.length < 1) return false
                  for (let iii = 0; iii < data.media.interactive.pages[pp].scene.edges[yy].semanticIds.length; iii++) {
                    if (iii in data.media.interactive.pages[pp].scene.edges[yy].semanticIds && hasOwn(data.media.interactive.pages[pp].scene.edges[yy].semanticIds, iii)) {
                      if (!(typeof data.media.interactive.pages[pp].scene.edges[yy].semanticIds[iii] === "string")) return false
                      if (data.media.interactive.pages[pp].scene.edges[yy].semanticIds[iii].length > 2048 && stringLength(data.media.interactive.pages[pp].scene.edges[yy].semanticIds[iii]) > 2048) return false
                      if (data.media.interactive.pages[pp].scene.edges[yy].semanticIds[iii].length < 1 || stringLength(data.media.interactive.pages[pp].scene.edges[yy].semanticIds[iii]) < 1) return false
                      if (!(pattern1.test(data.media.interactive.pages[pp].scene.edges[yy].semanticIds[iii]))) return false
                    }
                  }
                  if (!unique(data.media.interactive.pages[pp].scene.edges[yy].semanticIds)) return false
                }
                if ("waypoints" in data.media.interactive.pages[pp].scene.edges[yy] && hasOwn(data.media.interactive.pages[pp].scene.edges[yy], "waypoints")) {
                  if (!(Array.isArray(data.media.interactive.pages[pp].scene.edges[yy].waypoints))) return false
                  if (data.media.interactive.pages[pp].scene.edges[yy].waypoints.length > 2048) return false
                  if (data.media.interactive.pages[pp].scene.edges[yy].waypoints.length < 1) return false
                  for (let jjj = 0; jjj < data.media.interactive.pages[pp].scene.edges[yy].waypoints.length; jjj++) {
                    if (jjj in data.media.interactive.pages[pp].scene.edges[yy].waypoints && hasOwn(data.media.interactive.pages[pp].scene.edges[yy].waypoints, jjj)) {
                      if (!(typeof data.media.interactive.pages[pp].scene.edges[yy].waypoints[jjj] === "object" && data.media.interactive.pages[pp].scene.edges[yy].waypoints[jjj] && !Array.isArray(data.media.interactive.pages[pp].scene.edges[yy].waypoints[jjj]))) return false
                      if (!("x" in data.media.interactive.pages[pp].scene.edges[yy].waypoints[jjj] && hasOwn(data.media.interactive.pages[pp].scene.edges[yy].waypoints[jjj], "x"))) return false
                      if (!("y" in data.media.interactive.pages[pp].scene.edges[yy].waypoints[jjj] && hasOwn(data.media.interactive.pages[pp].scene.edges[yy].waypoints[jjj], "y"))) return false
                      if (!(typeof data.media.interactive.pages[pp].scene.edges[yy].waypoints[jjj].x === "number")) return false
                      if (!(-12000 <= data.media.interactive.pages[pp].scene.edges[yy].waypoints[jjj].x)) return false
                      if (!(12000 >= data.media.interactive.pages[pp].scene.edges[yy].waypoints[jjj].x)) return false
                      if (!(typeof data.media.interactive.pages[pp].scene.edges[yy].waypoints[jjj].y === "number")) return false
                      if (!(-12000 <= data.media.interactive.pages[pp].scene.edges[yy].waypoints[jjj].y)) return false
                      if (!(12000 >= data.media.interactive.pages[pp].scene.edges[yy].waypoints[jjj].y)) return false
                      for (const key59 of Object.keys(data.media.interactive.pages[pp].scene.edges[yy].waypoints[jjj])) {
                        if (key59 !== "x" && key59 !== "y") return false
                      }
                    }
                  }
                }
                for (const key60 of Object.keys(data.media.interactive.pages[pp].scene.edges[yy])) {
                  if (key60 !== "id" && key60 !== "from" && key60 !== "to" && key60 !== "label" && key60 !== "visualRole" && key60 !== "fromSide" && key60 !== "toSide" && key60 !== "route" && key60 !== "labelPlacement" && key60 !== "semanticIds" && key60 !== "waypoints") return false
                }
                return true
              })()
              if (sub46) passes7++
              const sub47 = (() => {
                if (!(typeof data.media.interactive.pages[pp].scene.edges[yy] === "object" && data.media.interactive.pages[pp].scene.edges[yy] && !Array.isArray(data.media.interactive.pages[pp].scene.edges[yy]))) return false
                if (!("id" in data.media.interactive.pages[pp].scene.edges[yy] && hasOwn(data.media.interactive.pages[pp].scene.edges[yy], "id"))) return false
                if (!("from" in data.media.interactive.pages[pp].scene.edges[yy] && hasOwn(data.media.interactive.pages[pp].scene.edges[yy], "from"))) return false
                if (!("to" in data.media.interactive.pages[pp].scene.edges[yy] && hasOwn(data.media.interactive.pages[pp].scene.edges[yy], "to"))) return false
                if (!("points" in data.media.interactive.pages[pp].scene.edges[yy] && hasOwn(data.media.interactive.pages[pp].scene.edges[yy], "points"))) return false
                if (!("strokeWidth" in data.media.interactive.pages[pp].scene.edges[yy] && hasOwn(data.media.interactive.pages[pp].scene.edges[yy], "strokeWidth"))) return false
                if (!("strokeTone" in data.media.interactive.pages[pp].scene.edges[yy] && hasOwn(data.media.interactive.pages[pp].scene.edges[yy], "strokeTone"))) return false
                if (!("arrow" in data.media.interactive.pages[pp].scene.edges[yy] && hasOwn(data.media.interactive.pages[pp].scene.edges[yy], "arrow"))) return false
                if (!("arrowGeometry" in data.media.interactive.pages[pp].scene.edges[yy] && hasOwn(data.media.interactive.pages[pp].scene.edges[yy], "arrowGeometry"))) return false
                if (!("semanticIds" in data.media.interactive.pages[pp].scene.edges[yy] && hasOwn(data.media.interactive.pages[pp].scene.edges[yy], "semanticIds"))) return false
                if (!("adornment" in data.media.interactive.pages[pp].scene.edges[yy] && hasOwn(data.media.interactive.pages[pp].scene.edges[yy], "adornment"))) return false
                if (!(typeof data.media.interactive.pages[pp].scene.edges[yy].id === "string")) return false
                if (!(pattern0.test(data.media.interactive.pages[pp].scene.edges[yy].id))) return false
                if (!(typeof data.media.interactive.pages[pp].scene.edges[yy].from === "string")) return false
                if (!(pattern0.test(data.media.interactive.pages[pp].scene.edges[yy].from))) return false
                if (!(typeof data.media.interactive.pages[pp].scene.edges[yy].to === "string")) return false
                if (!(pattern0.test(data.media.interactive.pages[pp].scene.edges[yy].to))) return false
                if (!(data.media.interactive.pages[pp].scene.edges[yy].adornment === true)) return false
                if (!(Array.isArray(data.media.interactive.pages[pp].scene.edges[yy].semanticIds))) return false
                if (data.media.interactive.pages[pp].scene.edges[yy].semanticIds.length > 0) return false
                for (let kkk = 0; kkk < data.media.interactive.pages[pp].scene.edges[yy].semanticIds.length; kkk++) {
                  if (kkk in data.media.interactive.pages[pp].scene.edges[yy].semanticIds && hasOwn(data.media.interactive.pages[pp].scene.edges[yy].semanticIds, kkk)) {
                    if (!(typeof data.media.interactive.pages[pp].scene.edges[yy].semanticIds[kkk] === "string")) return false
                    if (data.media.interactive.pages[pp].scene.edges[yy].semanticIds[kkk].length > 2048 && stringLength(data.media.interactive.pages[pp].scene.edges[yy].semanticIds[kkk]) > 2048) return false
                    if (data.media.interactive.pages[pp].scene.edges[yy].semanticIds[kkk].length < 1 || stringLength(data.media.interactive.pages[pp].scene.edges[yy].semanticIds[kkk]) < 1) return false
                    if (!(pattern1.test(data.media.interactive.pages[pp].scene.edges[yy].semanticIds[kkk]))) return false
                  }
                }
                if (!(Array.isArray(data.media.interactive.pages[pp].scene.edges[yy].points))) return false
                if (data.media.interactive.pages[pp].scene.edges[yy].points.length > 2048) return false
                if (data.media.interactive.pages[pp].scene.edges[yy].points.length < 2) return false
                for (let lll = 0; lll < data.media.interactive.pages[pp].scene.edges[yy].points.length; lll++) {
                  if (lll in data.media.interactive.pages[pp].scene.edges[yy].points && hasOwn(data.media.interactive.pages[pp].scene.edges[yy].points, lll)) {
                    if (!(typeof data.media.interactive.pages[pp].scene.edges[yy].points[lll] === "object" && data.media.interactive.pages[pp].scene.edges[yy].points[lll] && !Array.isArray(data.media.interactive.pages[pp].scene.edges[yy].points[lll]))) return false
                    if (!("x" in data.media.interactive.pages[pp].scene.edges[yy].points[lll] && hasOwn(data.media.interactive.pages[pp].scene.edges[yy].points[lll], "x"))) return false
                    if (!("y" in data.media.interactive.pages[pp].scene.edges[yy].points[lll] && hasOwn(data.media.interactive.pages[pp].scene.edges[yy].points[lll], "y"))) return false
                    if (!(typeof data.media.interactive.pages[pp].scene.edges[yy].points[lll].x === "number")) return false
                    if (!(-12000 <= data.media.interactive.pages[pp].scene.edges[yy].points[lll].x)) return false
                    if (!(12000 >= data.media.interactive.pages[pp].scene.edges[yy].points[lll].x)) return false
                    if (!(typeof data.media.interactive.pages[pp].scene.edges[yy].points[lll].y === "number")) return false
                    if (!(-12000 <= data.media.interactive.pages[pp].scene.edges[yy].points[lll].y)) return false
                    if (!(12000 >= data.media.interactive.pages[pp].scene.edges[yy].points[lll].y)) return false
                    for (const key61 of Object.keys(data.media.interactive.pages[pp].scene.edges[yy].points[lll])) {
                      if (key61 !== "x" && key61 !== "y") return false
                    }
                  }
                }
                if (!(typeof data.media.interactive.pages[pp].scene.edges[yy].strokeWidth === "number")) return false
                if (!(0 < data.media.interactive.pages[pp].scene.edges[yy].strokeWidth)) return false
                if (!(100 >= data.media.interactive.pages[pp].scene.edges[yy].strokeWidth)) return false
                if (!(typeof data.media.interactive.pages[pp].scene.edges[yy].strokeTone === "string")) return false
                if (!(pattern0.test(data.media.interactive.pages[pp].scene.edges[yy].strokeTone))) return false
                if (!(typeof data.media.interactive.pages[pp].scene.edges[yy].arrow === "boolean")) return false
                if (!(typeof data.media.interactive.pages[pp].scene.edges[yy].arrowGeometry === "object" && data.media.interactive.pages[pp].scene.edges[yy].arrowGeometry && !Array.isArray(data.media.interactive.pages[pp].scene.edges[yy].arrowGeometry))) return false
                if (!("length" in data.media.interactive.pages[pp].scene.edges[yy].arrowGeometry && hasOwn(data.media.interactive.pages[pp].scene.edges[yy].arrowGeometry, "length"))) return false
                if (!("halfWidth" in data.media.interactive.pages[pp].scene.edges[yy].arrowGeometry && hasOwn(data.media.interactive.pages[pp].scene.edges[yy].arrowGeometry, "halfWidth"))) return false
                if (!("strokeWidth" in data.media.interactive.pages[pp].scene.edges[yy].arrowGeometry && hasOwn(data.media.interactive.pages[pp].scene.edges[yy].arrowGeometry, "strokeWidth"))) return false
                if (!(typeof data.media.interactive.pages[pp].scene.edges[yy].arrowGeometry.length === "number")) return false
                if (!(0 <= data.media.interactive.pages[pp].scene.edges[yy].arrowGeometry.length)) return false
                if (!(100 >= data.media.interactive.pages[pp].scene.edges[yy].arrowGeometry.length)) return false
                if (!(typeof data.media.interactive.pages[pp].scene.edges[yy].arrowGeometry.halfWidth === "number")) return false
                if (!(0 <= data.media.interactive.pages[pp].scene.edges[yy].arrowGeometry.halfWidth)) return false
                if (!(100 >= data.media.interactive.pages[pp].scene.edges[yy].arrowGeometry.halfWidth)) return false
                if (!(typeof data.media.interactive.pages[pp].scene.edges[yy].arrowGeometry.strokeWidth === "number")) return false
                if (!(0 <= data.media.interactive.pages[pp].scene.edges[yy].arrowGeometry.strokeWidth)) return false
                if (!(100 >= data.media.interactive.pages[pp].scene.edges[yy].arrowGeometry.strokeWidth)) return false
                for (const key62 of Object.keys(data.media.interactive.pages[pp].scene.edges[yy].arrowGeometry)) {
                  if (key62 !== "length" && key62 !== "halfWidth" && key62 !== "strokeWidth") return false
                }
                for (const key63 of Object.keys(data.media.interactive.pages[pp].scene.edges[yy])) {
                  if (key63 !== "id" && key63 !== "from" && key63 !== "to" && key63 !== "adornment" && key63 !== "semanticIds" && key63 !== "points" && key63 !== "strokeWidth" && key63 !== "strokeTone" && key63 !== "arrow" && key63 !== "arrowGeometry") return false
                }
                return true
              })()
              if (sub47) passes7++
              if (passes7 !== 1) return false
            }
          }
          if ("routes" in data.media.interactive.pages[pp].scene && hasOwn(data.media.interactive.pages[pp].scene, "routes")) {
            if (!(Array.isArray(data.media.interactive.pages[pp].scene.routes))) return false
            if (data.media.interactive.pages[pp].scene.routes.length > 2048) return false
            for (let mmm = 0; mmm < data.media.interactive.pages[pp].scene.routes.length; mmm++) {
              if (mmm in data.media.interactive.pages[pp].scene.routes && hasOwn(data.media.interactive.pages[pp].scene.routes, mmm)) {
                if (!(typeof data.media.interactive.pages[pp].scene.routes[mmm] === "object" && data.media.interactive.pages[pp].scene.routes[mmm] && !Array.isArray(data.media.interactive.pages[pp].scene.routes[mmm]))) return false
                if (!("id" in data.media.interactive.pages[pp].scene.routes[mmm] && hasOwn(data.media.interactive.pages[pp].scene.routes[mmm], "id"))) return false
                if (!("reference" in data.media.interactive.pages[pp].scene.routes[mmm] && hasOwn(data.media.interactive.pages[pp].scene.routes[mmm], "reference"))) return false
                if (!("source" in data.media.interactive.pages[pp].scene.routes[mmm] && hasOwn(data.media.interactive.pages[pp].scene.routes[mmm], "source"))) return false
                if (!("target" in data.media.interactive.pages[pp].scene.routes[mmm] && hasOwn(data.media.interactive.pages[pp].scene.routes[mmm], "target"))) return false
                if (!("traversals" in data.media.interactive.pages[pp].scene.routes[mmm] && hasOwn(data.media.interactive.pages[pp].scene.routes[mmm], "traversals"))) return false
                if (!(typeof data.media.interactive.pages[pp].scene.routes[mmm].id === "string")) return false
                if (!(pattern0.test(data.media.interactive.pages[pp].scene.routes[mmm].id))) return false
                if (!(typeof data.media.interactive.pages[pp].scene.routes[mmm].reference === "string")) return false
                if (data.media.interactive.pages[pp].scene.routes[mmm].reference.length > 2048 && stringLength(data.media.interactive.pages[pp].scene.routes[mmm].reference) > 2048) return false
                if (data.media.interactive.pages[pp].scene.routes[mmm].reference.length < 1 || stringLength(data.media.interactive.pages[pp].scene.routes[mmm].reference) < 1) return false
                if (!(pattern1.test(data.media.interactive.pages[pp].scene.routes[mmm].reference))) return false
                if (!(typeof data.media.interactive.pages[pp].scene.routes[mmm].source === "string")) return false
                if (!(pattern0.test(data.media.interactive.pages[pp].scene.routes[mmm].source))) return false
                if (!(typeof data.media.interactive.pages[pp].scene.routes[mmm].target === "string")) return false
                if (!(pattern0.test(data.media.interactive.pages[pp].scene.routes[mmm].target))) return false
                if ("editionSha256" in data.media.interactive.pages[pp].scene.routes[mmm] && hasOwn(data.media.interactive.pages[pp].scene.routes[mmm], "editionSha256")) {
                  if (!(typeof data.media.interactive.pages[pp].scene.routes[mmm].editionSha256 === "string")) return false
                  if (!(pattern3.test(data.media.interactive.pages[pp].scene.routes[mmm].editionSha256))) return false
                }
                if (!(Array.isArray(data.media.interactive.pages[pp].scene.routes[mmm].traversals))) return false
                if (data.media.interactive.pages[pp].scene.routes[mmm].traversals.length > 2048) return false
                if (data.media.interactive.pages[pp].scene.routes[mmm].traversals.length < 1) return false
                for (let nnn = 0; nnn < data.media.interactive.pages[pp].scene.routes[mmm].traversals.length; nnn++) {
                  if (nnn in data.media.interactive.pages[pp].scene.routes[mmm].traversals && hasOwn(data.media.interactive.pages[pp].scene.routes[mmm].traversals, nnn)) {
                    if (!(typeof data.media.interactive.pages[pp].scene.routes[mmm].traversals[nnn] === "object" && data.media.interactive.pages[pp].scene.routes[mmm].traversals[nnn] && !Array.isArray(data.media.interactive.pages[pp].scene.routes[mmm].traversals[nnn]))) return false
                    if (!("edge" in data.media.interactive.pages[pp].scene.routes[mmm].traversals[nnn] && hasOwn(data.media.interactive.pages[pp].scene.routes[mmm].traversals[nnn], "edge"))) return false
                    if (!("direction" in data.media.interactive.pages[pp].scene.routes[mmm].traversals[nnn] && hasOwn(data.media.interactive.pages[pp].scene.routes[mmm].traversals[nnn], "direction"))) return false
                    if (!(typeof data.media.interactive.pages[pp].scene.routes[mmm].traversals[nnn].edge === "string")) return false
                    if (!(pattern0.test(data.media.interactive.pages[pp].scene.routes[mmm].traversals[nnn].edge))) return false
                    if (!(data.media.interactive.pages[pp].scene.routes[mmm].traversals[nnn].direction === "forward" || data.media.interactive.pages[pp].scene.routes[mmm].traversals[nnn].direction === "reverse")) return false
                    for (const key64 of Object.keys(data.media.interactive.pages[pp].scene.routes[mmm].traversals[nnn])) {
                      if (key64 !== "edge" && key64 !== "direction") return false
                    }
                  }
                }
                for (const key65 of Object.keys(data.media.interactive.pages[pp].scene.routes[mmm])) {
                  if (key65 !== "id" && key65 !== "reference" && key65 !== "source" && key65 !== "target" && key65 !== "editionSha256" && key65 !== "traversals") return false
                }
              }
            }
          }
          if ("texts" in data.media.interactive.pages[pp].scene && hasOwn(data.media.interactive.pages[pp].scene, "texts")) {
            if (!(Array.isArray(data.media.interactive.pages[pp].scene.texts))) return false
            if (data.media.interactive.pages[pp].scene.texts.length > 4096) return false
            for (let ooo = 0; ooo < data.media.interactive.pages[pp].scene.texts.length; ooo++) {
              if (ooo in data.media.interactive.pages[pp].scene.texts && hasOwn(data.media.interactive.pages[pp].scene.texts, ooo)) {
                if (!(typeof data.media.interactive.pages[pp].scene.texts[ooo] === "object" && data.media.interactive.pages[pp].scene.texts[ooo] && !Array.isArray(data.media.interactive.pages[pp].scene.texts[ooo]))) return false
                if (!("id" in data.media.interactive.pages[pp].scene.texts[ooo] && hasOwn(data.media.interactive.pages[pp].scene.texts[ooo], "id"))) return false
                if (!("text" in data.media.interactive.pages[pp].scene.texts[ooo] && hasOwn(data.media.interactive.pages[pp].scene.texts[ooo], "text"))) return false
                if (!("fontSize" in data.media.interactive.pages[pp].scene.texts[ooo] && hasOwn(data.media.interactive.pages[pp].scene.texts[ooo], "fontSize"))) return false
                if (!("weight" in data.media.interactive.pages[pp].scene.texts[ooo] && hasOwn(data.media.interactive.pages[pp].scene.texts[ooo], "weight"))) return false
                if (!("anchor" in data.media.interactive.pages[pp].scene.texts[ooo] && hasOwn(data.media.interactive.pages[pp].scene.texts[ooo], "anchor"))) return false
                if (!("tone" in data.media.interactive.pages[pp].scene.texts[ooo] && hasOwn(data.media.interactive.pages[pp].scene.texts[ooo], "tone"))) return false
                if (!("x" in data.media.interactive.pages[pp].scene.texts[ooo] && hasOwn(data.media.interactive.pages[pp].scene.texts[ooo], "x"))) return false
                if (!("baseline" in data.media.interactive.pages[pp].scene.texts[ooo] && hasOwn(data.media.interactive.pages[pp].scene.texts[ooo], "baseline"))) return false
                if (!("visible" in data.media.interactive.pages[pp].scene.texts[ooo] && hasOwn(data.media.interactive.pages[pp].scene.texts[ooo], "visible"))) return false
                if (!("semanticIds" in data.media.interactive.pages[pp].scene.texts[ooo] && hasOwn(data.media.interactive.pages[pp].scene.texts[ooo], "semanticIds"))) return false
                if (!("box" in data.media.interactive.pages[pp].scene.texts[ooo] && hasOwn(data.media.interactive.pages[pp].scene.texts[ooo], "box"))) return false
                if (!(typeof data.media.interactive.pages[pp].scene.texts[ooo].id === "string")) return false
                if (!(pattern0.test(data.media.interactive.pages[pp].scene.texts[ooo].id))) return false
                if (!(typeof data.media.interactive.pages[pp].scene.texts[ooo].text === "string")) return false
                if (data.media.interactive.pages[pp].scene.texts[ooo].text.length > 2048 && stringLength(data.media.interactive.pages[pp].scene.texts[ooo].text) > 2048) return false
                if (data.media.interactive.pages[pp].scene.texts[ooo].text.length < 1 || stringLength(data.media.interactive.pages[pp].scene.texts[ooo].text) < 1) return false
                if (!(pattern1.test(data.media.interactive.pages[pp].scene.texts[ooo].text))) return false
                if (!(typeof data.media.interactive.pages[pp].scene.texts[ooo].fontSize === "number")) return false
                if (!(0 < data.media.interactive.pages[pp].scene.texts[ooo].fontSize)) return false
                if (!(300 >= data.media.interactive.pages[pp].scene.texts[ooo].fontSize)) return false
                if (!(data.media.interactive.pages[pp].scene.texts[ooo].weight === "400" || data.media.interactive.pages[pp].scene.texts[ooo].weight === "500" || data.media.interactive.pages[pp].scene.texts[ooo].weight === "600" || data.media.interactive.pages[pp].scene.texts[ooo].weight === "700")) return false
                if ("font" in data.media.interactive.pages[pp].scene.texts[ooo] && hasOwn(data.media.interactive.pages[pp].scene.texts[ooo], "font")) {
                  if (!(typeof data.media.interactive.pages[pp].scene.texts[ooo].font === "string")) return false
                  if (!(pattern0.test(data.media.interactive.pages[pp].scene.texts[ooo].font))) return false
                }
                if ("owner" in data.media.interactive.pages[pp].scene.texts[ooo] && hasOwn(data.media.interactive.pages[pp].scene.texts[ooo], "owner")) {
                  if (!(typeof data.media.interactive.pages[pp].scene.texts[ooo].owner === "string")) return false
                  if (!(pattern0.test(data.media.interactive.pages[pp].scene.texts[ooo].owner))) return false
                }
                if (!(data.media.interactive.pages[pp].scene.texts[ooo].anchor === "start" || data.media.interactive.pages[pp].scene.texts[ooo].anchor === "middle" || data.media.interactive.pages[pp].scene.texts[ooo].anchor === "end")) return false
                if (!(typeof data.media.interactive.pages[pp].scene.texts[ooo].tone === "string")) return false
                if (!(pattern0.test(data.media.interactive.pages[pp].scene.texts[ooo].tone))) return false
                if (!(typeof data.media.interactive.pages[pp].scene.texts[ooo].x === "number")) return false
                if (!(-12000 <= data.media.interactive.pages[pp].scene.texts[ooo].x)) return false
                if (!(12000 >= data.media.interactive.pages[pp].scene.texts[ooo].x)) return false
                if (!(typeof data.media.interactive.pages[pp].scene.texts[ooo].baseline === "number")) return false
                if (!(-12000 <= data.media.interactive.pages[pp].scene.texts[ooo].baseline)) return false
                if (!(12000 >= data.media.interactive.pages[pp].scene.texts[ooo].baseline)) return false
                if (!(typeof data.media.interactive.pages[pp].scene.texts[ooo].visible === "boolean")) return false
                if (!(Array.isArray(data.media.interactive.pages[pp].scene.texts[ooo].semanticIds))) return false
                if (data.media.interactive.pages[pp].scene.texts[ooo].semanticIds.length > 4096) return false
                for (let ppp = 0; ppp < data.media.interactive.pages[pp].scene.texts[ooo].semanticIds.length; ppp++) {
                  if (ppp in data.media.interactive.pages[pp].scene.texts[ooo].semanticIds && hasOwn(data.media.interactive.pages[pp].scene.texts[ooo].semanticIds, ppp)) {
                    if (!(typeof data.media.interactive.pages[pp].scene.texts[ooo].semanticIds[ppp] === "string")) return false
                    if (data.media.interactive.pages[pp].scene.texts[ooo].semanticIds[ppp].length > 2048 && stringLength(data.media.interactive.pages[pp].scene.texts[ooo].semanticIds[ppp]) > 2048) return false
                    if (data.media.interactive.pages[pp].scene.texts[ooo].semanticIds[ppp].length < 1 || stringLength(data.media.interactive.pages[pp].scene.texts[ooo].semanticIds[ppp]) < 1) return false
                    if (!(pattern1.test(data.media.interactive.pages[pp].scene.texts[ooo].semanticIds[ppp]))) return false
                  }
                }
                if (!unique(data.media.interactive.pages[pp].scene.texts[ooo].semanticIds)) return false
                if (!(typeof data.media.interactive.pages[pp].scene.texts[ooo].box === "object" && data.media.interactive.pages[pp].scene.texts[ooo].box && !Array.isArray(data.media.interactive.pages[pp].scene.texts[ooo].box))) return false
                if (!("x" in data.media.interactive.pages[pp].scene.texts[ooo].box && hasOwn(data.media.interactive.pages[pp].scene.texts[ooo].box, "x"))) return false
                if (!("y" in data.media.interactive.pages[pp].scene.texts[ooo].box && hasOwn(data.media.interactive.pages[pp].scene.texts[ooo].box, "y"))) return false
                if (!("width" in data.media.interactive.pages[pp].scene.texts[ooo].box && hasOwn(data.media.interactive.pages[pp].scene.texts[ooo].box, "width"))) return false
                if (!("height" in data.media.interactive.pages[pp].scene.texts[ooo].box && hasOwn(data.media.interactive.pages[pp].scene.texts[ooo].box, "height"))) return false
                if (!(typeof data.media.interactive.pages[pp].scene.texts[ooo].box.x === "number")) return false
                if (!(-12000 <= data.media.interactive.pages[pp].scene.texts[ooo].box.x)) return false
                if (!(12000 >= data.media.interactive.pages[pp].scene.texts[ooo].box.x)) return false
                if (!(typeof data.media.interactive.pages[pp].scene.texts[ooo].box.y === "number")) return false
                if (!(-12000 <= data.media.interactive.pages[pp].scene.texts[ooo].box.y)) return false
                if (!(12000 >= data.media.interactive.pages[pp].scene.texts[ooo].box.y)) return false
                if (!(typeof data.media.interactive.pages[pp].scene.texts[ooo].box.width === "number")) return false
                if (!(0 < data.media.interactive.pages[pp].scene.texts[ooo].box.width)) return false
                if (!(12000 >= data.media.interactive.pages[pp].scene.texts[ooo].box.width)) return false
                if (!(typeof data.media.interactive.pages[pp].scene.texts[ooo].box.height === "number")) return false
                if (!(0 < data.media.interactive.pages[pp].scene.texts[ooo].box.height)) return false
                if (!(12000 >= data.media.interactive.pages[pp].scene.texts[ooo].box.height)) return false
                for (const key66 of Object.keys(data.media.interactive.pages[pp].scene.texts[ooo].box)) {
                  if (key66 !== "x" && key66 !== "y" && key66 !== "width" && key66 !== "height") return false
                }
                for (const key67 of Object.keys(data.media.interactive.pages[pp].scene.texts[ooo])) {
                  if (key67 !== "id" && key67 !== "text" && key67 !== "fontSize" && key67 !== "weight" && key67 !== "font" && key67 !== "owner" && key67 !== "anchor" && key67 !== "tone" && key67 !== "x" && key67 !== "baseline" && key67 !== "visible" && key67 !== "semanticIds" && key67 !== "box") return false
                }
              }
            }
          }
          if ("requiredSemanticIds" in data.media.interactive.pages[pp].scene && hasOwn(data.media.interactive.pages[pp].scene, "requiredSemanticIds")) {
            if (!(Array.isArray(data.media.interactive.pages[pp].scene.requiredSemanticIds))) return false
            if (data.media.interactive.pages[pp].scene.requiredSemanticIds.length > 8192) return false
            if (data.media.interactive.pages[pp].scene.requiredSemanticIds.length < 1) return false
            for (let qqq = 0; qqq < data.media.interactive.pages[pp].scene.requiredSemanticIds.length; qqq++) {
              if (qqq in data.media.interactive.pages[pp].scene.requiredSemanticIds && hasOwn(data.media.interactive.pages[pp].scene.requiredSemanticIds, qqq)) {
                if (!(typeof data.media.interactive.pages[pp].scene.requiredSemanticIds[qqq] === "string")) return false
                if (data.media.interactive.pages[pp].scene.requiredSemanticIds[qqq].length > 2048 && stringLength(data.media.interactive.pages[pp].scene.requiredSemanticIds[qqq]) > 2048) return false
                if (data.media.interactive.pages[pp].scene.requiredSemanticIds[qqq].length < 1 || stringLength(data.media.interactive.pages[pp].scene.requiredSemanticIds[qqq]) < 1) return false
                if (!(pattern1.test(data.media.interactive.pages[pp].scene.requiredSemanticIds[qqq]))) return false
              }
            }
            if (!unique(data.media.interactive.pages[pp].scene.requiredSemanticIds)) return false
          }
          for (const key68 of Object.keys(data.media.interactive.pages[pp].scene)) {
            if (key68 !== "schema" && key68 !== "id" && key68 !== "title" && key68 !== "subtitle" && key68 !== "viewport" && key68 !== "nodes" && key68 !== "groups" && key68 !== "edges" && key68 !== "routes" && key68 !== "texts" && key68 !== "requiredSemanticIds") return false
          }
          for (const key69 of Object.keys(data.media.interactive.pages[pp])) {
            if (key69 !== "id" && key69 !== "label" && key69 !== "purpose" && key69 !== "scene") return false
          }
        }
      }
      for (const key70 of Object.keys(data.media.interactive)) {
        if (key70 !== "kind" && key70 !== "font" && key70 !== "pages") return false
      }
      return true
    })()
    if (sub25) passes4++
    const sub48 = (() => {
      if (!(typeof data.media.interactive === "object" && data.media.interactive && !Array.isArray(data.media.interactive))) return false
      if (!("kind" in data.media.interactive && hasOwn(data.media.interactive, "kind"))) return false
      if (!(data.media.interactive.kind === "neutral")) return false
      for (const key71 of Object.keys(data.media.interactive)) {
        if (key71 !== "kind") return false
      }
      return true
    })()
    if (sub48) passes4++
    if (passes4 !== 1) {
      validate.errors = [{ keywordLocation: "#/properties/media/properties/interactive/oneOf", instanceLocation: "#/media/interactive" }]
      return false
    }
  }
  for (const key72 of Object.keys(data.media)) {
    if (key72 !== "static" && key72 !== "interactive") {
      validate.errors = [{ keywordLocation: "#/properties/media/additionalProperties", instanceLocation: "#/media/"+pointerPart(key72) }]
      return false
    }
  }
  for (const key73 of Object.keys(data)) {
    if (key73 !== "schema" && key73 !== "media") {
      validate.errors = [{ keywordLocation: "#/additionalProperties", instanceLocation: "#/"+pointerPart(key73) }]
      return false
    }
  }
  return true
};
return ref0})();;
export const primitiveValid = (function() {
'use strict'
const hasOwn = Function.prototype.call.bind(Object.prototype.hasOwnProperty);
const pointerPart = (s) => (/~\//.test(s) ? `${s}`.replace(/~/g, '~0').replace(/\//g, '~1') : s);
const pattern0 = new RegExp("^[a-z][a-z0-9-]{0,79}$", "u");
const ref0 = function validate(data) {
  validate.errors = null
  let passes0 = 0
  const sub0 = (() => {
    if (!(typeof data === "object" && data && !Array.isArray(data))) return false
    if (!("kind" in data && hasOwn(data, "kind"))) return false
    if (!("center" in data && hasOwn(data, "center"))) return false
    if (!("radius" in data && hasOwn(data, "radius"))) return false
    if (!("fill" in data && hasOwn(data, "fill"))) return false
    if (!("stroke" in data && hasOwn(data, "stroke"))) return false
    if (!("strokeWidth" in data && hasOwn(data, "strokeWidth"))) return false
    if (!(data.kind === "circle")) return false
    if (!(typeof data.center === "object" && data.center && !Array.isArray(data.center))) return false
    if (!("x" in data.center && hasOwn(data.center, "x"))) return false
    if (!("y" in data.center && hasOwn(data.center, "y"))) return false
    if (!(typeof data.center.x === "number")) return false
    if (!(-12000 <= data.center.x)) return false
    if (!(12000 >= data.center.x)) return false
    if (!(typeof data.center.y === "number")) return false
    if (!(-12000 <= data.center.y)) return false
    if (!(12000 >= data.center.y)) return false
    for (const key0 of Object.keys(data.center)) {
      if (key0 !== "x" && key0 !== "y") return false
    }
    if (!(typeof data.radius === "number")) return false
    if (!(0 < data.radius)) return false
    if (!(12000 >= data.radius)) return false
    const sub1 = (() => {
      if (!(typeof data.fill === "string")) return false
      if (!pattern0.test(data.fill)) return false
      return true
    })()
    if (!sub1) {
      const sub2 = (() => {
        if (!(data.fill === null)) return false
        return true
      })()
      if (!sub2) return false
    }
    const sub3 = (() => {
      if (!(typeof data.stroke === "string")) return false
      if (!pattern0.test(data.stroke)) return false
      return true
    })()
    if (!sub3) {
      const sub4 = (() => {
        if (!(data.stroke === null)) return false
        return true
      })()
      if (!sub4) return false
    }
    if (!(typeof data.strokeWidth === "number")) return false
    if (!(0 <= data.strokeWidth)) return false
    if (!(100 >= data.strokeWidth)) return false
    for (const key1 of Object.keys(data)) {
      if (key1 !== "kind" && key1 !== "center" && key1 !== "radius" && key1 !== "fill" && key1 !== "stroke" && key1 !== "strokeWidth") return false
    }
    return true
  })()
  if (sub0) passes0++
  const sub5 = (() => {
    if (!(typeof data === "object" && data && !Array.isArray(data))) return false
    if (!("kind" in data && hasOwn(data, "kind"))) return false
    if (!("box" in data && hasOwn(data, "box"))) return false
    if (!("fill" in data && hasOwn(data, "fill"))) return false
    if (!("stroke" in data && hasOwn(data, "stroke"))) return false
    if (!("strokeWidth" in data && hasOwn(data, "strokeWidth"))) return false
    if (!(data.kind === "rect")) return false
    if (!(typeof data.box === "object" && data.box && !Array.isArray(data.box))) return false
    if (!("x" in data.box && hasOwn(data.box, "x"))) return false
    if (!("y" in data.box && hasOwn(data.box, "y"))) return false
    if (!("width" in data.box && hasOwn(data.box, "width"))) return false
    if (!("height" in data.box && hasOwn(data.box, "height"))) return false
    if (!(typeof data.box.x === "number")) return false
    if (!(-12000 <= data.box.x)) return false
    if (!(12000 >= data.box.x)) return false
    if (!(typeof data.box.y === "number")) return false
    if (!(-12000 <= data.box.y)) return false
    if (!(12000 >= data.box.y)) return false
    if (!(typeof data.box.width === "number")) return false
    if (!(0 < data.box.width)) return false
    if (!(12000 >= data.box.width)) return false
    if (!(typeof data.box.height === "number")) return false
    if (!(0 < data.box.height)) return false
    if (!(12000 >= data.box.height)) return false
    for (const key2 of Object.keys(data.box)) {
      if (key2 !== "x" && key2 !== "y" && key2 !== "width" && key2 !== "height") return false
    }
    const sub6 = (() => {
      if (!(typeof data.fill === "string")) return false
      if (!pattern0.test(data.fill)) return false
      return true
    })()
    if (!sub6) {
      const sub7 = (() => {
        if (!(data.fill === null)) return false
        return true
      })()
      if (!sub7) return false
    }
    const sub8 = (() => {
      if (!(typeof data.stroke === "string")) return false
      if (!pattern0.test(data.stroke)) return false
      return true
    })()
    if (!sub8) {
      const sub9 = (() => {
        if (!(data.stroke === null)) return false
        return true
      })()
      if (!sub9) return false
    }
    if (!(typeof data.strokeWidth === "number")) return false
    if (!(0 <= data.strokeWidth)) return false
    if (!(100 >= data.strokeWidth)) return false
    for (const key3 of Object.keys(data)) {
      if (key3 !== "kind" && key3 !== "box" && key3 !== "fill" && key3 !== "stroke" && key3 !== "strokeWidth") return false
    }
    return true
  })()
  if (sub5) passes0++
  const sub10 = (() => {
    if (!(typeof data === "object" && data && !Array.isArray(data))) return false
    if (!("kind" in data && hasOwn(data, "kind"))) return false
    if (!("start" in data && hasOwn(data, "start"))) return false
    if (!("end" in data && hasOwn(data, "end"))) return false
    if (!("fill" in data && hasOwn(data, "fill"))) return false
    if (!("stroke" in data && hasOwn(data, "stroke"))) return false
    if (!("strokeWidth" in data && hasOwn(data, "strokeWidth"))) return false
    if (!(data.kind === "line")) return false
    if (!(typeof data.start === "object" && data.start && !Array.isArray(data.start))) return false
    if (!("x" in data.start && hasOwn(data.start, "x"))) return false
    if (!("y" in data.start && hasOwn(data.start, "y"))) return false
    if (!(typeof data.start.x === "number")) return false
    if (!(-12000 <= data.start.x)) return false
    if (!(12000 >= data.start.x)) return false
    if (!(typeof data.start.y === "number")) return false
    if (!(-12000 <= data.start.y)) return false
    if (!(12000 >= data.start.y)) return false
    for (const key4 of Object.keys(data.start)) {
      if (key4 !== "x" && key4 !== "y") return false
    }
    if (!(typeof data.end === "object" && data.end && !Array.isArray(data.end))) return false
    if (!("x" in data.end && hasOwn(data.end, "x"))) return false
    if (!("y" in data.end && hasOwn(data.end, "y"))) return false
    if (!(typeof data.end.x === "number")) return false
    if (!(-12000 <= data.end.x)) return false
    if (!(12000 >= data.end.x)) return false
    if (!(typeof data.end.y === "number")) return false
    if (!(-12000 <= data.end.y)) return false
    if (!(12000 >= data.end.y)) return false
    for (const key5 of Object.keys(data.end)) {
      if (key5 !== "x" && key5 !== "y") return false
    }
    if (!(data.fill === null)) return false
    const sub11 = (() => {
      if (!(typeof data.stroke === "string")) return false
      if (!pattern0.test(data.stroke)) return false
      return true
    })()
    if (!sub11) {
      const sub12 = (() => {
        if (!(data.stroke === null)) return false
        return true
      })()
      if (!sub12) return false
    }
    if (!(typeof data.strokeWidth === "number")) return false
    if (!(0 <= data.strokeWidth)) return false
    if (!(100 >= data.strokeWidth)) return false
    for (const key6 of Object.keys(data)) {
      if (key6 !== "kind" && key6 !== "start" && key6 !== "end" && key6 !== "fill" && key6 !== "stroke" && key6 !== "strokeWidth") return false
    }
    return true
  })()
  if (sub10) passes0++
  const sub13 = (() => {
    if (!(typeof data === "object" && data && !Array.isArray(data))) return false
    if (!("kind" in data && hasOwn(data, "kind"))) return false
    if (!("points" in data && hasOwn(data, "points"))) return false
    if (!("closed" in data && hasOwn(data, "closed"))) return false
    if (!("fill" in data && hasOwn(data, "fill"))) return false
    if (!("stroke" in data && hasOwn(data, "stroke"))) return false
    if (!("strokeWidth" in data && hasOwn(data, "strokeWidth"))) return false
    if (!(data.kind === "polyline")) return false
    if (!Array.isArray(data.points)) return false
    if (data.points.length > 64) return false
    if (data.points.length < 2) return false
    for (let i = 0; i < data.points.length; i++) {
      if (i in data.points && hasOwn(data.points, i)) {
        if (!(typeof data.points[i] === "object" && data.points[i] && !Array.isArray(data.points[i]))) return false
        if (!("x" in data.points[i] && hasOwn(data.points[i], "x"))) return false
        if (!("y" in data.points[i] && hasOwn(data.points[i], "y"))) return false
        if (!(typeof data.points[i].x === "number")) return false
        if (!(-12000 <= data.points[i].x)) return false
        if (!(12000 >= data.points[i].x)) return false
        if (!(typeof data.points[i].y === "number")) return false
        if (!(-12000 <= data.points[i].y)) return false
        if (!(12000 >= data.points[i].y)) return false
        for (const key7 of Object.keys(data.points[i])) {
          if (key7 !== "x" && key7 !== "y") return false
        }
      }
    }
    if (!(typeof data.closed === "boolean")) return false
    const sub14 = (() => {
      if (!(typeof data.fill === "string")) return false
      if (!pattern0.test(data.fill)) return false
      return true
    })()
    if (!sub14) {
      const sub15 = (() => {
        if (!(data.fill === null)) return false
        return true
      })()
      if (!sub15) return false
    }
    const sub16 = (() => {
      if (!(typeof data.stroke === "string")) return false
      if (!pattern0.test(data.stroke)) return false
      return true
    })()
    if (!sub16) {
      const sub17 = (() => {
        if (!(data.stroke === null)) return false
        return true
      })()
      if (!sub17) return false
    }
    if (!(typeof data.strokeWidth === "number")) return false
    if (!(0 <= data.strokeWidth)) return false
    if (!(100 >= data.strokeWidth)) return false
    for (const key8 of Object.keys(data)) {
      if (key8 !== "kind" && key8 !== "points" && key8 !== "closed" && key8 !== "fill" && key8 !== "stroke" && key8 !== "strokeWidth") return false
    }
    return true
  })()
  if (sub13) passes0++
  if (passes0 !== 1) {
    validate.errors = [{ keywordLocation: "#/oneOf", instanceLocation: "#" }]
    return false
  }
  return true
};
return ref0})();;
export const literalSegmentValid = (function() {
'use strict'
const hasOwn = Function.prototype.call.bind(Object.prototype.hasOwnProperty);
const pattern0 = new RegExp("^[a-z][a-z0-9-]{0,79}$", "u");
const stringLength = (string) =>
  /[\uD800-\uDFFF]/.test(string) ? [...string].length : string.length;
const pattern1 = new RegExp("^(?!\\s)(?!.*\\s$)[^\\u0000-\\u001f\\u007f]+$", "u");
const pointerPart = (s) => (/~\//.test(s) ? `${s}`.replace(/~/g, '~0').replace(/\//g, '~1') : s);
const ref0 = function validate(data) {
  validate.errors = null
  let passes0 = 0
  const sub0 = (() => {
    if (!(typeof data === "object" && data && !Array.isArray(data))) return false
    if (!("id" in data && hasOwn(data, "id"))) return false
    if (!("source" in data && hasOwn(data, "source"))) return false
    if (!("target" in data && hasOwn(data, "target"))) return false
    if (!("points" in data && hasOwn(data, "points"))) return false
    if (!("strokeWidth" in data && hasOwn(data, "strokeWidth"))) return false
    if (!("strokeTone" in data && hasOwn(data, "strokeTone"))) return false
    if (!("arrow" in data && hasOwn(data, "arrow"))) return false
    if (!("arrowGeometry" in data && hasOwn(data, "arrowGeometry"))) return false
    if (!("semanticIds" in data && hasOwn(data, "semanticIds"))) return false
    if (!("adornment" in data && hasOwn(data, "adornment"))) return false
    if (!(typeof data.id === "string")) return false
    if (!pattern0.test(data.id)) return false
    if (!(typeof data.source === "string")) return false
    if (!pattern0.test(data.source)) return false
    if (!(typeof data.target === "string")) return false
    if (!pattern0.test(data.target)) return false
    if (!(data.adornment === true)) return false
    if (!Array.isArray(data.semanticIds)) return false
    if (data.semanticIds.length > 0) return false
    for (let i = 0; i < data.semanticIds.length; i++) {
      if (i in data.semanticIds && hasOwn(data.semanticIds, i)) {
        if (!(typeof data.semanticIds[i] === "string")) return false
        if (data.semanticIds[i].length > 2048 && stringLength(data.semanticIds[i]) > 2048) return false
        if (data.semanticIds[i].length < 1 || stringLength(data.semanticIds[i]) < 1) return false
        if (!(pattern1.test(data.semanticIds[i]))) return false
      }
    }
    if (!Array.isArray(data.points)) return false
    if (data.points.length > 2048) return false
    if (data.points.length < 2) return false
    for (let j = 0; j < data.points.length; j++) {
      if (j in data.points && hasOwn(data.points, j)) {
        if (!(typeof data.points[j] === "object" && data.points[j] && !Array.isArray(data.points[j]))) return false
        if (!("x" in data.points[j] && hasOwn(data.points[j], "x"))) return false
        if (!("y" in data.points[j] && hasOwn(data.points[j], "y"))) return false
        if (!(typeof data.points[j].x === "number")) return false
        if (!(-12000 <= data.points[j].x)) return false
        if (!(12000 >= data.points[j].x)) return false
        if (!(typeof data.points[j].y === "number")) return false
        if (!(-12000 <= data.points[j].y)) return false
        if (!(12000 >= data.points[j].y)) return false
        for (const key0 of Object.keys(data.points[j])) {
          if (key0 !== "x" && key0 !== "y") return false
        }
      }
    }
    if (!(typeof data.strokeWidth === "number")) return false
    if (!(0 < data.strokeWidth)) return false
    if (!(100 >= data.strokeWidth)) return false
    if (!(typeof data.strokeTone === "string")) return false
    if (!pattern0.test(data.strokeTone)) return false
    if (!(typeof data.arrow === "boolean")) return false
    if (!(typeof data.arrowGeometry === "object" && data.arrowGeometry && !Array.isArray(data.arrowGeometry))) return false
    if (!("length" in data.arrowGeometry && hasOwn(data.arrowGeometry, "length"))) return false
    if (!("halfWidth" in data.arrowGeometry && hasOwn(data.arrowGeometry, "halfWidth"))) return false
    if (!("strokeWidth" in data.arrowGeometry && hasOwn(data.arrowGeometry, "strokeWidth"))) return false
    if (!(typeof data.arrowGeometry.length === "number")) return false
    if (!(0 <= data.arrowGeometry.length)) return false
    if (!(100 >= data.arrowGeometry.length)) return false
    if (!(typeof data.arrowGeometry.halfWidth === "number")) return false
    if (!(0 <= data.arrowGeometry.halfWidth)) return false
    if (!(100 >= data.arrowGeometry.halfWidth)) return false
    if (!(typeof data.arrowGeometry.strokeWidth === "number")) return false
    if (!(0 <= data.arrowGeometry.strokeWidth)) return false
    if (!(100 >= data.arrowGeometry.strokeWidth)) return false
    for (const key1 of Object.keys(data.arrowGeometry)) {
      if (key1 !== "length" && key1 !== "halfWidth" && key1 !== "strokeWidth") return false
    }
    for (const key2 of Object.keys(data)) {
      if (key2 !== "id" && key2 !== "source" && key2 !== "target" && key2 !== "adornment" && key2 !== "semanticIds" && key2 !== "points" && key2 !== "strokeWidth" && key2 !== "strokeTone" && key2 !== "arrow" && key2 !== "arrowGeometry") return false
    }
    return true
  })()
  if (sub0) passes0++
  const sub1 = (() => {
    if (!(typeof data === "object" && data && !Array.isArray(data))) return false
    if (!("id" in data && hasOwn(data, "id"))) return false
    if (!("from" in data && hasOwn(data, "from"))) return false
    if (!("to" in data && hasOwn(data, "to"))) return false
    if (!("points" in data && hasOwn(data, "points"))) return false
    if (!("strokeWidth" in data && hasOwn(data, "strokeWidth"))) return false
    if (!("strokeTone" in data && hasOwn(data, "strokeTone"))) return false
    if (!("arrow" in data && hasOwn(data, "arrow"))) return false
    if (!("arrowGeometry" in data && hasOwn(data, "arrowGeometry"))) return false
    if (!("semanticIds" in data && hasOwn(data, "semanticIds"))) return false
    if (!("adornment" in data && hasOwn(data, "adornment"))) return false
    if (!(typeof data.id === "string")) return false
    if (!pattern0.test(data.id)) return false
    if (!(typeof data.from === "string")) return false
    if (!pattern0.test(data.from)) return false
    if (!(typeof data.to === "string")) return false
    if (!pattern0.test(data.to)) return false
    if (!(data.adornment === true)) return false
    if (!Array.isArray(data.semanticIds)) return false
    if (data.semanticIds.length > 0) return false
    for (let k = 0; k < data.semanticIds.length; k++) {
      if (k in data.semanticIds && hasOwn(data.semanticIds, k)) {
        if (!(typeof data.semanticIds[k] === "string")) return false
        if (data.semanticIds[k].length > 2048 && stringLength(data.semanticIds[k]) > 2048) return false
        if (data.semanticIds[k].length < 1 || stringLength(data.semanticIds[k]) < 1) return false
        if (!(pattern1.test(data.semanticIds[k]))) return false
      }
    }
    if (!Array.isArray(data.points)) return false
    if (data.points.length > 2048) return false
    if (data.points.length < 2) return false
    for (let l = 0; l < data.points.length; l++) {
      if (l in data.points && hasOwn(data.points, l)) {
        if (!(typeof data.points[l] === "object" && data.points[l] && !Array.isArray(data.points[l]))) return false
        if (!("x" in data.points[l] && hasOwn(data.points[l], "x"))) return false
        if (!("y" in data.points[l] && hasOwn(data.points[l], "y"))) return false
        if (!(typeof data.points[l].x === "number")) return false
        if (!(-12000 <= data.points[l].x)) return false
        if (!(12000 >= data.points[l].x)) return false
        if (!(typeof data.points[l].y === "number")) return false
        if (!(-12000 <= data.points[l].y)) return false
        if (!(12000 >= data.points[l].y)) return false
        for (const key3 of Object.keys(data.points[l])) {
          if (key3 !== "x" && key3 !== "y") return false
        }
      }
    }
    if (!(typeof data.strokeWidth === "number")) return false
    if (!(0 < data.strokeWidth)) return false
    if (!(100 >= data.strokeWidth)) return false
    if (!(typeof data.strokeTone === "string")) return false
    if (!pattern0.test(data.strokeTone)) return false
    if (!(typeof data.arrow === "boolean")) return false
    if (!(typeof data.arrowGeometry === "object" && data.arrowGeometry && !Array.isArray(data.arrowGeometry))) return false
    if (!("length" in data.arrowGeometry && hasOwn(data.arrowGeometry, "length"))) return false
    if (!("halfWidth" in data.arrowGeometry && hasOwn(data.arrowGeometry, "halfWidth"))) return false
    if (!("strokeWidth" in data.arrowGeometry && hasOwn(data.arrowGeometry, "strokeWidth"))) return false
    if (!(typeof data.arrowGeometry.length === "number")) return false
    if (!(0 <= data.arrowGeometry.length)) return false
    if (!(100 >= data.arrowGeometry.length)) return false
    if (!(typeof data.arrowGeometry.halfWidth === "number")) return false
    if (!(0 <= data.arrowGeometry.halfWidth)) return false
    if (!(100 >= data.arrowGeometry.halfWidth)) return false
    if (!(typeof data.arrowGeometry.strokeWidth === "number")) return false
    if (!(0 <= data.arrowGeometry.strokeWidth)) return false
    if (!(100 >= data.arrowGeometry.strokeWidth)) return false
    for (const key4 of Object.keys(data.arrowGeometry)) {
      if (key4 !== "length" && key4 !== "halfWidth" && key4 !== "strokeWidth") return false
    }
    for (const key5 of Object.keys(data)) {
      if (key5 !== "id" && key5 !== "from" && key5 !== "to" && key5 !== "adornment" && key5 !== "semanticIds" && key5 !== "points" && key5 !== "strokeWidth" && key5 !== "strokeTone" && key5 !== "arrow" && key5 !== "arrowGeometry") return false
    }
    return true
  })()
  if (sub1) passes0++
  if (passes0 !== 1) {
    validate.errors = [{ keywordLocation: "#/oneOf", instanceLocation: "#" }]
    return false
  }
  return true
};
return ref0})();;
export const authoredRoutesValid = (function() {
'use strict'
const hasOwn = Function.prototype.call.bind(Object.prototype.hasOwnProperty);
const pattern0 = new RegExp("^[a-z][a-z0-9-]{0,79}$", "u");
const stringLength = (string) =>
  /[\uD800-\uDFFF]/.test(string) ? [...string].length : string.length;
const pattern1 = new RegExp("^(?!\\s)(?!.*\\s$)[^\\u0000-\\u001f\\u007f]+$", "u");
const pattern2 = new RegExp("^[a-f0-9]{64}$", "u");
const pointerPart = (s) => (/~\//.test(s) ? `${s}`.replace(/~/g, '~0').replace(/\//g, '~1') : s);
const ref0 = function validate(data) {
  validate.errors = null
  if (!Array.isArray(data)) {
    validate.errors = [{ keywordLocation: "#/type", instanceLocation: "#" }]
    return false
  }
  if (data.length > 2048) {
    validate.errors = [{ keywordLocation: "#/maxItems", instanceLocation: "#" }]
    return false
  }
  for (let i = 0; i < data.length; i++) {
    if (i in data && hasOwn(data, i)) {
      if (!(typeof data[i] === "object" && data[i] && !Array.isArray(data[i]))) {
        validate.errors = [{ keywordLocation: "#/items/type", instanceLocation: "#/"+i }]
        return false
      }
      if (!("id" in data[i] && hasOwn(data[i], "id"))) {
        validate.errors = [{ keywordLocation: "#/items/required", instanceLocation: "#/"+i+"/id" }]
        return false
      }
      if (!("reference" in data[i] && hasOwn(data[i], "reference"))) {
        validate.errors = [{ keywordLocation: "#/items/required", instanceLocation: "#/"+i+"/reference" }]
        return false
      }
      if (!("source" in data[i] && hasOwn(data[i], "source"))) {
        validate.errors = [{ keywordLocation: "#/items/required", instanceLocation: "#/"+i+"/source" }]
        return false
      }
      if (!("target" in data[i] && hasOwn(data[i], "target"))) {
        validate.errors = [{ keywordLocation: "#/items/required", instanceLocation: "#/"+i+"/target" }]
        return false
      }
      if (!("traversals" in data[i] && hasOwn(data[i], "traversals"))) {
        validate.errors = [{ keywordLocation: "#/items/required", instanceLocation: "#/"+i+"/traversals" }]
        return false
      }
      if (!(typeof data[i].id === "string")) {
        validate.errors = [{ keywordLocation: "#/items/properties/id/type", instanceLocation: "#/"+i+"/id" }]
        return false
      }
      if (!(pattern0.test(data[i].id))) {
        validate.errors = [{ keywordLocation: "#/items/properties/id/pattern", instanceLocation: "#/"+i+"/id" }]
        return false
      }
      if (!(typeof data[i].reference === "string")) {
        validate.errors = [{ keywordLocation: "#/items/properties/reference/type", instanceLocation: "#/"+i+"/reference" }]
        return false
      }
      if (data[i].reference.length > 2048 && stringLength(data[i].reference) > 2048) {
        validate.errors = [{ keywordLocation: "#/items/properties/reference/maxLength", instanceLocation: "#/"+i+"/reference" }]
        return false
      }
      if (data[i].reference.length < 1 || stringLength(data[i].reference) < 1) {
        validate.errors = [{ keywordLocation: "#/items/properties/reference/minLength", instanceLocation: "#/"+i+"/reference" }]
        return false
      }
      if (!(pattern1.test(data[i].reference))) {
        validate.errors = [{ keywordLocation: "#/items/properties/reference/pattern", instanceLocation: "#/"+i+"/reference" }]
        return false
      }
      if (!(typeof data[i].source === "string")) {
        validate.errors = [{ keywordLocation: "#/items/properties/source/type", instanceLocation: "#/"+i+"/source" }]
        return false
      }
      if (!(pattern0.test(data[i].source))) {
        validate.errors = [{ keywordLocation: "#/items/properties/source/pattern", instanceLocation: "#/"+i+"/source" }]
        return false
      }
      if (!(typeof data[i].target === "string")) {
        validate.errors = [{ keywordLocation: "#/items/properties/target/type", instanceLocation: "#/"+i+"/target" }]
        return false
      }
      if (!(pattern0.test(data[i].target))) {
        validate.errors = [{ keywordLocation: "#/items/properties/target/pattern", instanceLocation: "#/"+i+"/target" }]
        return false
      }
      if ("editionSha256" in data[i] && hasOwn(data[i], "editionSha256")) {
        if (!(typeof data[i].editionSha256 === "string")) {
          validate.errors = [{ keywordLocation: "#/items/properties/editionSha256/type", instanceLocation: "#/"+i+"/editionSha256" }]
          return false
        }
        if (!(pattern2.test(data[i].editionSha256))) {
          validate.errors = [{ keywordLocation: "#/items/properties/editionSha256/pattern", instanceLocation: "#/"+i+"/editionSha256" }]
          return false
        }
      }
      if (!(Array.isArray(data[i].traversals))) {
        validate.errors = [{ keywordLocation: "#/items/properties/traversals/type", instanceLocation: "#/"+i+"/traversals" }]
        return false
      }
      if (data[i].traversals.length > 2048) {
        validate.errors = [{ keywordLocation: "#/items/properties/traversals/maxItems", instanceLocation: "#/"+i+"/traversals" }]
        return false
      }
      if (data[i].traversals.length < 1) {
        validate.errors = [{ keywordLocation: "#/items/properties/traversals/minItems", instanceLocation: "#/"+i+"/traversals" }]
        return false
      }
      for (let j = 0; j < data[i].traversals.length; j++) {
        if (j in data[i].traversals && hasOwn(data[i].traversals, j)) {
          if (!(typeof data[i].traversals[j] === "object" && data[i].traversals[j] && !Array.isArray(data[i].traversals[j]))) {
            validate.errors = [{ keywordLocation: "#/items/properties/traversals/items/type", instanceLocation: "#/"+i+"traversals/"+j }]
            return false
          }
          if (!("edge" in data[i].traversals[j] && hasOwn(data[i].traversals[j], "edge"))) {
            validate.errors = [{ keywordLocation: "#/items/properties/traversals/items/required", instanceLocation: "#/"+i+"traversals/"+j+"/edge" }]
            return false
          }
          if (!("direction" in data[i].traversals[j] && hasOwn(data[i].traversals[j], "direction"))) {
            validate.errors = [{ keywordLocation: "#/items/properties/traversals/items/required", instanceLocation: "#/"+i+"traversals/"+j+"/direction" }]
            return false
          }
          if (!(typeof data[i].traversals[j].edge === "string")) {
            validate.errors = [{ keywordLocation: "#/items/properties/traversals/items/properties/edge/type", instanceLocation: "#/"+i+"traversals/"+j+"/edge" }]
            return false
          }
          if (!(pattern0.test(data[i].traversals[j].edge))) {
            validate.errors = [{ keywordLocation: "#/items/properties/traversals/items/properties/edge/pattern", instanceLocation: "#/"+i+"traversals/"+j+"/edge" }]
            return false
          }
          if (!(data[i].traversals[j].direction === "forward" || data[i].traversals[j].direction === "reverse")) {
            validate.errors = [{ keywordLocation: "#/items/properties/traversals/items/properties/direction/enum", instanceLocation: "#/"+i+"traversals/"+j+"/direction" }]
            return false
          }
          for (const key0 of Object.keys(data[i].traversals[j])) {
            if (key0 !== "edge" && key0 !== "direction") {
              validate.errors = [{ keywordLocation: "#/items/properties/traversals/items/additionalProperties", instanceLocation: "#/"+i+"traversals/"+j+"/"+pointerPart(key0) }]
              return false
            }
          }
        }
      }
      for (const key1 of Object.keys(data[i])) {
        if (key1 !== "id" && key1 !== "reference" && key1 !== "source" && key1 !== "target" && key1 !== "editionSha256" && key1 !== "traversals") {
          validate.errors = [{ keywordLocation: "#/items/additionalProperties", instanceLocation: "#/"+i+"/"+pointerPart(key1) }]
          return false
        }
      }
    }
  }
  return true
};
return ref0})();;
