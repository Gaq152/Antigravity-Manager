use serde::{Deserialize, Serialize};

/// Token 数据结构
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TokenData {
    pub access_token: String,
    pub refresh_token: String,
    pub expires_in: i64,
    pub expiry_timestamp: i64,
    pub token_type: String,
    pub email: Option<String>,
}

impl TokenData {
    pub fn new(
        access_token: String,
        refresh_token: String,
        expires_in: i64,
        email: Option<String>,
    ) -> Self {
        let expiry_timestamp = chrono::Utc::now().timestamp() + expires_in;
        Self {
            access_token,
            refresh_token,
            expires_in,
            expiry_timestamp,
            token_type: "Bearer".to_string(),
            email,
        }
    }

    #[allow(dead_code)]
    pub fn is_expired(&self) -> bool {
        chrono::Utc::now().timestamp() >= self.expiry_timestamp
    }
}
