修复USB3端口不识别连接设备批处理 - 由 https://miuiver.com/ 提供

使用方法：
右键以管理员身份运行 add-usb3-fix.bat 文件修复问题
右键以管理员身份运行 delete-usb3-fix.bat 文件移除之前所执行操作（可选）

批处理细节：
涉及注册表路径：计算机\HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\usbflags\18D1D00D0100
所添加注册表记录：osvc、SkipContainerIdQuery、SkipBOSDescriptorQuery

批处理逐行命令解释：
第 1 行：静默关闭命令回显，即不显示命令提示符仅显示运行结果
第 2-4 行：在注册表指定位置添加记录，/v 表示记录名称，/t 表示记录类型，/d 表示记录数据，/f 表示关闭操作提示
第 5 行：暂停批处理运行，并显示“请按任意键继续...”，按下后退出命令行窗口

