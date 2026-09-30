use super::client::{build_header_map, map_response_headers, validate_method, validate_url};
use super::types::{NativeHttpRequest, NativeHttpResponse};
use reqwest::header::{HeaderMap, HeaderName, HeaderValue};
use std::collections::HashMap;

#[test]
fn accepts_valid_http_and_https_urls() {
    assert!(validate_url("http://localhost:3000/api").is_ok());
    assert!(validate_url("https://api.pilauncher.org/v1/public/servers/community").is_ok());
    assert!(validate_url("   https://example.com/test   ").is_ok());
}

#[test]
fn rejects_empty_or_non_http_urls() {
    assert_eq!(validate_url(""), Err("URL cannot be empty.".to_string()));
    assert_eq!(validate_url("   "), Err("URL cannot be empty.".to_string()));
    assert_eq!(
        validate_url("ftp://example.com"),
        Err("URL must start with http:// or https://.".to_string())
    );
    assert_eq!(
        validate_url("localhost:3000"),
        Err("URL must start with http:// or https://.".to_string())
    );
}

#[test]
fn validates_http_methods() {
    assert_eq!(validate_method("GET").unwrap(), reqwest::Method::GET);
    assert_eq!(validate_method("post").unwrap(), reqwest::Method::POST);
    assert_eq!(validate_method("DELETE").unwrap(), reqwest::Method::DELETE);
    assert!(validate_method("INVALID METHOD WITH SPACES").is_err());
}

#[test]
fn builds_header_map_from_hash_map() {
    let mut headers = HashMap::new();
    headers.insert("Content-Type".to_string(), "application/json".to_string());
    headers.insert("Authorization".to_string(), "Bearer secret".to_string());

    let header_map = build_header_map(&headers);
    assert_eq!(
        header_map.get("content-type").unwrap(),
        &HeaderValue::from_static("application/json")
    );
    assert_eq!(
        header_map.get("authorization").unwrap(),
        &HeaderValue::from_static("Bearer secret")
    );
}

#[test]
fn maps_response_headers_to_lowercase_keys() {
    let mut header_map = HeaderMap::new();
    header_map.insert(
        HeaderName::from_static("content-type"),
        HeaderValue::from_static("application/json; charset=utf-8"),
    );
    header_map.insert(
        HeaderName::from_static("x-custom-header"),
        HeaderValue::from_static("custom-value"),
    );

    let mapped = map_response_headers(&header_map);
    assert_eq!(
        mapped.get("content-type").unwrap(),
        "application/json; charset=utf-8"
    );
    assert_eq!(mapped.get("x-custom-header").unwrap(), "custom-value");
}

#[test]
fn deserializes_native_http_request_with_defaults() {
    let json_data = r#"{"url":"https://example.com"}"#;
    let request: NativeHttpRequest = serde_json::from_str(json_data).unwrap();

    assert_eq!(request.url, "https://example.com");
    assert_eq!(request.method, "GET");
    assert!(request.headers.is_empty());
    assert!(request.body.is_none());
}

#[test]
fn serializes_native_http_response_in_camel_case() {
    let mut headers = HashMap::new();
    headers.insert("content-type".to_string(), "application/json".to_string());

    let response = NativeHttpResponse {
        status: 200,
        status_text: "OK".to_string(),
        headers,
        body: r#"{"status":"ok"}"#.to_string(),
    };

    let serialized = serde_json::to_string(&response).unwrap();
    assert!(serialized.contains(r#""statusText":"OK""#));
    assert!(serialized.contains(r#""status":200"#));
}
