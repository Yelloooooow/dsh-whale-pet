# dsh-whale-pet 🐋

DeepSeek Harness 鲸鱼娘余额桌宠 —— 作为固定插件常驻在 dsh Web GUI 右下角:一只鲸鱼娘,头顶气泡实时显示 DeepSeek 剩余余额。

## 功能

- **右下角常驻鲸鱼娘 + 余额气泡**:余额每 60 秒自动刷新,点击鲸鱼娘可手动刷新
- **双击打开用量页**:双击鲸鱼娘在新标签页打开 [DeepSeek 用量页](https://platform.deepseek.com/usage)
- **可拖动 + 位置记忆**:按住鲸鱼娘即可拖动摆放;位置自动记忆在浏览器 `localStorage`,下次打开自动还原(若移出视口则回到右下角默认位置)
- **密钥安全**:余额查询走 Host 端路由,API Key 只存在于 Harness 凭据服务,浏览器不接触任何密钥

## 效果预览

```
┌────────────────────────┐
│  DeepSeek 余额          │
│      ¥51.01            │
│      余额可用            │
│        ▾               │
│       🐋 ← 拖动 / 单击刷新 / 双击用量页
└────────────────────────┘
```

## 目录结构

```
dsh-whale-pet/
├── plugin/                  # 插件源码(安装到 profile 的源)
│   ├── index.js             # Host 端:/__whale-pet/balance 余额、/__whale-pet/image 形象图
│   ├── client.js            # 浏览器端:桌宠 UI(bundle 无需构建)
│   ├── cordis.patch.yml     # bundle 补丁层(插入插件行)
│   └── package.json         # 包声明(dsh.bundle.patch + dsh.client.platform)
├── assets/                  # 素材库(形象原图、预览图、素材清单)
├── whale_pet.png            # 当前使用的鲸鱼娘形象
├── whale_pet_b64.txt        # 形象图 base64(Host 端从这里读取)
└── 启动说明.md               # 原始安装笔记(中文)
```

## 安装

本插件是 dsh 的 **out-of-tree bundle**,注册进 web profile:

1. 安装插件包到 profile(以下任一):
   - 把 `plugin/` 四个文件放入 `C:\Users\<you>\.dsh\profiles\web\node_modules\dsh-whale-pet\`
   - 或在 profile 目录执行 `pnpm add file:<此仓库路径>` / 用 `dsh plugin --profile web add <此仓库路径>`
2. 确认 profile 的 `package.json` 中 `dsh.profile.bundles` 含 `"dsh-whale-pet"`(在 `@deepseek-ai/dsh-web-app` 之后)
3. 重启 Harness

启动后浏览器刷新页面,右下角即出现鲸鱼娘。

### 依赖的服务

插件使用 dsh web 组合自带的能力:Host 端需要 `webServer`、`credentials`(解析 `DEEPSEEK_API_KEY`)、`subprocess`;浏览器端需要 `slots` 服务(挂到 `shell.overlay` 槽)。均无需额外安装。

## 数据接口(Host 端 webServer 路由)

- `GET /__whale-pet/balance` — DeepSeek 余额(凭据服务解析 API Key,curl → node fetch 双通道,保证可用性)
- `GET /__whale-pet/image` — 鲸鱼娘形象图 data URI

## 自定义形象

1. 替换 `whale_pet.png`
2. 重新生成 base64 到 `whale_pet_b64.txt`:
   - PowerShell:`[Convert]::ToBase64String([IO.File]::ReadAllBytes("$PWD\whale_pet.png")) > whale_pet_b64.txt`
   - Git Bash:`base64 -w0 whale_pet.png > whale_pet_b64.txt`
3. 修改 `plugin/index.js` 顶部的 `IMAGE_B64_FILE`(默认硬编码为本机绝对路径 `G:\WorkSpace\DSH\dsh-whale-pet\whale_pet_b64.txt`,**换机器请改成你自己的路径**)
4. 同步 `plugin/` 到 profile 并重启 Harness

## 许可与署名

- **代码**:MIT License,见 [LICENSE](LICENSE)
- **形象素材**:基于 [fornarwhal/deepseek-whale-girl-icon](https://github.com/fornarwhal/deepseek-whale-girl-icon)(CC BY-NC-SA 4.0)的二创作品,按 **CC BY-NC-SA 4.0** 分发
  - 角色原型:上善无形 OC「溟月」
  - DeepSeek 元素二创:ZipZipPipe(GPT Image 2)
  - 许可证全文:https://creativecommons.org/licenses/by-nc-sa/4.0/
