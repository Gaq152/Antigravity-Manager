# Antigravity Tools 🚀

<div align="center">
  <img src="public/icon.png" alt="Antigravity Logo" width="120" height="120" style="border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.15);">

  <h3>Professional Account Management</h3>
  
  <p>
    <a href="https://github.com/lbjlaq/Antigravity-Manager">
      <img src="https://img.shields.io/badge/Version-2.0.0-blue?style=flat-square" alt="Version">
    </a>
    <img src="https://img.shields.io/badge/Tauri-v2-orange?style=flat-square" alt="Tauri">
    <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square" alt="React">
    <img src="https://img.shields.io/badge/Rust-Enabled-black?style=flat-square" alt="Rust">
  </p>
</div>

---

**Antigravity Tools** 是 [Antigravity Manager](https://github.com/lbjlaq/Antigravity-Manager) 项目的全新 2.0 重构版本。

基于 **Tauri v2** + **React** 构建，旨在提供更轻量、更高性能且安全隐私的现代化账号管理体验。专为管理 Google/Claude 等 AI 服务账号配额而设计，支持多账号无缝切换与状态监控。

> ⚠️ **注意**: 本项目仓库地址保持不变，继续沿用 [lbjlaq/Antigravity-Manager](https://github.com/lbjlaq/Antigravity-Manager)。

## ✨ 功能特性 (Features)

### 📊 仪表盘 (Dashboard)
- **全局概览**: 实时展示账号总数、各模型平均配额，健康度一目了然。
- **智能推荐**: 自动筛选当前配额最充足的 "最佳账号"，支持一键快速切换，始终使用最优资源。
- **状态监控**: 实时高亮显示低配额告警账号，避免开发中断。

### 👥 账号管理 (Account Management)
- **多渠道导入**:
    - 🔥 **OAuth 授权**: 支持拉起浏览器进行 Google 登录授权，自动获取 Token (推荐)。
    - 📋 **手动添加**: 支持直接粘贴 Refresh Token 进行添加。
    - 📂 **V1 迁移**: 支持从 v1 版本 (~/.antigravity-agent) 自动扫描并批量导入旧数据。
    - 🔄 **本地同步**: 支持从 IDE 本地数据库自动读取并导入当前登录账号。
- **批量操作**: 提供批量刷新配额、批量导出备份 (JSON)、批量删除功能。
- **搜索过滤**: 支持按邮箱关键字快速检索，管理数十个账号依然轻松。

### 🔄 配额同步 (Quota Sync)
- **自动刷新**: 可配置后台自动定时轮询所有账号的最新配额信息。
- **Token 保活**: 内置 Token 自动刷新机制，过期自动续期，确保连接时刻有效。
- **精准展示**: 清晰展示 Gemini / Claude 等不同模型的具体剩余百分比和重置时间。

### 🛠️ 系统集成 (System Integration)
- **托盘常驻**: 程序可最小化至系统托盘，不占用任务栏空间，后台静默运行。
- **快捷操作**: 托盘菜单支持一键查看当前账号配额、快速切换下一个可用账号。
- **安全存储**: 全程基于 SQLite 本地加密存储，所有 Token 数据仅保存在用户本地，绝不上传云端。

### ⚙️ 个性化设置 (Settings)
- **国际化**: 原生支持 **简体中文** / **English** 实时切换。
- **主题适配**: 完美适配系统的深色 (Dark Mode) / 浅色模式，夜间使用更护眼。
- **数据管理**: 支持自定义数据导出路径，并提供日志缓存一键清理功能。

## 🛠️ 技术栈

本项目采用前沿的现代技术栈构建，确保了应用的高性能与可维护性：

| 模块 | 技术选型 | 说明 |
| :--- | :--- | :--- |
| **Frontend** | React 18 + TypeScript | UI 构建与逻辑处理 |
| **Styling** | TailwindCSS + DaisyUI | 现代化原子类样式库 |
| **Backend** | Tauri v2 (Rust) | 高性能、安全的系统底层交互 |
| **Database** | SQLite (rusqlite) | 本地数据持久化存储 |
| **State** | Zustand | 轻量级全局状态管理 |
| **Network** | Reqwest (Async) | 异步网络请求处理 |

## 📦 安装与运行

### 前置要求

确保本地已安装：
- [Node.js](https://nodejs.org/) (推荐 v18+)
- [Rust](https://www.rust-lang.org/) (最新稳定版)

### 开发环境启动

```bash
# 1. 克隆项目
git clone https://github.com/lbjlaq/antigravity-tools.git

# 2. 安装前端依赖
npm install

# 3. 启动开发模式 (Frontend + Backend)
npm run tauri dev
```

### 构建发布

```bash
# 构建通用 macOS 应用 (同时支持 Intel & Apple Silicon)
npm run build:universal
```

## 👤 作者

**Ctrler**

- 💬 微信公众号: `Ctrler`
- 🐙 GitHub: [@lbjlaq](https://github.com/lbjlaq)

## 📄 版权说明

Copyright © 2025 Antigravity. All rights reserved.
