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
