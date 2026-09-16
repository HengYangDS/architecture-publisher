import { fail } from '../source/manifest.mjs';

const invalid = () => fail('raster_svg_value_invalid');
const number = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/;
const whitespace = /^[\t\n\r ]*/;
const units = /^(?:px|em|ex|in|cm|mm|pt|pc|%)/;
const words = (value) => new Set(value.split(' '));
const lengths = words(
  'width height x y x1 y1 x2 y2 cx cy r rx ry dx dy stroke-width stroke-dashoffset markerWidth markerHeight refX refY fx fy fr font-size letter-spacing word-spacing textLength',
);
const nonnegative = words(
  'width height r rx ry fr stroke-width markerWidth markerHeight font-size textLength',
);
const fractions = words(
  'opacity fill-opacity stroke-opacity stop-opacity offset',
);
const enums = Object.fromEntries(
  Object.entries({
    'fill-rule': 'nonzero evenodd',
    'clip-rule': 'nonzero evenodd',
    'stroke-linecap': 'butt round square',
    'stroke-linejoin': 'miter round bevel',
    clipPathUnits: 'userSpaceOnUse objectBoundingBox',
    markerUnits: 'strokeWidth userSpaceOnUse',
    gradientUnits: 'userSpaceOnUse objectBoundingBox',
    spreadMethod: 'pad reflect repeat',
    'font-style': 'normal italic oblique',
    'text-anchor': 'start middle end',
    'dominant-baseline':
      'auto use-script no-change reset-size ideographic alphabetic hanging mathematical central middle text-after-edge text-before-edge',
    'alignment-baseline':
      'auto baseline before-edge text-before-edge middle central after-edge text-after-edge ideographic alphabetic hanging mathematical',
    lengthAdjust: 'spacing spacingAndGlyphs',
    visibility: 'visible hidden collapse',
    display:
      'inline block list-item run-in compact marker table inline-table table-row-group table-header-group table-footer-group table-row table-column-group table-column table-cell table-caption none',
    'vector-effect': 'none non-scaling-stroke',
    'shape-rendering': 'auto optimizeSpeed crispEdges geometricPrecision',
    'text-rendering':
      'auto optimizeSpeed optimizeLegibility geometricPrecision',
  }).map(([key, value]) => [key, words(value)]),
);
const inheritable = words(
  'opacity fill fill-opacity fill-rule stroke stroke-width stroke-opacity stroke-linecap stroke-linejoin stroke-miterlimit stroke-dasharray stroke-dashoffset clip-path clip-rule marker-start marker-mid marker-end stop-color stop-opacity font-family font-size font-weight font-style text-anchor dominant-baseline alignment-baseline letter-spacing word-spacing visibility display color shape-rendering text-rendering',
);
const attributeNames = new Set([
  ...lengths,
  ...fractions,
  ...Object.keys(enums),
  ...words(
    'id role stroke-miterlimit stroke-dasharray d points transform gradientTransform viewBox preserveAspectRatio orient fill stroke color stop-color clip-path marker-start marker-mid marker-end font-weight font-family version',
  ),
]);
export const isSvgAttribute = (name) =>
  attributeNames.has(name) || /^(?:data|aria)-[\w-]+$/.test(name);
// SVG/CSS named colors are vocabulary, not a renderer-dependent fallback.
const colors = words(
  'aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato transparent turquoise violet wheat white whitesmoke yellow yellowgreen',
);

class Numbers {
  constructor(source) {
    this.rest = source.trim();
  }
  space() {
    const match = whitespace.exec(this.rest)[0];
    this.rest = this.rest.slice(match.length);
    return match.length;
  }
  separator() {
    let separated = this.space() > 0;
    if (this.rest[0] === ',') {
      separated = true;
      this.rest = this.rest.slice(1);
      this.space();
      if (!this.rest || this.rest[0] === ',') invalid();
    }
    return separated;
  }
  take({
    length = false,
    flag = false,
    first = false,
    requiredSeparator = false,
    negativePair = false,
  } = {}) {
    if (
      !first &&
      !this.separator() &&
      requiredSeparator &&
      !(negativePair && this.rest[0] === '-')
    )
      invalid();
    const match = (flag ? /^[01]/ : number).exec(this.rest);
    if (!match) invalid();
    this.rest = this.rest.slice(match[0].length);
    const value = Number(match[0]);
    if (!Number.isFinite(value)) invalid();
    let unit = '';
    if (length) {
      unit = units.exec(this.rest)?.[0] ?? '';
      this.rest = this.rest.slice(unit.length);
    }
    return { value, unit };
  }
  done() {
    this.space();
    if (this.rest) invalid();
  }
}

function list(value, length = false, points = false) {
  const input = new Numbers(value),
    result = [];
  if (!input.rest) return result;
  while (input.rest.trim()) {
    result.push(
      input.take({
        length,
        first: result.length === 0,
        requiredSeparator: true,
        negativePair: points && result.length % 2 === 1,
      }),
    );
  }
  return result;
}

function scalar(value, length = false) {
  const input = new Numbers(value),
    result = input.take({ length, first: true });
  input.done();
  return result;
}

function pathData(value) {
  // SVG path grammar; flags consume one digit so compact arc flags stay valid.
  const input = new Numbers(value),
    counts = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7 };
  let initial = true;
  while (input.rest) {
    const command = input.rest[0].toUpperCase();
    if ((initial && command !== 'M') || !(command in counts || command === 'Z'))
      invalid();
    initial = false;
    input.rest = input.rest.slice(1);
    input.space();
    if (command === 'Z') continue;
    let groups = 0;
    do {
      for (let index = 0; index < counts[command]; index++) {
        const { value } = input.take({
          first: groups === 0 && index === 0,
          flag: command === 'A' && (index === 3 || index === 4),
          requiredSeparator: command === 'A' && index === 3,
        });
        if (command === 'A' && index < 2 && value < 0) invalid();
      }
      groups++;
      input.space();
    } while (input.rest && !/^[A-Za-z]/.test(input.rest));
  }
}

function transform(value) {
  if (value === 'none') return;
  let rest = value.trim();
  const sizes = {
    matrix: [6],
    translate: [1, 2],
    scale: [1, 2],
    rotate: [1, 3],
    skewX: [1],
    skewY: [1],
  };
  while (rest) {
    const match = /^([A-Za-z]+)\s*\(([^()]*)\)/.exec(rest);
    if (!match || !sizes[match[1]]?.includes(list(match[2]).length)) invalid();
    rest = rest.slice(match[0].length).trim();
    if (rest[0] === ',') {
      rest = rest.slice(1).trim();
      if (!rest) invalid();
    }
  }
}

function color(value) {
  if (
    value === 'currentColor' ||
    colors.has(value.toLowerCase()) ||
    /^#(?:[a-f\d]{3}|[a-f\d]{4}|[a-f\d]{6}|[a-f\d]{8})$/i.test(value)
  )
    return;
  const match = /^(rgb|rgba|hsl|hsla)\(([^()]*)\)$/i.exec(value);
  if (!match) invalid();
  const items = list(match[2], true),
    type = match[1].toLowerCase();
  if (items.length !== 3 && items.length !== 4) invalid();
  if (items[3]?.unit) invalid();
  if (type.startsWith('rgb')) {
    const unit = items[0].unit;
    if (
      !['', '%'].includes(unit) ||
      items.slice(0, 3).some((x) => x.unit !== unit)
    )
      invalid();
    if (!unit && items.slice(1, 3).some((x) => !Number.isInteger(x.value)))
      invalid();
  } else {
    if (
      items[0].unit ||
      !Number.isInteger(items[0].value) ||
      items.slice(1, 3).some((x) => !['', '%'].includes(x.unit))
    )
      invalid();
  }
}

/** Value admission for the existing declarative profile, not SVG sanitization. */
export function validateSvgValues(tag, attributes) {
  for (const [key, original] of Object.entries(attributes)) {
    const value = original.trim();
    if (
      key === 'id' ||
      key === 'href' ||
      key === 'role' ||
      /^data-|^aria-/.test(key)
    )
      continue;
    if (value === 'inherit' && inheritable.has(key)) continue;
    if (lengths.has(key)) {
      if (
        ['letter-spacing', 'word-spacing'].includes(key) &&
        value === 'normal'
      )
        continue;
      const items =
        ['text', 'tspan'].includes(tag) && ['x', 'y', 'dx', 'dy'].includes(key)
          ? list(value, true)
          : [scalar(value, true)];
      if (
        !items.length ||
        (nonnegative.has(key) && items.some((x) => x.value < 0))
      )
        invalid();
    } else if (fractions.has(key)) {
      const item = scalar(value, true);
      if (item.unit && item.unit !== '%') invalid();
    } else if (enums[key]) {
      if (!enums[key].has(value)) invalid();
    } else if (key === 'stroke-miterlimit') {
      if (scalar(value).value < 1) invalid();
    } else if (key === 'stroke-dasharray') {
      if (value !== 'none') {
        const items = list(value, true);
        if (!items.length || items.some((x) => x.value < 0)) invalid();
      }
    } else if (key === 'd') pathData(value);
    else if (key === 'points') {
      if (list(value, false, true).length % 2) invalid();
    } else if (key === 'transform' || key === 'gradientTransform')
      transform(value);
    else if (key === 'viewBox') {
      const box = list(value);
      if (box.length !== 4 || box[2].value <= 0 || box[3].value <= 0) invalid();
    } else if (key === 'preserveAspectRatio') {
      if (
        !/^(?:defer\s+)?(?:none|x(?:Min|Mid|Max)Y(?:Min|Mid|Max))(?:\s+(?:meet|slice))?$/.test(
          value,
        )
      )
        invalid();
    } else if (key === 'orient') {
      if (!['auto', 'auto-start-reverse'].includes(value)) {
        scalar(value.replace(/(?:deg|grad|rad)$/, ''));
      }
    } else if (['fill', 'stroke', 'color', 'stop-color'].includes(key)) {
      if (
        ['fill', 'stroke'].includes(key) &&
        (value === 'none' || /^url\(\s*#[A-Za-z_][\w.:-]*\s*\)$/.test(value))
      )
        continue;
      color(value);
    } else if (key === 'clip-path' || key.startsWith('marker-')) {
      if (value !== 'none' && !/^url\(\s*#[A-Za-z_][\w.:-]*\s*\)$/.test(value))
        invalid();
    } else if (key === 'font-weight') {
      if (!/^(?:normal|bold|bolder|lighter|[1-9]00)$/.test(value)) invalid();
    } else if (key === 'font-family') {
      if (!value || /[;{}()]/.test(value)) invalid();
    } else if (key === 'version') {
      if (!['1.0', '1.1', '1.2', '2.0'].includes(value)) invalid();
    } else invalid();
  }
}
