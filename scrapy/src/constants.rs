use crate::models::PricingInfo;
use phf::phf_map;

pub static PRICING_INFO: phf::Map<&'static str, PricingInfo> = phf_map! {
    "gemini-1.5-flash-latest" => PricingInfo {
        input: 0.075 / 1_000_000.0,
        output: 0.3 / 1_000_000.0,
    },
};
