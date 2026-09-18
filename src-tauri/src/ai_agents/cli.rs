use std::{
    env,
    ffi::OsString,
    io::Read,
    path::{Path, PathBuf},
    process::{Command, Output, Stdio},
    sync::mpsc,
    thread,
    time::{Duration, Instant},
};

use super::models::parse;
use super::types::{AiAgentChatOutput, LocalAiAgent, LocalAiAgentModel};

#[derive(Clone, Copy, Debug)]
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

const MAX_OUTPUT_BYTES: usize = 1_048_576;
const COMMAND_TIMEOUT: Duration = Duration::from_secs(120);

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

pub(super) fn discover_models(agent_id: &str) -> Result<Vec<LocalAiAgentModel>, String> {
    let cli = cli_by_id(agent_id)?;
    if cli.command != "agy" {
        return Ok(Vec::new());
    }
    let executable = find_command(cli.command)
        .ok_or_else(|| format!("Could not find the local agent command: {}.", cli.command))?;
    let mut command = Command::new(executable);
    command.args(["models"]).env("PATH", agent_path());
    let output = run_command(command)?;
    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).trim().to_string());
    }
    Ok(parse(&String::from_utf8_lossy(&output.stdout)))
}

pub(super) fn chat(
    agent_id: &str,
    model: Option<&str>,
    prompt: &str,
) -> Result<AiAgentChatOutput, String> {
    let cli = cli_by_id(agent_id)?;
    let executable = find_command(cli.command)
        .ok_or_else(|| format!("Could not find the local agent command: {}.", cli.command))?;
    let output = run_command(build_chat_command_with_executable(
        cli, executable, model, prompt,
    ))?;
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

fn run_command(mut command: Command) -> Result<Output, String> {
    command.stdout(Stdio::piped()).stderr(Stdio::piped());
    let mut child = command.spawn().map_err(|error| error.to_string())?;
    let stdout = child
        .stdout
        .take()
        .ok_or_else(|| "Could not capture agent output.".to_string())?;
    let stderr = child
        .stderr
        .take()
        .ok_or_else(|| "Could not capture agent diagnostics.".to_string())?;
    let (sender, receiver) = mpsc::channel();
    spawn_output_reader(stdout, true, sender.clone());
    spawn_output_reader(stderr, false, sender);

    let deadline = Instant::now() + COMMAND_TIMEOUT;
    let status = loop {
        if let Some(status) = child.try_wait().map_err(|error| error.to_string())? {
            break status;
        }
        if Instant::now() >= deadline {
            let _ = child.kill();
            let _ = child.wait();
            return Err("The local agent exceeded the 120-second safety limit.".to_string());
        }
        thread::sleep(Duration::from_millis(50));
    };

    let mut stdout = None;
    let mut stderr = None;
    for _ in 0..2 {
        let (is_stdout, output) = receiver
            .recv()
            .map_err(|_| "Could not read agent output.".to_string())?;
        let output = output.map_err(|error| error.to_string())?;
        if output.len() > MAX_OUTPUT_BYTES {
            return Err("Agent output exceeded the 1 MB safety limit.".to_string());
        }
        if is_stdout {
            stdout = Some(output);
        } else {
            stderr = Some(output);
        }
    }
    Ok(Output {
        status,
        stdout: stdout.ok_or_else(|| "Could not read agent output.".to_string())?,
        stderr: stderr.ok_or_else(|| "Could not read agent diagnostics.".to_string())?,
    })
}

fn spawn_output_reader<R: std::io::Read + Send + 'static>(
    stream: R,
    is_stdout: bool,
    sender: mpsc::Sender<(bool, std::io::Result<Vec<u8>>)>,
) {
    thread::spawn(move || {
        let mut output = Vec::new();
        let result = stream
            .take((MAX_OUTPUT_BYTES + 1) as u64)
            .read_to_end(&mut output)
            .map(|_| output);
        let _ = sender.send((is_stdout, result));
    });
}

pub(super) fn cli_by_id(agent_id: &str) -> Result<&'static AgentCli, String> {
    let command = agent_id
        .strip_prefix("cli:")
        .ok_or_else(|| "Unsupported local agent.".to_string())?;
    SUPPORTED
        .iter()
        .find(|cli| cli.command == command)
        .ok_or_else(|| "Unsupported local agent.".to_string())
}

fn find_command(command: &str) -> Option<PathBuf> {
    for directory in current_command_search_paths() {
        let candidate = directory.join(command);
        if candidate.is_file() {
            return Some(candidate);
        }
        #[cfg(windows)]
        for extension in [".exe", ".cmd", ".bat", ".com"] {
            let candidate = directory.join(format!("{command}{extension}"));
            if candidate.is_file() {
                return Some(candidate);
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
