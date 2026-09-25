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
      let passes0 = 0
      const sub0 = (() => {
        if (!(typeof data.scope.selections[m] === "object" && data.scope.selections[m] && !Array.isArray(data.scope.selections[m]))) return false
        if (!("id" in data.scope.selections[m] && hasOwn(data.scope.selections[m], "id"))) return false
        if (!("namespace" in data.scope.selections[m] && hasOwn(data.scope.selections[m], "namespace"))) return false
        if (!("kind" in data.scope.selections[m] && hasOwn(data.scope.selections[m], "kind"))) return false
        if (!("reference" in data.scope.selections[m] && hasOwn(data.scope.selections[m], "reference"))) return false
        if (!(typeof data.scope.selections[m].id === "string")) return false
        if (!(pattern0.test(data.scope.selections[m].id))) return false
        if (!(typeof data.scope.selections[m].namespace === "string")) return false
        if (data.scope.selections[m].namespace.length > 2048 && stringLength(data.scope.selections[m].namespace) > 2048) return false
        if (data.scope.selections[m].namespace.length < 1 || stringLength(data.scope.selections[m].namespace) < 1) return false
        if (!(pattern1.test(data.scope.selections[m].namespace))) return false
        if (!(data.scope.selections[m].kind === "reference")) return false
        if (!(typeof data.scope.selections[m].reference === "string")) return false
        if (data.scope.selections[m].reference.length > 2048 && stringLength(data.scope.selections[m].reference) > 2048) return false
        if (data.scope.selections[m].reference.length < 1 || stringLength(data.scope.selections[m].reference) < 1) return false
        if (!(pattern1.test(data.scope.selections[m].reference))) return false
        if ("questions" in data.scope.selections[m] && hasOwn(data.scope.selections[m], "questions")) {
          if (!(Array.isArray(data.scope.selections[m].questions))) return false
          if (data.scope.selections[m].questions.length < 1) return false
          for (let n = 0; n < data.scope.selections[m].questions.length; n++) {
            if (n in data.scope.selections[m].questions && hasOwn(data.scope.selections[m].questions, n)) {
              if (!(typeof data.scope.selections[m].questions[n] === "string")) return false
              if (!(pattern0.test(data.scope.selections[m].questions[n]))) return false
            }
          }
          if (!unique(data.scope.selections[m].questions)) return false
        }
        for (const key2 of Object.keys(data.scope.selections[m])) {
          if (key2 !== "id" && key2 !== "namespace" && key2 !== "kind" && key2 !== "reference" && key2 !== "questions") return false
        }
        return true
      })()
      if (sub0) passes0++
      const sub1 = (() => {
        if (!(typeof data.scope.selections[m] === "object" && data.scope.selections[m] && !Array.isArray(data.scope.selections[m]))) return false
        if (!("id" in data.scope.selections[m] && hasOwn(data.scope.selections[m], "id"))) return false
        if (!("namespace" in data.scope.selections[m] && hasOwn(data.scope.selections[m], "namespace"))) return false
        if (!("kind" in data.scope.selections[m] && hasOwn(data.scope.selections[m], "kind"))) return false
        if (!("language" in data.scope.selections[m] && hasOwn(data.scope.selections[m], "language"))) return false
        if (!("expression" in data.scope.selections[m] && hasOwn(data.scope.selections[m], "expression"))) return false
        if (!(typeof data.scope.selections[m].id === "string")) return false
        if (!(pattern0.test(data.scope.selections[m].id))) return false
        if (!(typeof data.scope.selections[m].namespace === "string")) return false
        if (data.scope.selections[m].namespace.length > 2048 && stringLength(data.scope.selections[m].namespace) > 2048) return false
        if (data.scope.selections[m].namespace.length < 1 || stringLength(data.scope.selections[m].namespace) < 1) return false
        if (!(pattern1.test(data.scope.selections[m].namespace))) return false
        if (!(data.scope.selections[m].kind === "query")) return false
        if (!(typeof data.scope.selections[m].language === "string")) return false
        if (data.scope.selections[m].language.length > 2048 && stringLength(data.scope.selections[m].language) > 2048) return false
        if (data.scope.selections[m].language.length < 1 || stringLength(data.scope.selections[m].language) < 1) return false
        if (!(pattern1.test(data.scope.selections[m].language))) return false
        if (!(typeof data.scope.selections[m].expression === "string")) return false
        if (data.scope.selections[m].expression.length > 2048 && stringLength(data.scope.selections[m].expression) > 2048) return false
        if (data.scope.selections[m].expression.length < 1 || stringLength(data.scope.selections[m].expression) < 1) return false
        if (!(pattern1.test(data.scope.selections[m].expression))) return false
        if ("questions" in data.scope.selections[m] && hasOwn(data.scope.selections[m], "questions")) {
          if (!(Array.isArray(data.scope.selections[m].questions))) return false
          if (data.scope.selections[m].questions.length < 1) return false
          for (let o = 0; o < data.scope.selections[m].questions.length; o++) {
            if (o in data.scope.selections[m].questions && hasOwn(data.scope.selections[m].questions, o)) {
              if (!(typeof data.scope.selections[m].questions[o] === "string")) return false
              if (!(pattern0.test(data.scope.selections[m].questions[o]))) return false
            }
          }
          if (!unique(data.scope.selections[m].questions)) return false
        }
        for (const key3 of Object.keys(data.scope.selections[m])) {
          if (key3 !== "id" && key3 !== "namespace" && key3 !== "kind" && key3 !== "language" && key3 !== "expression" && key3 !== "questions") return false
        }
        return true
      })()
      if (sub1) passes0++
      if (passes0 !== 1) {
        validate.errors = [{ keywordLocation: "#/properties/scope/properties/selections/items/oneOf", instanceLocation: "#/scope/selections/"+m }]
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
  for (let p = 0; p < data.scope.limits.length; p++) {
    if (p in data.scope.limits && hasOwn(data.scope.limits, p)) {
      if (!(typeof data.scope.limits[p] === "object" && data.scope.limits[p] && !Array.isArray(data.scope.limits[p]))) {
        validate.errors = [{ keywordLocation: "#/properties/scope/properties/limits/items/type", instanceLocation: "#/scope/limits/"+p }]
        return false
      }
      if (!("question" in data.scope.limits[p] && hasOwn(data.scope.limits[p], "question"))) {
        validate.errors = [{ keywordLocation: "#/properties/scope/properties/limits/items/required", instanceLocation: "#/scope/limits/"+p+"/question" }]
        return false
      }
      if (!("reason" in data.scope.limits[p] && hasOwn(data.scope.limits[p], "reason"))) {
        validate.errors = [{ keywordLocation: "#/properties/scope/properties/limits/items/required", instanceLocation: "#/scope/limits/"+p+"/reason" }]
        return false
      }
      if (!(typeof data.scope.limits[p].question === "string")) {
        validate.errors = [{ keywordLocation: "#/properties/scope/properties/limits/items/properties/question/type", instanceLocation: "#/scope/limits/"+p+"/question" }]
        return false
      }
      if (!(pattern0.test(data.scope.limits[p].question))) {
        validate.errors = [{ keywordLocation: "#/properties/scope/properties/limits/items/properties/question/pattern", instanceLocation: "#/scope/limits/"+p+"/question" }]
        return false
      }
      if (!(typeof data.scope.limits[p].reason === "string")) {
        validate.errors = [{ keywordLocation: "#/properties/scope/properties/limits/items/properties/reason/type", instanceLocation: "#/scope/limits/"+p+"/reason" }]
        return false
      }
      if (data.scope.limits[p].reason.length > 2048 && stringLength(data.scope.limits[p].reason) > 2048) {
        validate.errors = [{ keywordLocation: "#/properties/scope/properties/limits/items/properties/reason/maxLength", instanceLocation: "#/scope/limits/"+p+"/reason" }]
        return false
      }
      if (data.scope.limits[p].reason.length < 1 || stringLength(data.scope.limits[p].reason) < 1) {
        validate.errors = [{ keywordLocation: "#/properties/scope/properties/limits/items/properties/reason/minLength", instanceLocation: "#/scope/limits/"+p+"/reason" }]
        return false
      }
      if (!(pattern1.test(data.scope.limits[p].reason))) {
        validate.errors = [{ keywordLocation: "#/properties/scope/properties/limits/items/properties/reason/pattern", instanceLocation: "#/scope/limits/"+p+"/reason" }]
        return false
      }
      for (const key4 of Object.keys(data.scope.limits[p])) {
        if (key4 !== "question" && key4 !== "reason") {
          validate.errors = [{ keywordLocation: "#/properties/scope/properties/limits/items/additionalProperties", instanceLocation: "#/scope/limits/"+p+"/"+pointerPart(key4) }]
          return false
        }
      }
    }
  }
  for (const key5 of Object.keys(data.scope)) {
    if (key5 !== "sourceNamespaces" && key5 !== "projectionNamespaces" && key5 !== "selections" && key5 !== "limits") {
      validate.errors = [{ keywordLocation: "#/properties/scope/additionalProperties", instanceLocation: "#/scope/"+pointerPart(key5) }]
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
    for (let q = 0; q < data.editorialAssertions.length; q++) {
      if (q in data.editorialAssertions && hasOwn(data.editorialAssertions, q)) {
        if (!(typeof data.editorialAssertions[q] === "object" && data.editorialAssertions[q] && !Array.isArray(data.editorialAssertions[q]))) {
          validate.errors = [{ keywordLocation: "#/properties/editorialAssertions/items/type", instanceLocation: "#/editorialAssertions/"+q }]
          return false
        }
        if (!("id" in data.editorialAssertions[q] && hasOwn(data.editorialAssertions[q], "id"))) {
          validate.errors = [{ keywordLocation: "#/properties/editorialAssertions/items/required", instanceLocation: "#/editorialAssertions/"+q+"/id" }]
          return false
        }
        if (!("statement" in data.editorialAssertions[q] && hasOwn(data.editorialAssertions[q], "statement"))) {
          validate.errors = [{ keywordLocation: "#/properties/editorialAssertions/items/required", instanceLocation: "#/editorialAssertions/"+q+"/statement" }]
          return false
        }
        if (!("proponent" in data.editorialAssertions[q] && hasOwn(data.editorialAssertions[q], "proponent"))) {
          validate.errors = [{ keywordLocation: "#/properties/editorialAssertions/items/required", instanceLocation: "#/editorialAssertions/"+q+"/proponent" }]
          return false
        }
        if (!("basis" in data.editorialAssertions[q] && hasOwn(data.editorialAssertions[q], "basis"))) {
          validate.errors = [{ keywordLocation: "#/properties/editorialAssertions/items/required", instanceLocation: "#/editorialAssertions/"+q+"/basis" }]
          return false
        }
        if (!("questions" in data.editorialAssertions[q] && hasOwn(data.editorialAssertions[q], "questions"))) {
          validate.errors = [{ keywordLocation: "#/properties/editorialAssertions/items/required", instanceLocation: "#/editorialAssertions/"+q+"/questions" }]
          return false
        }
        if (!(typeof data.editorialAssertions[q].id === "string")) {
          validate.errors = [{ keywordLocation: "#/properties/editorialAssertions/items/properties/id/type", instanceLocation: "#/editorialAssertions/"+q+"/id" }]
          return false
        }
        if (!(pattern0.test(data.editorialAssertions[q].id))) {
          validate.errors = [{ keywordLocation: "#/properties/editorialAssertions/items/properties/id/pattern", instanceLocation: "#/editorialAssertions/"+q+"/id" }]
          return false
        }
        if (!(typeof data.editorialAssertions[q].statement === "string")) {
          validate.errors = [{ keywordLocation: "#/properties/editorialAssertions/items/properties/statement/type", instanceLocation: "#/editorialAssertions/"+q+"/statement" }]
          return false
        }
        if (data.editorialAssertions[q].statement.length > 2048 && stringLength(data.editorialAssertions[q].statement) > 2048) {
          validate.errors = [{ keywordLocation: "#/properties/editorialAssertions/items/properties/statement/maxLength", instanceLocation: "#/editorialAssertions/"+q+"/statement" }]
          return false
        }
        if (data.editorialAssertions[q].statement.length < 1 || stringLength(data.editorialAssertions[q].statement) < 1) {
          validate.errors = [{ keywordLocation: "#/properties/editorialAssertions/items/properties/statement/minLength", instanceLocation: "#/editorialAssertions/"+q+"/statement" }]
          return false
        }
        if (!(pattern1.test(data.editorialAssertions[q].statement))) {
          validate.errors = [{ keywordLocation: "#/properties/editorialAssertions/items/properties/statement/pattern", instanceLocation: "#/editorialAssertions/"+q+"/statement" }]
          return false
        }
        if (!(typeof data.editorialAssertions[q].proponent === "string")) {
          validate.errors = [{ keywordLocation: "#/properties/editorialAssertions/items/properties/proponent/type", instanceLocation: "#/editorialAssertions/"+q+"/proponent" }]
          return false
        }
        if (data.editorialAssertions[q].proponent.length > 2048 && stringLength(data.editorialAssertions[q].proponent) > 2048) {
          validate.errors = [{ keywordLocation: "#/properties/editorialAssertions/items/properties/proponent/maxLength", instanceLocation: "#/editorialAssertions/"+q+"/proponent" }]
          return false
        }
        if (data.editorialAssertions[q].proponent.length < 1 || stringLength(data.editorialAssertions[q].proponent) < 1) {
          validate.errors = [{ keywordLocation: "#/properties/editorialAssertions/items/properties/proponent/minLength", instanceLocation: "#/editorialAssertions/"+q+"/proponent" }]
          return false
        }
        if (!(pattern1.test(data.editorialAssertions[q].proponent))) {
          validate.errors = [{ keywordLocation: "#/properties/editorialAssertions/items/properties/proponent/pattern", instanceLocation: "#/editorialAssertions/"+q+"/proponent" }]
          return false
        }
        if (!(Array.isArray(data.editorialAssertions[q].basis))) {
          validate.errors = [{ keywordLocation: "#/properties/editorialAssertions/items/properties/basis/type", instanceLocation: "#/editorialAssertions/"+q+"/basis" }]
          return false
        }
        if (data.editorialAssertions[q].basis.length < 1) {
          validate.errors = [{ keywordLocation: "#/properties/editorialAssertions/items/properties/basis/minItems", instanceLocation: "#/editorialAssertions/"+q+"/basis" }]
          return false
        }
        for (let r = 0; r < data.editorialAssertions[q].basis.length; r++) {
          if (r in data.editorialAssertions[q].basis && hasOwn(data.editorialAssertions[q].basis, r)) {
            if (!(typeof data.editorialAssertions[q].basis[r] === "string")) {
              validate.errors = [{ keywordLocation: "#/properties/editorialAssertions/items/properties/basis/items/type", instanceLocation: "#/editorialAssertions/"+q+"basis/"+r }]
              return false
            }
            if (!(pattern0.test(data.editorialAssertions[q].basis[r]))) {
              validate.errors = [{ keywordLocation: "#/properties/editorialAssertions/items/properties/basis/items/pattern", instanceLocation: "#/editorialAssertions/"+q+"basis/"+r }]
              return false
            }
          }
        }
        if (!unique(data.editorialAssertions[q].basis)) {
          validate.errors = [{ keywordLocation: "#/properties/editorialAssertions/items/properties/basis/uniqueItems", instanceLocation: "#/editorialAssertions/"+q+"/basis" }]
          return false
        }
        if (!(Array.isArray(data.editorialAssertions[q].questions))) {
          validate.errors = [{ keywordLocation: "#/properties/editorialAssertions/items/properties/questions/type", instanceLocation: "#/editorialAssertions/"+q+"/questions" }]
          return false
        }
        if (data.editorialAssertions[q].questions.length < 1) {
          validate.errors = [{ keywordLocation: "#/properties/editorialAssertions/items/properties/questions/minItems", instanceLocation: "#/editorialAssertions/"+q+"/questions" }]
          return false
        }
        for (let s = 0; s < data.editorialAssertions[q].questions.length; s++) {
          if (s in data.editorialAssertions[q].questions && hasOwn(data.editorialAssertions[q].questions, s)) {
            if (!(typeof data.editorialAssertions[q].questions[s] === "string")) {
              validate.errors = [{ keywordLocation: "#/properties/editorialAssertions/items/properties/questions/items/type", instanceLocation: "#/editorialAssertions/"+q+"questions/"+s }]
              return false
            }
            if (!(pattern0.test(data.editorialAssertions[q].questions[s]))) {
              validate.errors = [{ keywordLocation: "#/properties/editorialAssertions/items/properties/questions/items/pattern", instanceLocation: "#/editorialAssertions/"+q+"questions/"+s }]
              return false
            }
          }
        }
        if (!unique(data.editorialAssertions[q].questions)) {
          validate.errors = [{ keywordLocation: "#/properties/editorialAssertions/items/properties/questions/uniqueItems", instanceLocation: "#/editorialAssertions/"+q+"/questions" }]
          return false
        }
        for (const key6 of Object.keys(data.editorialAssertions[q])) {
          if (key6 !== "id" && key6 !== "statement" && key6 !== "proponent" && key6 !== "basis" && key6 !== "questions") {
            validate.errors = [{ keywordLocation: "#/properties/editorialAssertions/items/additionalProperties", instanceLocation: "#/editorialAssertions/"+q+"/"+pointerPart(key6) }]
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
  for (let t = 0; t < data.omissions.length; t++) {
    if (t in data.omissions && hasOwn(data.omissions, t)) {
      let passes1 = 0
      const sub2 = (() => {
        if (!(typeof data.omissions[t] === "object" && data.omissions[t] && !Array.isArray(data.omissions[t]))) return false
        if (!("selection" in data.omissions[t] && hasOwn(data.omissions[t], "selection"))) return false
        if (!("question" in data.omissions[t] && hasOwn(data.omissions[t], "question"))) return false
        if (!("medium" in data.omissions[t] && hasOwn(data.omissions[t], "medium"))) return false
        if (!("disposition" in data.omissions[t] && hasOwn(data.omissions[t], "disposition"))) return false
        if (!("view" in data.omissions[t] && hasOwn(data.omissions[t], "view"))) return false
        if (!("reason" in data.omissions[t] && hasOwn(data.omissions[t], "reason"))) return false
        if (!(typeof data.omissions[t].selection === "string")) return false
        if (!(pattern0.test(data.omissions[t].selection))) return false
        if (!(typeof data.omissions[t].question === "string")) return false
        if (!(pattern0.test(data.omissions[t].question))) return false
        if (!(data.omissions[t].medium === "static" || data.omissions[t].medium === "interactive")) return false
        if (!(data.omissions[t].disposition === "outside-question" || data.omissions[t].disposition === "explicit-limit")) return false
        if (!(typeof data.omissions[t].view === "string")) return false
        if (!(pattern0.test(data.omissions[t].view))) return false
        if (!(typeof data.omissions[t].reason === "string")) return false
        if (data.omissions[t].reason.length > 2048 && stringLength(data.omissions[t].reason) > 2048) return false
        if (data.omissions[t].reason.length < 1 || stringLength(data.omissions[t].reason) < 1) return false
        if (!(pattern1.test(data.omissions[t].reason))) return false
        for (const key7 of Object.keys(data.omissions[t])) {
          if (key7 !== "selection" && key7 !== "question" && key7 !== "medium" && key7 !== "disposition" && key7 !== "view" && key7 !== "reason") return false
        }
        return true
      })()
      if (sub2) passes1++
      const sub3 = (() => {
        if (!(typeof data.omissions[t] === "object" && data.omissions[t] && !Array.isArray(data.omissions[t]))) return false
        if (!("selection" in data.omissions[t] && hasOwn(data.omissions[t], "selection"))) return false
        if (!("question" in data.omissions[t] && hasOwn(data.omissions[t], "question"))) return false
        if (!("medium" in data.omissions[t] && hasOwn(data.omissions[t], "medium"))) return false
        if (!("disposition" in data.omissions[t] && hasOwn(data.omissions[t], "disposition"))) return false
        if (!("view" in data.omissions[t] && hasOwn(data.omissions[t], "view"))) return false
        if (!("coveredIn" in data.omissions[t] && hasOwn(data.omissions[t], "coveredIn"))) return false
        if (!("reason" in data.omissions[t] && hasOwn(data.omissions[t], "reason"))) return false
        if (!(typeof data.omissions[t].selection === "string")) return false
        if (!(pattern0.test(data.omissions[t].selection))) return false
        if (!(typeof data.omissions[t].question === "string")) return false
        if (!(pattern0.test(data.omissions[t].question))) return false
        if (!(data.omissions[t].medium === "static" || data.omissions[t].medium === "interactive")) return false
        if (!(data.omissions[t].disposition === "covered-elsewhere")) return false
        if (!(typeof data.omissions[t].view === "string")) return false
        if (!(pattern0.test(data.omissions[t].view))) return false
        if (!(typeof data.omissions[t].coveredIn === "string")) return false
        if (!(pattern0.test(data.omissions[t].coveredIn))) return false
        if (!(typeof data.omissions[t].reason === "string")) return false
        if (data.omissions[t].reason.length > 2048 && stringLength(data.omissions[t].reason) > 2048) return false
        if (data.omissions[t].reason.length < 1 || stringLength(data.omissions[t].reason) < 1) return false
        if (!(pattern1.test(data.omissions[t].reason))) return false
        for (const key8 of Object.keys(data.omissions[t])) {
          if (key8 !== "selection" && key8 !== "question" && key8 !== "medium" && key8 !== "disposition" && key8 !== "view" && key8 !== "coveredIn" && key8 !== "reason") return false
        }
        return true
      })()
      if (sub3) passes1++
      if (passes1 !== 1) {
        validate.errors = [{ keywordLocation: "#/properties/omissions/items/oneOf", instanceLocation: "#/omissions/"+t }]
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
  for (let u = 0; u < data.transformations.length; u++) {
    if (u in data.transformations && hasOwn(data.transformations, u)) {
      if (!(typeof data.transformations[u] === "object" && data.transformations[u] && !Array.isArray(data.transformations[u]))) {
        validate.errors = [{ keywordLocation: "#/properties/transformations/items/type", instanceLocation: "#/transformations/"+u }]
        return false
      }
      if (!("id" in data.transformations[u] && hasOwn(data.transformations[u], "id"))) {
        validate.errors = [{ keywordLocation: "#/properties/transformations/items/required", instanceLocation: "#/transformations/"+u+"/id" }]
        return false
      }
      if (!("kind" in data.transformations[u] && hasOwn(data.transformations[u], "kind"))) {
        validate.errors = [{ keywordLocation: "#/properties/transformations/items/required", instanceLocation: "#/transformations/"+u+"/kind" }]
        return false
      }
      if (!("inputs" in data.transformations[u] && hasOwn(data.transformations[u], "inputs"))) {
        validate.errors = [{ keywordLocation: "#/properties/transformations/items/required", instanceLocation: "#/transformations/"+u+"/inputs" }]
        return false
      }
      if (!("output" in data.transformations[u] && hasOwn(data.transformations[u], "output"))) {
        validate.errors = [{ keywordLocation: "#/properties/transformations/items/required", instanceLocation: "#/transformations/"+u+"/output" }]
        return false
      }
      if (!("proponent" in data.transformations[u] && hasOwn(data.transformations[u], "proponent"))) {
        validate.errors = [{ keywordLocation: "#/properties/transformations/items/required", instanceLocation: "#/transformations/"+u+"/proponent" }]
        return false
      }
      if (!("rule" in data.transformations[u] && hasOwn(data.transformations[u], "rule"))) {
        validate.errors = [{ keywordLocation: "#/properties/transformations/items/required", instanceLocation: "#/transformations/"+u+"/rule" }]
        return false
      }
      if (!(typeof data.transformations[u].id === "string")) {
        validate.errors = [{ keywordLocation: "#/properties/transformations/items/properties/id/type", instanceLocation: "#/transformations/"+u+"/id" }]
        return false
      }
      if (!(pattern0.test(data.transformations[u].id))) {
        validate.errors = [{ keywordLocation: "#/properties/transformations/items/properties/id/pattern", instanceLocation: "#/transformations/"+u+"/id" }]
        return false
      }
      if (!(data.transformations[u].kind === "group" || data.transformations[u].kind === "aggregate" || data.transformations[u].kind === "compare" || data.transformations[u].kind === "rephrase")) {
        validate.errors = [{ keywordLocation: "#/properties/transformations/items/properties/kind/enum", instanceLocation: "#/transformations/"+u+"/kind" }]
        return false
      }
      if (!(Array.isArray(data.transformations[u].inputs))) {
        validate.errors = [{ keywordLocation: "#/properties/transformations/items/properties/inputs/type", instanceLocation: "#/transformations/"+u+"/inputs" }]
        return false
      }
      if (data.transformations[u].inputs.length < 1) {
        validate.errors = [{ keywordLocation: "#/properties/transformations/items/properties/inputs/minItems", instanceLocation: "#/transformations/"+u+"/inputs" }]
        return false
      }
      for (let v = 0; v < data.transformations[u].inputs.length; v++) {
        if (v in data.transformations[u].inputs && hasOwn(data.transformations[u].inputs, v)) {
          if (!(typeof data.transformations[u].inputs[v] === "string")) {
            validate.errors = [{ keywordLocation: "#/properties/transformations/items/properties/inputs/items/type", instanceLocation: "#/transformations/"+u+"inputs/"+v }]
            return false
          }
          if (!(pattern0.test(data.transformations[u].inputs[v]))) {
            validate.errors = [{ keywordLocation: "#/properties/transformations/items/properties/inputs/items/pattern", instanceLocation: "#/transformations/"+u+"inputs/"+v }]
            return false
          }
        }
      }
      if (!unique(data.transformations[u].inputs)) {
        validate.errors = [{ keywordLocation: "#/properties/transformations/items/properties/inputs/uniqueItems", instanceLocation: "#/transformations/"+u+"/inputs" }]
        return false
      }
      if (!(typeof data.transformations[u].output === "string")) {
        validate.errors = [{ keywordLocation: "#/properties/transformations/items/properties/output/type", instanceLocation: "#/transformations/"+u+"/output" }]
        return false
      }
      if (!(pattern0.test(data.transformations[u].output))) {
        validate.errors = [{ keywordLocation: "#/properties/transformations/items/properties/output/pattern", instanceLocation: "#/transformations/"+u+"/output" }]
        return false
      }
      if (!(typeof data.transformations[u].proponent === "string")) {
        validate.errors = [{ keywordLocation: "#/properties/transformations/items/properties/proponent/type", instanceLocation: "#/transformations/"+u+"/proponent" }]
        return false
      }
      if (data.transformations[u].proponent.length > 2048 && stringLength(data.transformations[u].proponent) > 2048) {
        validate.errors = [{ keywordLocation: "#/properties/transformations/items/properties/proponent/maxLength", instanceLocation: "#/transformations/"+u+"/proponent" }]
        return false
      }
      if (data.transformations[u].proponent.length < 1 || stringLength(data.transformations[u].proponent) < 1) {
        validate.errors = [{ keywordLocation: "#/properties/transformations/items/properties/proponent/minLength", instanceLocation: "#/transformations/"+u+"/proponent" }]
        return false
      }
      if (!(pattern1.test(data.transformations[u].proponent))) {
        validate.errors = [{ keywordLocation: "#/properties/transformations/items/properties/proponent/pattern", instanceLocation: "#/transformations/"+u+"/proponent" }]
        return false
      }
      if (!(typeof data.transformations[u].rule === "string")) {
        validate.errors = [{ keywordLocation: "#/properties/transformations/items/properties/rule/type", instanceLocation: "#/transformations/"+u+"/rule" }]
        return false
      }
      if (data.transformations[u].rule.length > 2048 && stringLength(data.transformations[u].rule) > 2048) {
        validate.errors = [{ keywordLocation: "#/properties/transformations/items/properties/rule/maxLength", instanceLocation: "#/transformations/"+u+"/rule" }]
        return false
      }
      if (data.transformations[u].rule.length < 1 || stringLength(data.transformations[u].rule) < 1) {
        validate.errors = [{ keywordLocation: "#/properties/transformations/items/properties/rule/minLength", instanceLocation: "#/transformations/"+u+"/rule" }]
        return false
      }
      if (!(pattern1.test(data.transformations[u].rule))) {
        validate.errors = [{ keywordLocation: "#/properties/transformations/items/properties/rule/pattern", instanceLocation: "#/transformations/"+u+"/rule" }]
        return false
      }
      for (const key9 of Object.keys(data.transformations[u])) {
        if (key9 !== "id" && key9 !== "kind" && key9 !== "inputs" && key9 !== "output" && key9 !== "proponent" && key9 !== "rule") {
          validate.errors = [{ keywordLocation: "#/properties/transformations/items/additionalProperties", instanceLocation: "#/transformations/"+u+"/"+pointerPart(key9) }]
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
  for (const key10 of Object.keys(data.narrative)) {
    if (key10 !== "summary") {
      validate.errors = [{ keywordLocation: "#/properties/narrative/additionalProperties", instanceLocation: "#/narrative/"+pointerPart(key10) }]
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
  if (!("intent" in data.presentation.static && hasOwn(data.presentation.static, "intent"))) {
    validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/required", instanceLocation: "#/presentation/static/intent" }]
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
  for (let x = 0; x < data.presentation.static.views.length; x++) {
    if (x in data.presentation.static.views && hasOwn(data.presentation.static.views, x)) {
      if (!(typeof data.presentation.static.views[x] === "object" && data.presentation.static.views[x] && !Array.isArray(data.presentation.static.views[x]))) {
        validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/type", instanceLocation: "#/presentation/static/views/"+x }]
        return false
      }
      if (!("id" in data.presentation.static.views[x] && hasOwn(data.presentation.static.views[x], "id"))) {
        validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/required", instanceLocation: "#/presentation/static/views/"+x+"/id" }]
        return false
      }
      if (!("questions" in data.presentation.static.views[x] && hasOwn(data.presentation.static.views[x], "questions"))) {
        validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/required", instanceLocation: "#/presentation/static/views/"+x+"/questions" }]
        return false
      }
      if (!(typeof data.presentation.static.views[x].id === "string")) {
        validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/id/type", instanceLocation: "#/presentation/static/views/"+x+"/id" }]
        return false
      }
      if (!(pattern0.test(data.presentation.static.views[x].id))) {
        validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/id/pattern", instanceLocation: "#/presentation/static/views/"+x+"/id" }]
        return false
      }
      if (!(Array.isArray(data.presentation.static.views[x].questions))) {
        validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/questions/type", instanceLocation: "#/presentation/static/views/"+x+"/questions" }]
        return false
      }
      if (data.presentation.static.views[x].questions.length < 1) {
        validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/questions/minItems", instanceLocation: "#/presentation/static/views/"+x+"/questions" }]
        return false
      }
      for (let y = 0; y < data.presentation.static.views[x].questions.length; y++) {
        if (y in data.presentation.static.views[x].questions && hasOwn(data.presentation.static.views[x].questions, y)) {
          if (!(typeof data.presentation.static.views[x].questions[y] === "string")) {
            validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/questions/items/type", instanceLocation: "#/presentation/static/views/"+x+"questions/"+y }]
            return false
          }
          if (!(pattern0.test(data.presentation.static.views[x].questions[y]))) {
            validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/questions/items/pattern", instanceLocation: "#/presentation/static/views/"+x+"questions/"+y }]
            return false
          }
        }
      }
      if (!unique(data.presentation.static.views[x].questions)) {
        validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/questions/uniqueItems", instanceLocation: "#/presentation/static/views/"+x+"/questions" }]
        return false
      }
      if ("groups" in data.presentation.static.views[x] && hasOwn(data.presentation.static.views[x], "groups")) {
        if (!(Array.isArray(data.presentation.static.views[x].groups))) {
          validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/groups/type", instanceLocation: "#/presentation/static/views/"+x+"/groups" }]
          return false
        }
        if (data.presentation.static.views[x].groups.length > 256) {
          validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/groups/maxItems", instanceLocation: "#/presentation/static/views/"+x+"/groups" }]
          return false
        }
        if (data.presentation.static.views[x].groups.length < 1) {
          validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/groups/minItems", instanceLocation: "#/presentation/static/views/"+x+"/groups" }]
          return false
        }
        for (let z = 0; z < data.presentation.static.views[x].groups.length; z++) {
          if (z in data.presentation.static.views[x].groups && hasOwn(data.presentation.static.views[x].groups, z)) {
            if (!(typeof data.presentation.static.views[x].groups[z] === "object" && data.presentation.static.views[x].groups[z] && !Array.isArray(data.presentation.static.views[x].groups[z]))) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/groups/items/type", instanceLocation: "#/presentation/static/views/"+x+"groups/"+z }]
              return false
            }
            if (!("id" in data.presentation.static.views[x].groups[z] && hasOwn(data.presentation.static.views[x].groups[z], "id"))) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/groups/items/required", instanceLocation: "#/presentation/static/views/"+x+"groups/"+z+"/id" }]
              return false
            }
            if (!("label" in data.presentation.static.views[x].groups[z] && hasOwn(data.presentation.static.views[x].groups[z], "label"))) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/groups/items/required", instanceLocation: "#/presentation/static/views/"+x+"groups/"+z+"/label" }]
              return false
            }
            if (!("elements" in data.presentation.static.views[x].groups[z] && hasOwn(data.presentation.static.views[x].groups[z], "elements"))) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/groups/items/required", instanceLocation: "#/presentation/static/views/"+x+"groups/"+z+"/elements" }]
              return false
            }
            if (!(typeof data.presentation.static.views[x].groups[z].id === "string")) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/groups/items/properties/id/type", instanceLocation: "#/presentation/static/views/"+x+"groups/"+z+"/id" }]
              return false
            }
            if (!(pattern0.test(data.presentation.static.views[x].groups[z].id))) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/groups/items/properties/id/pattern", instanceLocation: "#/presentation/static/views/"+x+"groups/"+z+"/id" }]
              return false
            }
            if (!(typeof data.presentation.static.views[x].groups[z].label === "string")) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/groups/items/properties/label/type", instanceLocation: "#/presentation/static/views/"+x+"groups/"+z+"/label" }]
              return false
            }
            if (data.presentation.static.views[x].groups[z].label.length > 2048 && stringLength(data.presentation.static.views[x].groups[z].label) > 2048) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/groups/items/properties/label/maxLength", instanceLocation: "#/presentation/static/views/"+x+"groups/"+z+"/label" }]
              return false
            }
            if (data.presentation.static.views[x].groups[z].label.length < 1 || stringLength(data.presentation.static.views[x].groups[z].label) < 1) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/groups/items/properties/label/minLength", instanceLocation: "#/presentation/static/views/"+x+"groups/"+z+"/label" }]
              return false
            }
            if (!(pattern1.test(data.presentation.static.views[x].groups[z].label))) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/groups/items/properties/label/pattern", instanceLocation: "#/presentation/static/views/"+x+"groups/"+z+"/label" }]
              return false
            }
            if (!(Array.isArray(data.presentation.static.views[x].groups[z].elements))) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/groups/items/properties/elements/type", instanceLocation: "#/presentation/static/views/"+x+"groups/"+z+"/elements" }]
              return false
            }
            if (data.presentation.static.views[x].groups[z].elements.length > 4096) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/groups/items/properties/elements/maxItems", instanceLocation: "#/presentation/static/views/"+x+"groups/"+z+"/elements" }]
              return false
            }
            if (data.presentation.static.views[x].groups[z].elements.length < 1) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/groups/items/properties/elements/minItems", instanceLocation: "#/presentation/static/views/"+x+"groups/"+z+"/elements" }]
              return false
            }
            for (let ii = 0; ii < data.presentation.static.views[x].groups[z].elements.length; ii++) {
              if (ii in data.presentation.static.views[x].groups[z].elements && hasOwn(data.presentation.static.views[x].groups[z].elements, ii)) {
                if (!(typeof data.presentation.static.views[x].groups[z].elements[ii] === "object" && data.presentation.static.views[x].groups[z].elements[ii] && !Array.isArray(data.presentation.static.views[x].groups[z].elements[ii]))) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/groups/items/properties/elements/items/type", instanceLocation: "#/presentation/static/views/"+x+"groups/"+z+"elements/"+ii }]
                  return false
                }
                if (!("namespace" in data.presentation.static.views[x].groups[z].elements[ii] && hasOwn(data.presentation.static.views[x].groups[z].elements[ii], "namespace"))) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/groups/items/properties/elements/items/required", instanceLocation: "#/presentation/static/views/"+x+"groups/"+z+"elements/"+ii+"/namespace" }]
                  return false
                }
                if (!("id" in data.presentation.static.views[x].groups[z].elements[ii] && hasOwn(data.presentation.static.views[x].groups[z].elements[ii], "id"))) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/groups/items/properties/elements/items/required", instanceLocation: "#/presentation/static/views/"+x+"groups/"+z+"elements/"+ii+"/id" }]
                  return false
                }
                if (!(typeof data.presentation.static.views[x].groups[z].elements[ii].namespace === "string")) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/groups/items/properties/elements/items/properties/namespace/type", instanceLocation: "#/presentation/static/views/"+x+"groups/"+z+"elements/"+ii+"/namespace" }]
                  return false
                }
                if (data.presentation.static.views[x].groups[z].elements[ii].namespace.length > 2048 && stringLength(data.presentation.static.views[x].groups[z].elements[ii].namespace) > 2048) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/groups/items/properties/elements/items/properties/namespace/maxLength", instanceLocation: "#/presentation/static/views/"+x+"groups/"+z+"elements/"+ii+"/namespace" }]
                  return false
                }
                if (data.presentation.static.views[x].groups[z].elements[ii].namespace.length < 1 || stringLength(data.presentation.static.views[x].groups[z].elements[ii].namespace) < 1) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/groups/items/properties/elements/items/properties/namespace/minLength", instanceLocation: "#/presentation/static/views/"+x+"groups/"+z+"elements/"+ii+"/namespace" }]
                  return false
                }
                if (!(pattern1.test(data.presentation.static.views[x].groups[z].elements[ii].namespace))) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/groups/items/properties/elements/items/properties/namespace/pattern", instanceLocation: "#/presentation/static/views/"+x+"groups/"+z+"elements/"+ii+"/namespace" }]
                  return false
                }
                if (!(typeof data.presentation.static.views[x].groups[z].elements[ii].id === "string")) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/groups/items/properties/elements/items/properties/id/type", instanceLocation: "#/presentation/static/views/"+x+"groups/"+z+"elements/"+ii+"/id" }]
                  return false
                }
                if (data.presentation.static.views[x].groups[z].elements[ii].id.length > 2048 && stringLength(data.presentation.static.views[x].groups[z].elements[ii].id) > 2048) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/groups/items/properties/elements/items/properties/id/maxLength", instanceLocation: "#/presentation/static/views/"+x+"groups/"+z+"elements/"+ii+"/id" }]
                  return false
                }
                if (data.presentation.static.views[x].groups[z].elements[ii].id.length < 1 || stringLength(data.presentation.static.views[x].groups[z].elements[ii].id) < 1) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/groups/items/properties/elements/items/properties/id/minLength", instanceLocation: "#/presentation/static/views/"+x+"groups/"+z+"elements/"+ii+"/id" }]
                  return false
                }
                if (!(pattern1.test(data.presentation.static.views[x].groups[z].elements[ii].id))) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/groups/items/properties/elements/items/properties/id/pattern", instanceLocation: "#/presentation/static/views/"+x+"groups/"+z+"elements/"+ii+"/id" }]
                  return false
                }
                for (const key11 of Object.keys(data.presentation.static.views[x].groups[z].elements[ii])) {
                  if (key11 !== "namespace" && key11 !== "id") {
                    validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/groups/items/properties/elements/items/additionalProperties", instanceLocation: "#/presentation/static/views/"+x+"groups/"+z+"elements/"+ii+"/"+pointerPart(key11) }]
                    return false
                  }
                }
              }
            }
            for (const key12 of Object.keys(data.presentation.static.views[x].groups[z])) {
              if (key12 !== "id" && key12 !== "label" && key12 !== "elements") {
                validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/properties/groups/items/additionalProperties", instanceLocation: "#/presentation/static/views/"+x+"groups/"+z+"/"+pointerPart(key12) }]
                return false
              }
            }
          }
        }
      }
      for (const key13 of Object.keys(data.presentation.static.views[x])) {
        if (key13 !== "id" && key13 !== "questions" && key13 !== "groups") {
          validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/properties/views/items/additionalProperties", instanceLocation: "#/presentation/static/views/"+x+"/"+pointerPart(key13) }]
          return false
        }
      }
    }
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
  for (const key14 of Object.keys(data.presentation.static)) {
    if (key14 !== "views" && key14 !== "intent" && key14 !== "width") {
      validate.errors = [{ keywordLocation: "#/properties/presentation/properties/static/additionalProperties", instanceLocation: "#/presentation/static/"+pointerPart(key14) }]
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
  if (!("intent" in data.presentation.interactive && hasOwn(data.presentation.interactive, "intent"))) {
    validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/required", instanceLocation: "#/presentation/interactive/intent" }]
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
  for (let jj = 0; jj < data.presentation.interactive.views.length; jj++) {
    if (jj in data.presentation.interactive.views && hasOwn(data.presentation.interactive.views, jj)) {
      if (!(typeof data.presentation.interactive.views[jj] === "object" && data.presentation.interactive.views[jj] && !Array.isArray(data.presentation.interactive.views[jj]))) {
        validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/type", instanceLocation: "#/presentation/interactive/views/"+jj }]
        return false
      }
      if (!("id" in data.presentation.interactive.views[jj] && hasOwn(data.presentation.interactive.views[jj], "id"))) {
        validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/required", instanceLocation: "#/presentation/interactive/views/"+jj+"/id" }]
        return false
      }
      if (!("questions" in data.presentation.interactive.views[jj] && hasOwn(data.presentation.interactive.views[jj], "questions"))) {
        validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/required", instanceLocation: "#/presentation/interactive/views/"+jj+"/questions" }]
        return false
      }
      if (!(typeof data.presentation.interactive.views[jj].id === "string")) {
        validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/id/type", instanceLocation: "#/presentation/interactive/views/"+jj+"/id" }]
        return false
      }
      if (!(pattern0.test(data.presentation.interactive.views[jj].id))) {
        validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/id/pattern", instanceLocation: "#/presentation/interactive/views/"+jj+"/id" }]
        return false
      }
      if (!(Array.isArray(data.presentation.interactive.views[jj].questions))) {
        validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/questions/type", instanceLocation: "#/presentation/interactive/views/"+jj+"/questions" }]
        return false
      }
      if (data.presentation.interactive.views[jj].questions.length < 1) {
        validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/questions/minItems", instanceLocation: "#/presentation/interactive/views/"+jj+"/questions" }]
        return false
      }
      for (let kk = 0; kk < data.presentation.interactive.views[jj].questions.length; kk++) {
        if (kk in data.presentation.interactive.views[jj].questions && hasOwn(data.presentation.interactive.views[jj].questions, kk)) {
          if (!(typeof data.presentation.interactive.views[jj].questions[kk] === "string")) {
            validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/questions/items/type", instanceLocation: "#/presentation/interactive/views/"+jj+"questions/"+kk }]
            return false
          }
          if (!(pattern0.test(data.presentation.interactive.views[jj].questions[kk]))) {
            validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/questions/items/pattern", instanceLocation: "#/presentation/interactive/views/"+jj+"questions/"+kk }]
            return false
          }
        }
      }
      if (!unique(data.presentation.interactive.views[jj].questions)) {
        validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/questions/uniqueItems", instanceLocation: "#/presentation/interactive/views/"+jj+"/questions" }]
        return false
      }
      if ("groups" in data.presentation.interactive.views[jj] && hasOwn(data.presentation.interactive.views[jj], "groups")) {
        if (!(Array.isArray(data.presentation.interactive.views[jj].groups))) {
          validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/groups/type", instanceLocation: "#/presentation/interactive/views/"+jj+"/groups" }]
          return false
        }
        if (data.presentation.interactive.views[jj].groups.length > 256) {
          validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/groups/maxItems", instanceLocation: "#/presentation/interactive/views/"+jj+"/groups" }]
          return false
        }
        if (data.presentation.interactive.views[jj].groups.length < 1) {
          validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/groups/minItems", instanceLocation: "#/presentation/interactive/views/"+jj+"/groups" }]
          return false
        }
        for (let ll = 0; ll < data.presentation.interactive.views[jj].groups.length; ll++) {
          if (ll in data.presentation.interactive.views[jj].groups && hasOwn(data.presentation.interactive.views[jj].groups, ll)) {
            if (!(typeof data.presentation.interactive.views[jj].groups[ll] === "object" && data.presentation.interactive.views[jj].groups[ll] && !Array.isArray(data.presentation.interactive.views[jj].groups[ll]))) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/groups/items/type", instanceLocation: "#/presentation/interactive/views/"+jj+"groups/"+ll }]
              return false
            }
            if (!("id" in data.presentation.interactive.views[jj].groups[ll] && hasOwn(data.presentation.interactive.views[jj].groups[ll], "id"))) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/groups/items/required", instanceLocation: "#/presentation/interactive/views/"+jj+"groups/"+ll+"/id" }]
              return false
            }
            if (!("label" in data.presentation.interactive.views[jj].groups[ll] && hasOwn(data.presentation.interactive.views[jj].groups[ll], "label"))) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/groups/items/required", instanceLocation: "#/presentation/interactive/views/"+jj+"groups/"+ll+"/label" }]
              return false
            }
            if (!("elements" in data.presentation.interactive.views[jj].groups[ll] && hasOwn(data.presentation.interactive.views[jj].groups[ll], "elements"))) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/groups/items/required", instanceLocation: "#/presentation/interactive/views/"+jj+"groups/"+ll+"/elements" }]
              return false
            }
            if (!(typeof data.presentation.interactive.views[jj].groups[ll].id === "string")) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/groups/items/properties/id/type", instanceLocation: "#/presentation/interactive/views/"+jj+"groups/"+ll+"/id" }]
              return false
            }
            if (!(pattern0.test(data.presentation.interactive.views[jj].groups[ll].id))) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/groups/items/properties/id/pattern", instanceLocation: "#/presentation/interactive/views/"+jj+"groups/"+ll+"/id" }]
              return false
            }
            if (!(typeof data.presentation.interactive.views[jj].groups[ll].label === "string")) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/groups/items/properties/label/type", instanceLocation: "#/presentation/interactive/views/"+jj+"groups/"+ll+"/label" }]
              return false
            }
            if (data.presentation.interactive.views[jj].groups[ll].label.length > 2048 && stringLength(data.presentation.interactive.views[jj].groups[ll].label) > 2048) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/groups/items/properties/label/maxLength", instanceLocation: "#/presentation/interactive/views/"+jj+"groups/"+ll+"/label" }]
              return false
            }
            if (data.presentation.interactive.views[jj].groups[ll].label.length < 1 || stringLength(data.presentation.interactive.views[jj].groups[ll].label) < 1) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/groups/items/properties/label/minLength", instanceLocation: "#/presentation/interactive/views/"+jj+"groups/"+ll+"/label" }]
              return false
            }
            if (!(pattern1.test(data.presentation.interactive.views[jj].groups[ll].label))) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/groups/items/properties/label/pattern", instanceLocation: "#/presentation/interactive/views/"+jj+"groups/"+ll+"/label" }]
              return false
            }
            if (!(Array.isArray(data.presentation.interactive.views[jj].groups[ll].elements))) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/groups/items/properties/elements/type", instanceLocation: "#/presentation/interactive/views/"+jj+"groups/"+ll+"/elements" }]
              return false
            }
            if (data.presentation.interactive.views[jj].groups[ll].elements.length > 4096) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/groups/items/properties/elements/maxItems", instanceLocation: "#/presentation/interactive/views/"+jj+"groups/"+ll+"/elements" }]
              return false
            }
            if (data.presentation.interactive.views[jj].groups[ll].elements.length < 1) {
              validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/groups/items/properties/elements/minItems", instanceLocation: "#/presentation/interactive/views/"+jj+"groups/"+ll+"/elements" }]
              return false
            }
            for (let mm = 0; mm < data.presentation.interactive.views[jj].groups[ll].elements.length; mm++) {
              if (mm in data.presentation.interactive.views[jj].groups[ll].elements && hasOwn(data.presentation.interactive.views[jj].groups[ll].elements, mm)) {
                if (!(typeof data.presentation.interactive.views[jj].groups[ll].elements[mm] === "object" && data.presentation.interactive.views[jj].groups[ll].elements[mm] && !Array.isArray(data.presentation.interactive.views[jj].groups[ll].elements[mm]))) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/groups/items/properties/elements/items/type", instanceLocation: "#/presentation/interactive/views/"+jj+"groups/"+ll+"elements/"+mm }]
                  return false
                }
                if (!("namespace" in data.presentation.interactive.views[jj].groups[ll].elements[mm] && hasOwn(data.presentation.interactive.views[jj].groups[ll].elements[mm], "namespace"))) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/groups/items/properties/elements/items/required", instanceLocation: "#/presentation/interactive/views/"+jj+"groups/"+ll+"elements/"+mm+"/namespace" }]
                  return false
                }
                if (!("id" in data.presentation.interactive.views[jj].groups[ll].elements[mm] && hasOwn(data.presentation.interactive.views[jj].groups[ll].elements[mm], "id"))) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/groups/items/properties/elements/items/required", instanceLocation: "#/presentation/interactive/views/"+jj+"groups/"+ll+"elements/"+mm+"/id" }]
                  return false
                }
                if (!(typeof data.presentation.interactive.views[jj].groups[ll].elements[mm].namespace === "string")) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/groups/items/properties/elements/items/properties/namespace/type", instanceLocation: "#/presentation/interactive/views/"+jj+"groups/"+ll+"elements/"+mm+"/namespace" }]
                  return false
                }
                if (data.presentation.interactive.views[jj].groups[ll].elements[mm].namespace.length > 2048 && stringLength(data.presentation.interactive.views[jj].groups[ll].elements[mm].namespace) > 2048) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/groups/items/properties/elements/items/properties/namespace/maxLength", instanceLocation: "#/presentation/interactive/views/"+jj+"groups/"+ll+"elements/"+mm+"/namespace" }]
                  return false
                }
                if (data.presentation.interactive.views[jj].groups[ll].elements[mm].namespace.length < 1 || stringLength(data.presentation.interactive.views[jj].groups[ll].elements[mm].namespace) < 1) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/groups/items/properties/elements/items/properties/namespace/minLength", instanceLocation: "#/presentation/interactive/views/"+jj+"groups/"+ll+"elements/"+mm+"/namespace" }]
                  return false
                }
                if (!(pattern1.test(data.presentation.interactive.views[jj].groups[ll].elements[mm].namespace))) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/groups/items/properties/elements/items/properties/namespace/pattern", instanceLocation: "#/presentation/interactive/views/"+jj+"groups/"+ll+"elements/"+mm+"/namespace" }]
                  return false
                }
                if (!(typeof data.presentation.interactive.views[jj].groups[ll].elements[mm].id === "string")) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/groups/items/properties/elements/items/properties/id/type", instanceLocation: "#/presentation/interactive/views/"+jj+"groups/"+ll+"elements/"+mm+"/id" }]
                  return false
                }
                if (data.presentation.interactive.views[jj].groups[ll].elements[mm].id.length > 2048 && stringLength(data.presentation.interactive.views[jj].groups[ll].elements[mm].id) > 2048) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/groups/items/properties/elements/items/properties/id/maxLength", instanceLocation: "#/presentation/interactive/views/"+jj+"groups/"+ll+"elements/"+mm+"/id" }]
                  return false
                }
                if (data.presentation.interactive.views[jj].groups[ll].elements[mm].id.length < 1 || stringLength(data.presentation.interactive.views[jj].groups[ll].elements[mm].id) < 1) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/groups/items/properties/elements/items/properties/id/minLength", instanceLocation: "#/presentation/interactive/views/"+jj+"groups/"+ll+"elements/"+mm+"/id" }]
                  return false
                }
                if (!(pattern1.test(data.presentation.interactive.views[jj].groups[ll].elements[mm].id))) {
                  validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/groups/items/properties/elements/items/properties/id/pattern", instanceLocation: "#/presentation/interactive/views/"+jj+"groups/"+ll+"elements/"+mm+"/id" }]
                  return false
                }
                for (const key15 of Object.keys(data.presentation.interactive.views[jj].groups[ll].elements[mm])) {
                  if (key15 !== "namespace" && key15 !== "id") {
                    validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/groups/items/properties/elements/items/additionalProperties", instanceLocation: "#/presentation/interactive/views/"+jj+"groups/"+ll+"elements/"+mm+"/"+pointerPart(key15) }]
                    return false
                  }
                }
              }
            }
            for (const key16 of Object.keys(data.presentation.interactive.views[jj].groups[ll])) {
              if (key16 !== "id" && key16 !== "label" && key16 !== "elements") {
                validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/properties/groups/items/additionalProperties", instanceLocation: "#/presentation/interactive/views/"+jj+"groups/"+ll+"/"+pointerPart(key16) }]
                return false
              }
            }
          }
        }
      }
      for (const key17 of Object.keys(data.presentation.interactive.views[jj])) {
        if (key17 !== "id" && key17 !== "questions" && key17 !== "groups") {
          validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/properties/views/items/additionalProperties", instanceLocation: "#/presentation/interactive/views/"+jj+"/"+pointerPart(key17) }]
          return false
        }
      }
    }
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
  for (const key18 of Object.keys(data.presentation.interactive)) {
    if (key18 !== "views" && key18 !== "intent") {
      validate.errors = [{ keywordLocation: "#/properties/presentation/properties/interactive/additionalProperties", instanceLocation: "#/presentation/interactive/"+pointerPart(key18) }]
      return false
    }
  }
  for (const key19 of Object.keys(data.presentation)) {
    if (key19 !== "static" && key19 !== "interactive") {
      validate.errors = [{ keywordLocation: "#/properties/presentation/additionalProperties", instanceLocation: "#/presentation/"+pointerPart(key19) }]
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
    const sub4 = (() => {
      if (!(typeof data.visualPolicy.override === "string")) return false
      if (data.visualPolicy.override.length > 2048 && stringLength(data.visualPolicy.override) > 2048) return false
      if (data.visualPolicy.override.length < 1 || stringLength(data.visualPolicy.override) < 1) return false
      if (!pattern2.test(data.visualPolicy.override)) return false
      return true
    })()
    if (!sub4) {
      const sub5 = (() => {
        if (!(data.visualPolicy.override === null)) return false
        return true
      })()
      if (!sub5) {
        validate.errors = [{ keywordLocation: "#/properties/visualPolicy/properties/override/anyOf", instanceLocation: "#/visualPolicy/override" }]
        return false
      }
    }
  }
  for (const key20 of Object.keys(data.visualPolicy)) {
    if (key20 !== "profile" && key20 !== "override") {
      validate.errors = [{ keywordLocation: "#/properties/visualPolicy/additionalProperties", instanceLocation: "#/visualPolicy/"+pointerPart(key20) }]
      return false
    }
  }
  for (const key21 of Object.keys(data)) {
    if (key21 !== "schema" && key21 !== "id" && key21 !== "editor" && key21 !== "title" && key21 !== "audiences" && key21 !== "questions" && key21 !== "scope" && key21 !== "editorialAssertions" && key21 !== "omissions" && key21 !== "transformations" && key21 !== "narrative" && key21 !== "presentation" && key21 !== "visualPolicy") {
      validate.errors = [{ keywordLocation: "#/additionalProperties", instanceLocation: "#/"+pointerPart(key21) }]
      return false
    }
  }
  return true
};
return ref0})();;
