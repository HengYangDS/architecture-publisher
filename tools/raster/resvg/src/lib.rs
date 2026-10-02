use std::sync::Arc;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Default)]
pub struct Renderer {
    fonts: Vec<Vec<u8>>,
}

#[wasm_bindgen]
impl Renderer {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self::default()
    }

    #[wasm_bindgen(js_name = addFont)]
    pub fn add_font(&mut self, bytes: &[u8]) {
        self.fonts.push(bytes.to_vec());
    }

    #[wasm_bindgen(js_name = measureText)]
    pub fn measure_text(&self, svg: &[u8], count: u32) -> Result<Vec<f64>, JsError> {
        if count == 0 || count > 4096 || svg.len() > 16 * 1024 * 1024 {
            return Err(JsError::new("measurement_limit"));
        }
        let mut fontdb = resvg::usvg::fontdb::Database::new();
        for bytes in &self.fonts {
            fontdb.load_font_data(bytes.clone());
        }
        let options = resvg::usvg::Options {
            resources_dir: None,
            fontdb: Arc::new(fontdb),
            ..resvg::usvg::Options::default()
        };
        let tree =
            resvg::usvg::Tree::from_data(svg, &options).map_err(|_| JsError::new("svg_invalid"))?;
        let mut values = Vec::with_capacity(count as usize * 4);
        for index in 0..count {
            let id = format!("architecture-measure-{index}");
            let Some(resvg::usvg::Node::Text(text)) = tree.node_by_id(&id) else {
                return Err(JsError::new("measurement_text_missing"));
            };
            let ink = text.flattened();
            if !ink.has_children() {
                return Err(JsError::new("measurement_ink_missing"));
            }
            let bounds = ink.abs_bounding_box();
            values.extend([
                bounds.x() as f64,
                bounds.y() as f64,
                bounds.width() as f64,
                bounds.height() as f64,
            ]);
        }
        Ok(values)
    }

    pub fn render(&self, svg: &[u8], width: u32) -> Result<Vec<u8>, JsError> {
        if width == 0 {
            return Err(JsError::new("width_invalid"));
        }
        let mut fontdb = resvg::usvg::fontdb::Database::new();
        for bytes in &self.fonts {
            fontdb.load_font_data(bytes.clone());
        }
        let options = resvg::usvg::Options {
            resources_dir: None,
            fontdb: Arc::new(fontdb),
            ..resvg::usvg::Options::default()
        };
        let tree =
            resvg::usvg::Tree::from_data(svg, &options).map_err(|_| JsError::new("svg_invalid"))?;
        let size = tree.size();
        let height = (width as f64 * size.height() as f64 / size.width() as f64).round() as u32;
        let target = resvg::tiny_skia::IntSize::from_wh(width, height)
            .ok_or_else(|| JsError::new("dimensions_invalid"))?;
        let mut pixmap = resvg::tiny_skia::Pixmap::new(target.width(), target.height())
            .ok_or_else(|| JsError::new("allocation_failed"))?;
        let sx = target.width() as f32 / size.width() as f32;
        let sy = target.height() as f32 / size.height() as f32;
        resvg::render(
            &tree,
            resvg::tiny_skia::Transform::from_scale(sx, sy),
            &mut pixmap.as_mut(),
        );
        pixmap
            .encode_png()
            .map_err(|_| JsError::new("png_encode_failed"))
    }
}
