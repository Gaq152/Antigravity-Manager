use sysinfo::System;
use std::process::Command;
use std::thread;
use std::time::Duration;

/// 检查 Antigravity 是否在运行
pub fn is_antigravity_running() -> bool {
    let mut system = System::new();
    system.refresh_processes(sysinfo::ProcessesToUpdate::All);

    let current_pid = std::process::id();

    for (pid, process) in system.processes() {
        if pid.as_u32() == current_pid {
            continue;
        }

        #[allow(unused_variables)]
        let name = process.name().to_string_lossy().to_lowercase();
        let exe_path = process.exe()
            .and_then(|p| p.to_str())
            .unwrap_or("")
            .to_lowercase();

        #[cfg(target_os = "macos")]
        {
            if exe_path.contains("antigravity.app") {
                return true;
            }
        }

        #[cfg(target_os = "windows")]
        {
            // 严格匹配进程名，避免 false positive (如 esbuild.exe 在 antigravity 目录下)
            if name == "antigravity.exe" {
                 crate::modules::logger::log_info(&format!("检测到 Antigravity 进程: {} (PID: {}) Path: {}", name, pid, exe_path));
                 return true;
            }
        }

        #[cfg(target_os = "linux")]
        {
            if name == "antigravity" || exe_path.contains("antigravity") {
                return true;
            }
        }
    }

    false
}

/// 关闭 Antigravity 进程
pub fn close_antigravity(timeout_secs: u64) -> Result<(), String> {
    crate::modules::logger::log_info("正在关闭 Antigravity...");

    #[cfg(target_os = "windows")]
    {
        // Windows: 直接执行静默强杀 (Quiet Force Kill)
        // 模拟 cursor-free-vip 的逻辑：不尝试优雅关闭，直接使用 /F /IM 原子性强杀
        // 这被证明是处理 Antigravity 及其子进程最快且最干净的方式，避免了死锁和弹窗
        let _ = Command::new("taskkill")
            .args(["/F", "/IM", "Antigravity.exe"])
            .output();
            
        // 给一点点时间让系统清理 PID
        thread::sleep(Duration::from_millis(200));
    }

    #[cfg(target_os = "macos")]
    {
        // macOS: 尝试 Applescript 优雅关闭
        let _ = Command::new("osascript")
            .args(["-e", "tell application \"Antigravity\" to quit"])
            .output();
    }
    
    // 统一等待确认逻辑
    let start = std::time::Instant::now();
    while start.elapsed() < Duration::from_secs(timeout_secs) {
        if !is_antigravity_running() {
            crate::modules::logger::log_info("Antigravity 已关闭");
            return Ok(());
        }
        thread::sleep(Duration::from_millis(500));
    }

    // 超时后的清理 (对 Windows 来说通常不会走到这里，除非权限不足)
    if is_antigravity_running() {
        crate::modules::logger::log_warn("关闭超时，正在尝试强制清理...");
        
        #[cfg(target_os = "macos")]
        {
            let _ = Command::new("pkill")
                .args(["-9", "Antigravity"])
                .output();
        }

        #[cfg(target_os = "windows")]
        {
            // Windows: 再试一次强杀
            let _ = Command::new("taskkill")
                .args(["/F", "/IM", "Antigravity.exe"])
                .output();
        }

        #[cfg(target_os = "linux")]
        {
            let _ = Command::new("pkill")
                .args(["-9", "antigravity"])
                .output();
        }
        
        thread::sleep(Duration::from_secs(1));

        if is_antigravity_running() {
             return Err("无法关闭 Antigravity 进程".to_string());
        }
    }

    crate::modules::logger::log_info("Antigravity 已关闭");
    Ok(())
}

/// 启动 Antigravity
pub fn start_antigravity() -> Result<(), String> {
    crate::modules::logger::log_info("正在启动 Antigravity...");

    #[cfg(target_os = "macos")]
    {
        // 改进：使用 output() 等待 open 命令完成，以捕获"应用未找到"错误
        let output = Command::new("open")
            .args(["-a", "Antigravity"])
            .output()
            .map_err(|e| format!("无法执行 open 命令: {}", e))?;
            
        if !output.status.success() {
            let error = String::from_utf8_lossy(&output.stderr);
            return Err(format!("启动失败 (open exited with {}): {}", output.status, error));
        }
    }

    #[cfg(target_os = "windows")]
    {
        // 尝试通过注册表或默认路径启动
        let result = Command::new("cmd")
            .args(["/C", "start", "antigravity://"])
            .spawn();
        
        if result.is_err() {
            return Err("启动失败，请手动打开 Antigravity".to_string());
        }
    }

    #[cfg(target_os = "linux")]
    {
        Command::new("antigravity")
            .spawn()
            .map_err(|e| format!("启动失败: {}", e))?;
    }

    crate::modules::logger::log_info("Antigravity 启动命令已发送");
    Ok(())
}

/// 获取 Antigravity 可执行文件路径（跨平台）
/// 
/// 查找策略（优先级从高到低）：
/// 1. 从运行中的进程获取路径（最可靠，支持任意安装位置）
/// 2. 遍历标准安装位置
/// 3. 返回 None
pub fn get_antigravity_executable_path() -> Option<std::path::PathBuf> {
    // 策略1: 从运行进程获取（支持任意位置）
    if let Some(path) = get_path_from_running_process() {
        return Some(path);
    }
    
    // 策略2: 检查标准安装位置
    check_standard_locations()
}

/// 从运行中的进程获取 Antigravity 可执行文件路径
/// 
/// 这是最可靠的方法，可以找到任意位置的安装
fn get_path_from_running_process() -> Option<std::path::PathBuf> {
    let mut system = System::new_all();
    system.refresh_all();
    
    for process in system.processes().values() {
        #[allow(unused_variables)]
        let name = process.name().to_string_lossy().to_lowercase();
        
        // 获取可执行文件路径
        if let Some(exe) = process.exe() {
            let exe_path = exe.to_str().unwrap_or("").to_lowercase();
            
            #[cfg(target_os = "macos")]
            {
                // macOS: 检查 Antigravity.app
                if exe_path.contains("antigravity.app") {
                    return Some(exe.to_path_buf());
                }
            }
            
            #[cfg(target_os = "windows")]
            {
                // Windows: 严格匹配进程名
                if name == "antigravity.exe" {
                    return Some(exe.to_path_buf());
                }
            }
            
            #[cfg(target_os = "linux")]
            {
                // Linux: 检查进程名或路径包含 antigravity
                if name.contains("antigravity") || exe_path.contains("antigravity") {
                    return Some(exe.to_path_buf());
                }
            }
        }
    }
    None
}

/// 检查标准安装位置
fn check_standard_locations() -> Option<std::path::PathBuf> {
    #[cfg(target_os = "macos")]
    {
        let path = std::path::PathBuf::from("/Applications/Antigravity.app");
        if path.exists() {
            return Some(path);
        }
    }
    
    #[cfg(target_os = "windows")]
    {
        use std::env;
        
        // 获取环境变量
        let local_appdata = env::var("LOCALAPPDATA").ok();
        let program_files = env::var("ProgramFiles")
            .unwrap_or_else(|_| "C:\\Program Files".to_string());
        let program_files_x86 = env::var("ProgramFiles(x86)")
            .unwrap_or_else(|_| "C:\\Program Files (x86)".to_string());
        
        let mut possible_paths = Vec::new();
        
        // 用户安装位置（优先）
        if let Some(local) = local_appdata {
            possible_paths.push(
                std::path::PathBuf::from(&local)
                    .join("Programs")
                    .join("Antigravity")
                    .join("Antigravity.exe")
            );
        }
        
        // 系统安装位置
        possible_paths.push(
            std::path::PathBuf::from(&program_files)
                .join("Antigravity")
                .join("Antigravity.exe")
        );
        
        // 32位兼容位置
        possible_paths.push(
            std::path::PathBuf::from(&program_files_x86)
                .join("Antigravity")
                .join("Antigravity.exe")
        );
        
        // 返回第一个存在的路径
        for path in possible_paths {
            if path.exists() {
                return Some(path);
            }
        }
    }
    
    #[cfg(target_os = "linux")]
    {
        let possible_paths = vec![
            std::path::PathBuf::from("/usr/bin/antigravity"),
            std::path::PathBuf::from("/opt/Antigravity/antigravity"),
            std::path::PathBuf::from("/usr/share/antigravity/antigravity"),
        ];
        
        // 用户本地安装
        if let Some(home) = dirs::home_dir() {
            let user_local = home.join(".local/bin/antigravity");
            if user_local.exists() {
                return Some(user_local);
            }
        }
        
        for path in possible_paths {
            if path.exists() {
                return Some(path);
            }
        }
    }
    
    None
}
