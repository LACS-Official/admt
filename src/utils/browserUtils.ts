/**
 * 浏览器工具函数
 * 提供清除自动填充历史记录等功能
 */

/**
 * 清除指定输入框的浏览器自动填充历史记录
 * 适用于主流浏览器：Chrome、Firefox、Safari、Edge
 */
export const clearInputAutoFillHistory = (inputSelector: string | HTMLInputElement[]) => {
  let inputs: HTMLInputElement[];
  
  if (typeof inputSelector === 'string') {
    inputs = Array.from(document.querySelectorAll(inputSelector)) as HTMLInputElement[];
  } else {
    inputs = inputSelector;
  }

  inputs.forEach((input) => {
    if (!input) return;

    // 1. 清除当前值和默认值
    input.value = '';
    input.defaultValue = '';
    
    // 2. 设置防止自动填充的属性
    input.setAttribute('autocomplete', 'new-password'); // 最有效的方法
    input.setAttribute('autoComplete', 'off'); // React属性
    input.setAttribute('autoCorrect', 'off');
    input.setAttribute('autoCapitalize', 'off');
    input.setAttribute('spellCheck', 'false');
    
    // 3. 防止密码管理器记录
    input.setAttribute('data-lpignore', 'true'); // LastPass
    input.setAttribute('data-1p-ignore', 'true'); // 1Password
    input.setAttribute('data-bwignore', 'true'); // Bitwarden
    input.setAttribute('data-dashlane-ignore', 'true'); // Dashlane
    input.setAttribute('data-form-type', 'other'); // 通用标记
    
    // 4. 使用随机name属性防止浏览器记忆
    const randomSuffix = Math.random().toString(36).substr(2, 9);
    input.name = `temp-input-${randomSuffix}`;
    
    // 5. 移除可能的自动填充CSS类
    input.classList.remove('auto-filled', 'autocompleted', 'x-webkit-autofill');
    
    // 6. 设置输入类型为text（如果不是密码字段）
    if (input.type !== 'password') {
      input.type = 'text';
    }
  });
};

/**
 * 清除浏览器表单历史记录缓存
 */
export const clearBrowserFormCache = () => {
  try {
    // 清除localStorage和sessionStorage中可能的表单数据
    const keysToRemove = [];
    
    // 检查localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('form') || key.includes('input') || key.includes('activation'))) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    // 检查sessionStorage
    const sessionKeysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (key.includes('form') || key.includes('input') || key.includes('activation'))) {
        sessionKeysToRemove.push(key);
      }
    }
    
    sessionKeysToRemove.forEach(key => {
      sessionStorage.removeItem(key);
    });
    
  } catch (e) {
    console.log('清除浏览器缓存失败:', e);
  }
};

/**
 * 监控并阻止浏览器自动填充
 * 使用MutationObserver监控DOM变化
 */
export const preventAutoFill = (inputSelector: string) => {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes') {
        const target = mutation.target as HTMLInputElement;
        
        // 检查是否是我们要保护的输入框
        if (target.matches && target.matches(inputSelector)) {
          // 如果检测到value属性变化且不是用户输入
          if (mutation.attributeName === 'value' && !target.dataset.userInput) {
            // 延迟清除，避免与用户输入冲突
            setTimeout(() => {
              if (!target.dataset.userInput) {
                target.value = '';
              }
            }, 50);
          }
          
          // 检测自动填充的CSS类
          if (target.classList.contains('auto-filled') || 
              target.classList.contains('autocompleted') ||
              target.classList.contains('x-webkit-autofill')) {
            target.classList.remove('auto-filled', 'autocompleted', 'x-webkit-autofill');
            target.value = '';
          }
        }
      }
    });
  });

  // 开始监控
  observer.observe(document.body, {
    attributes: true,
    subtree: true,
    attributeFilter: ['value', 'class']
  });

  return observer;
};

/**
 * 为激活码输入框提供的专用清除函数
 */
export const clearActivationCodeHistory = () => {
  // 清除激活码输入框
  clearInputAutoFillHistory('input[id^="activation-code-"]');
  
  // 清除相关的浏览器缓存
  clearBrowserFormCache();
  
  // 启动防护监控
  const observer = preventAutoFill('input[id^="activation-code-"]');
  
  return observer;
};

/**
 * 在输入框获得焦点时清除自动填充
 */
export const setupInputFocusHandler = (inputSelector: string) => {
  const inputs = document.querySelectorAll(inputSelector) as NodeListOf<HTMLInputElement>;
  
  inputs.forEach((input) => {
    // 焦点事件
    input.addEventListener('focus', () => {
      // 标记为用户交互
      input.dataset.userInput = 'true';
      
      // 清除可能的自动填充
      setTimeout(() => {
        if (input.value && !input.dataset.manualInput) {
          input.value = '';
        }
      }, 100);
    });
    
    // 输入事件
    input.addEventListener('input', () => {
      input.dataset.manualInput = 'true';
    });
    
    // 失去焦点时清理标记
    input.addEventListener('blur', () => {
      setTimeout(() => {
        delete input.dataset.userInput;
        delete input.dataset.manualInput;
      }, 1000);
    });
  });
};

/**
 * 页面卸载时的清理函数
 */
export const setupPageUnloadHandler = () => {
  const handleBeforeUnload = () => {
    clearActivationCodeHistory();
  };
  
  window.addEventListener('beforeunload', handleBeforeUnload);
  
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };
};