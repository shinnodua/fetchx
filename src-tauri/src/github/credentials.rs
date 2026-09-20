use keyring::{Entry, Error};

const SERVICE_NAME: &str = "dev.fetchx.desktop.github";

pub(super) fn account_name(credential_key: &str) -> Result<String, String> {
    if credential_key.is_empty()
        || credential_key.len() > 180
        || !credential_key.chars().all(|character| {
            character.is_ascii_alphanumeric() || matches!(character, '-' | '_' | '.')
        })
    {
        return Err("The GitHub credential identifier is invalid.".to_string());
    }
    if credential_key.starts_with("app.")
        || credential_key.starts_with("connection.")
        || credential_key.starts_with("workspace.")
    {
        Ok(credential_key.to_string())
    } else {
        Ok(format!("workspace.{credential_key}"))
    }
}

fn entry(credential_key: &str) -> Result<Entry, String> {
    Entry::new(SERVICE_NAME, &account_name(credential_key)?)
        .map_err(|error| format!("Could not access the desktop credential store: {error}"))
}

#[tauri::command]
pub(crate) fn save_github_credential(credential_key: String, token: String) -> Result<(), String> {
    let normalized_token = token.trim();
    if normalized_token.is_empty() {
        return Err("A GitHub token is required.".to_string());
    }
    let credential_entry = entry(&credential_key)?;
    credential_entry
        .set_password(normalized_token)
        .map_err(|error| format!("Could not save the GitHub credential: {error}"))?;
    match credential_entry.get_password() {
        Ok(saved_token) if saved_token == normalized_token => Ok(()),
        Ok(_) => {
            Err("The GitHub credential store returned a different value after saving.".to_string())
        }
        Err(error) => Err(format!(
            "The GitHub credential was saved but could not be read back: {error}"
        )),
    }
}

#[tauri::command]
pub(crate) fn read_github_credential(credential_key: String) -> Result<Option<String>, String> {
    match entry(&credential_key)?.get_password() {
        Ok(token) => Ok(Some(token)),
        Err(Error::NoEntry) => Ok(None),
        Err(error) => Err(format!("Could not read the GitHub credential: {error}")),
    }
}

#[tauri::command]
pub(crate) fn remove_github_credential(credential_key: String) -> Result<(), String> {
    match entry(&credential_key)?.delete_credential() {
        Ok(()) | Err(Error::NoEntry) => Ok(()),
        Err(error) => Err(format!("Could not remove the GitHub credential: {error}")),
    }
}
