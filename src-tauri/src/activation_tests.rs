#[cfg(test)]
mod tests {
    use crate::activation::{ActivationValidator, ActivationRequest, UserConfiguration, DeviceInfo, ActivationStatus};
    use chrono::Utc;

    /// 测试激活码格式验证
    #[test]
    fn test_activation_code_format_validation() {
        let validator = ActivationValidator::new();

        // 测试有效格式
        assert!(validator.validate_format("1K2L3M4N-ABC123-DEF45678"));
        assert!(validator.validate_format("2M3N4O5P-XYZ789-GHI12345"));
        assert!(validator.validate_format("3O5P6Q7R-RST456-JKL67890"));

        // 测试无效格式
        assert!(!validator.validate_format(""));  // 空字符串
        assert!(!validator.validate_format("HOUT-2025-DEMO-001"));  // 旧格式
        assert!(!validator.validate_format("1K2L3M4N-ABC123"));  // 缺少部分
        assert!(!validator.validate_format("1K2L3M4N-ABC123-DEF45678-EXTRA"));  // 多余部分
        assert!(!validator.validate_format("1K2L3M4N-ABC12-DEF45678"));  // 第二部分长度错误
        assert!(!validator.validate_format("1K2L3M4N-ABC123-DEF4567"));  // 第三部分长度错误
        assert!(!validator.validate_format("1K2L3M4N-ABC@23-DEF45678"));  // 包含特殊字符
        assert!(!validator.validate_format("1K2L3M4N ABC123 DEF45678"));  // 包含空格
    }

    /// 测试激活码格式边界情况
    #[test]
    fn test_activation_code_format_edge_cases() {
        let validator = ActivationValidator::new();

        // 测试长度边界
        assert!(!validator.validate_format("A".repeat(51).as_str()));  // 过长
        assert!(!validator.validate_format("12345-ABC123-DEF45678"));  // 第一部分太短
        assert!(!validator.validate_format("1234567890A-ABC123-DEF45678"));  // 第一部分太长

        // 测试字符类型
        assert!(!validator.validate_format("1K2L3M4N-ABC123-DEF4567中"));  // 包含中文
        assert!(!validator.validate_format("1K2L3M4N-ABC123-DEF4567!"));  // 包含感叹号
        assert!(!validator.validate_format("1K2L3M4N-ABC123-DEF4567."));  // 包含点号
    }

    /// 创建测试用的激活请求
    fn create_test_activation_request(code: &str) -> ActivationRequest {
        ActivationRequest {
            activation_code: code.to_string(),
            user_config: UserConfiguration {
                username: "测试用户".to_string(),
                language: "zh-CN".to_string(),
                theme: "light".to_string(),
                auto_start: false,
                check_updates: true,
                enable_telemetry: false,
            },
            device_info: Some(DeviceInfo {
                platform: "Windows".to_string(),
                version: "1.0.0".to_string(),
                device_id: "test-device-123".to_string(),
            }),
        }
    }

    /// 测试激活请求输入验证
    #[tokio::test]
    async fn test_activation_input_validation() {
        let validator = ActivationValidator::new();

        // 测试空激活码
        let mut request = create_test_activation_request("");
        let response = validator.activate(request).await.unwrap();
        assert!(!response.success);
        assert_eq!(response.status, ActivationStatus::ActivationFailed);
        assert!(response.message.contains("激活码不能为空"));

        // 测试空用户名
        request = create_test_activation_request("1K2L3M4N-ABC123-DEF45678");
        request.user_config.username = "".to_string();
        let response = validator.activate(request).await.unwrap();
        assert!(!response.success);
        assert_eq!(response.status, ActivationStatus::ActivationFailed);
        assert!(response.message.contains("用户名不能为空"));

        // 测试只包含空格的激活码
        request = create_test_activation_request("   ");
        let response = validator.activate(request).await.unwrap();
        assert!(!response.success);
        assert_eq!(response.status, ActivationStatus::ActivationFailed);
        assert!(response.message.contains("激活码不能为空"));
    }

    /// 测试激活码格式验证在激活流程中的应用
    #[tokio::test]
    async fn test_activation_with_invalid_format() {
        let validator = ActivationValidator::new();

        // 测试无效格式的激活码
        let request = create_test_activation_request("INVALID-FORMAT");
        let response = validator.activate(request).await.unwrap();
        assert!(!response.success);
        assert_eq!(response.status, ActivationStatus::ActivationFailed);
        assert!(response.message.contains("激活码格式不正确"));
    }

    /// 测试用户配置验证
    #[test]
    fn test_user_configuration_validation() {
        let config = UserConfiguration {
            username: "测试用户".to_string(),
            language: "zh-CN".to_string(),
            theme: "light".to_string(),
            auto_start: false,
            check_updates: true,
            enable_telemetry: false,
        };

        // 验证配置字段
        assert!(!config.username.is_empty());
        assert!(!config.language.is_empty());
        assert!(!config.theme.is_empty());
        assert!(["light", "dark", "auto"].contains(&config.theme.as_str()));
        assert!(["zh-CN", "zh-TW", "en-US", "ja-JP", "ko-KR"].contains(&config.language.as_str()));
    }

    /// 测试设备信息验证
    #[test]
    fn test_device_info_validation() {
        let device_info = DeviceInfo {
            platform: "Windows".to_string(),
            version: "1.0.0".to_string(),
            device_id: "test-device-123".to_string(),
        };

        // 验证设备信息字段
        assert!(!device_info.platform.is_empty());
        assert!(!device_info.version.is_empty());
        assert!(!device_info.device_id.is_empty());
        assert!(["Windows", "macOS", "Linux", "Android", "iOS"].contains(&device_info.platform.as_str()));
    }

    /// 测试激活响应结构
    #[test]
    fn test_activation_response_structure() {
        use crate::activation::ActivationResponse;

        let response = ActivationResponse {
            success: true,
            status: ActivationStatus::Activated,
            message: "激活成功".to_string(),
            expiry_date: Some(Utc::now()),
            features: Some(vec!["premium".to_string(), "support".to_string()]),
            token: Some("test-token".to_string()),
        };

        assert!(response.success);
        assert_eq!(response.status, ActivationStatus::Activated);
        assert!(!response.message.is_empty());
        assert!(response.expiry_date.is_some());
        assert!(response.features.is_some());
        assert!(response.token.is_some());
    }

    /// 测试API验证请求结构
    #[test]
    fn test_verify_request_structure() {
        use crate::activation::VerifyRequest;

        let request = VerifyRequest {
            code: "1K2L3M4N-ABC123-DEF45678".to_string(),
        };

        assert!(!request.code.is_empty());
        assert_eq!(request.code, "1K2L3M4N-ABC123-DEF45678");
    }

    /// 测试产品信息结构
    #[test]
    fn test_product_info_structure() {
        use crate::activation::ProductInfo;

        let product_info = ProductInfo {
            name: "HOUT工具箱专业版".to_string(),
            version: "2.1.0".to_string(),
            features: vec!["screen_mirror".to_string(), "file_manager".to_string()],
        };

        assert!(!product_info.name.is_empty());
        assert!(!product_info.version.is_empty());
        assert!(!product_info.features.is_empty());
        assert!(product_info.features.contains(&"screen_mirror".to_string()));
    }

    /// 测试激活状态枚举
    #[test]
    fn test_activation_status_enum() {
        let statuses = vec![
            ActivationStatus::NotActivated,
            ActivationStatus::Activating,
            ActivationStatus::Activated,
            ActivationStatus::ActivationFailed,
            ActivationStatus::Expired,
        ];

        // 确保所有状态都能正确序列化和反序列化
        for status in statuses {
            let serialized = serde_json::to_string(&status).unwrap();
            let deserialized: ActivationStatus = serde_json::from_str(&serialized).unwrap();
            assert_eq!(status, deserialized);
        }
    }
}
