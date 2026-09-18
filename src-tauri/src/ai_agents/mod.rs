mod cli;
mod http;
mod models;
mod types;

#[cfg(test)]
#[path = "test/mod.rs"]
mod test;

use types::{AiAgentChatInput, AiAgentChatOutput, LocalAiAgent, LocalAiAgentModel};

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
    tauri::async_runtime::spawn_blocking(move || {
        if input.agent_id.starts_with("cli:") {
            cli::chat(&input.agent_id, input.model.as_deref(), &input.prompt)
        } else {
            http::chat(input)
        }
    })
    .await
    .map_err(|error| format!("The local agent task could not complete: {error}"))?
}

#[tauri::command]
pub(crate) async fn discover_ai_agent_models(
    agent_id: String,
) -> Result<Vec<LocalAiAgentModel>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        if agent_id.starts_with("cli:") {
            cli::discover_models(&agent_id)
        } else {
            http::discover_models(&agent_id)
        }
    })
    .await
    .map_err(|error| format!("The local agent model discovery task could not complete: {error}"))?
}
