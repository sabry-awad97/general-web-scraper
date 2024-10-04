use crate::constants::PRICING_INFO;

pub fn calculate_price(model: &str, input_tokens: u64, output_tokens: u64) -> f64 {
    let pricing_info = PRICING_INFO.get(model).unwrap();
    (input_tokens as f64 * pricing_info.input) + (output_tokens as f64 * pricing_info.output)
}

pub fn get_all_models() -> Vec<String> {
    PRICING_INFO.keys().map(|k| k.to_string()).collect()
}
