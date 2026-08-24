# WHAT 100 PEOPLE DO TO A GAME

“WHAT 100 PEOPLE DO TO A GAME / 一百个人怎么做游戏”项目网站与创作者协作区的完整源码。

## 技术架构

- React 19 + TypeScript
- Vinext + Vite 8
- Cloudflare Workers
- Cloudflare D1（结构化数据）
- Cloudflare R2（上传文件）
- Drizzle ORM / SQL migrations

Node.js 版本要求：`>=22.13.0`。项目使用 `pnpm`，锁定文件为 `pnpm-lock.yaml`。

## 本地安装与检查

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm test
pnpm dev
```

`pnpm test` 会执行静态检查、生产构建与项目测试。开发服务启动后按终端显示的本地地址访问。

导出前验证结果：锁定依赖可安装，生产构建与 48 项项目测试通过，生产服务可启动并返回首页。`pnpm lint` 仍会报告项目原有的 ESLint 规则问题（主要是 React effect 写法、内部导航 `<a>`、控制字符正则和少量未使用变量）；这些问题不会阻止本次构建或运行，但外部程序员若把 lint 设为部署门禁，应先逐项整理。导出过程没有为隐藏这些结果而关闭规则。

## 环境变量

复制 `.env.example` 为本地私密配置文件，并替换其中的占位值。不要提交真实邀请码、会话密钥、API Key 或 Token。

- `LEAD_ACCESS_CODE`：主策划验证码
- `LEAD_SESSION_SECRET`：服务端会话签名密钥，至少 32 个随机字节
- `OWNER_USER_ID`：被授权查看主策划数据的站点用户标识；迁移到非 Sites 环境时应改接目标服务器的认证系统

Cloudflare 本地开发建议使用 `.dev.vars`，线上使用平台 Secrets。

## 数据库与存储

- D1 binding：`DB`
- R2 binding：`UPLOADS`
- 数据结构：`db/schema.ts`
- 数据迁移：`drizzle/`
- Drizzle 配置：`drizzle.config.ts`

创作者名单、问卷回答、任务提交、访问统计和贡献分记录均为服务端数据。贡献分由已完成任务自动累计，主策划也可以在私密界面手动增减。普通参与者不能读取主策划统计、完整问卷回答或贡献排行榜。

## 部署

### 部署到 Cloudflare

这是当前架构迁移成本最低的方式：

1. 创建 Workers 项目。
2. 创建并绑定一个 D1 数据库为 `DB`。
3. 创建并绑定一个 R2 bucket 为 `UPLOADS`。
4. 执行 `drizzle/` 中的迁移。
5. 设置 `.env.example` 中列出的线上 Secrets。
6. 通过授权管理流程创建新的参与者邀请码；源码包不会分发线上或历史邀请码。
7. 构建并部署 Worker。

### 不能直接脱离 ChatGPT Sites 的部分

本源码可以交给外部程序员继续部署，但以下能力当前依赖 ChatGPT Sites / Cloudflare 运行环境，不能把 ZIP 直接放到普通静态空间后原样工作：

1. `cloudflare:workers` 运行时与 Worker bindings。
2. D1 数据库读写。
3. R2 文件上传与读取。
4. `oai-authenticated-user-id` 请求头所提供的站点所有者身份。迁移到普通服务器时必须替换成可靠的登录与授权系统。
5. `.openai/hosting.json` 中的 Sites 项目绑定。
6. `worker/index.ts` 使用的 `ASSETS` / `IMAGES` 平台绑定。

源码没有为这些依赖伪造客户端替代功能。若部署到普通 Node.js/VPS，外部程序员需要为数据库、对象存储、认证和静态资源绑定编写适配层；若继续部署到 Cloudflare Workers，则改动最少。

## 上线前检查

- 更换所有共享邀请码和主策划密钥。
- 确认普通邀请码不会取得主策划权限。
- 确认主策划页面、问卷完整回答、贡献排行和访问量只对授权身份开放。
- 为 D1 和 R2 配置备份与保留策略。
- 检查上传大小、文件类型、访问日志和速率限制。
- 在桌面与手机宽度分别验证首页、理念、问卷、协作区和主策划界面。

## 源码包范围

源码包包含前端、服务端 routes、Worker、Assets、依赖配置、数据库 Schema / Migration、`.env.example` 和本说明。线上 D1 中的真实问卷/用户数据及 R2 中的真实上传文件属于持久化运行数据，不属于源码，不会写入导出包。

© 2026 HuieChen. All rights reserved.
