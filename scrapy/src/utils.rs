use std::{env, path::PathBuf};

use crate::constants::PRICING_INFO;

pub fn calculate_price(model: &str, input_tokens: u64, output_tokens: u64) -> f64 {
    let pricing_info = PRICING_INFO.get(model).unwrap();
    (input_tokens as f64 * pricing_info.input) + (output_tokens as f64 * pricing_info.output)
}

pub fn get_all_models() -> Vec<String> {
    PRICING_INFO.keys().map(|k| k.to_string()).collect()
}


pub fn find_static_dir() -> PathBuf {
    // 1. Try STATIC_DIR environment variable
    if let Ok(dir) = env::var("STATIC_DIR") {
        let path = PathBuf::from(dir);
        if path.is_dir() {
            return path;
        }
    }

    // 2. Try directory containing Cargo.toml
    if let Ok(manifest_dir) = env::var("CARGO_MANIFEST_DIR") {
        let path = PathBuf::from(manifest_dir).join("static");
        if path.is_dir() {
            return path;
        }
    }

    // 3. Try directory containing the executable
    if let Ok(exec_path) = env::current_exe() {
        if let Some(exec_dir) = exec_path.parent() {
            let path = exec_dir.join("static");
            if path.is_dir() {
                return path;
            }
        }
    }

    // 4. Try current working directory
    env::current_dir()
        .expect("Failed to get current working directory")
        .join("static") // Return this path even if it doesn't exist
}
