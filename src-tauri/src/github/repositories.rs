use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;

const GITHUB_API_URL: &str = "https://api.github.com";
const USER_REPOSITORIES_PATH: &str =
    "/user/repos?affiliation=owner,collaborator,organization_member&per_page=100&sort=updated";

#[derive(Deserialize)]
pub(super) struct GitHubApiRepository {
    full_name: String,
    owner: GitHubRepositoryOwner,
    name: String,
    default_branch: Option<String>,
    private: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct GitHubRepository {
    pub(super) full_name: String,
    pub(super) owner: String,
    pub(super) name: String,
    pub(super) default_branch: String,
    pub(super) private: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct GitHubAccount {
    id: String,
    login: String,
}

#[derive(Deserialize)]
pub(super) struct GitHubApiAccount {
    pub(super) id: u64,
    pub(super) login: String,
}

#[derive(Deserialize)]
struct GitHubRepositoryOwner {
    login: String,
}

#[derive(Deserialize)]
struct GitHubErrorResponse {
    message: Option<String>,
}

#[derive(Deserialize)]
struct GitHubInstallationsResponse {
    installations: Vec<GitHubInstallation>,
}

#[derive(Deserialize)]
struct GitHubInstallation {
    id: u64,
}

#[derive(Deserialize)]
pub(super) struct GitHubInstallationRepositoriesResponse {
    pub(super) repositories: Vec<GitHubApiRepository>,
}

pub(super) fn clean_token(token: &str) -> &str {
    let trimmed = token.trim();
    if let Some(stripped) = trimmed.strip_prefix("Bearer ") {
        stripped.trim()
    } else if let Some(stripped) = trimmed.strip_prefix("bearer ") {
        stripped.trim()
    } else {
        trimmed
    }
}

pub(super) fn validate_access_token(token: &str) -> Result<(), String> {
    let cleaned = clean_token(token);
    if cleaned.is_empty() || cleaned.len() > 1_000 {
        return Err("A valid GitHub access token is required.".to_string());
    }
    Ok(())
}

pub(super) fn to_repository(repository: GitHubApiRepository) -> GitHubRepository {
    GitHubRepository {
        full_name: repository.full_name,
        owner: repository.owner.login,
        name: repository.name,
        default_branch: repository
            .default_branch
            .unwrap_or_else(|| "main".to_string()),
        private: repository.private,
    }
}

fn github_request(client: &Client, token: &str, path: &str) -> reqwest::RequestBuilder {
    client
        .get(format!("{GITHUB_API_URL}{path}"))
        .header("Accept", "application/vnd.github+json")
        .header("Authorization", format!("Bearer {}", clean_token(token)))
        .header("User-Agent", "FetchX")
}

async fn github_error(response: reqwest::Response) -> String {
    response
        .json::<GitHubErrorResponse>()
        .await
        .ok()
        .and_then(|body| body.message)
        .unwrap_or_else(|| "GitHub could not load repositories.".to_string())
}

async fn list_user_repositories(
    client: &Client,
    token: &str,
) -> Result<Vec<GitHubApiRepository>, String> {
    let response = github_request(client, token, USER_REPOSITORIES_PATH)
        .send()
        .await
        .map_err(|error| format!("Could not reach GitHub: {error}"))?;
    if !response.status().is_success() {
        return Err(github_error(response).await);
    }
    response
        .json::<Vec<GitHubApiRepository>>()
        .await
        .map_err(|_| "GitHub returned an invalid repository list.".to_string())
}

#[tauri::command]
pub(crate) async fn get_github_account(token: String) -> Result<GitHubAccount, String> {
    let token = clean_token(&token);
    validate_access_token(token)?;
    let response = github_request(&Client::new(), token, "/user")
        .send()
        .await
        .map_err(|error| format!("Could not reach GitHub: {error}"))?;
    if !response.status().is_success() {
        return Err(github_error(response).await);
    }
    let account = response
        .json::<GitHubApiAccount>()
        .await
        .map_err(|_| "GitHub returned an invalid account response.".to_string())?;
    Ok(GitHubAccount {
        id: account.id.to_string(),
        login: account.login,
    })
}

async fn list_app_installation_repositories(
    client: &Client,
    token: &str,
) -> Result<Vec<GitHubApiRepository>, String> {
    let installations_response = github_request(client, token, "/user/installations?per_page=100")
        .send()
        .await
        .map_err(|error| format!("Could not reach GitHub: {error}"))?;
    if !installations_response.status().is_success() {
        return Err(github_error(installations_response).await);
    }
    let installations = installations_response
        .json::<GitHubInstallationsResponse>()
        .await
        .map_err(|_| "GitHub returned an invalid installation list.".to_string())?;
    let mut repositories = Vec::new();
    let mut last_error = None;
    for installation in &installations.installations {
        let response = github_request(
            client,
            token,
            &format!(
                "/user/installations/{}/repositories?per_page=100",
                installation.id
            ),
        )
        .send()
        .await;
        let response = match response {
            Ok(res) => res,
            Err(error) => {
                last_error = Some(format!("Could not reach GitHub: {error}"));
                continue;
            }
        };
        if !response.status().is_success() {
            last_error = Some(github_error(response).await);
            continue;
        }
        match response
            .json::<GitHubInstallationRepositoriesResponse>()
            .await
        {
            Ok(mut body) => repositories.append(&mut body.repositories),
            Err(_) => {
                last_error = Some("GitHub returned an invalid repository list.".to_string());
            }
        }
    }
    if repositories.is_empty() && !installations.installations.is_empty() {
        if let Some(error) = last_error {
            return Err(error);
        }
    }
    Ok(repositories)
}

#[tauri::command]
pub(crate) async fn list_github_repositories(
    token: String,
) -> Result<Vec<GitHubRepository>, String> {
    let token = clean_token(&token);
    validate_access_token(token)?;
    let client = Client::new();

    let user_repos_result = list_user_repositories(&client, token).await;
    let (mut all_repos, user_error) = match user_repos_result {
        Ok(repos) => (repos, None),
        Err(err) => (Vec::new(), Some(err)),
    };

    let installation_repos_result = list_app_installation_repositories(&client, token).await;
    let installation_error = match installation_repos_result {
        Ok(mut repos) => {
            all_repos.append(&mut repos);
            None
        }
        Err(err) => Some(err),
    };

    if !all_repos.is_empty() {
        let mut seen = HashSet::new();
        let deduplicated: Vec<GitHubRepository> = all_repos
            .into_iter()
            .filter(|repo| seen.insert(repo.full_name.clone()))
            .map(to_repository)
            .collect();
        return Ok(deduplicated);
    }

    if let (Some(u_err), Some(i_err)) = (user_error, installation_error) {
        return Err(format!(
            "GitHub could not load repositories. Account access: {u_err}. App installation access: {i_err}."
        ));
    }

    Ok(Vec::new())
}
