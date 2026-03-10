# 我的 Hexo 博客

基于 [Hexo](https://hexo.io/) + [AnZhiYu 主题](https://github.com/anzhiyu-c/hexo-theme-anzhiyu) 搭建的个人博客。

---

## 📦 环境要求

- [Node.js](https://nodejs.org/) 16 及以上版本
- [Git](https://git-scm.com/)

---

## 🚀 本地运行

### 第一步：克隆仓库

```bash
git clone https://github.com/1217265165/1217265165.github.io.git
cd 1217265165.github.io
```

### 第二步：安装依赖

```bash
npm install
```

> `npm install` **不需要在后面写包名**。它会自动读取仓库根目录的 `package.json`，把里面列出的所有包全部下载安装好。
>
> 本项目 `package.json` 里已经写好了以下所有需要的包：
>
> | 包名 | 用途 |
> |------|------|
> | `hexo` | 博客框架核心 |
> | `hexo-theme-anzhiyu` | AnZhiYu 主题 |
> | `hexo-deployer-git` | 部署到 GitHub Pages |
> | `hexo-server` | 本地预览服务器 |
> | `hexo-renderer-marked` | 渲染 Markdown 文章 |
> | `hexo-renderer-pug` | 渲染主题模板 |
> | `hexo-renderer-stylus` | 渲染主题样式 |
> | `hexo-generator-index` | 生成首页 |
> | `hexo-generator-archive` | 生成归档页 |
> | `hexo-generator-category` | 生成分类页 |
> | `hexo-generator-tag` | 生成标签页 |
> | `hexo-generator-searchdb` | 生成搜索数据 |
>
> 运行一次 `npm install` 后，以上所有包都会被安装到本地 `node_modules/` 文件夹中，之后不需要重复执行（除非 `package.json` 有变化）。

### 第三步：清除缓存并启动本地预览

```bash
npx hexo cl
npx hexo s
```

然后在浏览器打开 [http://localhost:4000](http://localhost:4000) 即可看到博客效果。

- `npx hexo cl` — 清除之前生成的缓存文件
- `npx hexo s` — 启动本地服务器，实时预览

按 `Ctrl + C` 停止本地服务器。

---

## ✏️ 写新文章

### 方式一：用命令创建

```bash
npx hexo new "文章标题"
```

文件会自动创建在 `source/_posts/文章标题.md`，编辑这个文件即可。

### 方式二：手动创建

在 `source/_posts/` 目录下新建一个 `.md` 文件，格式如下：

```markdown
---
title: 我的第一篇文章
date: 2026-03-10 12:00:00
categories:
  - 前端
tags:
  - JavaScript
---

正文内容写在这里，支持 Markdown 格式。
```

---

## 📤 发布到 GitHub Pages

修改完成后，执行以下命令生成静态文件并部署：

```bash
npx hexo cl
npx hexo g
npx hexo d
```

- `npx hexo cl` — 清除旧缓存
- `npx hexo g` — 生成静态文件（输出到 `public/` 目录）
- `npx hexo d` — 将 `public/` 目录部署到 GitHub Pages（推送到 `main` 分支）

> **首次部署前** 需要在 `_config.yml` 中确认 `deploy` 配置：
> ```yaml
> deploy:
>   type: git
>   repo: https://github.com/1217265165/1217265165.github.io
>   branch: main
> ```
> 如果推送时需要输入密码，建议配置 [SSH 密钥](https://docs.github.com/zh/authentication/connecting-to-github-with-ssh)。

---

## 📁 目录结构说明

```
├── source/                 # 博客源文件
│   ├── _posts/             # 📝 文章放这里
│   ├── categories/         # 分类页面
│   └── tags/               # 标签页面
├── _config.yml             # Hexo 主配置文件
├── _config.anzhiyu.yml     # AnZhiYu 主题配置文件
├── package.json            # 项目依赖
└── README.md               # 本文件
```

---

## 🔧 常用命令速查

| 命令 | 说明 |
|------|------|
| `npm install` | 安装依赖（首次克隆后执行） |
| `npx hexo s` | 启动本地预览服务器 |
| `npx hexo cl` | 清除缓存 |
| `npx hexo g` | 生成静态文件 |
| `npx hexo d` | 部署到 GitHub Pages |
| `npx hexo new "标题"` | 新建文章 |

---

## 📖 更多文档

- [Hexo 官方文档](https://hexo.io/zh-cn/docs/)
- [AnZhiYu 主题文档](https://docs.anheyu.com/)
