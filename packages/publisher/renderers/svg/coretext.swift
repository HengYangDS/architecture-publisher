import Foundation
import CoreText

struct FontSelection: Decodable {
    let id: String
    let path: String
    let postscript: String
    let cascade: [String]
}
struct Request: Decodable { let text: String; let size: Double; let font: String }
struct Input: Decodable { let fonts: [FontSelection]; let requests: [Request] }
struct Ink: Encodable { let x: Double; let y: Double; let width: Double; let height: Double }
struct Metric: Encodable { let width: Double; let height: Double; let ascent: Double; let descent: Double; let glyph: Ink }
struct UsedFont: Encodable { let id: String; let path: String; let postscript: String }
struct Observation: Encodable { let fonts: [UsedFont]; let metric: Metric }
struct Output: Encodable { let status: String; let observations: [Observation] }
struct Failure: Encodable { let status: String; let code: String }
enum MeasureError: String, Error { case font = "coretext_font_unbound", glyph = "coretext_glyph_missing", input = "coretext_input_invalid" }

func encoded<T: Encodable>(_ value: T) throws -> Data {
    let encoder = JSONEncoder()
    encoder.outputFormatting = [.sortedKeys]
    return try encoder.encode(value)
}

func measure(_ input: Input) throws -> [Observation] {
    var selections: [String: FontSelection] = [:]
    var descriptors: [String: CTFontDescriptor] = [:]
    for selected in input.fonts {
        if selections[selected.id] != nil { throw MeasureError.input }
        let url = URL(fileURLWithPath: selected.path)
        guard let available = CTFontManagerCreateFontDescriptorsFromURL(url as CFURL) as? [CTFontDescriptor],
              let descriptor = available.first(where: { (CTFontDescriptorCopyAttribute($0, kCTFontNameAttribute) as? String) == selected.postscript })
        else { throw MeasureError.font }
        selections[selected.id] = selected
        descriptors[selected.id] = descriptor
    }
    return try input.requests.map { request in
        guard let selected = selections[request.font], let descriptor = descriptors[request.font] else { throw MeasureError.input }
        let fallback: [CTFontDescriptor] = try selected.cascade.map { id in
            guard let value = descriptors[id] else { throw MeasureError.input }
            return value
        }
        let bound = CTFontDescriptorCreateCopyWithAttributes(descriptor, [kCTFontCascadeListAttribute: fallback] as CFDictionary)
        let font = CTFontCreateWithFontDescriptor(bound, request.size, nil)
        if CTFontCopyPostScriptName(font) as String != selected.postscript { throw MeasureError.font }
        let string = NSAttributedString(string: request.text, attributes: [NSAttributedString.Key(kCTFontAttributeName as String): font])
        let line = CTLineCreateWithAttributedString(string)
        let allowed = [selected.id] + selected.cascade
        var used: [UsedFont] = []
        var seen: Set<String> = []
        for run in CTLineGetGlyphRuns(line) as! [CTRun] {
            let attrs = CTRunGetAttributes(run) as NSDictionary
            let actual = attrs[kCTFontAttributeName] as! CTFont
            let name = CTFontCopyPostScriptName(actual) as String
            guard let url = CTFontCopyAttribute(actual, kCTFontURLAttribute) as? URL else { throw MeasureError.font }
            let file = url.resolvingSymlinksInPath().standardizedFileURL.path
            guard let id = allowed.first(where: {
                guard let candidate = selections[$0] else { return false }
                let selectedPath = URL(fileURLWithPath: candidate.path)
                    .resolvingSymlinksInPath().standardizedFileURL.path
                return candidate.postscript == name && selectedPath == file
            }) else { throw MeasureError.font }
            var glyphs = [CGGlyph](repeating: 0, count: CTRunGetGlyphCount(run))
            CTRunGetGlyphs(run, CFRange(location: 0, length: 0), &glyphs)
            if glyphs.contains(0) { throw MeasureError.glyph }
            if seen.insert(id).inserted {
                used.append(UsedFont(id: id, path: selections[id]!.path, postscript: name))
            }
        }
        if used.isEmpty { throw MeasureError.glyph }
        var ascent: CGFloat = 0, descent: CGFloat = 0, leading: CGFloat = 0
        let width = CTLineGetTypographicBounds(line, &ascent, &descent, &leading)
        let ink = CTLineGetBoundsWithOptions(line, .useGlyphPathBounds)
        let metric = Metric(width: width, height: Double(ascent + descent), ascent: Double(ascent), descent: Double(descent),
                            glyph: Ink(x: Double(ink.origin.x), y: Double(ink.origin.y), width: Double(ink.width), height: Double(ink.height)))
        return Observation(fonts: used, metric: metric)
    }
}

do {
    let input = try JSONDecoder().decode(Input.self, from: FileHandle.standardInput.readDataToEndOfFile())
    let result = try measure(input)
    FileHandle.standardOutput.write(try encoded(Output(status: "measured", observations: result)))
} catch {
    let code = (error as? MeasureError)?.rawValue ?? "coretext_measurement_failed"
    FileHandle.standardOutput.write(try encoded(Failure(status: "error", code: code)))
    exit(1)
}
