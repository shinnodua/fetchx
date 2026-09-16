use super::models::parse;
use super::types::{
    AiAgentChatInput, AiAgentChatOutput, AiAgentSelection, LocalAiAgent, LocalAiAgentModel,
};
use serde_json::{json, Value};
use std::{
    io::{Read, Write},
    net::{SocketAddr, TcpStream},
    time::Duration,
};

const ENDPOINTS: &[(&str, &str, &str, &str)] = &[
    (
        "call3-local-agent",
        "Call3 Local Agent",
        "http://127.0.0.1:37373",
        "call3-agent",
    ),
    (
        "lm-studio",
        "LM Studio",
        "http://127.0.0.1:1234",
        "openai-chat",
    ),
    ("ollama", "Ollama", "http://127.0.0.1:11434", "ollama-chat"),
];

pub(super) fn discover() -> Vec<LocalAiAgent> {
    ENDPOINTS
        .iter()
        .filter(|(_, _, endpoint, _)| port_is_open(endpoint))
        .map(|(id, name, endpoint, protocol)| LocalAiAgent {
            id: format!("http:{id}"),
            name: (*name).to_string(),
            kind: "http".to_string(),
            command: None,
            endpoint: Some((*endpoint).to_string()),
            protocol: (*protocol).to_string(),
        })
        .collect()
}

pub(super) fn discover_models(agent: AiAgentSelection) -> Result<Vec<LocalAiAgentModel>, String> {
    let endpoint = agent
        .endpoint
        .ok_or_else(|| "Missing agent endpoint.".to_string())?;
    let path = match agent.protocol.as_str() {
        "ollama-chat" => "/api/tags",
        "openai-chat" => "/v1/models",
        _ => return Ok(Vec::new()),
    };
    request(&endpoint, "GET", path, None).map(|response| parse(&response))
}

pub(super) fn chat(input: AiAgentChatInput) -> Result<AiAgentChatOutput, String> {
    let endpoint = input
        .agent
        .endpoint
        .ok_or_else(|| "Missing agent endpoint.".to_string())?;
    let response = match input.agent.protocol.as_str() {
        "call3-agent" => request(&endpoint, "POST", "/chat", Some(json!({ "prompt": input.prompt }).to_string())),
        "ollama-chat" => request(&endpoint, "POST", "/api/chat", Some(json!({ "model": "llama3.1", "stream": false, "messages": [{ "role": "user", "content": input.prompt }] }).to_string())),
        _ => request(&endpoint, "POST", "/v1/chat/completions", Some(json!({ "model": "local-model", "messages": [{ "role": "user", "content": input.prompt }], "temperature": 0.1 }).to_string())),
    }?;
    Ok(AiAgentChatOutput {
        content: extract_content(&response),
    })
}

pub(super) fn parse_endpoint(endpoint: &str) -> Result<(&str, u16), String> {
    let without_scheme = endpoint
        .strip_prefix("http://")
        .ok_or_else(|| "Only http:// localhost agent endpoints are supported.".to_string())?;
    let host_port = without_scheme
        .split('/')
        .next()
        .ok_or_else(|| "Invalid agent endpoint.".to_string())?;
    let (host, port) = host_port
        .rsplit_once(':')
        .ok_or_else(|| "Agent endpoint must include a port.".to_string())?;
    let port = port
        .parse::<u16>()
        .map_err(|_| "Agent endpoint port is invalid.".to_string())?;
    if host != "127.0.0.1" && host != "localhost" {
        return Err("Only localhost agent endpoints are supported.".to_string());
    }
    Ok((host, port))
}

fn port_is_open(endpoint: &str) -> bool {
    let Ok((host, port)) = parse_endpoint(endpoint) else {
        return false;
    };
    let Ok(address) = format!("{host}:{port}").parse::<SocketAddr>() else {
        return false;
    };
    TcpStream::connect_timeout(&address, Duration::from_millis(180)).is_ok()
}

fn request(
    endpoint: &str,
    method: &str,
    path: &str,
    body: Option<String>,
) -> Result<String, String> {
    let (host, port) = parse_endpoint(endpoint)?;
    let mut stream =
        TcpStream::connect(format!("{host}:{port}")).map_err(|error| error.to_string())?;
    stream
        .set_read_timeout(Some(Duration::from_secs(120)))
        .map_err(|error| error.to_string())?;
    stream
        .set_write_timeout(Some(Duration::from_secs(10)))
        .map_err(|error| error.to_string())?;
    let body = body.unwrap_or_default();
    let request = format!("{method} {path} HTTP/1.1\r\nHost: {host}:{port}\r\nContent-Type: application/json\r\nAccept: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}", body.len());
    stream
        .write_all(request.as_bytes())
        .map_err(|error| error.to_string())?;
    let mut response = String::new();
    stream
        .read_to_string(&mut response)
        .map_err(|error| error.to_string())?;
    let (head, body) = response
        .split_once("\r\n\r\n")
        .ok_or_else(|| "Agent returned an invalid HTTP response.".to_string())?;
    if !head.starts_with("HTTP/1.1 2") && !head.starts_with("HTTP/1.0 2") {
        return Err(format!(
            "Agent returned {}.",
            head.lines().next().unwrap_or("an HTTP error")
        ));
    }
    Ok(body.to_string())
}

fn extract_content(response: &str) -> String {
    let parsed: Value =
        serde_json::from_str(response).unwrap_or_else(|_| json!({ "content": response }));
    let paths: &[&[&str]] = &[
        &["content"],
        &["message"],
        &["response"],
        &["message", "content"],
        &["choices", "0", "message", "content"],
    ];
    paths
        .iter()
        .find_map(|path| extract_json_string(&parsed, path))
        .unwrap_or_else(|| response.trim().to_string())
}

fn extract_json_string(value: &Value, path: &[&str]) -> Option<String> {
    path.iter()
        .try_fold(value, |current, key| match key.parse::<usize>() {
            Ok(index) => current.get(index),
            Err(_) => current.get(*key),
        })
        .and_then(Value::as_str)
        .map(ToString::to_string)
}
