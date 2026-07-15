use serde::Deserialize;
use serde_json::{json, Value};
use std::time::Duration;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AiChatRequest {
    base_url: String,
    api_key: String,
    model: String,
    prompt: String,
}

fn validate_base_url(base_url: &str) -> Result<(), String> {
    let is_https = base_url.starts_with("https://");
    let is_local_http = base_url.starts_with("http://localhost")
        || base_url.starts_with("http://127.0.0.1")
        || base_url.starts_with("http://[::1]");

    if is_https || is_local_http {
        Ok(())
    } else {
        Err("AI 接口必须使用 HTTPS，本机模型可使用 localhost HTTP".to_string())
    }
}

#[tauri::command]
pub async fn request_ai_album_guide(request: AiChatRequest) -> Result<String, String> {
    let base_url = request.base_url.trim().trim_end_matches('/');
    validate_base_url(base_url)?;

    if request.api_key.trim().is_empty() || request.model.trim().is_empty() {
        return Err("请先配置 AI API Key 和模型".to_string());
    }

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(45))
        .build()
        .map_err(|error| format!("无法创建 AI 请求: {error}"))?;

    let response = client
        .post(format!("{base_url}/chat/completions"))
        .bearer_auth(request.api_key.trim())
        .json(&json!({
            "model": request.model.trim(),
            "temperature": 0.7,
            "max_tokens": 700,
            "messages": [
                {
                    "role": "system",
                    "content": "你是一位克制、具体的中文音乐编辑。只根据输入信息给出听前导览，不虚构奖项、销量、制作人或曲目信息。"
                },
                {
                    "role": "user",
                    "content": request.prompt
                }
            ]
        }))
        .send()
        .await
        .map_err(|error| format!("AI 请求失败: {error}"))?;

    let status = response.status();
    let body = response
        .text()
        .await
        .map_err(|error| format!("无法读取 AI 响应: {error}"))?;

    let data: Value = serde_json::from_str(&body)
        .map_err(|_| format!("AI 服务返回了无法解析的内容（HTTP {status}）"))?;

    if !status.is_success() {
        let message = data
            .pointer("/error/message")
            .and_then(Value::as_str)
            .unwrap_or("AI 服务返回错误");
        return Err(format!("{message}（HTTP {status}）"));
    }

    data.pointer("/choices/0/message/content")
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|content| !content.is_empty())
        .map(str::to_string)
        .ok_or_else(|| "AI 响应中没有可用内容".to_string())
}
