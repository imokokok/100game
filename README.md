# WHAT 100 PEOPLE DO TO A GAME

“WHAT 100 PEOPLE DO TO A GAME / 一百个人怎么做游戏”项目网站与创作者协作区的完整源码。

## 技术架构

- Next.js 16（App Router）
- React 19 + TypeScript
- Supabase Postgres（结构化数据）
- Vercel Blob（私密文件存储）
- Vercel（Node.js 服务端与前端部署）

Node.js 版本要求为 `>=22.13.0`。项目使用 `pnpm`，依赖版本记录在 `pnpm-lock.yaml`。

## 本地安装与检查

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm run build
pnpm run dev
```

生产模式可运行：

```bash
pnpm run build
pnpm run start
```

## 环境变量

复制 `.env.example` 为 `.env.local`，只在本地或部署平台的私密环境变量中填写真实值：

- `DATABASE_URL`：Supabase Postgres 连接串；Serverless 部署建议使用 pooler 地址。
- `BLOB_READ_WRITE_TOKEN`：Vercel Blob 私密读写 Token。
- `LEAD_ACCESS_CODE`：主策划验证码。
- `LEAD_SESSION_SECRET`：主策划会话签名密钥，至少 32 个随机字节。

不要把真实邀请码、数据库密码、API Key、Token 或会话密钥提交到 Git。

## 数据库与存储

1. 在 Supabase SQL Editor 中执行 `supabase/schema.sql`。
2. 将 Supabase pooler 连接串写入部署平台的 `DATABASE_URL`。
3. 在 Vercel 项目中创建或连接 Blob Store，让平台注入 `BLOB_READ_WRITE_TOKEN`。

创作者名单、问卷回答、任务提交、访问统计和贡献分均保存在 Postgres。上传文件保存为 private Blob，并通过带权限检查的应用路由读取；普通参与者不能直接访问其他人的文件、完整问卷回答或主策划统计。

主策划权限只通过姓名 `Hera` 与主策划验证码建立的服务端签名会话授予。会话使用 `HttpOnly`、`Secure` Cookie；客户端请求头、查询参数和前端可读存储不能授予主策划权限。主策划登录还使用 Postgres 持久化限流，跨 Serverless 实例生效。

## 部署到 Vercel

1. 将仓库导入 Vercel。
2. 配置上述四项环境变量。
3. 在 Supabase 执行 `supabase/schema.sql`。
4. 连接 Vercel Blob Store。
5. 使用默认 Next.js 构建设置部署。
6. 在 Vercel Domains 中绑定自有域名并按提示配置 DNS。

部署后检查：

- 首页片头视频可播放、可跳过，刷新和浏览器返回会重新播放。
- `/?access=invite` 直接进入邀请码表单，不加载片头。
- 普通邀请码只能取得参与者权限；`Hera` 与主策划验证码才可取得主策划权限。
- 问卷回答、访问量、贡献排行和全部文件只对主策划开放。
- 上传、下载、CSV 导出、任务保存和问卷提交均写入持久化服务。
- 手机与桌面均无横向溢出，交互控件可点击。

## 可迁移性

该仓库不依赖专有页面托管运行时。若迁移到普通 Node.js 服务器，可以继续使用 Supabase Postgres 与 Vercel Blob；若更换数据库或对象存储，需要替换 `db/index.ts` 与 `app/api/_shared.ts` 中对应的适配层。静态空间无法独立运行本项目的服务端认证、数据库和文件上传功能。

© 2026 HuieChen. All rights reserved.
