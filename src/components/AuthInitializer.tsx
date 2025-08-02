/**
 * 认证系统初始化组件
 * 在应用启动时初始化认证系统，确保安全配置和认证状态正确设置
 */

import React, { useEffect, useState } from 'react'
import { AuthInitService, AuthInitStatus } from '../services/authInitService'

interface AuthInitializerProps {
  children: React.ReactNode
  onInitComplete?: (status: AuthInitStatus) => void
  onInitError?: (error: string) => void
}

interface InitState {
  isLoading: boolean
  isComplete: boolean
  error: string | null
  status: AuthInitStatus | null
}

const AuthInitializer: React.FC<AuthInitializerProps> = ({
  children,
  onInitComplete,
  onInitError
}) => {
  const [initState, setInitState] = useState<InitState>({
    isLoading: true,
    isComplete: false,
    error: null,
    status: null
  })

  useEffect(() => {
    initializeAuth()
  }, [])

  const initializeAuth = async () => {
    try {
      console.log('🚀 开始初始化认证系统...')
      setInitState(prev => ({ ...prev, isLoading: true, error: null }))

      const authInitService = AuthInitService.getInstance()
      const status = await authInitService.initialize()

      setInitState({
        isLoading: false,
        isComplete: true,
        error: null,
        status
      })

      console.log('✅ 认证系统初始化完成:', status)
      onInitComplete?.(status)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('❌ 认证系统初始化失败:', errorMessage)

      setInitState({
        isLoading: false,
        isComplete: false,
        error: errorMessage,
        status: null
      })

      onInitError?.(errorMessage)
    }
  }

  const handleRetry = () => {
    initializeAuth()
  }

  // 加载中状态
  if (initState.isLoading) {
    return (
      <div className="auth-initializer-loading">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <h3>正在初始化安全系统...</h3>
          <div className="loading-steps">
            <div className="step">🔐 加载安全配置</div>
            <div className="step">🔍 生成设备指纹</div>
            <div className="step">🎫 获取认证令牌</div>
            <div className="step">✅ 验证系统状态</div>
          </div>
        </div>
        <style jsx>{`
          .auth-initializer-loading {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }
          .loading-container {
            text-align: center;
            padding: 2rem;
            border-radius: 12px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          }
          .loading-spinner {
            width: 50px;
            height: 50px;
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-top: 4px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .loading-steps {
            margin-top: 1.5rem;
          }
          .step {
            margin: 0.5rem 0;
            opacity: 0.8;
            font-size: 0.9rem;
          }
          h3 {
            margin: 0 0 1rem 0;
            font-size: 1.5rem;
            font-weight: 600;
          }
        `}</style>
      </div>
    )
  }

  // 错误状态
  if (initState.error) {
    return (
      <div className="auth-initializer-error">
        <div className="error-container">
          <div className="error-icon">❌</div>
          <h3>认证系统初始化失败</h3>
          <p className="error-message">{initState.error}</p>
          <div className="error-actions">
            <button onClick={handleRetry} className="retry-button">
              🔄 重试
            </button>
          </div>
        </div>
        <style jsx>{`
          .auth-initializer-error {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
            color: white;
          }
          .error-container {
            text-align: center;
            padding: 2rem;
            border-radius: 12px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            max-width: 400px;
          }
          .error-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
          }
          .error-message {
            margin: 1rem 0;
            padding: 1rem;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            font-family: monospace;
            font-size: 0.9rem;
            word-break: break-word;
          }
          .retry-button {
            background: rgba(255, 255, 255, 0.2);
            border: 2px solid rgba(255, 255, 255, 0.3);
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1rem;
            transition: all 0.3s ease;
          }
          .retry-button:hover {
            background: rgba(255, 255, 255, 0.3);
            border-color: rgba(255, 255, 255, 0.5);
            transform: translateY(-2px);
          }
          h3 {
            margin: 0 0 1rem 0;
            font-size: 1.5rem;
            font-weight: 600;
          }
        `}</style>
      </div>
    )
  }

  // 初始化完成，渲染子组件
  return <>{children}</>
}

export default AuthInitializer
