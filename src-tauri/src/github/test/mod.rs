use super::{credentials, device_auth, repositories};
use keyring::credential::CredentialPersistence;

#[test]
fn uses_a_persistent_native_credential_store() {
    assert!(matches!(
        keyring::default::default_credential_builder().persistence(),
        CredentialPersistence::UntilDelete
    ));
}

#[test]
fn accepts_workspace_credential_identifiers() {
    assert_eq!(
        credentials::account_name("owner_repository.main").as_deref(),
        Ok("workspace.owner_repository.main")
    );
}

#[test]
fn accepts_connection_credential_identifiers() {
    assert_eq!(
        credentials::account_name("connection.connect").as_deref(),
        Ok("connection.connect")
    );
    assert_eq!(
        credentials::account_name("connection.create").as_deref(),
        Ok("connection.create")
    );
    assert_eq!(
        credentials::account_name("app.connect").as_deref(),
        Ok("app.connect")
    );
    assert_eq!(
        credentials::account_name("connection.github-123456-abcdef").as_deref(),
        Ok("connection.github-123456-abcdef")
    );
}

#[test]
fn rejects_unsafe_workspace_credential_identifiers() {
    assert!(matches!(
        credentials::account_name("owner/repository"),
        Err(error) if error == "The GitHub credential identifier is invalid."
    ));
}

#[test]
fn accepts_github_app_client_ids() {
    assert!(device_auth::validate_client_id("Iv1_123abc").is_ok());
}

#[test]
fn rejects_invalid_github_app_client_ids() {
    assert_eq!(
        device_auth::validate_client_id("client-id"),
        Err("The GitHub App client ID is invalid.".to_string())
    );
}

#[test]
fn rejects_empty_github_access_tokens() {
    assert_eq!(
        repositories::validate_access_token("  "),
        Err("A valid GitHub access token is required.".to_string())
    );
}

#[test]
fn maps_github_repository_responses_to_the_desktop_contract() {
    let repository = serde_json::from_str::<repositories::GitHubApiRepository>(
        r#"{"full_name":"fetchx/api-workspace","owner":{"login":"fetchx"},"name":"api-workspace","default_branch":"main","private":true}"#,
    )
    .expect("GitHub repository response should parse");
    let value = serde_json::to_value(repositories::to_repository(repository))
        .expect("desktop repository response should serialize");

    assert_eq!(value["fullName"], "fetchx/api-workspace");
    assert_eq!(value["owner"], "fetchx");
    assert_eq!(value["defaultBranch"], "main");
}

#[test]
fn parses_github_account_responses_for_connection_labels() {
    let account =
        serde_json::from_str::<repositories::GitHubApiAccount>(r#"{"id":42,"login":"octocat"}"#)
            .expect("GitHub account response should parse");
    assert_eq!(account.id, 42);
    assert_eq!(account.login, "octocat");
}

#[test]
fn parses_repositories_from_a_github_app_installation() {
    let response = serde_json::from_str::<repositories::GitHubInstallationRepositoriesResponse>(
        r#"{"repositories":[{"full_name":"fetchx/api-workspace","owner":{"login":"fetchx"},"name":"api-workspace","default_branch":"main","private":true}]}"#,
    )
    .expect("GitHub App installation response should parse");

    assert_eq!(response.repositories.len(), 1);
}

#[test]
fn cleans_bearer_prefix_from_tokens() {
    assert_eq!(
        repositories::clean_token("Bearer ghu_test123"),
        "ghu_test123"
    );
    assert_eq!(
        repositories::clean_token("bearer ghu_test123"),
        "ghu_test123"
    );
    assert_eq!(repositories::clean_token("  ghu_test123  "), "ghu_test123");
}

#[test]
fn handles_null_default_branch_in_repository_responses() {
    let repository = serde_json::from_str::<repositories::GitHubApiRepository>(
        r#"{"full_name":"fetchx/empty-repo","owner":{"login":"fetchx"},"name":"empty-repo","default_branch":null,"private":false}"#,
    )
    .expect("GitHub repository response with null default_branch should parse");
    let mapped = repositories::to_repository(repository);
    assert_eq!(mapped.default_branch, "main");
    assert_eq!(mapped.full_name, "fetchx/empty-repo");
}
