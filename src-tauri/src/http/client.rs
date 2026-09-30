use super::types::{NativeHttpRequest, NativeHttpResponse};
use reqwest::header::{HeaderMap, HeaderName, HeaderValue};
use std::collections::HashMap;
use std::str::FromStr;
use std::time::Duration;

pub(super) fn validate_url(url: &str) -> Result<(), String> {
    let trimmed = url.trim();
    if trimmed.is_empty() {
        return Err("URL cannot be empty.".to_string());
    }
    if !trimmed.starts_with("http://") && !trimmed.starts_with("https://") {
        return Err("URL must start with http:// or https://.".to_string());
    }
    Ok(())
}

pub(super) fn validate_method(method: &str) -> Result<reqwest::Method, String> {
    reqwest::Method::from_str(method.trim().to_uppercase().as_str())
        .map_err(|_| format!("Invalid HTTP method: {method}"))
}

pub(super) fn build_header_map(headers: &HashMap<String, String>) -> HeaderMap {
    let mut header_map = HeaderMap::new();
    for (name, value) in headers {
        if let (Ok(header_name), Ok(header_value)) = (
            HeaderName::from_str(name.trim()),
            HeaderValue::from_str(value.trim()),
        ) {
            header_map.insert(header_name, header_value);
        }
    }
    header_map
}

pub(super) fn map_response_headers(header_map: &HeaderMap) -> HashMap<String, String> {
    let mut headers = HashMap::new();
    for (name, value) in header_map {
        if let Ok(value_str) = value.to_str() {
            headers.insert(name.as_str().to_lowercase(), value_str.to_string());
        }
    }
    headers
}

pub(crate) async fn execute_request(
    request: NativeHttpRequest,
) -> Result<NativeHttpResponse, String> {
    validate_url(&request.url)?;
    let method = validate_method(&request.method)?;

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(60))
        .build()
        .map_err(|error| format!("Failed to initialize HTTP client: {error}"))?;

    let header_map = build_header_map(&request.headers);

    let mut req_builder = client
        .request(method, request.url.trim())
        .headers(header_map);

    if let Some(body) = request.body {
        req_builder = req_builder.body(body);
    }

    let response = req_builder
        .send()
        .await
        .map_err(|error| format!("Native request failed: {error}"))?;

    let status = response.status().as_u16();
    let status_text = response
        .status()
        .canonical_reason()
        .unwrap_or("")
        .to_string();

    let response_headers = map_response_headers(response.headers());

    let bytes = response
        .bytes()
        .await
        .map_err(|error| format!("Failed to read response body: {error}"))?;

    let body = String::from_utf8_lossy(&bytes).to_string();

    Ok(NativeHttpResponse {
        status,
        status_text,
        headers: response_headers,
        body,
    })
}
