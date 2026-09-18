use super::{cli, http, models};

#[test]
fn parses_openai_compatible_model_responses() {
    let models =
        models::parse(r#"{"data":[{"id":"gpt-5.6"},{"id":"gpt-5.5","display_name":"GPT-5.5"}]}"#);

    assert_eq!(models[0].id, "gpt-5.6");
    assert_eq!(models[1].name, "GPT-5.5");
}

#[test]
fn parses_line_based_model_ids_and_display_names() {
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
fn rejects_unknown_agent_ids() {
    let error = http::agent_by_id("http:attacker-controlled")
        .expect_err("unknown local agents must be rejected");

    assert_eq!(error, "Unsupported local agent.");
}

#[test]
fn rejects_unknown_cli_agent_ids() {
    let error =
        cli::cli_by_id("cli:attacker-controlled").expect_err("unknown CLI agents must be rejected");

    assert_eq!(error, "Unsupported local agent.");
}

#[test]
fn keeps_positional_prompts_as_content() {
    let codex = cli::cli_by_id("cli:codex").expect("Codex should be supported");
    let command = cli::build_chat_command_with_executable(
        codex,
        "codex",
        None,
        "--do not treat this as an option",
    );
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
            "--do not treat this as an option"
        ]
    );
}
