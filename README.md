<div align="center">
  <img width="112" height="112" src="./src-tauri/icons/icon.png" alt="RivuMusic">
  <h1>RivuMusic</h1>
  <p>一个以专辑为主体的 AI 音乐推荐与收藏客户端</p>

  <img src="https://img.shields.io/badge/React-19-149ECA" alt="React 19">
  <img src="https://img.shields.io/badge/Tauri-2-24C8DB" alt="Tauri 2">
  <img src="https://img.shields.io/badge/Platform-Windows-0078D4" alt="Windows">
  <img src="https://img.shields.io/badge/License-AGPL--3.0-663399" alt="AGPL-3.0">
</div>

## 项目简介

现在的音乐产品更习惯推荐单曲和歌单，但我更想解决另一个问题：

> 用户喜欢一首歌之后，怎样继续发现一张值得完整听完的专辑？

RivuMusic 在成熟的网易云桌面播放器基础上，增加了专辑优先的推荐流程。系统根据用户收藏的专辑和音乐人生成候选，用规则完成排序，再由 AI 解释推荐原因。

AI 不负责替用户决定听什么，只负责把推荐讲清楚。没有配置模型时，推荐、收藏和播放仍然可以正常使用。

## 核心功能

### 专辑发现

- 未登录时展示公开新碟，保证冷启动也有内容
- 登录后读取收藏专辑和收藏音乐人
- 推荐同音乐人的其他专辑，并排除已经收藏的内容
- 限制同一音乐人在首屏的数量，避免结果过于单一
- 支持“全部 / 为你推荐 / 新碟”筛选

### AI 听前导览

- 解释为什么推荐这张专辑
- 给出适合的场景或情绪
- 建议如何开始完整聆听
- 支持 DeepSeek、通义千问、OpenAI 和本机兼容服务
- 只发送当前专辑和一条推荐线索，不上传完整收藏库

### 播放器能力

- 网易云账号登录、搜索和收藏
- 专辑、歌手和歌单详情
- 在线播放、本地音乐和歌曲下载
- 逐字歌词、翻译与罗马音歌词
- Windows 媒体控制、音频缓存和输出设备选择
- 从专辑详情跳转到网易云音乐

## 推荐流程

```text
收藏专辑 / 收藏音乐人
          ↓
获取同音乐人的其他专辑
          ↓
混入公开新碟
          ↓
排除已收藏、去重、评分和多样性控制
          ↓
展示推荐理由
          ↓
按需调用 AI 生成听前导览
```

推荐逻辑是确定性的，AI 只是最后一层解释。这让结果更容易调试，也避免整个功能依赖模型接口。

## 技术实现

- React 19 + TypeScript：页面和业务交互
- Tauri 2 + Rust：桌面能力、音频引擎和 AI 请求代理
- Zustand：用户、播放器和设置状态
- SWR：推荐数据缓存和刷新
- Tailwind CSS 4 + shadcn/ui：界面和基础组件
- 网易云音乐增强 API：账号、收藏、专辑和播放数据
- OpenAI Compatible API：按需生成专辑听前导览

项目没有重新实现播放器内核。新增功能通过原有 service、store 和 player API 接入，主要代码集中在：

```text
src/pages/recommend/AlbumDiscoveryPage.tsx
src/lib/services/albumDiscovery.ts
src/components/album/album-recommendation-card.tsx
src/components/album/album-ai-guide-dialog.tsx
src/lib/services/albumAi.ts
src-tauri/src/ai.rs
```

## 快速开始

### 环境要求

- Windows 10 / 11
- Node.js 22.13 以上，推荐 24
- pnpm 11
- Rust stable
- C++ Build Tools
- Edge WebView2

### 安装运行

```bash
git clone https://github.com/itoyohane/RivuMusic.git
cd RivuMusic
pnpm install
pnpm tdev
```

进入侧栏的“专辑发现”即可查看推荐。

### 配置 AI

AI 是可选功能。

1. 打开“设置 → AI 推荐”。
2. 填写兼容接口地址、模型名称和 API Key。
3. 回到“专辑发现”，点击专辑卡片上的闪光图标。

默认配置使用 DeepSeek：

```text
Base URL: https://api.deepseek.com/v1
Model: deepseek-chat
```

API Key 只保存在本机，不会写入仓库。生产环境仍应改用系统凭据存储。

### 构建检查

```bash
pnpm build
cargo check --manifest-path src-tauri/Cargo.toml
```

完整桌面构建：

```bash
pnpm tbuild
```

## Demo 演示顺序

1. 未登录进入“专辑发现”，展示公开新碟。
2. 登录网易云账号，展示基于收藏生成的个性化推荐。
3. 筛选推荐来源，收藏或直接播放一张专辑。
4. 生成 AI 听前导览。
5. 进入专辑详情，并跳转到网易云音乐。

这条流程控制在三分钟内，就能完整说明产品问题、推荐逻辑、AI 边界和工程实现。

## 项目文档

- [原项目学习文档](./docs/ORIGINAL_PROJECT_STUDY.md)
- [改造后学习文档](./docs/ALBUM_AI_DEMO_STUDY.md)
- [一个月 Demo 计划](./one_month_demo_plan.md)
- [早期产品思路](./idea.md)

## 当前限制

- 喜欢歌曲暂时没有聚合为专辑偏好
- 推荐主要依赖同音乐人作品，尚未加入跨音乐人的风格相似度
- 没有“不感兴趣”等负反馈
- AI Key 当前保存在 WebView localStorage
- 项目暂时以 Windows 桌面端为主要运行环境

## 项目来源

本项目基于 [Yee Music](https://github.com/1sen3/YeeMusic) 继续开发，保留原项目的播放器能力、版权声明和开源许可。

感谢以下项目：

- [Tauri](https://github.com/tauri-apps/tauri)
- [NeteaseCloudMusicAPI Enhanced](https://github.com/neteasecloudmusicapienhanced/api-enhanced)
- [Howler.js](https://github.com/goldfire/howler.js)
- [Zustand](https://github.com/pmndrs/zustand)
- [AMLL](https://github.com/amll-dev/applemusic-like-lyrics)

## 声明与许可

本项目仅用于学习和技术交流。音乐数据及相关内容来自第三方服务，版权归原权利人所有，请勿用于违法或侵权用途。

项目遵循 [GNU Affero General Public License v3.0](./LICENSE)。修改或分发衍生版本时，需要保留版权声明并按相同协议公开源代码。
