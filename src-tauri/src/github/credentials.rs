use keyring::{Entry, Error};
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, sync::Mutex};

const SERVICE_NAME: &str = "dev.fetchx.desktop.github";
const VAULT_ACCOUNT_NAME: &str = "connections";
static VAULT_LOCK: Mutex<()> = Mutex::new(());

#[derive(Default, Deserialize, Serialize)]
pub(super) struct CredentialVault {
    pub(super) version: u8,
    pub(super) credentials: HashMap<String, String>,
}

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

fn legacy_entry(credential_key: &str) -> Result<Entry, String> {
    Entry::new(SERVICE_NAME, &account_name(credential_key)?)
        .map_err(|error| format!("Could not access the desktop credential store: {error}"))
}

fn vault_entry() -> Result<Entry, String> {
    Entry::new(SERVICE_NAME, VAULT_ACCOUNT_NAME)
        .map_err(|error| format!("Could not access the desktop credential store: {error}"))
}

fn read_vault(entry: &Entry) -> Result<CredentialVault, String> {
    match entry.get_password() {
        Ok(payload) => serde_json::from_str(&payload)
            .map_err(|_| "The GitHub credential vault is invalid.".to_string()),
        Err(Error::NoEntry) => Ok(CredentialVault {
            version: 1,
            credentials: HashMap::new(),
        }),
        Err(error) => Err(format!(
            "Could not read the GitHub credential vault: {error}"
        )),
    }
}

fn write_vault(entry: &Entry, vault: &CredentialVault) -> Result<(), String> {
    let payload = serde_json::to_string(vault)
        .map_err(|_| "Could not serialize the GitHub credential vault.".to_string())?;
    entry
        .set_password(&payload)
        .map_err(|error| format!("Could not save the GitHub credential vault: {error}"))
}

#[tauri::command]
pub(crate) fn save_github_credential(credential_key: String, token: String) -> Result<(), String> {
    let normalized_token = token.trim();
    if normalized_token.is_empty() {
        return Err("A GitHub token is required.".to_string());
    }
    let account = account_name(&credential_key)?;
    let _guard = VAULT_LOCK
        .lock()
        .map_err(|_| "The GitHub credential vault is unavailable.".to_string())?;
    let credential_entry = vault_entry()?;
    let mut vault = read_vault(&credential_entry)?;
    vault.version = 1;
    vault
        .credentials
        .insert(account, normalized_token.to_string());
    write_vault(&credential_entry, &vault)
}

#[tauri::command]
pub(crate) fn read_github_credential(credential_key: String) -> Result<Option<String>, String> {
    let account = account_name(&credential_key)?;
    let _guard = VAULT_LOCK
        .lock()
        .map_err(|_| "The GitHub credential vault is unavailable.".to_string())?;
    let credential_entry = vault_entry()?;
    let mut vault = read_vault(&credential_entry)?;
    if let Some(token) = vault.credentials.get(&account) {
        return Ok(Some(token.clone()));
    }

    match legacy_entry(&credential_key)?.get_password() {
        Ok(token) => {
            vault.version = 1;
            vault.credentials.insert(account, token.clone());
            write_vault(&credential_entry, &vault)?;
            let _ = legacy_entry(&credential_key)?.delete_credential();
            Ok(Some(token))
        }
        Err(Error::NoEntry) => Ok(None),
        Err(error) => Err(format!("Could not read the GitHub credential: {error}")),
    }
}

#[tauri::command]
pub(crate) fn remove_github_credential(credential_key: String) -> Result<(), String> {
    let account = account_name(&credential_key)?;
    let _guard = VAULT_LOCK
        .lock()
        .map_err(|_| "The GitHub credential vault is unavailable.".to_string())?;
    let credential_entry = vault_entry()?;
    let mut vault = read_vault(&credential_entry)?;
    if vault.credentials.remove(&account).is_some() {
        write_vault(&credential_entry, &vault)?;
    }
    match legacy_entry(&credential_key)?.delete_credential() {
        Ok(()) | Err(Error::NoEntry) => {}
        Err(error) => return Err(format!("Could not remove the GitHub credential: {error}")),
    }
    Ok(())
}
