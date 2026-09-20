use serde::{Deserialize, Serialize};

const DEVICE_CODE_URL: &str = "https://github.com/login/device/code";
const ACCESS_TOKEN_URL: &str = "https://github.com/login/oauth/access_token";

#[derive(Deserialize)]
#[serde(rename_all = "snake_case")]
struct DeviceCodeResponse {
    device_code: String,
    user_code: String,
    verification_uri: String,
    expires_in: u64,
    interval: u64,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct DeviceAuthorization {
    device_code: String,
    user_code: String,
    verification_uri: String,
    expires_in: u64,
    interval: u64,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub(crate) struct GitHubAuthToken {
    pub access_token: String,
    pub expires_in: Option<u64>,
    pub refresh_token: Option<String>,
    pub refresh_token_expires_in: Option<u64>,
    pub token_type: Option<String>,
    pub scope: Option<String>,
}

#[derive(Deserialize)]
struct TokenResponse {
    access_token: Option<String>,
    expires_in: Option<u64>,
    refresh_token: Option<String>,
    refresh_token_expires_in: Option<u64>,
    token_type: Option<String>,
    scope: Option<String>,
    error: Option<String>,
    error_description: Option<String>,
}

pub(super) fn validate_client_id(client_id: &str) -> Result<(), String> {
    if client_id.is_empty()
        || client_id.len() > 200
        || !client_id
            .chars()
            .all(|character| character.is_ascii_alphanumeric() || character == '_')
    {
        return Err("The GitHub App client ID is invalid.".to_string());
    }
    Ok(())
}

#[tauri::command]
pub(crate) async fn start_github_device_authorization(
    client_id: String,
) -> Result<DeviceAuthorization, String> {
    validate_client_id(&client_id)?;
    let response = reqwest::Client::new()
        .post(DEVICE_CODE_URL)
        .header("Accept", "application/json")
        .form(&[("client_id", client_id)])
        .send()
        .await
        .map_err(|error| format!("Could not reach GitHub: {error}"))?;
    if !response.status().is_success() {
        return Err("GitHub could not start authorization.".to_string());
    }
    let body = response
        .json::<DeviceCodeResponse>()
        .await
        .map_err(|_| "GitHub returned an invalid authorization response.".to_string())?;
    Ok(DeviceAuthorization {
        device_code: body.device_code,
        user_code: body.user_code,
        verification_uri: body.verification_uri,
        expires_in: body.expires_in,
        interval: body.interval,
    })
}

#[tauri::command]
pub(crate) async fn complete_github_device_authorization(
    client_id: String,
    device_code: String,
) -> Result<GitHubAuthToken, String> {
    validate_client_id(&client_id)?;
    if device_code.is_empty() || device_code.len() > 500 {
        return Err("The GitHub device code is invalid.".to_string());
    }
    let response = reqwest::Client::new()
        .post(ACCESS_TOKEN_URL)
        .header("Accept", "application/json")
        .form(&[
            ("client_id", client_id.as_str()),
            ("device_code", device_code.as_str()),
            ("grant_type", "urn:ietf:params:oauth:grant-type:device_code"),
        ])
        .send()
        .await
        .map_err(|error| format!("Could not reach GitHub: {error}"))?;
    let body = response
        .json::<TokenResponse>()
        .await
        .map_err(|_| "GitHub returned an invalid authorization response.".to_string())?;
    if let Some(token) = body.access_token {
        return Ok(GitHubAuthToken {
            access_token: token,
            expires_in: body.expires_in,
            refresh_token: body.refresh_token,
            refresh_token_expires_in: body.refresh_token_expires_in,
            token_type: body.token_type,
            scope: body.scope,
        });
    }
    if body.error.as_deref() == Some("authorization_pending") {
        return Err(
            "Authorization is still pending. Complete it in GitHub, then try again.".to_string(),
        );
    }
    Err(body
        .error_description
        .or(body.error)
        .unwrap_or_else(|| "GitHub authorization was not completed.".to_string()))
}

#[tauri::command]
pub(crate) async fn refresh_github_token(
    client_id: String,
    refresh_token: String,
) -> Result<GitHubAuthToken, String> {
    validate_client_id(&client_id)?;
    if refresh_token.trim().is_empty() || refresh_token.len() > 500 {
        return Err("The GitHub refresh token is invalid.".to_string());
    }
    let response = reqwest::Client::new()
        .post(ACCESS_TOKEN_URL)
        .header("Accept", "application/json")
        .form(&[
            ("client_id", client_id.as_str()),
            ("grant_type", "refresh_token"),
            ("refresh_token", refresh_token.trim()),
        ])
        .send()
        .await
        .map_err(|error| format!("Could not reach GitHub: {error}"))?;
    let body = response
        .json::<TokenResponse>()
        .await
        .map_err(|_| "GitHub returned an invalid refresh token response.".to_string())?;
    if let Some(token) = body.access_token {
        return Ok(GitHubAuthToken {
            access_token: token,
            expires_in: body.expires_in,
            refresh_token: body
                .refresh_token
                .or(Some(refresh_token.trim().to_string())),
            refresh_token_expires_in: body.refresh_token_expires_in,
            token_type: body.token_type,
            scope: body.scope,
        });
    }
    Err(body
        .error_description
        .or(body.error)
        .unwrap_or_else(|| "GitHub token refresh was not completed.".to_string()))
}
