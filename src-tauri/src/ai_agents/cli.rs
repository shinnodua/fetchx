use std::{
    env,
    ffi::OsString,
    path::{Path, PathBuf},
    process::Command,
};

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
    let executable = find_command(&command)
        .ok_or_else(|| format!("Could not find the local agent command: {command}."))?;
    let output = Command::new(executable)
        .args(["models"])
        .env("PATH", agent_path())
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
    let executable = find_command(&command)
        .ok_or_else(|| format!("Could not find the local agent command: {command}."))?;
    let output =
        build_chat_command_with_executable(cli, executable, input.model.as_deref(), &input.prompt)
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
    for directory in current_command_search_paths() {
        let candidate = directory.join(command);
        if candidate.is_file() {
            return Some(candidate);
        }
        #[cfg(windows)]
        {
            for extension in [".exe", ".cmd", ".bat", ".com"] {
                let candidate = directory.join(format!("{command}{extension}"));
                if candidate.is_file() {
                    return Some(candidate);
                }
            }
        }
    }
    None
}

pub(super) fn command_search_paths(path: Option<OsString>, home: Option<OsString>) -> Vec<PathBuf> {
    let mut paths = path
        .as_deref()
        .map(env::split_paths)
        .into_iter()
        .flatten()
        .collect::<Vec<_>>();

    if let Some(home) = home.as_deref() {
        let home = PathBuf::from(home);
        paths.extend([
            home.join(".local/bin"),
            home.join(".npm-global/bin"),
            home.join(".bun/bin"),
            home.join(".volta/bin"),
            home.join(".cargo/bin"),
            home.join("Library/pnpm"),
        ]);
        paths.extend(versioned_node_paths(&home));
    }

    #[cfg(unix)]
    paths.extend([
        PathBuf::from("/opt/homebrew/bin"),
        PathBuf::from("/usr/local/bin"),
        PathBuf::from("/usr/bin"),
        PathBuf::from("/bin"),
    ]);

    #[cfg(windows)]
    paths.extend(windows_command_paths(
        home.as_deref(),
        env::var_os("APPDATA").as_deref(),
        env::var_os("LOCALAPPDATA").as_deref(),
        env::var_os("ProgramFiles").as_deref(),
    ));

    let mut unique_paths = Vec::new();
    for path in paths {
        if !unique_paths.contains(&path) {
            unique_paths.push(path);
        }
    }
    unique_paths
}

fn current_command_search_paths() -> Vec<PathBuf> {
    command_search_paths(
        env::var_os("PATH"),
        env::var_os("HOME").or_else(|| env::var_os("USERPROFILE")),
    )
}

#[cfg(windows)]
fn windows_command_paths(
    home: Option<&std::ffi::OsStr>,
    app_data: Option<&std::ffi::OsStr>,
    local_app_data: Option<&std::ffi::OsStr>,
    program_files: Option<&std::ffi::OsStr>,
) -> Vec<PathBuf> {
    let mut paths = Vec::new();
    if let Some(home) = home {
        let home = PathBuf::from(home);
        paths.extend([
            home.join("AppData/Roaming/npm"),
            home.join("AppData/Local/pnpm"),
            home.join("scoop/shims"),
            home.join(".bun/bin"),
            home.join(".volta/bin"),
            home.join(".cargo/bin"),
        ]);
    }
    if let Some(app_data) = app_data {
        paths.push(PathBuf::from(app_data).join("npm"));
    }
    if let Some(local_app_data) = local_app_data {
        paths.push(PathBuf::from(local_app_data).join("pnpm"));
    }
    if let Some(program_files) = program_files {
        paths.push(PathBuf::from(program_files).join("nodejs"));
    }
    paths
}

fn versioned_node_paths(home: &Path) -> Vec<PathBuf> {
    let mut paths = Vec::new();
    for root in [
        home.join(".nvm/versions/node"),
        home.join(".local/share/fnm/node-versions"),
    ] {
        let Ok(entries) = std::fs::read_dir(root) else {
            continue;
        };
        paths.extend(entries.flatten().map(|entry| entry.path().join("bin")));
    }
    paths
}

fn agent_path() -> OsString {
    env::join_paths(current_command_search_paths())
        .unwrap_or_else(|_| env::var_os("PATH").unwrap_or_default())
}

pub(super) fn find_supported(command: &str) -> Option<&'static AgentCli> {
    SUPPORTED
        .iter()
        .find(|candidate| candidate.command == command)
}

pub(super) fn build_chat_command_with_executable(
    cli: &AgentCli,
    executable: impl AsRef<std::ffi::OsStr>,
    model: Option<&str>,
    prompt: &str,
) -> Command {
    let mut command = Command::new(executable);
    command.env("PATH", agent_path());
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
