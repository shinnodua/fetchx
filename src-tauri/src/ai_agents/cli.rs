use std::{env, path::PathBuf, process::Command};

use super::models::parse;
use super::types::{
    AiAgentChatInput, AiAgentChatOutput, AiAgentSelection, LocalAiAgent, LocalAiAgentModel,
};

#[derive(Clone, Copy)]
pub(super) struct AgentCli {
    command: &'static str,
    name: &'static str,
    args_before_prompt: &'static [&'static str],
    prompt_is_option_value: bool,
}

const SUPPORTED: &[AgentCli] = &[
    AgentCli {
        command: "claude",
        name: "Claude Code",
        args_before_prompt: &["-p"],
        prompt_is_option_value: true,
    },
    AgentCli {
        command: "agy",
        name: "Google Antigravity CLI",
        args_before_prompt: &["--new-project", "-p"],
        prompt_is_option_value: true,
    },
    AgentCli {
        command: "codex",
        name: "Codex",
        args_before_prompt: &["exec", "--skip-git-repo-check"],
        prompt_is_option_value: false,
    },
    AgentCli {
        command: "gemini",
        name: "Gemini CLI",
        args_before_prompt: &["-p"],
        prompt_is_option_value: true,
    },
    AgentCli {
        command: "opencode",
        name: "OpenCode",
        args_before_prompt: &["run"],
        prompt_is_option_value: false,
    },
    AgentCli {
        command: "cursor-agent",
        name: "Cursor Agent",
        args_before_prompt: &["-p"],
        prompt_is_option_value: true,
    },
    AgentCli {
        command: "copilot",
        name: "GitHub Copilot CLI",
        args_before_prompt: &[],
        prompt_is_option_value: false,
    },
    AgentCli {
        command: "kiro-cli",
        name: "Kiro CLI",
        args_before_prompt: &[],
        prompt_is_option_value: false,
    },
];

pub(super) fn discover() -> Vec<LocalAiAgent> {
    SUPPORTED
        .iter()
        .filter(|cli| find_command(cli.command).is_some())
        .map(|cli| LocalAiAgent {
            id: format!("cli:{}", cli.command),
            name: cli.name.to_string(),
            kind: "cli".to_string(),
            command: Some(cli.command.to_string()),
            endpoint: None,
            protocol: "cli-prompt".to_string(),
        })
        .collect()
}

pub(super) fn discover_models(agent: AiAgentSelection) -> Result<Vec<LocalAiAgentModel>, String> {
    let command = agent
        .command
        .ok_or_else(|| "Missing agent command.".to_string())?;
    if command != "agy" {
        return Ok(Vec::new());
    }
    let output = Command::new(command)
        .args(["models"])
        .output()
        .map_err(|error| error.to_string())?;
    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).trim().to_string());
    }
    Ok(parse(&String::from_utf8_lossy(&output.stdout)))
}

pub(super) fn chat(input: AiAgentChatInput) -> Result<AiAgentChatOutput, String> {
    let command = input
        .agent
        .command
        .ok_or_else(|| "Missing agent command.".to_string())?;
    let cli =
        find_supported(&command).ok_or_else(|| "Unsupported local agent command.".to_string())?;
    let output = build_chat_command(cli, input.model.as_deref(), &input.prompt)
        .output()
        .map_err(|error| error.to_string())?;
    let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
    if !output.status.success() {
        return Err(if stderr.is_empty() {
            "The local agent exited without a successful response.".to_string()
        } else {
            stderr
        });
    }
    if stdout.is_empty() {
        return Err(if stderr.is_empty() {
            format!("{} did not return a response.", cli.name)
        } else {
            format!("{} did not return a response: {stderr}", cli.name)
        });
    }
    Ok(AiAgentChatOutput { content: stdout })
}

fn find_command(command: &str) -> Option<PathBuf> {
    let path = env::var_os("PATH")?;
    for directory in env::split_paths(&path) {
        let candidate = directory.join(command);
        if candidate.is_file() {
            return Some(candidate);
        }
        #[cfg(windows)]
        {
            let candidate = directory.join(format!("{command}.exe"));
            if candidate.is_file() {
                return Some(candidate);
            }
        }
    }
    None
}

pub(super) fn find_supported(command: &str) -> Option<&'static AgentCli> {
    SUPPORTED
        .iter()
        .find(|candidate| candidate.command == command)
}

pub(super) fn build_chat_command(cli: &AgentCli, model: Option<&str>, prompt: &str) -> Command {
    let mut command = Command::new(cli.command);
    let prompt_flag_index = cli.args_before_prompt.len().saturating_sub(1);
    if cli.prompt_is_option_value {
        command.args(&cli.args_before_prompt[..prompt_flag_index]);
    } else {
        command.args(cli.args_before_prompt);
    }
    if let Some(model) = model.filter(|model| !model.trim().is_empty()) {
        command.args(["--model", model.trim()]);
    }
    if cli.prompt_is_option_value {
        command.arg(cli.args_before_prompt[prompt_flag_index]);
    } else {
        command.arg("--");
    }
    command.arg(prompt);
    command
}
