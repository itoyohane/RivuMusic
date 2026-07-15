# RivuMusic 原项目学习文档

## 1. 项目是什么

RivuMusic 当前代码来自 Yee Music，是一个面向 Windows 的第三方网易云音乐桌面客户端。它并不是普通网页播放器，而是由 React 前端、Tauri 桌面容器和 Rust 音频模块共同组成的完整客户端。

原项目已经具备登录、搜索、歌单、专辑、歌手、收藏、在线播放、本地音乐、下载、逐字歌词和系统媒体控制等能力。对本次实习 Demo 最有价值的基础，是它已经打通了“外部音乐 API -> React 页面 -> 播放器状态 -> Tauri 音频引擎”这条链路。

## 2. 技术栈

- React 19 + TypeScript：页面和交互。
- React Router：主页、搜索、专辑详情、歌手详情等路由。
- Zustand：用户、播放器、设置和本地音乐状态。
- SWR：主页和最近播放等远程数据缓存。
- Tailwind CSS 4 + shadcn/ui：样式和基础组件。
- Tauri 2 + Rust：桌面窗口、音频播放、下载、缓存和系统媒体控制。
- 网易云音乐增强 API：账号、搜索、推荐、专辑及播放地址等外部数据。

## 3. 启动与构建

环境要求是 Node.js 20 以上、pnpm、Rust、Windows C++ 构建工具和 WebView2。

```bash
pnpm install
pnpm tdev
```

只调试 React 页面时可以运行 `pnpm dev`，完整桌面功能需要运行 `pnpm tdev`。生产构建使用 `pnpm tbuild`。

## 4. 目录怎么读

```text
src/
  App.tsx                 路由入口
  layouts/RootLayout.tsx  全局布局，组合标题栏、侧栏、页面和播放器
  pages/                  页面级组件
  components/             可复用 UI 与业务组件
  lib/api.ts              外部 API 请求封装和登录 Cookie 注入
  lib/services/           按专辑、歌手、歌曲、用户等领域封装接口
  lib/store/              Zustand 状态与持久化
  lib/types/              API 数据类型
src-tauri/
  src/audio/              Rust 音频管线与播放控制
  src/download.rs         下载能力
  src/cache.rs            缓存能力
  tauri.conf.json         桌面窗口、打包和更新配置
```

建议先读 `src/App.tsx` 和 `src/layouts/RootLayout.tsx`，理解页面骨架；再读 `src/lib/api.ts`、`src/lib/services/album.ts` 和 `src/lib/store/userStore/userStore.ts`，理解数据如何进入页面；最后再看播放器 store 与 Rust 音频目录。

## 5. 三条核心数据流

### 专辑详情

用户进入 `/detail/album?id=...` 后，`AlbumDetailPage` 调用 `getAlbum`，服务层请求 `/album`，随后页面展示封面、歌手、歌曲和收藏状态。播放按钮把专辑 ID 交给 player store，由播放器层生成播放队列。

### 登录与收藏

`AuthConfig` 在应用启动时恢复 Cookie 和用户信息，并请求喜欢歌曲、收藏歌手、收藏专辑及歌单。结果进入 `userStore`，其中数组负责渲染，`Set` 负责快速判断是否收藏。专辑详情页采用乐观更新：先更新本地状态，再请求外部 API，失败时回滚。

### 播放

React 组件只发出播放、暂停、切歌等意图。player store 维护队列和当前歌曲，Tauri/Rust 负责音频流、设备、缓存及系统媒体中心同步。这种分层让推荐功能可以只生产“要听哪张专辑”，无需改动底层音频引擎。

## 6. 原项目值得学习的设计

- 服务层按领域拆分，页面不直接拼 API URL。
- 用户收藏同时保存数组和 `Set`，兼顾展示与查询效率。
- React 页面与 Rust 播放能力分离，业务功能不会侵入音频管线。
- 复杂播放状态拆成多个 Zustand slice，避免单文件继续膨胀。
- Tauri 负责桌面能力，React 仍可单独在浏览器中调试大部分页面。

## 7. 当前限制

- API 基地址写死在前端，部署切换不够灵活。
- 推荐仍以每日歌曲、私人 FM 和首页歌单为主，没有“专辑优先”的独立入口。
- 喜欢歌曲虽然保存了 ID，但没有直接聚合为用户的专辑偏好。
- README 中的仓库链接和产品名仍保留上游 Yee Music 信息。
- 项目缺少覆盖核心业务服务的自动化测试。

这些限制正好构成本次改造的切入点：保留成熟播放器，新增专辑推荐领域层、独立页面、AI 推荐解释和可学习的文档，而不重写已有播放能力。
