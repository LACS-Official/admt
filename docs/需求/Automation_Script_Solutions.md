# ADB 设备自动化脚本与宏 (Macro & Automation) 实现方案规划

## 应用场景

签到、刷金币、自动化测试场景等需要重复性交互的操作。

## 方案一：纯前端 + ADB 串行下发 (轻量级/最基础)

**核心思路**：在 PC 端界面提供一个动作流配置面板，用户配置完成后，由前端（React）按照设定的延时，依次通过 Tauri 的 `deviceService` 发送 `adb shell` 命令。

### 具体实现步骤

1. **统一数据结构定义**：定义一系列动作模型（Action List），例如：
   - `TAP`: `{ type: 'tap', x: number, y: number }`
   - `SWIPE`: `{ type: 'swipe', x1: number, y1: number, x2: number, y2: number, duration?: number }`
   - `TEXT`: `{ type: 'text', text: string }`
   - `WAIT`: `{ type: 'wait', ms: number }`
   - `KEYEVENT`: `{ type: 'keyevent', keycode: number }` (如返回键、Home键)
2. **可视化配置画布**：
   - **时间轴列表视图**：用户通过拖拽左侧的动作块到中间的时间轴或列表视图中。
   - **参数编辑侧边栏**：点击某个动作块，可以在右侧属性面板配置它的参数（如坐标、文本、等待时间）。
3. **执行引擎 (前端驱动)**：
   - 用户点击“运行”时，前端遍历这个配置好的数组。
   - 对于 `TAP`/`SWIPE`/`TEXT`/`KEYEVENT`，调用 `deviceService.executeAdbCommand`。
   - 对于 `WAIT`，前端使用 `await new Promise(r => setTimeout(r, ms))` 阻塞执行队列。

### 优缺点

- **优点**：开发极快，完全复用现有的 ADB 执行通道，无侵入系统要求。
- **缺点**：ADB 命令启动耗时较长（每次下发建立连接），动作间隔如果过短（低于200-300ms），会导致实际表现不连贯，无法做高速连点或丝滑滑动；且如果 PC 性能波动或传输延迟，整体同步性差。

---

## 方案二：生成统一 Shell 脚本后推送到设备端执行 (中级/推荐方案)

**核心思路**：在 PC 端配置好流程后，在 Tauri 后端将这些动作“编译”成一个 `.sh` (Shell) 脚本文件。先用 `adb push` 将脚本推送到 Android 设备（如 `/data/local/tmp`），然后只调用一次 `adb shell sh /data/local/tmp/macro.sh` 让设备自身执行。

### 具体实现步骤

1. **脚本模板编译器**：根据前端传来的 JSON 配置数据，在 Tauri 侧解析并拼接成标准的 Shell 脚本字符串。例如：
   ```sh
   #!/system/bin/sh
   input tap 100 200
   sleep 1          # 对应等待 1000ms
   input swipe 500 800 500 200 500
   input text "Hello"
   input keyevent 4 # 返回键
   ```
2. **文件传输与执行**：
   - 将拼接好的字符串保存为临时文件。
   - `adb push temp.sh /data/local/tmp/macro.sh`
   - `adb shell chmod +x /data/local/tmp/macro.sh`
   - `adb shell sh /data/local/tmp/macro.sh`

### 优缺点

- **优点**：解决了电脑端“频繁调用 ADB 发送单条指令”带来的严重网络延迟和进程创建开销。执行全部在手机端闭环，速度快、稳定性高，支持高达上百次连续点击。
- **缺点**：`sleep` 命令在部分老旧 Android 系统上的最小精度只能是 1 秒，无法精确控制毫秒级延时。如果有复杂的图像识别需求该方案无法实现；出错中断处理较难。

---

## 方案三：通过 Scrcpy 或 UiAutomator 服务进行坐标录制与下发 (高级/旗舰体验)

**核心思路**：不仅提供手动的“坐标输入”输入框，而且提供一个“录制器”按钮体验。
如果软件之后集成了 Scrcpy 投屏：

1. **可视化屏幕录制器**：
   - 开启“录制模式”后，用户在投屏界面上直接用鼠标点击、滑动手机屏幕。
   - 前端拦截这些鼠标事件，根据相对屏幕分辨率解析出真实的 `(x, y)` 坐标。
   - 自动在侧边栏的时间轴中生成对应的 `TAP(x,y)` 或 `SWIPE(x1,y1, x2,y2)` 动作块。
2. **高速套接字 (Socket) 下发**：
   - 不依靠慢速的 ADB Shell 文本命令，而是利用类似 Scrcpy 或基于 UiAutomator2 运行的一个驻留后台 Server（可以通过 adb forward 建立连接）。
   - 直接通过 TCP 或 WebSocket 将序列化的高精度二进制动作（Touch Down/Move/Up）高速发送到守护进程。

### 优缺点

- **优点**：用户体验拉满，真正像按键精灵一样做到“所点即所得”，不需要猜测坐标点；执行延迟极低。
- **缺点**：开发难度最高。需要集成 Scrcpy 或在 Android 端启动 Java/Rust 守护进程（类似 U2 / Airtest 的底层原理）。

---

## 方案四：复选框导出到 Airtest / Auto.js 等通用脚本引擎 (周边辅助)

**核心思路**：软件自身不重度开发复杂执行引擎，而是成为一个快速的“脚本坐标和逻辑生成器”。
配置完流程后，支持“一键导出”为：

- **Airtest** (Python 语法格式的 `.py` 脚本)
- **Auto.js** (JavaScript 语法格式的 `.js` 脚本)
- **按键精灵手机版脚本**

### 优缺点

- **优点**：规避了复杂的底层实现，能够接驳那些已经极其完善的手机端自动化生态。对于专业自动化测试或挂机玩家非常有用。
- **缺点**：需要用户手机上额外安装第三方执行环境或 App，降低了即插即用性。

---

## 最佳实践建议

为了兼顾开发成本和最终效果，建议可以采用：

**方案一 (界面壳子) + 方案二 (.sh 脚本化) 的组合**：
在前端做一个友好的拖拽可视化配置面板（支持简单的增删改、调序动作），用户点击“运行”时，Tauri 后端静默地将这些动作编译为一个临时 `.sh` 脚本推送到 `/data/local/tmp` 执行。它可以满足 90% 以上像“签到、收菜、跑环”这种不需要高频毫秒级极限操作的轻度挂机需求。
