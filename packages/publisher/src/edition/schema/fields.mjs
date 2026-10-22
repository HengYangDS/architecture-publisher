export const closed = (required, properties) => ({
  type: "object",
  required,
  properties,
  additionalProperties: false,
});

export const identifier = { type: "string", pattern: "^[a-z][a-z0-9-]{0,79}$" };

export const text = {
  type: "string",
  minLength: 1,
  maxLength: 2048,
  pattern: "^(?!\\s)(?!.*\\s$)[^\\u0000-\\u001f\\u007f]+$",
};

export const prose = {
  type: "string",
  minLength: 1,
  pattern: "^[^\\u0000-\\u0008\\u000b\\u000c\\u000e-\\u001f\\u007f]+$",
  not: { pattern: "^\\s*$" },
};

export const digest = { type: "string", pattern: "^[a-f0-9]{64}$" };

export const portable = {
  type: "string",
  minLength: 1,
  maxLength: 2048,
  pattern: "^[^\\\\\\u0000-\\u001f\\u007f]+$",
};

export const questionIds = {
  type: "array",
  minItems: 1,
  uniqueItems: true,
  items: identifier,
};

export const coordinate = { type: "number", minimum: -12000, maximum: 12000 };

export const canvasPoint = closed(["x", "y"], { x: coordinate, y: coordinate });

export const canvasBox = closed(["x", "y", "width", "height"], {
  x: coordinate,
  y: coordinate,
  width: { type: "number", exclusiveMinimum: 0, maximum: 12000 },
  height: { type: "number", exclusiveMinimum: 0, maximum: 12000 },
});

export const semanticIds = {
  type: "array",
  maxItems: 4096,
  uniqueItems: true,
  items: text,
};
