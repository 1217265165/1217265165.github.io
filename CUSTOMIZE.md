# 站点自定义（头像、标签、站点名字）

这个仓库是**已生成的静态页面**（`index.html`、`archives/.../index.html`），不是完整 Hexo 源码。
所以改法有两种：

## 1) 直接改静态页面（立刻生效）

本仓库已提供批量脚本：`tools/customize_static_site.py`。

### 常见需求

- 改网站名字（浏览器标题 + 左上角标题）
- 改右侧头像
- 改 Telegram 群链接
- 改首页分类文字（你说的“标签”通常就是这里）

### 使用示例

```bash
python tools/customize_static_site.py \
  --site-title "你的站点名" \
  --avatar-url "/img/my-avatar.png" \
  --telegram-url "https://t.me/+_xmrD69vLCVhMjMx" \
  --category "前端=技术" \
  --category "大学=学习" \
  --category "生活=日常"
```

### 推荐头像做法

1. 把头像文件放到：`img/my-avatar.png`
2. 然后执行：

```bash
python tools/customize_static_site.py --avatar-url "/img/my-avatar.png"
```

---

## 2) 从 Hexo 源码长期维护（推荐）

如果你后续会频繁发博客、置顶、改主题配置，建议用 Hexo 源码仓库来改：

- 头像：一般在主题配置里的 `avatar` 字段
- 站点名字：一般在 Hexo 主配置 `title`
- 分类/标签：写文章 front-matter 的 `categories` / `tags`
- 置顶：文章 front-matter 一般用 `top` 或 `sticky`（看主题）

> 如果你愿意，我可以下一步帮你把“静态仓库”迁回“源码仓库”的标准结构，这样以后改动更简单。
