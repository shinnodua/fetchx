use serde_json::Value;

use super::types::LocalAiAgentModel;

pub(super) fn parse(response: &str) -> Vec<LocalAiAgentModel> {
    let parsed: Value = serde_json::from_str(response).unwrap_or(Value::Null);
    if let Some(models) = parsed
        .get("data")
        .or_else(|| parsed.get("models"))
        .and_then(Value::as_array)
    {
        return models.iter().filter_map(model_from_json).collect();
    }

    response
        .lines()
        .map(str::trim)
        .filter(|line| !line.is_empty() && !line.ends_with(':'))
        .map(|line| line.trim_start_matches(['-', '*', ' ']).trim())
        .filter(|line| !line.is_empty())
        .map(model_from_line)
        .collect()
}

fn model_from_json(value: &Value) -> Option<LocalAiAgentModel> {
    let id = value
        .get("id")
        .or_else(|| value.get("name"))
        .and_then(Value::as_str)?
        .trim();
    (!id.is_empty()).then(|| LocalAiAgentModel {
        id: id.to_string(),
        name: value
            .get("display_name")
            .or_else(|| value.get("name"))
            .and_then(Value::as_str)
            .unwrap_or(id)
            .trim()
            .to_string(),
    })
}

fn model_from_line(line: &str) -> LocalAiAgentModel {
    let (id, name) = line.split_once('\t').unwrap_or((line, line));
    LocalAiAgentModel {
        id: id.trim().to_string(),
        name: name.trim().to_string(),
    }
}
