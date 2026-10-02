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
  for (const key26 of Object.keys(data.presentation.interactive)) {
    if (key26 !== "views" && key26 !== "intent") {
      validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/additionalProperties", instanceLocation: "#/presentation/interactive/"+pointerPart(key26) }]
      return false
    }
  }
  for (const key27 of Object.keys(data.presentation)) {
    if (key27 !== "static" && key27 !== "interactive") {
      validate.errors = [{ keywordLocation: "#/properties/presentation/additionalProperties", instanceLocation: "#/presentation/"+pointerPart(key27) }]
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
  for (const key28 of Object.keys(data.visualPolicy)) {
    if (key28 !== "profile" && key28 !== "override") {
      validate.errors = [{ keywordLocation: "#/properties/visualPolicy/additionalProperties", instanceLocation: "#/visualPolicy/"+pointerPart(key28) }]
      return false
    }
  }
  for (const key29 of Object.keys(data)) {
    if (key29 !== "schema" && key29 !== "id" && key29 !== "editor" && key29 !== "title" && key29 !== "audiences" && key29 !== "questions" && key29 !== "scope" && key29 !== "editorialAssertions" && key29 !== "omissions" && key29 !== "narrative" && key29 !== "presentation" && key29 !== "visualPolicy") {
      validate.errors = [{ keywordLocation: "#/additionalProperties", instanceLocation: "#/"+pointerPart(key29) }]
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
          if (!(data.media.static.scene.texts[u].weight === "400" || data.media.static.scene.texts[u].weight === "600")) return false
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
            if (key26 !== "id" && key26 !== "text" && key26 !== "fontSize" && key26 !== "weight" && key26 !== "anchor" && key26 !== "tone" && key26 !== "x" && key26 !== "baseline" && key26 !== "visible" && key26 !== "semanticIds" && key26 !== "box") return false
          }
        }
      }
      if (!Array.isArray(data.media.static.scene.edges)) return false
      if (data.media.static.scene.edges.length > 8192) return false
      for (let x = 0; x < data.media.static.scene.edges.length; x++) {
        if (x in data.media.static.scene.edges && hasOwn(data.media.static.scene.edges, x)) {
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
        }
      }
      if (!Array.isArray(data.media.static.scene.decorations)) return false
      if (data.media.static.scene.decorations.length > 4096) return false
      for (let ii = 0; ii < data.media.static.scene.decorations.length; ii++) {
        if (ii in data.media.static.scene.decorations && hasOwn(data.media.static.scene.decorations, ii)) {
          if (!(typeof data.media.static.scene.decorations[ii] === "object" && data.media.static.scene.decorations[ii] && !Array.isArray(data.media.static.scene.decorations[ii]))) return false
          if (!("id" in data.media.static.scene.decorations[ii] && hasOwn(data.media.static.scene.decorations[ii], "id"))) return false
          if (!("role" in data.media.static.scene.decorations[ii] && hasOwn(data.media.static.scene.decorations[ii], "role"))) return false
          if (!("tone" in data.media.static.scene.decorations[ii] && hasOwn(data.media.static.scene.decorations[ii], "tone"))) return false
          if (!("points" in data.media.static.scene.decorations[ii] && hasOwn(data.media.static.scene.decorations[ii], "points"))) return false
          if (!("strokeWidth" in data.media.static.scene.decorations[ii] && hasOwn(data.media.static.scene.decorations[ii], "strokeWidth"))) return false
          if (!(typeof data.media.static.scene.decorations[ii].id === "string")) return false
          if (!(pattern0.test(data.media.static.scene.decorations[ii].id))) return false
          if (!(typeof data.media.static.scene.decorations[ii].role === "string")) return false
          if (data.media.static.scene.decorations[ii].role.length > 2048 && stringLength(data.media.static.scene.decorations[ii].role) > 2048) return false
          if (data.media.static.scene.decorations[ii].role.length < 1 || stringLength(data.media.static.scene.decorations[ii].role) < 1) return false
          if (!(pattern1.test(data.media.static.scene.decorations[ii].role))) return false
          if (!(typeof data.media.static.scene.decorations[ii].tone === "string")) return false
          if (!(pattern0.test(data.media.static.scene.decorations[ii].tone))) return false
          if (!(Array.isArray(data.media.static.scene.decorations[ii].points))) return false
          if (data.media.static.scene.decorations[ii].points.length > 2048) return false
          if (data.media.static.scene.decorations[ii].points.length < 2) return false
          for (let jj = 0; jj < data.media.static.scene.decorations[ii].points.length; jj++) {
            if (jj in data.media.static.scene.decorations[ii].points && hasOwn(data.media.static.scene.decorations[ii].points, jj)) {
              if (!(typeof data.media.static.scene.decorations[ii].points[jj] === "object" && data.media.static.scene.decorations[ii].points[jj] && !Array.isArray(data.media.static.scene.decorations[ii].points[jj]))) return false
              if (!("x" in data.media.static.scene.decorations[ii].points[jj] && hasOwn(data.media.static.scene.decorations[ii].points[jj], "x"))) return false
              if (!("y" in data.media.static.scene.decorations[ii].points[jj] && hasOwn(data.media.static.scene.decorations[ii].points[jj], "y"))) return false
              if (!(typeof data.media.static.scene.decorations[ii].points[jj].x === "number")) return false
              if (!(-12000 <= data.media.static.scene.decorations[ii].points[jj].x)) return false
              if (!(12000 >= data.media.static.scene.decorations[ii].points[jj].x)) return false
              if (!(typeof data.media.static.scene.decorations[ii].points[jj].y === "number")) return false
              if (!(-12000 <= data.media.static.scene.decorations[ii].points[jj].y)) return false
              if (!(12000 >= data.media.static.scene.decorations[ii].points[jj].y)) return false
              for (const key30 of Object.keys(data.media.static.scene.decorations[ii].points[jj])) {
                if (key30 !== "x" && key30 !== "y") return false
              }
            }
          }
          if (!(typeof data.media.static.scene.decorations[ii].strokeWidth === "number")) return false
          if (!(0 <= data.media.static.scene.decorations[ii].strokeWidth)) return false
          if (!(100 >= data.media.static.scene.decorations[ii].strokeWidth)) return false
          for (const key31 of Object.keys(data.media.static.scene.decorations[ii])) {
            if (key31 !== "id" && key31 !== "role" && key31 !== "tone" && key31 !== "points" && key31 !== "strokeWidth") return false
          }
        }
      }
      if (!Array.isArray(data.media.static.scene.requiredSemanticIds)) return false
      if (data.media.static.scene.requiredSemanticIds.length > 8192) return false
      if (data.media.static.scene.requiredSemanticIds.length < 1) return false
      for (let kk = 0; kk < data.media.static.scene.requiredSemanticIds.length; kk++) {
        if (kk in data.media.static.scene.requiredSemanticIds && hasOwn(data.media.static.scene.requiredSemanticIds, kk)) {
          if (!(typeof data.media.static.scene.requiredSemanticIds[kk] === "string")) return false
          if (data.media.static.scene.requiredSemanticIds[kk].length > 2048 && stringLength(data.media.static.scene.requiredSemanticIds[kk]) > 2048) return false
          if (data.media.static.scene.requiredSemanticIds[kk].length < 1 || stringLength(data.media.static.scene.requiredSemanticIds[kk]) < 1) return false
          if (!(pattern1.test(data.media.static.scene.requiredSemanticIds[kk]))) return false
        }
      }
      if (!unique(data.media.static.scene.requiredSemanticIds)) return false
      for (const key32 of Object.keys(data.media.static.scene)) {
        if (key32 !== "schema" && key32 !== "title" && key32 !== "subtitle" && key32 !== "description" && key32 !== "width" && key32 !== "height" && key32 !== "referenceWidth" && key32 !== "spine" && key32 !== "paint" && key32 !== "nodes" && key32 !== "texts" && key32 !== "edges" && key32 !== "decorations" && key32 !== "requiredSemanticIds") return false
      }
      for (const key33 of Object.keys(data.media.static)) {
        if (key33 !== "kind" && key33 !== "scene") return false
      }
      return true
    })()
    if (sub1) passes0++
    const sub22 = (() => {
      if (!(typeof data.media.static === "object" && data.media.static && !Array.isArray(data.media.static))) return false
      if (!("kind" in data.media.static && hasOwn(data.media.static, "kind"))) return false
      if (!(data.media.static.kind === "neutral")) return false
      for (const key34 of Object.keys(data.media.static)) {
        if (key34 !== "kind") return false
      }
      return true
    })()
    if (sub22) passes0++
    if (passes0 !== 1) {
      validate.errors = [{ keywordLocation: "#/properties/media/properties/static/oneOf", instanceLocation: "#/media/static" }]
      return false
    }
  }
  if ("interactive" in data.media && hasOwn(data.media, "interactive")) {
    let passes3 = 0
    const sub23 = (() => {
      if (!(typeof data.media.interactive === "object" && data.media.interactive && !Array.isArray(data.media.interactive))) return false
      if (!("kind" in data.media.interactive && hasOwn(data.media.interactive, "kind"))) return false
      if (!("pages" in data.media.interactive && hasOwn(data.media.interactive, "pages"))) return false
      if (!(data.media.interactive.kind === "authored-architecture")) return false
      if (!Array.isArray(data.media.interactive.pages)) return false
      if (data.media.interactive.pages.length > 64) return false
      if (data.media.interactive.pages.length < 1) return false
      for (let ll = 0; ll < data.media.interactive.pages.length; ll++) {
        if (ll in data.media.interactive.pages && hasOwn(data.media.interactive.pages, ll)) {
          if (!(typeof data.media.interactive.pages[ll] === "object" && data.media.interactive.pages[ll] && !Array.isArray(data.media.interactive.pages[ll]))) return false
          if (!("id" in data.media.interactive.pages[ll] && hasOwn(data.media.interactive.pages[ll], "id"))) return false
          if (!("label" in data.media.interactive.pages[ll] && hasOwn(data.media.interactive.pages[ll], "label"))) return false
          if (!("purpose" in data.media.interactive.pages[ll] && hasOwn(data.media.interactive.pages[ll], "purpose"))) return false
          if (!("scene" in data.media.interactive.pages[ll] && hasOwn(data.media.interactive.pages[ll], "scene"))) return false
          if (!(typeof data.media.interactive.pages[ll].id === "string")) return false
          if (!(pattern0.test(data.media.interactive.pages[ll].id))) return false
          if (!(typeof data.media.interactive.pages[ll].label === "string")) return false
          if (data.media.interactive.pages[ll].label.length > 2048 && stringLength(data.media.interactive.pages[ll].label) > 2048) return false
          if (data.media.interactive.pages[ll].label.length < 1 || stringLength(data.media.interactive.pages[ll].label) < 1) return false
          if (!(pattern1.test(data.media.interactive.pages[ll].label))) return false
          if (!(data.media.interactive.pages[ll].purpose === "overview" || data.media.interactive.pages[ll].purpose === "mechanism")) return false
          if (!(typeof data.media.interactive.pages[ll].scene === "object" && data.media.interactive.pages[ll].scene && !Array.isArray(data.media.interactive.pages[ll].scene))) return false
          if (!("schema" in data.media.interactive.pages[ll].scene && hasOwn(data.media.interactive.pages[ll].scene, "schema"))) return false
          if (!("id" in data.media.interactive.pages[ll].scene && hasOwn(data.media.interactive.pages[ll].scene, "id"))) return false
          if (!("title" in data.media.interactive.pages[ll].scene && hasOwn(data.media.interactive.pages[ll].scene, "title"))) return false
          if (!("subtitle" in data.media.interactive.pages[ll].scene && hasOwn(data.media.interactive.pages[ll].scene, "subtitle"))) return false
          if (!("viewport" in data.media.interactive.pages[ll].scene && hasOwn(data.media.interactive.pages[ll].scene, "viewport"))) return false
          if (!("nodes" in data.media.interactive.pages[ll].scene && hasOwn(data.media.interactive.pages[ll].scene, "nodes"))) return false
          if (!("groups" in data.media.interactive.pages[ll].scene && hasOwn(data.media.interactive.pages[ll].scene, "groups"))) return false
          if (!("edges" in data.media.interactive.pages[ll].scene && hasOwn(data.media.interactive.pages[ll].scene, "edges"))) return false
          if (!(data.media.interactive.pages[ll].scene.schema === "architecture.interactive-scene/v1")) return false
          if (!(typeof data.media.interactive.pages[ll].scene.id === "string")) return false
          if (!(pattern0.test(data.media.interactive.pages[ll].scene.id))) return false
          if (!(typeof data.media.interactive.pages[ll].scene.title === "string")) return false
          if (data.media.interactive.pages[ll].scene.title.length > 2048 && stringLength(data.media.interactive.pages[ll].scene.title) > 2048) return false
          if (data.media.interactive.pages[ll].scene.title.length < 1 || stringLength(data.media.interactive.pages[ll].scene.title) < 1) return false
          if (!(pattern1.test(data.media.interactive.pages[ll].scene.title))) return false
          if (!(typeof data.media.interactive.pages[ll].scene.subtitle === "string")) return false
          if (data.media.interactive.pages[ll].scene.subtitle.length > 2048 && stringLength(data.media.interactive.pages[ll].scene.subtitle) > 2048) return false
          if (data.media.interactive.pages[ll].scene.subtitle.length < 1 || stringLength(data.media.interactive.pages[ll].scene.subtitle) < 1) return false
          if (!(pattern1.test(data.media.interactive.pages[ll].scene.subtitle))) return false
          if (!(typeof data.media.interactive.pages[ll].scene.viewport === "object" && data.media.interactive.pages[ll].scene.viewport && !Array.isArray(data.media.interactive.pages[ll].scene.viewport))) return false
          if (!("width" in data.media.interactive.pages[ll].scene.viewport && hasOwn(data.media.interactive.pages[ll].scene.viewport, "width"))) return false
          if (!("height" in data.media.interactive.pages[ll].scene.viewport && hasOwn(data.media.interactive.pages[ll].scene.viewport, "height"))) return false
          if (!(typeof data.media.interactive.pages[ll].scene.viewport.width === "number")) return false
          if (!(0 < data.media.interactive.pages[ll].scene.viewport.width)) return false
          if (!(12000 >= data.media.interactive.pages[ll].scene.viewport.width)) return false
          if (!(typeof data.media.interactive.pages[ll].scene.viewport.height === "number")) return false
          if (!(0 < data.media.interactive.pages[ll].scene.viewport.height)) return false
          if (!(12000 >= data.media.interactive.pages[ll].scene.viewport.height)) return false
          for (const key35 of Object.keys(data.media.interactive.pages[ll].scene.viewport)) {
            if (key35 !== "width" && key35 !== "height") return false
          }
          if (!(Array.isArray(data.media.interactive.pages[ll].scene.nodes))) return false
          if (data.media.interactive.pages[ll].scene.nodes.length > 512) return false
          for (let mm = 0; mm < data.media.interactive.pages[ll].scene.nodes.length; mm++) {
            if (mm in data.media.interactive.pages[ll].scene.nodes && hasOwn(data.media.interactive.pages[ll].scene.nodes, mm)) {
              let passes4 = 0
              const sub24 = (() => {
                if (!(typeof data.media.interactive.pages[ll].scene.nodes[mm] === "object" && data.media.interactive.pages[ll].scene.nodes[mm] && !Array.isArray(data.media.interactive.pages[ll].scene.nodes[mm]))) return false
                if (!("id" in data.media.interactive.pages[ll].scene.nodes[mm] && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm], "id"))) return false
                if (!("label" in data.media.interactive.pages[ll].scene.nodes[mm] && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm], "label"))) return false
                if (!("visualRole" in data.media.interactive.pages[ll].scene.nodes[mm] && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm], "visualRole"))) return false
                if (!("position" in data.media.interactive.pages[ll].scene.nodes[mm] && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm], "position"))) return false
                if (!("size" in data.media.interactive.pages[ll].scene.nodes[mm] && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm], "size"))) return false
                if (!(typeof data.media.interactive.pages[ll].scene.nodes[mm].id === "string")) return false
                if (!(pattern0.test(data.media.interactive.pages[ll].scene.nodes[mm].id))) return false
                if (!(typeof data.media.interactive.pages[ll].scene.nodes[mm].label === "string")) return false
                if (data.media.interactive.pages[ll].scene.nodes[mm].label.length > 2048 && stringLength(data.media.interactive.pages[ll].scene.nodes[mm].label) > 2048) return false
                if (data.media.interactive.pages[ll].scene.nodes[mm].label.length < 1 || stringLength(data.media.interactive.pages[ll].scene.nodes[mm].label) < 1) return false
                if (!(pattern1.test(data.media.interactive.pages[ll].scene.nodes[mm].label))) return false
                if (!(typeof data.media.interactive.pages[ll].scene.nodes[mm].visualRole === "string")) return false
                if (data.media.interactive.pages[ll].scene.nodes[mm].visualRole.length > 2048 && stringLength(data.media.interactive.pages[ll].scene.nodes[mm].visualRole) > 2048) return false
                if (data.media.interactive.pages[ll].scene.nodes[mm].visualRole.length < 1 || stringLength(data.media.interactive.pages[ll].scene.nodes[mm].visualRole) < 1) return false
                if (!(pattern1.test(data.media.interactive.pages[ll].scene.nodes[mm].visualRole))) return false
                if (!(typeof data.media.interactive.pages[ll].scene.nodes[mm].position === "object" && data.media.interactive.pages[ll].scene.nodes[mm].position && !Array.isArray(data.media.interactive.pages[ll].scene.nodes[mm].position))) return false
                if (!("x" in data.media.interactive.pages[ll].scene.nodes[mm].position && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm].position, "x"))) return false
                if (!("y" in data.media.interactive.pages[ll].scene.nodes[mm].position && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm].position, "y"))) return false
                if (!(typeof data.media.interactive.pages[ll].scene.nodes[mm].position.x === "number")) return false
                if (!(-12000 <= data.media.interactive.pages[ll].scene.nodes[mm].position.x)) return false
                if (!(12000 >= data.media.interactive.pages[ll].scene.nodes[mm].position.x)) return false
                if (!(typeof data.media.interactive.pages[ll].scene.nodes[mm].position.y === "number")) return false
                if (!(-12000 <= data.media.interactive.pages[ll].scene.nodes[mm].position.y)) return false
                if (!(12000 >= data.media.interactive.pages[ll].scene.nodes[mm].position.y)) return false
                for (const key36 of Object.keys(data.media.interactive.pages[ll].scene.nodes[mm].position)) {
                  if (key36 !== "x" && key36 !== "y") return false
                }
                if (!(typeof data.media.interactive.pages[ll].scene.nodes[mm].size === "object" && data.media.interactive.pages[ll].scene.nodes[mm].size && !Array.isArray(data.media.interactive.pages[ll].scene.nodes[mm].size))) return false
                if (!("width" in data.media.interactive.pages[ll].scene.nodes[mm].size && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm].size, "width"))) return false
                if (!("height" in data.media.interactive.pages[ll].scene.nodes[mm].size && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm].size, "height"))) return false
                if (!(typeof data.media.interactive.pages[ll].scene.nodes[mm].size.width === "number")) return false
                if (!(0 < data.media.interactive.pages[ll].scene.nodes[mm].size.width)) return false
                if (!(12000 >= data.media.interactive.pages[ll].scene.nodes[mm].size.width)) return false
                if (!(typeof data.media.interactive.pages[ll].scene.nodes[mm].size.height === "number")) return false
                if (!(0 < data.media.interactive.pages[ll].scene.nodes[mm].size.height)) return false
                if (!(12000 >= data.media.interactive.pages[ll].scene.nodes[mm].size.height)) return false
                for (const key37 of Object.keys(data.media.interactive.pages[ll].scene.nodes[mm].size)) {
                  if (key37 !== "width" && key37 !== "height") return false
                }
                if ("detail" in data.media.interactive.pages[ll].scene.nodes[mm] && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm], "detail")) {
                  if (!(typeof data.media.interactive.pages[ll].scene.nodes[mm].detail === "string")) return false
                  if (data.media.interactive.pages[ll].scene.nodes[mm].detail.length > 2048 && stringLength(data.media.interactive.pages[ll].scene.nodes[mm].detail) > 2048) return false
                  if (data.media.interactive.pages[ll].scene.nodes[mm].detail.length < 1 || stringLength(data.media.interactive.pages[ll].scene.nodes[mm].detail) < 1) return false
                  if (!(pattern1.test(data.media.interactive.pages[ll].scene.nodes[mm].detail))) return false
                }
                if ("semanticIds" in data.media.interactive.pages[ll].scene.nodes[mm] && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm], "semanticIds")) {
                  if (!(Array.isArray(data.media.interactive.pages[ll].scene.nodes[mm].semanticIds))) return false
                  if (data.media.interactive.pages[ll].scene.nodes[mm].semanticIds.length > 4096) return false
                  if (data.media.interactive.pages[ll].scene.nodes[mm].semanticIds.length < 1) return false
                  for (let nn = 0; nn < data.media.interactive.pages[ll].scene.nodes[mm].semanticIds.length; nn++) {
                    if (nn in data.media.interactive.pages[ll].scene.nodes[mm].semanticIds && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm].semanticIds, nn)) {
                      if (!(typeof data.media.interactive.pages[ll].scene.nodes[mm].semanticIds[nn] === "string")) return false
                      if (data.media.interactive.pages[ll].scene.nodes[mm].semanticIds[nn].length > 2048 && stringLength(data.media.interactive.pages[ll].scene.nodes[mm].semanticIds[nn]) > 2048) return false
                      if (data.media.interactive.pages[ll].scene.nodes[mm].semanticIds[nn].length < 1 || stringLength(data.media.interactive.pages[ll].scene.nodes[mm].semanticIds[nn]) < 1) return false
                      if (!(pattern1.test(data.media.interactive.pages[ll].scene.nodes[mm].semanticIds[nn]))) return false
                    }
                  }
                  if (!unique(data.media.interactive.pages[ll].scene.nodes[mm].semanticIds)) return false
                }
                for (const key38 of Object.keys(data.media.interactive.pages[ll].scene.nodes[mm])) {
                  if (key38 !== "id" && key38 !== "label" && key38 !== "visualRole" && key38 !== "position" && key38 !== "size" && key38 !== "detail" && key38 !== "semanticIds") return false
                }
                return true
              })()
              if (sub24) passes4++
              const sub25 = (() => {
                if (!(typeof data.media.interactive.pages[ll].scene.nodes[mm] === "object" && data.media.interactive.pages[ll].scene.nodes[mm] && !Array.isArray(data.media.interactive.pages[ll].scene.nodes[mm]))) return false
                if (!("id" in data.media.interactive.pages[ll].scene.nodes[mm] && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm], "id"))) return false
                if (!("position" in data.media.interactive.pages[ll].scene.nodes[mm] && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm], "position"))) return false
                if (!("size" in data.media.interactive.pages[ll].scene.nodes[mm] && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm], "size"))) return false
                if (!("semanticIds" in data.media.interactive.pages[ll].scene.nodes[mm] && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm], "semanticIds"))) return false
                if (!("primitives" in data.media.interactive.pages[ll].scene.nodes[mm] && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm], "primitives"))) return false
                if (!(typeof data.media.interactive.pages[ll].scene.nodes[mm].id === "string")) return false
                if (!(pattern0.test(data.media.interactive.pages[ll].scene.nodes[mm].id))) return false
                if (!(Array.isArray(data.media.interactive.pages[ll].scene.nodes[mm].semanticIds))) return false
                if (data.media.interactive.pages[ll].scene.nodes[mm].semanticIds.length > 4096) return false
                for (let oo = 0; oo < data.media.interactive.pages[ll].scene.nodes[mm].semanticIds.length; oo++) {
                  if (oo in data.media.interactive.pages[ll].scene.nodes[mm].semanticIds && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm].semanticIds, oo)) {
                    if (!(typeof data.media.interactive.pages[ll].scene.nodes[mm].semanticIds[oo] === "string")) return false
                    if (data.media.interactive.pages[ll].scene.nodes[mm].semanticIds[oo].length > 2048 && stringLength(data.media.interactive.pages[ll].scene.nodes[mm].semanticIds[oo]) > 2048) return false
                    if (data.media.interactive.pages[ll].scene.nodes[mm].semanticIds[oo].length < 1 || stringLength(data.media.interactive.pages[ll].scene.nodes[mm].semanticIds[oo]) < 1) return false
                    if (!(pattern1.test(data.media.interactive.pages[ll].scene.nodes[mm].semanticIds[oo]))) return false
                  }
                }
                if (!unique(data.media.interactive.pages[ll].scene.nodes[mm].semanticIds)) return false
                if (!(Array.isArray(data.media.interactive.pages[ll].scene.nodes[mm].primitives))) return false
                if (data.media.interactive.pages[ll].scene.nodes[mm].primitives.length > 32) return false
                if (data.media.interactive.pages[ll].scene.nodes[mm].primitives.length < 1) return false
                for (let pp = 0; pp < data.media.interactive.pages[ll].scene.nodes[mm].primitives.length; pp++) {
                  if (pp in data.media.interactive.pages[ll].scene.nodes[mm].primitives && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm].primitives, pp)) {
                    let passes5 = 0
                    const sub26 = (() => {
                      if (!(typeof data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp] === "object" && data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp] && !Array.isArray(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp]))) return false
                      if (!("kind" in data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp] && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp], "kind"))) return false
                      if (!("center" in data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp] && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp], "center"))) return false
                      if (!("radius" in data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp] && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp], "radius"))) return false
                      if (!("fill" in data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp] && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp], "fill"))) return false
                      if (!("stroke" in data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp] && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp], "stroke"))) return false
                      if (!("strokeWidth" in data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp] && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp], "strokeWidth"))) return false
                      if (!(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].kind === "circle")) return false
                      if (!(typeof data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].center === "object" && data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].center && !Array.isArray(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].center))) return false
                      if (!("x" in data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].center && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].center, "x"))) return false
                      if (!("y" in data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].center && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].center, "y"))) return false
                      if (!(typeof data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].center.x === "number")) return false
                      if (!(-12000 <= data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].center.x)) return false
                      if (!(12000 >= data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].center.x)) return false
                      if (!(typeof data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].center.y === "number")) return false
                      if (!(-12000 <= data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].center.y)) return false
                      if (!(12000 >= data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].center.y)) return false
                      for (const key39 of Object.keys(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].center)) {
                        if (key39 !== "x" && key39 !== "y") return false
                      }
                      if (!(typeof data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].radius === "number")) return false
                      if (!(0 < data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].radius)) return false
                      if (!(12000 >= data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].radius)) return false
                      const sub27 = (() => {
                        if (!(typeof data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].fill === "string")) return false
                        if (!(pattern0.test(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].fill))) return false
                        return true
                      })()
                      if (!sub27) {
                        const sub28 = (() => {
                          if (!(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].fill === null)) return false
                          return true
                        })()
                        if (!sub28) return false
                      }
                      const sub29 = (() => {
                        if (!(typeof data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].stroke === "string")) return false
                        if (!(pattern0.test(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].stroke))) return false
                        return true
                      })()
                      if (!sub29) {
                        const sub30 = (() => {
                          if (!(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].stroke === null)) return false
                          return true
                        })()
                        if (!sub30) return false
                      }
                      if (!(typeof data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].strokeWidth === "number")) return false
                      if (!(0 <= data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].strokeWidth)) return false
                      if (!(100 >= data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].strokeWidth)) return false
                      for (const key40 of Object.keys(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp])) {
                        if (key40 !== "kind" && key40 !== "center" && key40 !== "radius" && key40 !== "fill" && key40 !== "stroke" && key40 !== "strokeWidth") return false
                      }
                      return true
                    })()
                    if (sub26) passes5++
                    const sub31 = (() => {
                      if (!(typeof data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp] === "object" && data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp] && !Array.isArray(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp]))) return false
                      if (!("kind" in data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp] && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp], "kind"))) return false
                      if (!("box" in data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp] && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp], "box"))) return false
                      if (!("fill" in data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp] && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp], "fill"))) return false
                      if (!("stroke" in data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp] && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp], "stroke"))) return false
                      if (!("strokeWidth" in data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp] && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp], "strokeWidth"))) return false
                      if (!(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].kind === "rect")) return false
                      if (!(typeof data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].box === "object" && data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].box && !Array.isArray(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].box))) return false
                      if (!("x" in data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].box && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].box, "x"))) return false
                      if (!("y" in data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].box && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].box, "y"))) return false
                      if (!("width" in data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].box && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].box, "width"))) return false
                      if (!("height" in data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].box && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].box, "height"))) return false
                      if (!(typeof data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].box.x === "number")) return false
                      if (!(-12000 <= data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].box.x)) return false
                      if (!(12000 >= data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].box.x)) return false
                      if (!(typeof data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].box.y === "number")) return false
                      if (!(-12000 <= data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].box.y)) return false
                      if (!(12000 >= data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].box.y)) return false
                      if (!(typeof data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].box.width === "number")) return false
                      if (!(0 < data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].box.width)) return false
                      if (!(12000 >= data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].box.width)) return false
                      if (!(typeof data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].box.height === "number")) return false
                      if (!(0 < data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].box.height)) return false
                      if (!(12000 >= data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].box.height)) return false
                      for (const key41 of Object.keys(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].box)) {
                        if (key41 !== "x" && key41 !== "y" && key41 !== "width" && key41 !== "height") return false
                      }
                      const sub32 = (() => {
                        if (!(typeof data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].fill === "string")) return false
                        if (!(pattern0.test(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].fill))) return false
                        return true
                      })()
                      if (!sub32) {
                        const sub33 = (() => {
                          if (!(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].fill === null)) return false
                          return true
                        })()
                        if (!sub33) return false
                      }
                      const sub34 = (() => {
                        if (!(typeof data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].stroke === "string")) return false
                        if (!(pattern0.test(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].stroke))) return false
                        return true
                      })()
                      if (!sub34) {
                        const sub35 = (() => {
                          if (!(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].stroke === null)) return false
                          return true
                        })()
                        if (!sub35) return false
                      }
                      if (!(typeof data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].strokeWidth === "number")) return false
                      if (!(0 <= data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].strokeWidth)) return false
                      if (!(100 >= data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].strokeWidth)) return false
                      for (const key42 of Object.keys(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp])) {
                        if (key42 !== "kind" && key42 !== "box" && key42 !== "fill" && key42 !== "stroke" && key42 !== "strokeWidth") return false
                      }
                      return true
                    })()
                    if (sub31) passes5++
                    const sub36 = (() => {
                      if (!(typeof data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp] === "object" && data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp] && !Array.isArray(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp]))) return false
                      if (!("kind" in data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp] && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp], "kind"))) return false
                      if (!("start" in data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp] && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp], "start"))) return false
                      if (!("end" in data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp] && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp], "end"))) return false
                      if (!("fill" in data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp] && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp], "fill"))) return false
                      if (!("stroke" in data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp] && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp], "stroke"))) return false
                      if (!("strokeWidth" in data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp] && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp], "strokeWidth"))) return false
                      if (!(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].kind === "line")) return false
                      if (!(typeof data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].start === "object" && data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].start && !Array.isArray(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].start))) return false
                      if (!("x" in data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].start && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].start, "x"))) return false
                      if (!("y" in data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].start && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].start, "y"))) return false
                      if (!(typeof data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].start.x === "number")) return false
                      if (!(-12000 <= data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].start.x)) return false
                      if (!(12000 >= data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].start.x)) return false
                      if (!(typeof data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].start.y === "number")) return false
                      if (!(-12000 <= data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].start.y)) return false
                      if (!(12000 >= data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].start.y)) return false
                      for (const key43 of Object.keys(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].start)) {
                        if (key43 !== "x" && key43 !== "y") return false
                      }
                      if (!(typeof data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].end === "object" && data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].end && !Array.isArray(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].end))) return false
                      if (!("x" in data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].end && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].end, "x"))) return false
                      if (!("y" in data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].end && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].end, "y"))) return false
                      if (!(typeof data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].end.x === "number")) return false
                      if (!(-12000 <= data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].end.x)) return false
                      if (!(12000 >= data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].end.x)) return false
                      if (!(typeof data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].end.y === "number")) return false
                      if (!(-12000 <= data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].end.y)) return false
                      if (!(12000 >= data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].end.y)) return false
                      for (const key44 of Object.keys(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].end)) {
                        if (key44 !== "x" && key44 !== "y") return false
                      }
                      if (!(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].fill === null)) return false
                      const sub37 = (() => {
                        if (!(typeof data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].stroke === "string")) return false
                        if (!(pattern0.test(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].stroke))) return false
                        return true
                      })()
                      if (!sub37) {
                        const sub38 = (() => {
                          if (!(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].stroke === null)) return false
                          return true
                        })()
                        if (!sub38) return false
                      }
                      if (!(typeof data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].strokeWidth === "number")) return false
                      if (!(0 <= data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].strokeWidth)) return false
                      if (!(100 >= data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].strokeWidth)) return false
                      for (const key45 of Object.keys(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp])) {
                        if (key45 !== "kind" && key45 !== "start" && key45 !== "end" && key45 !== "fill" && key45 !== "stroke" && key45 !== "strokeWidth") return false
                      }
                      return true
                    })()
                    if (sub36) passes5++
                    const sub39 = (() => {
                      if (!(typeof data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp] === "object" && data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp] && !Array.isArray(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp]))) return false
                      if (!("kind" in data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp] && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp], "kind"))) return false
                      if (!("points" in data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp] && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp], "points"))) return false
                      if (!("closed" in data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp] && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp], "closed"))) return false
                      if (!("fill" in data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp] && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp], "fill"))) return false
                      if (!("stroke" in data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp] && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp], "stroke"))) return false
                      if (!("strokeWidth" in data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp] && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp], "strokeWidth"))) return false
                      if (!(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].kind === "polyline")) return false
                      if (!(Array.isArray(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].points))) return false
                      if (data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].points.length > 64) return false
                      if (data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].points.length < 2) return false
                      for (let qq = 0; qq < data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].points.length; qq++) {
                        if (qq in data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].points && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].points, qq)) {
                          if (!(typeof data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].points[qq] === "object" && data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].points[qq] && !Array.isArray(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].points[qq]))) return false
                          if (!("x" in data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].points[qq] && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].points[qq], "x"))) return false
                          if (!("y" in data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].points[qq] && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].points[qq], "y"))) return false
                          if (!(typeof data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].points[qq].x === "number")) return false
                          if (!(-12000 <= data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].points[qq].x)) return false
                          if (!(12000 >= data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].points[qq].x)) return false
                          if (!(typeof data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].points[qq].y === "number")) return false
                          if (!(-12000 <= data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].points[qq].y)) return false
                          if (!(12000 >= data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].points[qq].y)) return false
                          for (const key46 of Object.keys(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].points[qq])) {
                            if (key46 !== "x" && key46 !== "y") return false
                          }
                        }
                      }
                      if (!(typeof data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].closed === "boolean")) return false
                      const sub40 = (() => {
                        if (!(typeof data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].fill === "string")) return false
                        if (!(pattern0.test(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].fill))) return false
                        return true
                      })()
                      if (!sub40) {
                        const sub41 = (() => {
                          if (!(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].fill === null)) return false
                          return true
                        })()
                        if (!sub41) return false
                      }
                      const sub42 = (() => {
                        if (!(typeof data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].stroke === "string")) return false
                        if (!(pattern0.test(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].stroke))) return false
                        return true
                      })()
                      if (!sub42) {
                        const sub43 = (() => {
                          if (!(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].stroke === null)) return false
                          return true
                        })()
                        if (!sub43) return false
                      }
                      if (!(typeof data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].strokeWidth === "number")) return false
                      if (!(0 <= data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].strokeWidth)) return false
                      if (!(100 >= data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp].strokeWidth)) return false
                      for (const key47 of Object.keys(data.media.interactive.pages[ll].scene.nodes[mm].primitives[pp])) {
                        if (key47 !== "kind" && key47 !== "points" && key47 !== "closed" && key47 !== "fill" && key47 !== "stroke" && key47 !== "strokeWidth") return false
                      }
                      return true
                    })()
                    if (sub39) passes5++
                    if (passes5 !== 1) return false
                  }
                }
                if ("paintBox" in data.media.interactive.pages[ll].scene.nodes[mm] && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm], "paintBox")) {
                  if (!(typeof data.media.interactive.pages[ll].scene.nodes[mm].paintBox === "object" && data.media.interactive.pages[ll].scene.nodes[mm].paintBox && !Array.isArray(data.media.interactive.pages[ll].scene.nodes[mm].paintBox))) return false
                  if (!("x" in data.media.interactive.pages[ll].scene.nodes[mm].paintBox && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm].paintBox, "x"))) return false
                  if (!("y" in data.media.interactive.pages[ll].scene.nodes[mm].paintBox && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm].paintBox, "y"))) return false
                  if (!("width" in data.media.interactive.pages[ll].scene.nodes[mm].paintBox && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm].paintBox, "width"))) return false
                  if (!("height" in data.media.interactive.pages[ll].scene.nodes[mm].paintBox && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm].paintBox, "height"))) return false
                  if (!(typeof data.media.interactive.pages[ll].scene.nodes[mm].paintBox.x === "number")) return false
                  if (!(-12000 <= data.media.interactive.pages[ll].scene.nodes[mm].paintBox.x)) return false
                  if (!(12000 >= data.media.interactive.pages[ll].scene.nodes[mm].paintBox.x)) return false
                  if (!(typeof data.media.interactive.pages[ll].scene.nodes[mm].paintBox.y === "number")) return false
                  if (!(-12000 <= data.media.interactive.pages[ll].scene.nodes[mm].paintBox.y)) return false
                  if (!(12000 >= data.media.interactive.pages[ll].scene.nodes[mm].paintBox.y)) return false
                  if (!(typeof data.media.interactive.pages[ll].scene.nodes[mm].paintBox.width === "number")) return false
                  if (!(0 < data.media.interactive.pages[ll].scene.nodes[mm].paintBox.width)) return false
                  if (!(12000 >= data.media.interactive.pages[ll].scene.nodes[mm].paintBox.width)) return false
                  if (!(typeof data.media.interactive.pages[ll].scene.nodes[mm].paintBox.height === "number")) return false
                  if (!(0 < data.media.interactive.pages[ll].scene.nodes[mm].paintBox.height)) return false
                  if (!(12000 >= data.media.interactive.pages[ll].scene.nodes[mm].paintBox.height)) return false
                  for (const key48 of Object.keys(data.media.interactive.pages[ll].scene.nodes[mm].paintBox)) {
                    if (key48 !== "x" && key48 !== "y" && key48 !== "width" && key48 !== "height") return false
                  }
                }
                if ("adornment" in data.media.interactive.pages[ll].scene.nodes[mm] && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm], "adornment")) {
                  if (!(data.media.interactive.pages[ll].scene.nodes[mm].adornment === true)) return false
                }
                if (!(typeof data.media.interactive.pages[ll].scene.nodes[mm].position === "object" && data.media.interactive.pages[ll].scene.nodes[mm].position && !Array.isArray(data.media.interactive.pages[ll].scene.nodes[mm].position))) return false
                if (!("x" in data.media.interactive.pages[ll].scene.nodes[mm].position && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm].position, "x"))) return false
                if (!("y" in data.media.interactive.pages[ll].scene.nodes[mm].position && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm].position, "y"))) return false
                if (!(typeof data.media.interactive.pages[ll].scene.nodes[mm].position.x === "number")) return false
                if (!(-12000 <= data.media.interactive.pages[ll].scene.nodes[mm].position.x)) return false
                if (!(12000 >= data.media.interactive.pages[ll].scene.nodes[mm].position.x)) return false
                if (!(typeof data.media.interactive.pages[ll].scene.nodes[mm].position.y === "number")) return false
                if (!(-12000 <= data.media.interactive.pages[ll].scene.nodes[mm].position.y)) return false
                if (!(12000 >= data.media.interactive.pages[ll].scene.nodes[mm].position.y)) return false
                for (const key49 of Object.keys(data.media.interactive.pages[ll].scene.nodes[mm].position)) {
                  if (key49 !== "x" && key49 !== "y") return false
                }
                if (!(typeof data.media.interactive.pages[ll].scene.nodes[mm].size === "object" && data.media.interactive.pages[ll].scene.nodes[mm].size && !Array.isArray(data.media.interactive.pages[ll].scene.nodes[mm].size))) return false
                if (!("width" in data.media.interactive.pages[ll].scene.nodes[mm].size && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm].size, "width"))) return false
                if (!("height" in data.media.interactive.pages[ll].scene.nodes[mm].size && hasOwn(data.media.interactive.pages[ll].scene.nodes[mm].size, "height"))) return false
                if (!(typeof data.media.interactive.pages[ll].scene.nodes[mm].size.width === "number")) return false
                if (!(0 < data.media.interactive.pages[ll].scene.nodes[mm].size.width)) return false
                if (!(12000 >= data.media.interactive.pages[ll].scene.nodes[mm].size.width)) return false
                if (!(typeof data.media.interactive.pages[ll].scene.nodes[mm].size.height === "number")) return false
                if (!(0 < data.media.interactive.pages[ll].scene.nodes[mm].size.height)) return false
                if (!(12000 >= data.media.interactive.pages[ll].scene.nodes[mm].size.height)) return false
                for (const key50 of Object.keys(data.media.interactive.pages[ll].scene.nodes[mm].size)) {
                  if (key50 !== "width" && key50 !== "height") return false
                }
                for (const key51 of Object.keys(data.media.interactive.pages[ll].scene.nodes[mm])) {
                  if (key51 !== "id" && key51 !== "semanticIds" && key51 !== "primitives" && key51 !== "paintBox" && key51 !== "adornment" && key51 !== "position" && key51 !== "size") return false
                }
                return true
              })()
              if (sub25) passes4++
              if (passes4 !== 1) return false
            }
          }
          if (!(Array.isArray(data.media.interactive.pages[ll].scene.groups))) return false
          if (data.media.interactive.pages[ll].scene.groups.length > 256) return false
          for (let rr = 0; rr < data.media.interactive.pages[ll].scene.groups.length; rr++) {
            if (rr in data.media.interactive.pages[ll].scene.groups && hasOwn(data.media.interactive.pages[ll].scene.groups, rr)) {
              if (!(typeof data.media.interactive.pages[ll].scene.groups[rr] === "object" && data.media.interactive.pages[ll].scene.groups[rr] && !Array.isArray(data.media.interactive.pages[ll].scene.groups[rr]))) return false
              if (!("id" in data.media.interactive.pages[ll].scene.groups[rr] && hasOwn(data.media.interactive.pages[ll].scene.groups[rr], "id"))) return false
              if (!("label" in data.media.interactive.pages[ll].scene.groups[rr] && hasOwn(data.media.interactive.pages[ll].scene.groups[rr], "label"))) return false
              if (!("nodeIds" in data.media.interactive.pages[ll].scene.groups[rr] && hasOwn(data.media.interactive.pages[ll].scene.groups[rr], "nodeIds"))) return false
              if (!("padding" in data.media.interactive.pages[ll].scene.groups[rr] && hasOwn(data.media.interactive.pages[ll].scene.groups[rr], "padding"))) return false
              if (!(typeof data.media.interactive.pages[ll].scene.groups[rr].id === "string")) return false
              if (!(pattern0.test(data.media.interactive.pages[ll].scene.groups[rr].id))) return false
              if (!(typeof data.media.interactive.pages[ll].scene.groups[rr].label === "string")) return false
              if (data.media.interactive.pages[ll].scene.groups[rr].label.length > 2048 && stringLength(data.media.interactive.pages[ll].scene.groups[rr].label) > 2048) return false
              if (data.media.interactive.pages[ll].scene.groups[rr].label.length < 1 || stringLength(data.media.interactive.pages[ll].scene.groups[rr].label) < 1) return false
              if (!(pattern1.test(data.media.interactive.pages[ll].scene.groups[rr].label))) return false
              if (!(Array.isArray(data.media.interactive.pages[ll].scene.groups[rr].nodeIds))) return false
              if (data.media.interactive.pages[ll].scene.groups[rr].nodeIds.length > 512) return false
              if (data.media.interactive.pages[ll].scene.groups[rr].nodeIds.length < 1) return false
              for (let ss = 0; ss < data.media.interactive.pages[ll].scene.groups[rr].nodeIds.length; ss++) {
                if (ss in data.media.interactive.pages[ll].scene.groups[rr].nodeIds && hasOwn(data.media.interactive.pages[ll].scene.groups[rr].nodeIds, ss)) {
                  if (!(typeof data.media.interactive.pages[ll].scene.groups[rr].nodeIds[ss] === "string")) return false
                  if (!(pattern0.test(data.media.interactive.pages[ll].scene.groups[rr].nodeIds[ss]))) return false
                }
              }
              if (!unique(data.media.interactive.pages[ll].scene.groups[rr].nodeIds)) return false
              if (!(typeof data.media.interactive.pages[ll].scene.groups[rr].padding === "number")) return false
              if (!(0 <= data.media.interactive.pages[ll].scene.groups[rr].padding)) return false
              if (!(12000 >= data.media.interactive.pages[ll].scene.groups[rr].padding)) return false
              for (const key52 of Object.keys(data.media.interactive.pages[ll].scene.groups[rr])) {
                if (key52 !== "id" && key52 !== "label" && key52 !== "nodeIds" && key52 !== "padding") return false
              }
            }
          }
          if (!(Array.isArray(data.media.interactive.pages[ll].scene.edges))) return false
          if (data.media.interactive.pages[ll].scene.edges.length > 2048) return false
          for (let tt = 0; tt < data.media.interactive.pages[ll].scene.edges.length; tt++) {
            if (tt in data.media.interactive.pages[ll].scene.edges && hasOwn(data.media.interactive.pages[ll].scene.edges, tt)) {
              if (!(typeof data.media.interactive.pages[ll].scene.edges[tt] === "object" && data.media.interactive.pages[ll].scene.edges[tt] && !Array.isArray(data.media.interactive.pages[ll].scene.edges[tt]))) return false
              if (!("id" in data.media.interactive.pages[ll].scene.edges[tt] && hasOwn(data.media.interactive.pages[ll].scene.edges[tt], "id"))) return false
              if (!("from" in data.media.interactive.pages[ll].scene.edges[tt] && hasOwn(data.media.interactive.pages[ll].scene.edges[tt], "from"))) return false
              if (!("to" in data.media.interactive.pages[ll].scene.edges[tt] && hasOwn(data.media.interactive.pages[ll].scene.edges[tt], "to"))) return false
              if (!("label" in data.media.interactive.pages[ll].scene.edges[tt] && hasOwn(data.media.interactive.pages[ll].scene.edges[tt], "label"))) return false
              if (!("visualRole" in data.media.interactive.pages[ll].scene.edges[tt] && hasOwn(data.media.interactive.pages[ll].scene.edges[tt], "visualRole"))) return false
              if (!("fromSide" in data.media.interactive.pages[ll].scene.edges[tt] && hasOwn(data.media.interactive.pages[ll].scene.edges[tt], "fromSide"))) return false
              if (!("toSide" in data.media.interactive.pages[ll].scene.edges[tt] && hasOwn(data.media.interactive.pages[ll].scene.edges[tt], "toSide"))) return false
              if (!("route" in data.media.interactive.pages[ll].scene.edges[tt] && hasOwn(data.media.interactive.pages[ll].scene.edges[tt], "route"))) return false
              if (!(typeof data.media.interactive.pages[ll].scene.edges[tt].id === "string")) return false
              if (!(pattern0.test(data.media.interactive.pages[ll].scene.edges[tt].id))) return false
              if (!(typeof data.media.interactive.pages[ll].scene.edges[tt].from === "string")) return false
              if (!(pattern0.test(data.media.interactive.pages[ll].scene.edges[tt].from))) return false
              if (!(typeof data.media.interactive.pages[ll].scene.edges[tt].to === "string")) return false
              if (!(pattern0.test(data.media.interactive.pages[ll].scene.edges[tt].to))) return false
              if (!(typeof data.media.interactive.pages[ll].scene.edges[tt].label === "string")) return false
              if (data.media.interactive.pages[ll].scene.edges[tt].label.length > 2048 && stringLength(data.media.interactive.pages[ll].scene.edges[tt].label) > 2048) return false
              if (data.media.interactive.pages[ll].scene.edges[tt].label.length < 1 || stringLength(data.media.interactive.pages[ll].scene.edges[tt].label) < 1) return false
              if (!(pattern1.test(data.media.interactive.pages[ll].scene.edges[tt].label))) return false
              if (!(typeof data.media.interactive.pages[ll].scene.edges[tt].visualRole === "string")) return false
              if (data.media.interactive.pages[ll].scene.edges[tt].visualRole.length > 2048 && stringLength(data.media.interactive.pages[ll].scene.edges[tt].visualRole) > 2048) return false
              if (data.media.interactive.pages[ll].scene.edges[tt].visualRole.length < 1 || stringLength(data.media.interactive.pages[ll].scene.edges[tt].visualRole) < 1) return false
              if (!(pattern1.test(data.media.interactive.pages[ll].scene.edges[tt].visualRole))) return false
              if (!(data.media.interactive.pages[ll].scene.edges[tt].fromSide === "top" || data.media.interactive.pages[ll].scene.edges[tt].fromSide === "right" || data.media.interactive.pages[ll].scene.edges[tt].fromSide === "bottom" || data.media.interactive.pages[ll].scene.edges[tt].fromSide === "left")) return false
              if (!(data.media.interactive.pages[ll].scene.edges[tt].toSide === "top" || data.media.interactive.pages[ll].scene.edges[tt].toSide === "right" || data.media.interactive.pages[ll].scene.edges[tt].toSide === "bottom" || data.media.interactive.pages[ll].scene.edges[tt].toSide === "left")) return false
              if (!(data.media.interactive.pages[ll].scene.edges[tt].route === "auto" || data.media.interactive.pages[ll].scene.edges[tt].route === "straight" || data.media.interactive.pages[ll].scene.edges[tt].route === "orthogonal-h" || data.media.interactive.pages[ll].scene.edges[tt].route === "orthogonal-v")) return false
              if ("labelPlacement" in data.media.interactive.pages[ll].scene.edges[tt] && hasOwn(data.media.interactive.pages[ll].scene.edges[tt], "labelPlacement")) {
                if (!(typeof data.media.interactive.pages[ll].scene.edges[tt].labelPlacement === "object" && data.media.interactive.pages[ll].scene.edges[tt].labelPlacement && !Array.isArray(data.media.interactive.pages[ll].scene.edges[tt].labelPlacement))) return false
                if ("at" in data.media.interactive.pages[ll].scene.edges[tt].labelPlacement && hasOwn(data.media.interactive.pages[ll].scene.edges[tt].labelPlacement, "at")) {
                  if (!(Array.isArray(data.media.interactive.pages[ll].scene.edges[tt].labelPlacement.at))) return false
                  if (data.media.interactive.pages[ll].scene.edges[tt].labelPlacement.at.length > 2) return false
                  if (data.media.interactive.pages[ll].scene.edges[tt].labelPlacement.at.length < 2) return false
                  for (let uu = 0; uu < data.media.interactive.pages[ll].scene.edges[tt].labelPlacement.at.length; uu++) {
                    if (uu in data.media.interactive.pages[ll].scene.edges[tt].labelPlacement.at && hasOwn(data.media.interactive.pages[ll].scene.edges[tt].labelPlacement.at, uu)) {
                      if (!(typeof data.media.interactive.pages[ll].scene.edges[tt].labelPlacement.at[uu] === "number")) return false
                      if (!(-12000 <= data.media.interactive.pages[ll].scene.edges[tt].labelPlacement.at[uu])) return false
                      if (!(12000 >= data.media.interactive.pages[ll].scene.edges[tt].labelPlacement.at[uu])) return false
                    }
                  }
                }
                if ("dx" in data.media.interactive.pages[ll].scene.edges[tt].labelPlacement && hasOwn(data.media.interactive.pages[ll].scene.edges[tt].labelPlacement, "dx")) {
                  if (!(typeof data.media.interactive.pages[ll].scene.edges[tt].labelPlacement.dx === "number")) return false
                  if (!(-12000 <= data.media.interactive.pages[ll].scene.edges[tt].labelPlacement.dx)) return false
                  if (!(12000 >= data.media.interactive.pages[ll].scene.edges[tt].labelPlacement.dx)) return false
                }
                if ("dy" in data.media.interactive.pages[ll].scene.edges[tt].labelPlacement && hasOwn(data.media.interactive.pages[ll].scene.edges[tt].labelPlacement, "dy")) {
                  if (!(typeof data.media.interactive.pages[ll].scene.edges[tt].labelPlacement.dy === "number")) return false
                  if (!(-12000 <= data.media.interactive.pages[ll].scene.edges[tt].labelPlacement.dy)) return false
                  if (!(12000 >= data.media.interactive.pages[ll].scene.edges[tt].labelPlacement.dy)) return false
                }
                if ("segment" in data.media.interactive.pages[ll].scene.edges[tt].labelPlacement && hasOwn(data.media.interactive.pages[ll].scene.edges[tt].labelPlacement, "segment")) {
                  if (!(Number.isInteger(data.media.interactive.pages[ll].scene.edges[tt].labelPlacement.segment))) return false
                  if (!(0 <= data.media.interactive.pages[ll].scene.edges[tt].labelPlacement.segment)) return false
                  if (!(2048 >= data.media.interactive.pages[ll].scene.edges[tt].labelPlacement.segment)) return false
                }
                for (const key53 of Object.keys(data.media.interactive.pages[ll].scene.edges[tt].labelPlacement)) {
                  if (key53 !== "at" && key53 !== "dx" && key53 !== "dy" && key53 !== "segment") return false
                }
              }
              if ("semanticIds" in data.media.interactive.pages[ll].scene.edges[tt] && hasOwn(data.media.interactive.pages[ll].scene.edges[tt], "semanticIds")) {
                if (!(Array.isArray(data.media.interactive.pages[ll].scene.edges[tt].semanticIds))) return false
                if (data.media.interactive.pages[ll].scene.edges[tt].semanticIds.length > 4096) return false
                if (data.media.interactive.pages[ll].scene.edges[tt].semanticIds.length < 1) return false
                for (let vv = 0; vv < data.media.interactive.pages[ll].scene.edges[tt].semanticIds.length; vv++) {
                  if (vv in data.media.interactive.pages[ll].scene.edges[tt].semanticIds && hasOwn(data.media.interactive.pages[ll].scene.edges[tt].semanticIds, vv)) {
                    if (!(typeof data.media.interactive.pages[ll].scene.edges[tt].semanticIds[vv] === "string")) return false
                    if (data.media.interactive.pages[ll].scene.edges[tt].semanticIds[vv].length > 2048 && stringLength(data.media.interactive.pages[ll].scene.edges[tt].semanticIds[vv]) > 2048) return false
                    if (data.media.interactive.pages[ll].scene.edges[tt].semanticIds[vv].length < 1 || stringLength(data.media.interactive.pages[ll].scene.edges[tt].semanticIds[vv]) < 1) return false
                    if (!(pattern1.test(data.media.interactive.pages[ll].scene.edges[tt].semanticIds[vv]))) return false
                  }
                }
                if (!unique(data.media.interactive.pages[ll].scene.edges[tt].semanticIds)) return false
              }
              if ("waypoints" in data.media.interactive.pages[ll].scene.edges[tt] && hasOwn(data.media.interactive.pages[ll].scene.edges[tt], "waypoints")) {
                if (!(Array.isArray(data.media.interactive.pages[ll].scene.edges[tt].waypoints))) return false
                if (data.media.interactive.pages[ll].scene.edges[tt].waypoints.length > 2048) return false
                if (data.media.interactive.pages[ll].scene.edges[tt].waypoints.length < 1) return false
                for (let xx = 0; xx < data.media.interactive.pages[ll].scene.edges[tt].waypoints.length; xx++) {
                  if (xx in data.media.interactive.pages[ll].scene.edges[tt].waypoints && hasOwn(data.media.interactive.pages[ll].scene.edges[tt].waypoints, xx)) {
                    if (!(typeof data.media.interactive.pages[ll].scene.edges[tt].waypoints[xx] === "object" && data.media.interactive.pages[ll].scene.edges[tt].waypoints[xx] && !Array.isArray(data.media.interactive.pages[ll].scene.edges[tt].waypoints[xx]))) return false
                    if (!("x" in data.media.interactive.pages[ll].scene.edges[tt].waypoints[xx] && hasOwn(data.media.interactive.pages[ll].scene.edges[tt].waypoints[xx], "x"))) return false
                    if (!("y" in data.media.interactive.pages[ll].scene.edges[tt].waypoints[xx] && hasOwn(data.media.interactive.pages[ll].scene.edges[tt].waypoints[xx], "y"))) return false
                    if (!(typeof data.media.interactive.pages[ll].scene.edges[tt].waypoints[xx].x === "number")) return false
                    if (!(-12000 <= data.media.interactive.pages[ll].scene.edges[tt].waypoints[xx].x)) return false
                    if (!(12000 >= data.media.interactive.pages[ll].scene.edges[tt].waypoints[xx].x)) return false
                    if (!(typeof data.media.interactive.pages[ll].scene.edges[tt].waypoints[xx].y === "number")) return false
                    if (!(-12000 <= data.media.interactive.pages[ll].scene.edges[tt].waypoints[xx].y)) return false
                    if (!(12000 >= data.media.interactive.pages[ll].scene.edges[tt].waypoints[xx].y)) return false
                    for (const key54 of Object.keys(data.media.interactive.pages[ll].scene.edges[tt].waypoints[xx])) {
                      if (key54 !== "x" && key54 !== "y") return false
                    }
                  }
                }
              }
              for (const key55 of Object.keys(data.media.interactive.pages[ll].scene.edges[tt])) {
                if (key55 !== "id" && key55 !== "from" && key55 !== "to" && key55 !== "label" && key55 !== "visualRole" && key55 !== "fromSide" && key55 !== "toSide" && key55 !== "route" && key55 !== "labelPlacement" && key55 !== "semanticIds" && key55 !== "waypoints") return false
              }
            }
          }
          if ("texts" in data.media.interactive.pages[ll].scene && hasOwn(data.media.interactive.pages[ll].scene, "texts")) {
            if (!(Array.isArray(data.media.interactive.pages[ll].scene.texts))) return false
            if (data.media.interactive.pages[ll].scene.texts.length > 4096) return false
            for (let yy = 0; yy < data.media.interactive.pages[ll].scene.texts.length; yy++) {
              if (yy in data.media.interactive.pages[ll].scene.texts && hasOwn(data.media.interactive.pages[ll].scene.texts, yy)) {
                if (!(typeof data.media.interactive.pages[ll].scene.texts[yy] === "object" && data.media.interactive.pages[ll].scene.texts[yy] && !Array.isArray(data.media.interactive.pages[ll].scene.texts[yy]))) return false
                if (!("id" in data.media.interactive.pages[ll].scene.texts[yy] && hasOwn(data.media.interactive.pages[ll].scene.texts[yy], "id"))) return false
                if (!("text" in data.media.interactive.pages[ll].scene.texts[yy] && hasOwn(data.media.interactive.pages[ll].scene.texts[yy], "text"))) return false
                if (!("fontSize" in data.media.interactive.pages[ll].scene.texts[yy] && hasOwn(data.media.interactive.pages[ll].scene.texts[yy], "fontSize"))) return false
                if (!("weight" in data.media.interactive.pages[ll].scene.texts[yy] && hasOwn(data.media.interactive.pages[ll].scene.texts[yy], "weight"))) return false
                if (!("anchor" in data.media.interactive.pages[ll].scene.texts[yy] && hasOwn(data.media.interactive.pages[ll].scene.texts[yy], "anchor"))) return false
                if (!("tone" in data.media.interactive.pages[ll].scene.texts[yy] && hasOwn(data.media.interactive.pages[ll].scene.texts[yy], "tone"))) return false
                if (!("x" in data.media.interactive.pages[ll].scene.texts[yy] && hasOwn(data.media.interactive.pages[ll].scene.texts[yy], "x"))) return false
                if (!("baseline" in data.media.interactive.pages[ll].scene.texts[yy] && hasOwn(data.media.interactive.pages[ll].scene.texts[yy], "baseline"))) return false
                if (!("visible" in data.media.interactive.pages[ll].scene.texts[yy] && hasOwn(data.media.interactive.pages[ll].scene.texts[yy], "visible"))) return false
                if (!("semanticIds" in data.media.interactive.pages[ll].scene.texts[yy] && hasOwn(data.media.interactive.pages[ll].scene.texts[yy], "semanticIds"))) return false
                if (!("box" in data.media.interactive.pages[ll].scene.texts[yy] && hasOwn(data.media.interactive.pages[ll].scene.texts[yy], "box"))) return false
                if (!(typeof data.media.interactive.pages[ll].scene.texts[yy].id === "string")) return false
                if (!(pattern0.test(data.media.interactive.pages[ll].scene.texts[yy].id))) return false
                if (!(typeof data.media.interactive.pages[ll].scene.texts[yy].text === "string")) return false
                if (data.media.interactive.pages[ll].scene.texts[yy].text.length > 2048 && stringLength(data.media.interactive.pages[ll].scene.texts[yy].text) > 2048) return false
                if (data.media.interactive.pages[ll].scene.texts[yy].text.length < 1 || stringLength(data.media.interactive.pages[ll].scene.texts[yy].text) < 1) return false
                if (!(pattern1.test(data.media.interactive.pages[ll].scene.texts[yy].text))) return false
                if (!(typeof data.media.interactive.pages[ll].scene.texts[yy].fontSize === "number")) return false
                if (!(0 < data.media.interactive.pages[ll].scene.texts[yy].fontSize)) return false
                if (!(300 >= data.media.interactive.pages[ll].scene.texts[yy].fontSize)) return false
                if (!(data.media.interactive.pages[ll].scene.texts[yy].weight === "400" || data.media.interactive.pages[ll].scene.texts[yy].weight === "600")) return false
                if (!(data.media.interactive.pages[ll].scene.texts[yy].anchor === "start" || data.media.interactive.pages[ll].scene.texts[yy].anchor === "middle" || data.media.interactive.pages[ll].scene.texts[yy].anchor === "end")) return false
                if (!(typeof data.media.interactive.pages[ll].scene.texts[yy].tone === "string")) return false
                if (!(pattern0.test(data.media.interactive.pages[ll].scene.texts[yy].tone))) return false
                if (!(typeof data.media.interactive.pages[ll].scene.texts[yy].x === "number")) return false
                if (!(-12000 <= data.media.interactive.pages[ll].scene.texts[yy].x)) return false
                if (!(12000 >= data.media.interactive.pages[ll].scene.texts[yy].x)) return false
                if (!(typeof data.media.interactive.pages[ll].scene.texts[yy].baseline === "number")) return false
                if (!(-12000 <= data.media.interactive.pages[ll].scene.texts[yy].baseline)) return false
                if (!(12000 >= data.media.interactive.pages[ll].scene.texts[yy].baseline)) return false
                if (!(typeof data.media.interactive.pages[ll].scene.texts[yy].visible === "boolean")) return false
                if (!(Array.isArray(data.media.interactive.pages[ll].scene.texts[yy].semanticIds))) return false
                if (data.media.interactive.pages[ll].scene.texts[yy].semanticIds.length > 4096) return false
                for (let zz = 0; zz < data.media.interactive.pages[ll].scene.texts[yy].semanticIds.length; zz++) {
                  if (zz in data.media.interactive.pages[ll].scene.texts[yy].semanticIds && hasOwn(data.media.interactive.pages[ll].scene.texts[yy].semanticIds, zz)) {
                    if (!(typeof data.media.interactive.pages[ll].scene.texts[yy].semanticIds[zz] === "string")) return false
                    if (data.media.interactive.pages[ll].scene.texts[yy].semanticIds[zz].length > 2048 && stringLength(data.media.interactive.pages[ll].scene.texts[yy].semanticIds[zz]) > 2048) return false
                    if (data.media.interactive.pages[ll].scene.texts[yy].semanticIds[zz].length < 1 || stringLength(data.media.interactive.pages[ll].scene.texts[yy].semanticIds[zz]) < 1) return false
                    if (!(pattern1.test(data.media.interactive.pages[ll].scene.texts[yy].semanticIds[zz]))) return false
                  }
                }
                if (!unique(data.media.interactive.pages[ll].scene.texts[yy].semanticIds)) return false
                if (!(typeof data.media.interactive.pages[ll].scene.texts[yy].box === "object" && data.media.interactive.pages[ll].scene.texts[yy].box && !Array.isArray(data.media.interactive.pages[ll].scene.texts[yy].box))) return false
                if (!("x" in data.media.interactive.pages[ll].scene.texts[yy].box && hasOwn(data.media.interactive.pages[ll].scene.texts[yy].box, "x"))) return false
                if (!("y" in data.media.interactive.pages[ll].scene.texts[yy].box && hasOwn(data.media.interactive.pages[ll].scene.texts[yy].box, "y"))) return false
                if (!("width" in data.media.interactive.pages[ll].scene.texts[yy].box && hasOwn(data.media.interactive.pages[ll].scene.texts[yy].box, "width"))) return false
                if (!("height" in data.media.interactive.pages[ll].scene.texts[yy].box && hasOwn(data.media.interactive.pages[ll].scene.texts[yy].box, "height"))) return false
                if (!(typeof data.media.interactive.pages[ll].scene.texts[yy].box.x === "number")) return false
                if (!(-12000 <= data.media.interactive.pages[ll].scene.texts[yy].box.x)) return false
                if (!(12000 >= data.media.interactive.pages[ll].scene.texts[yy].box.x)) return false
                if (!(typeof data.media.interactive.pages[ll].scene.texts[yy].box.y === "number")) return false
                if (!(-12000 <= data.media.interactive.pages[ll].scene.texts[yy].box.y)) return false
                if (!(12000 >= data.media.interactive.pages[ll].scene.texts[yy].box.y)) return false
                if (!(typeof data.media.interactive.pages[ll].scene.texts[yy].box.width === "number")) return false
                if (!(0 < data.media.interactive.pages[ll].scene.texts[yy].box.width)) return false
                if (!(12000 >= data.media.interactive.pages[ll].scene.texts[yy].box.width)) return false
                if (!(typeof data.media.interactive.pages[ll].scene.texts[yy].box.height === "number")) return false
                if (!(0 < data.media.interactive.pages[ll].scene.texts[yy].box.height)) return false
                if (!(12000 >= data.media.interactive.pages[ll].scene.texts[yy].box.height)) return false
                for (const key56 of Object.keys(data.media.interactive.pages[ll].scene.texts[yy].box)) {
                  if (key56 !== "x" && key56 !== "y" && key56 !== "width" && key56 !== "height") return false
                }
                for (const key57 of Object.keys(data.media.interactive.pages[ll].scene.texts[yy])) {
                  if (key57 !== "id" && key57 !== "text" && key57 !== "fontSize" && key57 !== "weight" && key57 !== "anchor" && key57 !== "tone" && key57 !== "x" && key57 !== "baseline" && key57 !== "visible" && key57 !== "semanticIds" && key57 !== "box") return false
                }
              }
            }
          }
          if ("requiredSemanticIds" in data.media.interactive.pages[ll].scene && hasOwn(data.media.interactive.pages[ll].scene, "requiredSemanticIds")) {
            if (!(Array.isArray(data.media.interactive.pages[ll].scene.requiredSemanticIds))) return false
            if (data.media.interactive.pages[ll].scene.requiredSemanticIds.length > 8192) return false
            if (data.media.interactive.pages[ll].scene.requiredSemanticIds.length < 1) return false
            for (let iii = 0; iii < data.media.interactive.pages[ll].scene.requiredSemanticIds.length; iii++) {
              if (iii in data.media.interactive.pages[ll].scene.requiredSemanticIds && hasOwn(data.media.interactive.pages[ll].scene.requiredSemanticIds, iii)) {
                if (!(typeof data.media.interactive.pages[ll].scene.requiredSemanticIds[iii] === "string")) return false
                if (data.media.interactive.pages[ll].scene.requiredSemanticIds[iii].length > 2048 && stringLength(data.media.interactive.pages[ll].scene.requiredSemanticIds[iii]) > 2048) return false
                if (data.media.interactive.pages[ll].scene.requiredSemanticIds[iii].length < 1 || stringLength(data.media.interactive.pages[ll].scene.requiredSemanticIds[iii]) < 1) return false
                if (!(pattern1.test(data.media.interactive.pages[ll].scene.requiredSemanticIds[iii]))) return false
              }
            }
            if (!unique(data.media.interactive.pages[ll].scene.requiredSemanticIds)) return false
          }
          for (const key58 of Object.keys(data.media.interactive.pages[ll].scene)) {
            if (key58 !== "schema" && key58 !== "id" && key58 !== "title" && key58 !== "subtitle" && key58 !== "viewport" && key58 !== "nodes" && key58 !== "groups" && key58 !== "edges" && key58 !== "texts" && key58 !== "requiredSemanticIds") return false
          }
          for (const key59 of Object.keys(data.media.interactive.pages[ll])) {
            if (key59 !== "id" && key59 !== "label" && key59 !== "purpose" && key59 !== "scene") return false
          }
        }
      }
      for (const key60 of Object.keys(data.media.interactive)) {
        if (key60 !== "kind" && key60 !== "pages") return false
      }
      return true
    })()
    if (sub23) passes3++
    const sub44 = (() => {
      if (!(typeof data.media.interactive === "object" && data.media.interactive && !Array.isArray(data.media.interactive))) return false
      if (!("kind" in data.media.interactive && hasOwn(data.media.interactive, "kind"))) return false
      if (!(data.media.interactive.kind === "neutral")) return false
      for (const key61 of Object.keys(data.media.interactive)) {
        if (key61 !== "kind") return false
      }
      return true
    })()
    if (sub44) passes3++
    if (passes3 !== 1) {
      validate.errors = [{ keywordLocation: "#/properties/media/properties/interactive/oneOf", instanceLocation: "#/media/interactive" }]
      return false
    }
  }
  for (const key62 of Object.keys(data.media)) {
    if (key62 !== "static" && key62 !== "interactive") {
      validate.errors = [{ keywordLocation: "#/properties/media/additionalProperties", instanceLocation: "#/media/"+pointerPart(key62) }]
      return false
    }
  }
  for (const key63 of Object.keys(data)) {
    if (key63 !== "schema" && key63 !== "media") {
      validate.errors = [{ keywordLocation: "#/additionalProperties", instanceLocation: "#/"+pointerPart(key63) }]
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
