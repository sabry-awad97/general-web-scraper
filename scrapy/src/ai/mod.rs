#[cfg(test)]
mod tests {
    use google_generative_ai_rs::v1::{
        api::Client,
        gemini::{request::Request, Content, Model, Part, ResponseType, Role},
    };

    #[tokio::test]
    async fn text_request_stream() -> Result<(), Box<dyn std::error::Error>> {
        dotenvy::dotenv().ok();

        // Either run as a standard text request or a stream generate content request
        let client = Client::new_from_model_response_type(
            Model::GeminiPro,
            std::env::var("GEMINI_API_KEY").unwrap().to_string(),
            ResponseType::StreamGenerateContent,
        );

        let prompt = r#"Give me a recipe for banana bread."#.to_string();

        let txt_request = Request {
            contents: vec![Content {
                role: Role::User,
                parts: vec![Part {
                    text: Some(prompt),
                    inline_data: None,
                    file_data: None,
                    video_metadata: None,
                }],
            }],
            tools: vec![],
            safety_settings: vec![],
            generation_config: None,
            system_instruction: None,
        };

        let response = client.post(30, &txt_request).await?;

        println!("{:#?}", response);

        let message = std::sync::Arc::new(std::sync::Mutex::new(String::new()));

        if let Some(stream_response) = response.streamed() {
            if let Some(json_stream) = stream_response.response_stream {
                let message_clone = message.clone();
                Client::for_each_async(json_stream, move |response| {
                    let message_clone = message_clone.clone();
                    async move {
                        let part = &response.candidates[0].content.parts[0].text;
                        if let Some(text) = part {
                            let mut message = message_clone.lock().unwrap();
                            message.push_str(text);
                        }
                    }
                })
                .await;
            }
        }

        println!("Response: {}", message.lock().unwrap());

        Ok(())
    }
}
