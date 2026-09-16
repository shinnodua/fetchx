use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct LocalAiAgent {
    pub(super) id: String,
    pub(super) name: String,
    pub(super) kind: String,
    pub(super) command: Option<String>,
    pub(super) endpoint: Option<String>,
    pub(super) protocol: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct AiAgentSelection {
    pub(super) kind: String,
    pub(super) command: Option<String>,
    pub(super) endpoint: Option<String>,
    pub(super) protocol: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct AiAgentChatInput {
    pub(super) agent: AiAgentSelection,
    pub(super) model: Option<String>,
    pub(super) prompt: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct AiAgentChatOutput {
    pub(super) content: String,
}

#[derive(Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub(crate) struct LocalAiAgentModel {
    pub(super) id: String,
    pub(super) name: String,
}
