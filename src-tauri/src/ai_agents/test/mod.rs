use std::{ffi::OsString, path::PathBuf};

use super::{cli, http, models};

#[test]
fn builds_positional_cli_prompts_with_an_option_delimiter() {
    let codex = cli::find_supported("codex").expect("Codex should be supported");
    let command =
        cli::build_chat_command_with_executable(codex, "codex", None, "--help me create a request");
    let arguments = command
        .get_args()
        .map(|argument| argument.to_string_lossy().to_string())
        .collect::<Vec<_>>();

    assert_eq!(
        arguments,
        vec![
            "exec",
            "--skip-git-repo-check",
            "--",
            "--help me create a request"
        ]
    );
}

#[test]
fn builds_option_value_prompts_after_the_model_argument() {
    let claude = cli::find_supported("claude").expect("Claude Code should be supported");
    let command = cli::build_chat_command_with_executable(
        claude,
        "claude",
        Some("sonnet"),
        "Create a request",
    );
    let arguments = command
        .get_args()
        .map(|argument| argument.to_string_lossy().to_string())
        .collect::<Vec<_>>();

    assert_eq!(
        arguments,
        vec!["--model", "sonnet", "-p", "Create a request"]
    );
}

#[test]
fn parses_openai_compatible_model_responses() {
    let models =
        models::parse(r#"{"data":[{"id":"gpt-5.6"},{"id":"gpt-5.5","display_name":"GPT-5.5"}]}"#);

    assert_eq!(models[0].id, "gpt-5.6");
    assert_eq!(models[1].name, "GPT-5.5");
}

#[test]
fn parses_cli_model_ids_and_display_names() {
    let models = models::parse("gemini-3.8-flash-high\tGemini 3.8 Flash (High)\nclaude-sonnet-4-6\tClaude Sonnet 4.6 (Thinking)");

    assert_eq!(models[0].id, "gemini-3.8-flash-high");
    assert_eq!(models[1].name, "Claude Sonnet 4.6 (Thinking)");
}

#[test]
fn rejects_non_local_http_endpoints() {
    let error = http::parse_endpoint("http://example.com:11434")
        .expect_err("non-local endpoints must be rejected");

    assert_eq!(error, "Only localhost agent endpoints are supported.");
}

#[test]
fn searches_common_gui_safe_cli_locations() {
    let paths = cli::command_search_paths(
        Some(OsString::from("/usr/bin")),
        Some(OsString::from("/Users/example")),
    );

    assert!(paths.contains(&PathBuf::from("/Users/example/.local/bin")));
    assert!(paths.contains(&PathBuf::from("/Users/example/.bun/bin")));
    assert!(paths.contains(&PathBuf::from("/opt/homebrew/bin")));
}

#[cfg(windows)]
#[test]
fn searches_windows_cli_install_locations() {
    let paths = cli::command_search_paths(
        Some(OsString::from(r"C:\Windows\System32")),
        Some(OsString::from(r"C:\Users\example")),
    );

    assert!(paths.contains(&PathBuf::from(r"C:\Users\example\AppData\Roaming\npm")));
    assert!(paths.contains(&PathBuf::from(r"C:\Users\example\scoop\shims")));
}
