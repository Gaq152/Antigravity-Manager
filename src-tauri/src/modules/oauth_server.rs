use std::io::{Read, Write};
use std::net::TcpListener;
use tauri::Url;
use crate::modules::oauth;

/// 启动 OAuth 流程
/// 1. 启动本地服务器监听回调
/// 2. 打开浏览器访问授权页面
/// 3. 等待并捕获 code
/// 4. 交换 token
pub async fn start_oauth_flow(app_handle: tauri::AppHandle) -> Result<oauth::TokenResponse, String> {
    // 1. 获取授权 URL
    let auth_url = oauth::get_auth_url();
    
    // 2. 启动本地监听器
    let listener = TcpListener::bind("127.0.0.1:8888").map_err(|e| format!("无法绑定端口 8888: {}", e))?;
    
    // 3. 打开浏览器 (使用 tauri_plugin_opener)
    use tauri_plugin_opener::OpenerExt;
    app_handle.opener().open_url(auth_url, None::<String>).map_err(|e| format!("无法打开浏览器: {}", e))?;
    
    // 4. 等待回调 (阻塞接受一个连接)
    let (mut stream, _) = listener.accept().map_err(|e| format!("接受连接失败: {}", e))?;
    
    let mut buffer = [0; 1024];
    stream.read(&mut buffer).map_err(|e| format!("读取请求失败: {}", e))?;
    
    let request = String::from_utf8_lossy(&buffer);
    
    // 解析请求行获取 code
    // GET /oauth-callback?code=XXXX HTTP/1.1
    let code = if let Some(line) = request.lines().next() {
        if let Some(path) = line.split_whitespace().nth(1) {
            let url = Url::parse(&format!("http://localhost:8888{}", path))
                .map_err(|e| format!("URL 解析失败: {}", e))?;
            
            let pairs = url.query_pairs();
            let mut code = None;
            for (key, value) in pairs {
                if key == "code" {
                    code = Some(value.into_owned());
                    break;
                }
            }
            code
        } else {
            None
        }
    } else {
        None
    };
    
    let response_html = if code.is_some() {
        "HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\n\r\n
        <html>
        <body style='font-family: sans-serif; text-align: center; padding: 50px;'>
            <h1 style='color: green;'>✅ 授权成功!</h1>
            <p>您可以关闭此窗口返回应用。</p>
            <script>setTimeout(function() { window.close(); }, 2000);</script>
        </body>
        </html>"
    } else {
        "HTTP/1.1 400 Bad Request\r\nContent-Type: text/html\r\n\r\n<h1>❌ 授权失败</h1>"
    };
    
    stream.write(response_html.as_bytes()).unwrap_or(0);
    stream.flush().unwrap_or(());
    
    let code = code.ok_or("未能在回调中获取 Authorization Code")?;
    
    // 5. 交换 Token
    oauth::exchange_code(&code).await
}
