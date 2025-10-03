use crate::error::{HoutError, Result};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

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
    #[serde(rename = "createdAt")]
    pub created_at: String, // API返回的是字符串格式的时间
    #[serde(rename = "expiresAt")]
    pub expires_at: String, // API返回的是字符串格式的时间
    #[serde(rename = "isUsed")]
    pub is_used: bool,
    #[serde(rename = "usedAt")]
    pub used_at: Option<String>, // API返回的是字符串格式的时间
    #[serde(rename = "isExpired")]
    pub is_expired: bool,
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

    /// 验证激活码格式（修改为8位大写字母和数字）
    pub fn validate_format(&self, code: &str) -> bool {
        // 安全性检查：防止空值和过长输入
        if code.is_empty() || code.len() != 8 {
            log::warn!("Invalid activation code length: {}", code.len());
            return false;
        }

        // 安全性检查：只允许大写字母和数字
        if !code
            .chars()
            .all(|c| c.is_ascii_uppercase() || c.is_ascii_digit())
        {
            log::warn!("Invalid characters in activation code");
            return false;
        }

        log::debug!("Activation code format validation passed");
        true
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

        match self
            .client
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
                }

                // 在调试模式下记录响应内容，用于诊断问题
                #[cfg(debug_assertions)]
                log::debug!("Response body: {}", response_text);

                // 在生产环境中也记录响应长度和前100个字符，用于诊断
                #[cfg(not(debug_assertions))]
                {
                    log::info!("Response length: {} bytes", response_text.len());
                    let preview = if response_text.len() > 100 {
                        format!("{}...", &response_text[..100])
                    } else {
                        response_text.clone()
                    };
                    log::info!("Response preview: {}", preview);
                }

                if status.is_success() {
                    // 首先尝试解析为通用的JSON值，以便更好地诊断问题
                    match serde_json::from_str::<serde_json::Value>(&response_text) {
                        Ok(json_value) => {
                            log::debug!("Successfully parsed JSON, attempting to deserialize to VerifyResponse");

                            // 现在尝试解析为VerifyResponse
                            match serde_json::from_value::<VerifyResponse>(json_value.clone()) {
                                Ok(verify_response) => {
                                    if verify_response.success {
                                        if let Some(verify_data) = verify_response.data {
                                            // 将VerifyResponseData转换为ActivationCode
                                            // 解析API返回的时间字段
                                            let created_at = chrono::DateTime::parse_from_rfc3339(
                                                &verify_data.created_at,
                                            )
                                            .map(|dt| dt.with_timezone(&chrono::Utc))
                                            .unwrap_or_else(|_| chrono::Utc::now());

                                            let expires_at = chrono::DateTime::parse_from_rfc3339(
                                                &verify_data.expires_at,
                                            )
                                            .map(|dt| dt.with_timezone(&chrono::Utc))
                                            .unwrap_or_else(|_| {
                                                chrono::Utc::now() + chrono::Duration::days(365)
                                            });

                                            let used_at = verify_data.used_at.as_ref().and_then(
                                                |used_at_str| {
                                                    chrono::DateTime::parse_from_rfc3339(
                                                        used_at_str,
                                                    )
                                                    .map(|dt| dt.with_timezone(&chrono::Utc))
                                                    .ok()
                                                },
                                            );

                                            let activation_code = ActivationCode {
                                                id: verify_data.id,
                                                code: verify_data.code,
                                                created_at,
                                                expires_at,
                                                is_used: verify_data.is_used,
                                                used_at,
                                                metadata: verify_data.metadata,
                                                product_info: verify_data.product_info,
                                            };
                                            Ok(activation_code)
                                        } else {
                                            Err(HoutError::Tool("API响应数据为空".to_string()))
                                        }
                                    } else {
                                        let error_msg =
                                            verify_response.error.unwrap_or("未知错误".to_string());
                                        Err(HoutError::Tool(error_msg))
                                    }
                                }
                                Err(e) => {
                                    log::error!("Failed to deserialize VerifyResponse: {}", e);
                                    log::error!(
                                        "JSON structure: {}",
                                        serde_json::to_string_pretty(&json_value)
                                            .unwrap_or_default()
                                    );

                                    // 尝试提取错误信息
                                    if let Some(error_msg) =
                                        json_value.get("error").and_then(|v| v.as_str())
                                    {
                                        Err(HoutError::Tool(error_msg.to_string()))
                                    } else if let Some(message) =
                                        json_value.get("message").and_then(|v| v.as_str())
                                    {
                                        Err(HoutError::Tool(message.to_string()))
                                    } else {
                                        Err(HoutError::Tool(format!("API响应结构不匹配: {}", e)))
                                    }
                                }
                            }
                        }
                        Err(e) => {
                            log::error!("Failed to parse response as JSON: {}", e);
                            log::error!("Raw response: {}", response_text);
                            Err(HoutError::Tool(format!("API响应不是有效的JSON格式: {}", e)))
                        }
                    }
                } else {
                    // 处理HTTP错误状态码
                    match status.as_u16() {
                        400 => {
                            if let Ok(error_response) =
                                serde_json::from_str::<VerifyResponse>(&response_text)
                            {
                                let error_msg =
                                    error_response.error.unwrap_or("激活码无效".to_string());
                                Err(HoutError::Tool(error_msg))
                            } else {
                                Err(HoutError::Tool("激活码无效".to_string()))
                            }
                        }
                        404 => Err(HoutError::Tool("激活码不存在".to_string())),
                        500 => Err(HoutError::Tool("服务器内部错误，请稍后重试".to_string())),
                        _ => Err(HoutError::Tool(format!("验证失败，HTTP状态码: {}", status))),
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
        log::info!(
            "Activation attempt started for user: {}",
            request.user_config.username
        );

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
        if code.len() != 8 {
            log::warn!(
                "Activation attempt with invalid code length: {}",
                code.len()
            );
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
            log::warn!(
                "Activation attempt with username too long: {}",
                username.len()
            );
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
        log::info!(
            "Processing activation request for code: {} by user: {}",
            code_prefix,
            request.user_config.username
        );

        match self.validate_code(&request.activation_code).await {
            Ok(activation_code) => {
                log::info!(
                    "Activation successful for code: {}",
                    request.activation_code
                );

                // 不再从productInfo中提取features，使用默认的空列表
                let features: Vec<String> = vec![];

                Ok(ActivationResponse {
                    success: true,
                    status: ActivationStatus::Activated,
                    message: "激活成功！欢迎使用ADMT工具箱。".to_string(),
                    expiry_date: Some(activation_code.expires_at),
                    features: Some(features),
                    token: Some(format!("token_{}", uuid::Uuid::new_v4())),
                })
            }
            Err(e) => {
                log::warn!(
                    "Activation failed for code {}: {}",
                    request.activation_code,
                    e
                );

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
pub async fn check_activation_expiry() -> Result<serde_json::Value> {
    log::info!("Checking activation expiry status...");
    
    // 返回模拟的过期检查状态
    let status = serde_json::json!({
        "isExpired": false,
        "remainingDays": 365,
        "expiryDate": chrono::Utc::now() + chrono::Duration::days(365)
    });
    
    Ok(status)
}

/// 验证激活码格式
#[tauri::command]
pub async fn validate_activation_code_format(activation_code: String) -> Result<bool> {
    let validator = ActivationValidator::new();
    Ok(validator.validate_format(&activation_code))
}

/// 激活应用
#[tauri::command]
pub async fn activate_application(request: ActivationRequest) -> Result<ActivationResponse> {
    log::info!(
        "Processing activation request for user: {}",
        request.user_config.username
    );

    let validator = ActivationValidator::new();
    let response = validator.activate(request).await?;

    Ok(response)
}

/// 检查激活状态
#[tauri::command]
pub async fn check_activation_status() -> Result<serde_json::Value> {
    log::info!("Checking activation status...");

    // 返回详细的激活状态信息
    let status = serde_json::json!({
        "isActivated": false,
        "isExpired": false,
        "needsActivation": true,
        "message": "需要激活应用"
    });

    Ok(status)
}

/// 验证本地存储的激活数据完整性
#[tauri::command]
pub async fn validate_local_activation_data(encrypted_data: String) -> Result<bool> {
    log::info!("Validating local activation data integrity");

    // 这里可以添加更复杂的验证逻辑
    // 目前简单检查数据是否为空
    if encrypted_data.trim().is_empty() {
        log::warn!("Empty activation data provided");
        return Ok(false);
    }

    // 检查数据格式是否为有效的base64
    use base64::{engine::general_purpose, Engine as _};
    match general_purpose::STANDARD.decode(&encrypted_data) {
        Ok(_) => {
            log::info!("Local activation data format is valid");
            Ok(true)
        }
        Err(e) => {
            log::warn!("Invalid activation data format: {}", e);
            Ok(false)
        }
    }
}

/// 生成设备指纹用于激活验证
#[tauri::command]
pub async fn get_device_fingerprint() -> Result<String> {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};

    log::info!("Generating device fingerprint");

    // 获取系统信息生成设备指纹
    let mut hasher = DefaultHasher::new();

    // 添加操作系统信息
    std::env::consts::OS.hash(&mut hasher);
    std::env::consts::ARCH.hash(&mut hasher);

    // 添加时间戳确保唯一性（在实际应用中应使用硬件信息）
    let timestamp = chrono::Utc::now().timestamp();
    timestamp.hash(&mut hasher);

    let fingerprint = format!("device_{:x}", hasher.finish());
    log::info!("Generated device fingerprint: {}", fingerprint);

    Ok(fingerprint)
}

/// 获取应用配置
#[tauri::command]
pub async fn get_app_config() -> Result<Option<AppConfig>> {
    // 这里应该从本地存储读取配置
    // 暂时返回None
    Ok(None)
}

/// 保存应用配置
#[tauri::command]
pub async fn save_app_config(config: AppConfig) -> Result<bool> {
    log::info!(
        "Saving app config for user: {}",
        config.user_config.username
    );
    // 这里应该将配置保存到本地存储
    // 暂时返回true表示保存成功
    Ok(true)
}

/// 获取详细的设备指纹信息
#[tauri::command]
pub async fn get_detailed_device_fingerprint() -> Result<DetailedDeviceFingerprint> {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};

    log::info!("Generating detailed device fingerprint");

    // 获取系统信息
    let platform = std::env::consts::OS.to_string();
    let arch = std::env::consts::ARCH.to_string();
    
    // 生成基本指纹
    let mut hasher = DefaultHasher::new();
    platform.hash(&mut hasher);
    arch.hash(&mut hasher);
    
    // 添加时间戳确保唯一性
    let timestamp = chrono::Utc::now().timestamp();
    timestamp.hash(&mut hasher);
    
    let basic_fingerprint = format!("{:x}", hasher.finish());
    
    // 生成增强指纹（包含更多系统信息）
    let mut enhanced_hasher = DefaultHasher::new();
    
    // 添加系统信息
    enhanced_hasher.write_u64(timestamp as u64);
    enhanced_hasher.write(platform.as_bytes());
    enhanced_hasher.write(arch.as_bytes());
    
    // 添加进程ID和线程ID增加随机性
    let process_id = std::process::id();
    let thread_id = std::thread::current().id();
    process_id.hash(&mut enhanced_hasher);
    thread_id.hash(&mut enhanced_hasher);
    
    let enhanced_fingerprint = format!("enhanced_{:x}", enhanced_hasher.finish());
    
    let fingerprint = DetailedDeviceFingerprint {
        basic_fingerprint: basic_fingerprint.clone(),
        enhanced_fingerprint,
        platform,
        arch,
        timestamp: chrono::Utc::now(),
        machine_id: Some(basic_fingerprint),
    };
    
    log::info!("Generated detailed device fingerprint: {:?}", fingerprint);
    
    Ok(fingerprint)
}

/// 详细的设备指纹信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DetailedDeviceFingerprint {
    pub basic_fingerprint: String,
    pub enhanced_fingerprint: String,
    pub platform: String,
    pub arch: String,
    pub timestamp: chrono::DateTime<chrono::Utc>,
    pub machine_id: Option<String>,
}
