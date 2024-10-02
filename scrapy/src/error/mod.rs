#[derive(thiserror::Error, Debug)]
pub enum AppError {
    #[error("Reqwest Error: {0}")]
    Reqwest(#[from] reqwest::Error),
}
