mod cli;
mod http;
mod models;
mod types;

#[cfg(test)]
#[path = "test/mod.rs"]
mod test;

use types::{
    AiAgentChatInput, AiAgentChatOutput, AiAgentSelection, LocalAiAgent, LocalAiAgentModel,
};

#[tauri::command]
pub(crate) fn discover_ai_agents() -> Vec<LocalAiAgent> {
    cli::discover()
        .into_iter()
        .chain(http::discover())
        .collect()
}

#[tauri::command]
pub(crate) async fn chat_with_ai_agent(
    input: AiAgentChatInput,
) -> Result<AiAgentChatOutput, String> {
    tauri::async_runtime::spawn_blocking(move || match input.agent.kind.as_str() {
        "cli" => cli::chat(input),
        "http" => http::chat(input),
        _ => Err("Unsupported agent kind.".to_string()),
    })
    .await
    .map_err(|error| format!("The local agent task could not complete: {error}"))?
}

#[tauri::command]
pub(crate) async fn discover_ai_agent_models(
    agent: AiAgentSelection,
) -> Result<Vec<LocalAiAgentModel>, String> {
    tauri::async_runtime::spawn_blocking(move || match agent.kind.as_str() {
        "cli" => cli::discover_models(agent),
        "http" => http::discover_models(agent),
        _ => Err("Unsupported agent kind.".to_string()),
    })
    .await
    .map_err(|error| format!("The local agent model discovery task could not complete: {error}"))?
}
