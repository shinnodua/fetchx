pub(crate) mod client;
pub(crate) mod types;

#[cfg(test)]
#[path = "test/mod.rs"]
mod test;

use types::{NativeHttpRequest, NativeHttpResponse};

#[tauri::command]
pub(crate) async fn execute_native_http_request(
    request: NativeHttpRequest,
) -> Result<NativeHttpResponse, String> {
    client::execute_request(request).await
}
