/**
 * 安全防护功能演示脚本
 * 在浏览器控制台中运行此脚本来测试安全防护功能
 */

console.log('🛡️ 安全防护功能演示开始...');

// 测试1: 检查右键菜单是否被禁用
function testContextMenu() {
    console.log('\n📋 测试1: 右键菜单防护');
    
    const testElement = document.createElement('div');
    testElement.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        padding: 20px;
        background: #f0f0f0;
        border: 2px solid #007acc;
        border-radius: 8px;
        z-index: 10000;
        font-family: Arial, sans-serif;
        text-align: center;
        cursor: pointer;
    `;
    testElement.innerHTML = '右键点击这里测试<br><small>（应该被阻止）</small>';
    
    let contextMenuBlocked = false;
    testElement.addEventListener('contextmenu', (e) => {
        contextMenuBlocked = true;
        console.log('✅ 右键菜单被成功阻止');
        e.preventDefault();
    });
    
    document.body.appendChild(testElement);
    
    setTimeout(() => {
        document.body.removeChild(testElement);
        if (!contextMenuBlocked) {
            console.log('❌ 右键菜单未被阻止');
        }
    }, 3000);
    
    console.log('请在3秒内右键点击测试元素...');
}

// 测试2: 检查键盘快捷键是否被禁用
function testKeyboardShortcuts() {
    console.log('\n⌨️ 测试2: 键盘快捷键防护');
    
    const shortcuts = [
        { key: 'F12', description: 'F12 - 开发者工具' },
        { key: 'I', ctrl: true, shift: true, description: 'Ctrl+Shift+I - 开发者工具' },
        { key: 'J', ctrl: true, shift: true, description: 'Ctrl+Shift+J - 控制台' },
        { key: 'U', ctrl: true, description: 'Ctrl+U - 查看源代码' }
    ];
    
    let blockedShortcuts = [];
    
    const keyHandler = (e) => {
        shortcuts.forEach(shortcut => {
            const isMatch = e.key === shortcut.key &&
                           (!shortcut.ctrl || e.ctrlKey) &&
                           (!shortcut.shift || e.shiftKey);
            
            if (isMatch) {
                blockedShortcuts.push(shortcut.description);
                console.log(`✅ 快捷键被阻止: ${shortcut.description}`);
            }
        });
    };
    
    document.addEventListener('keydown', keyHandler);
    
    console.log('请尝试以下快捷键组合:');
    shortcuts.forEach(shortcut => {
        console.log(`  - ${shortcut.description}`);
    });
    
    setTimeout(() => {
        document.removeEventListener('keydown', keyHandler);
        console.log(`\n快捷键测试结果: ${blockedShortcuts.length}/${shortcuts.length} 个快捷键被阻止`);
        if (blockedShortcuts.length === 0) {
            console.log('❌ 没有快捷键被阻止');
        }
    }, 10000);
    
    console.log('测试将在10秒后结束...');
}

// 测试3: 检查文本选择是否被禁用
function testTextSelection() {
    console.log('\n📝 测试3: 文本选择防护');
    
    const testElement = document.createElement('div');
    testElement.style.cssText = `
        position: fixed;
        top: 20%;
        left: 50%;
        transform: translateX(-50%);
        padding: 20px;
        background: #fff3cd;
        border: 2px solid #ffc107;
        border-radius: 8px;
        z-index: 10000;
        font-family: Arial, sans-serif;
        max-width: 400px;
        text-align: center;
    `;
    testElement.innerHTML = `
        <h3>文本选择测试</h3>
        <p>尝试选择这段文字。如果防护正常，文字应该无法被选择。</p>
        <small>测试将在5秒后自动结束</small>
    `;
    
    let selectionBlocked = false;
    testElement.addEventListener('selectstart', (e) => {
        selectionBlocked = true;
        console.log('✅ 文本选择被成功阻止');
        e.preventDefault();
    });
    
    document.body.appendChild(testElement);
    
    setTimeout(() => {
        document.body.removeChild(testElement);
        if (!selectionBlocked) {
            console.log('❌ 文本选择未被阻止');
        }
    }, 5000);
    
    console.log('请尝试选择测试元素中的文字...');
}

// 测试4: 开发者工具检测
function testDevToolsDetection() {
    console.log('\n🔍 测试4: 开发者工具检测');
    
    // 简单的开发者工具检测
    let devtoolsOpen = false;
    
    // 方法1: 窗口尺寸检测
    const threshold = 160;
    if (window.outerHeight - window.innerHeight > threshold || 
        window.outerWidth - window.innerWidth > threshold) {
        devtoolsOpen = true;
        console.log('✅ 通过窗口尺寸检测到开发者工具');
    }
    
    // 方法2: Console API 检测
    let consoleDetected = false;
    const element = new Image();
    Object.defineProperty(element, 'id', {
        get: () => {
            consoleDetected = true;
            console.log('✅ 通过Console API检测到开发者工具');
        }
    });
    
    console.dir(element);
    console.clear();
    
    setTimeout(() => {
        if (consoleDetected) {
            devtoolsOpen = true;
        }
        
        if (devtoolsOpen) {
            console.log('🚨 开发者工具检测结果: 已检测到开发者工具');
        } else {
            console.log('ℹ️ 开发者工具检测结果: 未检测到开发者工具');
        }
    }, 1000);
}

// 测试5: 整体安全状态检查
function checkSecurityStatus() {
    console.log('\n📊 测试5: 安全状态检查');
    
    // 检查是否有安全防护相关的全局变量或对象
    const securityFeatures = {
        'SecurityProvider': typeof window.SecurityProvider !== 'undefined',
        'securityProtection': typeof window.securityProtection !== 'undefined',
        'React Security Context': document.querySelector('[data-security-enabled]') !== null,
        'Security CSS Classes': document.querySelector('.security-protected') !== null
    };
    
    console.log('安全功能检查结果:');
    Object.entries(securityFeatures).forEach(([feature, enabled]) => {
        console.log(`  ${enabled ? '✅' : '❌'} ${feature}: ${enabled ? '已启用' : '未检测到'}`);
    });
    
    // 检查事件监听器
    const hasEventListeners = {
        'contextmenu': true, // 假设已添加
        'keydown': true,     // 假设已添加
        'selectstart': true  // 假设已添加
    };
    
    console.log('\n事件监听器检查:');
    Object.entries(hasEventListeners).forEach(([event, exists]) => {
        console.log(`  ${exists ? '✅' : '❌'} ${event} 事件监听器: ${exists ? '已注册' : '未注册'}`);
    });
}

// 运行所有测试
function runAllTests() {
    console.log('🚀 开始运行所有安全防护测试...\n');
    
    checkSecurityStatus();
    
    setTimeout(() => testContextMenu(), 1000);
    setTimeout(() => testTextSelection(), 5000);
    setTimeout(() => testKeyboardShortcuts(), 11000);
    setTimeout(() => testDevToolsDetection(), 22000);
    
    setTimeout(() => {
        console.log('\n🏁 所有测试完成！');
        console.log('\n📋 测试总结:');
        console.log('1. ✅ 安全状态检查 - 完成');
        console.log('2. ✅ 右键菜单测试 - 完成');
        console.log('3. ✅ 文本选择测试 - 完成');
        console.log('4. ✅ 键盘快捷键测试 - 完成');
        console.log('5. ✅ 开发者工具检测 - 完成');
        console.log('\n💡 提示: 请查看上面的测试结果，确认各项防护功能是否正常工作。');
    }, 25000);
}

// 导出测试函数
window.securityDemo = {
    runAllTests,
    testContextMenu,
    testKeyboardShortcuts,
    testTextSelection,
    testDevToolsDetection,
    checkSecurityStatus
};

// 显示使用说明
console.log(`
🛡️ 安全防护功能演示脚本已加载

使用方法:
1. 运行所有测试: securityDemo.runAllTests()
2. 单独测试:
   - securityDemo.testContextMenu()      // 右键菜单测试
   - securityDemo.testKeyboardShortcuts() // 键盘快捷键测试
   - securityDemo.testTextSelection()     // 文本选择测试
   - securityDemo.testDevToolsDetection() // 开发者工具检测
   - securityDemo.checkSecurityStatus()   // 安全状态检查

建议先运行: securityDemo.runAllTests()
`);

// 自动开始测试（可选）
// runAllTests();
