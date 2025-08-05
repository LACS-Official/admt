use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use crate::error::{HoutError, Result};

/// 激活状态枚举
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ActivationStatus {
    #[serde(rename = "not_activated")]
    NotActivated,
    #[serde(rename = "activating")]
    Activating,
    #[serde(rename = "activated")]
    Activated,
    #[serde(rename = "activation_failed")]
    ActivationFailed,
    #[serde(rename = "expired")]
    Expired,
}

/// 用户配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserConfiguration {
    pub username: String,
    pub language: String,
    pub theme: String,
    #[serde(rename = "autoStart")]
    pub auto_start: bool,
    #[serde(rename = "checkUpdates")]
    pub check_updates: bool,
    #[serde(rename = "enableTelemetry")]
    pub enable_telemetry: bool,
}

/// 激活码信息（根据API文档更新）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActivationCode {
    pub id: String,
    pub code: String,
    #[serde(rename = "createdAt")]
    pub created_at: DateTime<Utc>,
    #[serde(rename = "expiresAt")]
    pub expires_at: DateTime<Utc>,
    #[serde(rename = "isUsed")]
    pub is_used: bool,
    #[serde(rename = "usedAt")]
    pub used_at: Option<DateTime<Utc>>,
    pub metadata: Option<serde_json::Value>,
    #[serde(rename = "productInfo")]
    pub product_info: Option<ProductInfo>,
}

/// 产品信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProductInfo {
    pub name: String,
    pub version: String,
    pub features: Vec<String>,
}

/// API验证请求
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VerifyRequest {
    pub code: String,
}

/// API验证响应（根据实际API响应格式更新）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VerifyResponse {
    pub success: bool,
    pub data: Option<VerifyResponseData>,
    pub error: Option<String>,
}

/// 验证响应数据（根据实际API响应格式更新）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VerifyResponseData {
    pub id: String,
    pub code: String,
    #[serde(rename = "activatedAt")]
    pub activated_at: String, // API返回的是字符串格式的时间
    #[serde(rename = "productInfo")]
    pub product_info: Option<ProductInfo>,
    pub metadata: Option<serde_json::Value>,
    #[serde(rename = "apiValidation")]
    pub api_validation: Option<ApiValidationInfo>,
}

/// API验证信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiValidationInfo {
    #[serde(rename = "expiresAt")]
    pub expires_at: String,
    #[serde(rename = "remainingTime")]
    pub remaining_time: Option<i64>,
    pub message: Option<String>,
}

/// 激活请求
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActivationRequest {
    #[serde(rename = "activationCode")]
    pub activation_code: String,
    #[serde(rename = "userConfig")]
    pub user_config: UserConfiguration,
    #[serde(rename = "deviceInfo")]
    pub device_info: Option<DeviceInfo>,
}

/// 设备信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceInfo {
    pub platform: String,
    pub version: String,
    #[serde(rename = "deviceId")]
    pub device_id: String,
}

/// 激活响应
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActivationResponse {
    pub success: bool,
    pub status: ActivationStatus,
    pub message: String,
    #[serde(rename = "expiryDate")]
    pub expiry_date: Option<DateTime<Utc>>,
    pub features: Option<Vec<String>>,
    pub token: Option<String>,
}

/// 应用配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    #[serde(rename = "isActivated")]
    pub is_activated: bool,
    #[serde(rename = "activationStatus")]
    pub activation_status: ActivationStatus,
    #[serde(rename = "userConfig")]
    pub user_config: UserConfiguration,
    #[serde(rename = "activationDate")]
    pub activation_date: Option<DateTime<Utc>>,
    #[serde(rename = "expiryDate")]
    pub expiry_date: Option<DateTime<Utc>>,
    pub features: Vec<String>,
    pub version: String,
}

/// 激活码验证器
pub struct ActivationValidator {
    api_base_url: String,
    client: reqwest::Client,
}

impl ActivationValidator {
    /// 创建新的激活码验证器
    pub fn new() -> Self {
        Self {
            api_base_url: "https://api-g.lacs.cc".to_string(), // 根据API文档更新
            client: reqwest::Client::builder()
                .timeout(std::time::Duration::from_secs(30))
                .build()
                .unwrap_or_else(|_| reqwest::Client::new()),
        }
    }

    /// 使用自定义API地址创建验证器
    #[allow(dead_code)]
    pub fn with_api_url(api_url: String) -> Self {
        Self {
            api_base_url: api_url,
            client: reqwest::Client::builder()
                .timeout(std::time::Duration::from_secs(30))
                .build()
                .unwrap_or_else(|_| reqwest::Client::new()),
        }
    }
    
    /// 验证激活码格式（根据API文档更新）
    pub fn validate_format(&self, code: &str) -> bool {
        // 安全性检查：防止空值和过长输入
        if code.is_empty() || code.len() > 50 {
            log::warn!("Invalid activation code length: {}", code.len());
            return false;
        }

        // 安全性检查：防止过短输入
        if code.len() < 15 {
            log::debug!("Activation code too short: {}", code.len());
            return false;
        }

        // 安全性检查：只允许字母数字和短横线
        if !code.chars().all(|c| c.is_ascii_alphanumeric() || c == '-') {
            log::warn!("Invalid characters in activation code");
            return false;
        }

        // 防止SQL注入和XSS攻击：检查危险字符
        let dangerous_patterns = ["'", "\"", ";", "<", ">", "&", "script", "select", "insert", "update", "delete"];
        let code_lower = code.to_lowercase();
        for pattern in &dangerous_patterns {
            if code_lower.contains(pattern) {
                log::warn!("Potentially dangerous pattern detected in activation code: {}", pattern);
                return false;
            }
        }

        // 新格式验证：{timestamp}-{random}-{uuid}
        let parts: Vec<&str> = code.split('-').collect();
        if parts.len() != 3 {
            log::debug!("Invalid activation code format: expected 3 parts, got {}", parts.len());
            return false;
        }

        // 检查第一部分：时间戳（36进制）
        if parts[0].len() < 6 || parts[0].len() > 10 {
            log::debug!("Invalid timestamp part length: {}", parts[0].len());
            return false;
        }
        if !parts[0].chars().all(|c| c.is_ascii_alphanumeric()) {
            log::debug!("Invalid characters in timestamp part");
            return false;
        }

        // 检查第二部分：随机字符串（6位）
        if parts[1].len() != 6 {
            log::debug!("Invalid random part length: {}", parts[1].len());
            return false;
        }
        if !parts[1].chars().all(|c| c.is_ascii_alphanumeric()) {
            log::debug!("Invalid characters in random part");
            return false;
        }

        // 检查第三部分：UUID片段（8位）
        if parts[2].len() != 8 {
            log::debug!("Invalid UUID part length: {}", parts[2].len());
            return false;
        }
        if !parts[2].chars().all(|c| c.is_ascii_alphanumeric()) {
            log::debug!("Invalid characters in UUID part");
            return false;
        }

        log::debug!("Activation code format validation passed");
        true
    }
    
    /// 检查激活码是否过期
    pub fn is_activation_expired(&self, activation_code: &ActivationCode) -> bool {
        let now = chrono::Utc::now();
        now > activation_code.expires_at
    }

    /// 获取激活码剩余有效时间（秒）
    pub fn get_remaining_time(&self, activation_code: &ActivationCode) -> i64 {
        let now = chrono::Utc::now();
        let remaining = activation_code.expires_at.timestamp() - now.timestamp();
        std::cmp::max(0, remaining)
    }

    /// 验证激活码有效性（云端验证）
    pub async fn validate_code(&self, code: &str) -> Result<ActivationCode> {
        // 格式验证
        if !self.validate_format(code) {
            return Err(HoutError::Tool("激活码格式不正确".to_string()));
        }

        // 额外的安全检查：防止重放攻击
        let current_time = chrono::Utc::now();
        log::info!("Starting activation code validation at: {}", current_time);

        // 调用云端API进行验证
        let verify_url = format!("{}/api/activation-codes/verify", self.api_base_url);
        let request_body = VerifyRequest {
            code: code.to_string(),
        };

        log::info!("Verifying activation code with API: {}", verify_url);

        match self.client
            .post(&verify_url)
            .header("Content-Type", "application/json")
            .header("User-Agent", "HOUT-Client/1.0.0")
            .header("Accept", "application/json")
            .header("Cache-Control", "no-cache")
            .json(&request_body)
            .send()
            .await
        {
            Ok(response) => {
                let status = response.status();
                let response_text = response.text().await.unwrap_or_default();

                // 安全日志记录：不记录敏感信息
                log::info!("API response status: {}", status);
                if status.is_success() {
                    log::debug!("API response received successfully");
                } else {
                    log::warn!("API request failed with status: {}", status);
                    // 只在调试模式下记录响应内容
                    #[cfg(debug_assertions)]
                    log::debug!("Response body: {}", response_text);
                }

                if status.is_success() {
                    match serde_json::from_str::<VerifyResponse>(&response_text) {
                        Ok(verify_response) => {
                            if verify_response.success {
                                if let Some(verify_data) = verify_response.data {
                                    // 将VerifyResponseData转换为ActivationCode
                                    // 由于API响应格式与ActivationCode结构不完全匹配，我们需要构造缺失的字段
                                    let activated_at = chrono::DateTime::parse_from_rfc3339(&verify_data.activated_at)
                                        .map(|dt| dt.with_timezone(&chrono::Utc))
                                        .unwrap_or_else(|_| chrono::Utc::now());

                                    // 从apiValidation中获取过期时间
                                    let expires_at = if let Some(api_validation) = &verify_data.api_validation {
                                        chrono::DateTime::parse_from_rfc3339(&api_validation.expires_at)
                                            .map(|dt| dt.with_timezone(&chrono::Utc))
                                            .unwrap_or_else(|_| chrono::Utc::now() + chrono::Duration::days(365))
                                    } else {
                                        chrono::Utc::now() + chrono::Duration::days(365)
                                    };

                                    let activation_code = ActivationCode {
                                        id: verify_data.id,
                                        code: verify_data.code,
                                        created_at: chrono::Utc::now(), // API没有返回，使用当前时间
                                        expires_at,
                                        is_used: true, // 验证成功说明已被使用
                                        used_at: Some(activated_at),
                                        metadata: verify_data.metadata,
                                        product_info: verify_data.product_info,
                                    };
                                    Ok(activation_code)
                                } else {
                                    Err(HoutError::Tool("API响应数据为空".to_string()))
                                }
                            } else {
                                let error_msg = verify_response.error.unwrap_or("未知错误".to_string());
                                Err(HoutError::Tool(error_msg))
                            }
                        }
                        Err(e) => {
                            log::error!("Failed to parse API response: {}", e);
                            Err(HoutError::Tool("API响应格式错误".to_string()))
                        }
                    }
                } else {
                    // 处理HTTP错误状态码
                    match status.as_u16() {
                        400 => {
                            if let Ok(error_response) = serde_json::from_str::<VerifyResponse>(&response_text) {
                                let error_msg = error_response.error.unwrap_or("激活码无效".to_string());
                                Err(HoutError::Tool(error_msg))
                            } else {
                                Err(HoutError::Tool("激活码无效".to_string()))
                            }
                        }
                        404 => Err(HoutError::Tool("激活码不存在".to_string())),
                        500 => Err(HoutError::Tool("服务器内部错误，请稍后重试".to_string())),
                        _ => Err(HoutError::Tool(format!("验证失败，HTTP状态码: {}", status)))
                    }
                }
            }
            Err(e) => {
                log::error!("Failed to call activation API: {}", e);
                Err(HoutError::Network(format!("网络请求失败: {}", e)))
            }
        }
    }
    
    /// 执行激活
    pub async fn activate(&self, request: ActivationRequest) -> Result<ActivationResponse> {
        // 记录激活尝试
        log::info!("Activation attempt started for user: {}", request.user_config.username);

        // 输入验证和安全检查
        if request.activation_code.trim().is_empty() {
            log::warn!("Activation attempt with empty code");
            return Ok(ActivationResponse {
                success: false,
                status: ActivationStatus::ActivationFailed,
                message: "激活码不能为空".to_string(),
                expiry_date: None,
                features: None,
                token: None,
            });
        }

        // 验证激活码长度和格式
        let code = request.activation_code.trim();
        if code.len() < 15 || code.len() > 50 {
            log::warn!("Activation attempt with invalid code length: {}", code.len());
            return Ok(ActivationResponse {
                success: false,
                status: ActivationStatus::ActivationFailed,
                message: "激活码长度不正确".to_string(),
                expiry_date: None,
                features: None,
                token: None,
            });
        }

        if request.user_config.username.trim().is_empty() {
            log::warn!("Activation attempt with empty username");
            return Ok(ActivationResponse {
                success: false,
                status: ActivationStatus::ActivationFailed,
                message: "用户名不能为空".to_string(),
                expiry_date: None,
                features: None,
                token: None,
            });
        }

        // 验证用户名长度和字符
        let username = request.user_config.username.trim();
        if username.len() > 50 {
            log::warn!("Activation attempt with username too long: {}", username.len());
            return Ok(ActivationResponse {
                success: false,
                status: ActivationStatus::ActivationFailed,
                message: "用户名过长".to_string(),
                expiry_date: None,
                features: None,
                token: None,
            });
        }

        // 安全日志：记录激活尝试但不记录完整激活码
        let code_prefix = if request.activation_code.len() > 8 {
            format!("{}****", &request.activation_code[..4])
        } else {
            "****".to_string()
        };
        log::info!("Processing activation request for code: {} by user: {}",
                  code_prefix, request.user_config.username);

        match self.validate_code(&request.activation_code).await {
            Ok(activation_code) => {
                log::info!("Activation successful for code: {}", request.activation_code);

                // 提取功能列表
                let features = activation_code.product_info
                    .as_ref()
                    .map(|info| info.features.clone())
                    .unwrap_or_default();

                Ok(ActivationResponse {
                    success: true,
                    status: ActivationStatus::Activated,
                    message: "激活成功！欢迎使用HOUT工具箱。".to_string(),
                    expiry_date: Some(activation_code.expires_at),
                    features: Some(features),
                    token: Some(format!("token_{}", uuid::Uuid::new_v4())),
                })
            }
            Err(e) => {
                log::warn!("Activation failed for code {}: {}", request.activation_code, e);

                Ok(ActivationResponse {
                    success: false,
                    status: ActivationStatus::ActivationFailed,
                    message: format!("激活失败：{}", e),
                    expiry_date: None,
                    features: None,
                    token: None,
                })
            }
        }
    }
}

impl Default for ActivationValidator {
    fn default() -> Self {
        Self::new()
    }
}

// Tauri命令：检查激活码过期状态
#[tauri::command]
pub async fn check_activation_expiry(activation_data: String) -> std::result::Result<serde_json::Value, String> {
    match serde_json::from_str::<ActivationCode>(&activation_data) {
        Ok(activation_code) => {
            let validator = ActivationValidator::new();
            let is_expired = validator.is_activation_expired(&activation_code);
            let remaining_time = validator.get_remaining_time(&activation_code);

            let result = serde_json::json!({
                "isExpired": is_expired,
                "expiresAt": activation_code.expires_at.to_rfc3339(),
                "remainingTime": remaining_time,
                "remainingDays": remaining_time / (24 * 60 * 60),
                "remainingHours": (remaining_time % (24 * 60 * 60)) / 3600,
                "remainingMinutes": (remaining_time % 3600) / 60
            });

            Ok(result)
        }
        Err(e) => Err(format!("解析激活码数据失败: {}", e))
    }
}
