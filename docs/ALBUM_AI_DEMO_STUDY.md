# RivuMusic 专辑 AI Demo 学习文档

## 1. 改造后的项目定位

这个版本不是重新开发一个播放器，而是在 RivuMusic 已有桌面播放器之上增加一条新的产品主线：

> 根据用户收藏的专辑和音乐人，推荐值得完整聆听的专辑，并用 AI 生成克制、可解释的听前导览。

原项目负责登录、搜索、收藏、专辑详情和播放，本次改造负责候选生成、专辑排序、解释展示和 AI 调用。这样既保留成熟项目的工程深度，也能在实习 Demo 中清楚展示自己的产品和技术贡献。

## 2. 为什么调整原计划

最初计划考虑 Next.js、Spotify、Last.fm 和 Supabase，但实际选定的 RivuMusic 已经是 React + Tauri 客户端，并完整接入网易云音乐增强 API。如果强行替换技术栈，会花大量时间重做登录、收藏、详情和播放，反而看不到专辑推荐本身。

因此落地时做了三项调整：

- 主音乐数据源改为项目现有的网易云音乐 API。
- 保留内置播放，同时补充“在网易云音乐中打开”的外部入口。
- 不新增云数据库，直接复用用户真实的收藏专辑和收藏歌手作为偏好种子。

AI 的定位没有变化：规则负责推荐，模型负责解释。即使没有 API Key，真实专辑推荐仍然可以使用。

## 3. 最终用户流程

1. 用户打开侧栏中的“专辑发现”。
2. 未登录时，页面请求公开新碟，保证 Demo 有内容可看。
3. 登录后，应用读取收藏专辑和收藏歌手。
4. 推荐服务查找这些音乐人的其他专辑，并混入新发行专辑。
5. 页面去重、排除已收藏专辑、限制同一音乐人占比并按相关性排序。
6. 用户可以查看详情、播放、收藏，或点击闪光图标生成 AI 听前导览。
7. 专辑详情页可以跳转到网易云音乐网页继续查看或播放。

## 4. 推荐系统怎么工作

核心实现位于 `src/lib/services/albumDiscovery.ts`。

候选有三个来源：

- 收藏专辑的同音乐人作品，基础分最高。
- 收藏音乐人的其他专辑，基础分次之。
- 全站公开新碟，作为冷启动和探索内容。

每个候选都被转换成 `AlbumRecommendation`，包含专辑、来源、规则解释、偏好种子和分数。相同专辑来自多个来源时保留得分更高的版本；已收藏专辑会被排除；最终列表限制同一音乐人在首屏最多出现两次，再用其他候选补齐。

这不是机器学习推荐，但它有三个适合面试讲述的优点：结果稳定、推荐原因可追踪、没有 AI 时仍能工作。后续如果要升级，可以增加喜欢歌曲到专辑的聚合、风格标签、最近播放衰减和用户反馈权重。

## 5. AI 调用链

AI 相关文件分为三层：

```text
AlbumAiSettingCard.tsx       保存接口地址、模型和 API Key
albumAi.ts                   构造最小提示词并调用 Tauri 命令
src-tauri/src/ai.rs          通过 Rust 请求 OpenAI 兼容接口
album-ai-guide-dialog.tsx    展示未配置、生成中、结果和错误状态
```

模型只接收当前专辑名、音乐人、发行年份、推荐原因和一个偏好种子，不接收完整收藏库。请求必须使用 HTTPS，本机模型可以使用 localhost HTTP。Rust 层设置 45 秒超时，并处理非 2xx 响应、非法 JSON 和空内容。

默认配置是 DeepSeek 的 OpenAI 兼容地址和 `deepseek-chat`，也可以改成通义千问、OpenAI 或本机兼容服务。API Key 保存在本机 WebView 的 localStorage，不会写入仓库；它适合 Demo，但如果走向生产，应迁移到系统凭据存储。

## 6. 页面与状态设计

`AlbumDiscoveryPage` 使用 SWR 缓存推荐结果，收藏种子变化后会得到新的缓存键。页面包含加载、错误、空状态，以及“全部 / 为你推荐 / 新碟”分段筛选。刷新按钮会重新请求推荐数据。

`AlbumRecommendationCard` 复用原项目的 player store 和 user store：播放仍走原音频管线，收藏仍采用原项目的乐观更新和失败回滚。新代码没有复制播放器或登录逻辑，只依赖稳定的业务接口。

## 7. 关键文件索引

- `src/pages/recommend/AlbumDiscoveryPage.tsx`：专辑发现页面。
- `src/components/album/album-recommendation-card.tsx`：推荐卡片与操作。
- `src/lib/services/albumDiscovery.ts`：候选获取、评分、去重和多样性。
- `src/lib/types/albumRecommendation.ts`：推荐领域模型。
- `src/components/album/album-ai-guide-dialog.tsx`：AI 导览交互。
- `src/components/settings/AiSettings/AlbumAiSettingCard.tsx`：AI 配置。
- `src/lib/services/albumAi.ts`：配置持久化和提示词。
- `src-tauri/src/ai.rs`：OpenAI 兼容请求代理。
- `src/pages/detail/AlbumDetailPage.tsx`：外部网易云入口。

## 8. 如何运行

需要 Node.js 20 以上、pnpm、Rust stable、Windows C++ 构建工具和 WebView2。

```bash
git clone https://github.com/itoyohane/RivuMusic.git
cd RivuMusic
git switch codex/album-ai-demo
pnpm install
pnpm tdev
```

进入“专辑发现”即可查看公开新碟。登录网易云账号后会生成个性化候选。要使用 AI，在“设置 -> AI 推荐”中填写接口地址、模型和 API Key，然后回到推荐卡片点击闪光图标。

前端生产构建：

```bash
pnpm build
```

桌面端检查：

```bash
cargo check --manifest-path src-tauri/Cargo.toml
```

## 9. 怎么在面试中讲

可以把项目拆成四个问题回答：

- 为什么做：多数音乐推荐以单曲和歌单为中心，我希望把专辑重新变成推荐主体。
- 为什么这样设计：已有播放器能力成熟，因此把时间投入推荐闭环，而不是重造播放内核。
- 推荐如何实现：规则生成候选并排序，AI 只解释，系统没有模型也能正常工作。
- 工程亮点：复用领域服务与 Zustand 状态；用 SWR 管理远程数据；通过 Tauri Rust 层规避 CORS；限制 AI 数据范围并提供完整错误状态。

演示时建议按“公开冷启动 -> 登录后的个性化 -> 收藏/播放 -> AI 导览 -> 外部打开”顺序走一遍，控制在三分钟内。

## 10. 已知限制与下一步

- 喜欢歌曲目前只有 ID，没有批量取回并聚合为专辑偏好。
- 推荐依赖同音乐人作品，尚未加入跨音乐人的风格相似度。
- API Key 采用本机 localStorage，生产环境应使用系统安全存储。
- 推荐结果没有收集“不感兴趣”等负反馈。
- 原项目的大体积前端包和部分旧 lint 告警尚未在本次范围内处理。

最值得继续做的一项是“喜欢歌曲 -> 专辑偏好画像”：批量获取喜欢歌曲详情，按专辑聚合权重，再结合音乐人和最近播放生成更丰富的候选。它能让产品差异化更完整，也适合作为下一轮面试迭代。

## 11. 版本记录

- `ade3fc5`：规划文档与原项目学习文档。
- `7d06364`：专辑发现、规则推荐、筛选、播放和收藏。
- `d953eac`：AI 专辑导览、AI 设置和外部网易云入口。
