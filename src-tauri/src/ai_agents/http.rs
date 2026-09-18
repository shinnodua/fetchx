use super::models::parse;
use super::types::{AiAgentChatInput, AiAgentChatOutput, LocalAiAgent, LocalAiAgentModel};
use serde_json::{json, Value};
use std::{
    io::{Read, Write},
    net::{SocketAddr, TcpStream},
    time::Duration,
};

const MAX_RESPONSE_BYTES: u64 = 1_048_576;

#[derive(Debug)]
pub(super) struct AgentEndpoint {
    id: &'static str,
    name: &'static str,
    endpoint: &'static str,
    protocol: &'static str,
}

const ENDPOINTS: &[AgentEndpoint] = &[
    AgentEndpoint {
        id: "fetchx-local-agent",
        name: "Fetchx Local Agent",
        endpoint: "http://127.0.0.1:37373",
        protocol: "fetchx-agent",
    },
    AgentEndpoint {
        id: "lm-studio",
        name: "LM Studio",
        endpoint: "http://127.0.0.1:1234",
        protocol: "openai-chat",
    },
    AgentEndpoint {
        id: "ollama",
        name: "Ollama",
        endpoint: "http://127.0.0.1:11434",
        protocol: "ollama-chat",
    },
];

pub(super) fn discover() -> Vec<LocalAiAgent> {
    ENDPOINTS
        .iter()
        .filter(|agent| port_is_open(agent.endpoint))
        .map(|agent| LocalAiAgent {
            id: format!("http:{}", agent.id),
            name: agent.name.to_string(),
            kind: "http".to_string(),
            command: None,
            endpoint: Some(agent.endpoint.to_string()),
            protocol: agent.protocol.to_string(),
        })
        .collect()
}

pub(super) fn discover_models(agent_id: &str) -> Result<Vec<LocalAiAgentModel>, String> {
    let agent = agent_by_id(agent_id)?;
    let path = match agent.protocol {
        "ollama-chat" => "/api/tags",
        "openai-chat" => "/v1/models",
        _ => return Ok(Vec::new()),
    };
    request(agent.endpoint, "GET", path, None).map(|response| parse(&response))
}

pub(super) fn chat(input: AiAgentChatInput) -> Result<AiAgentChatOutput, String> {
    let agent = agent_by_id(&input.agent_id)?;
    let response = match agent.protocol {
        "fetchx-agent" => request(agent.endpoint, "POST", "/chat", Some(json!({ "prompt": input.prompt }).to_string())),
        "ollama-chat" => request(agent.endpoint, "POST", "/api/chat", Some(json!({ "model": input.model.unwrap_or_else(|| "llama3.1".to_string()), "stream": false, "messages": [{ "role": "user", "content": input.prompt }] }).to_string())),
        "openai-chat" => request(agent.endpoint, "POST", "/v1/chat/completions", Some(json!({ "model": input.model.unwrap_or_else(|| "local-model".to_string()), "messages": [{ "role": "user", "content": input.prompt }], "temperature": 0.1 }).to_string())),
        _ => return Err("Unsupported local agent protocol.".to_string()),
    }?;
    Ok(AiAgentChatOutput {
        content: extract_content(&response),
    })
}

pub(super) fn agent_by_id(agent_id: &str) -> Result<&'static AgentEndpoint, String> {
    let endpoint_id = agent_id
        .strip_prefix("http:")
        .ok_or_else(|| "Unsupported local agent.".to_string())?;
    ENDPOINTS
        .iter()
        .find(|agent| agent.id == endpoint_id)
        .ok_or_else(|| "Unsupported local agent.".to_string())
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
        .take(MAX_RESPONSE_BYTES + 1)
        .read_to_string(&mut response)
        .map_err(|error| error.to_string())?;
    if response.len() as u64 > MAX_RESPONSE_BYTES {
        return Err("Agent response exceeded the 1 MB safety limit.".to_string());
    }
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
