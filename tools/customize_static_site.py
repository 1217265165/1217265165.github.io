#!/usr/bin/env python3
"""Batch customize generated Hexo static HTML pages.

Usage example:
  python tools/customize_static_site.py \
    --site-title "我的博客" \
    --avatar-url "/img/my-avatar.png" \
    --telegram-url "https://t.me/+_xmrD69vLCVhMjMx" \
    --category "前端=技术" --category "大学=学习"
"""

from __future__ import annotations

import argparse
from pathlib import Path


def replace_all(html: str, src: str, dst: str) -> str:
    if not src:
        return html
    return html.replace(src, dst)


def main() -> int:
    parser = argparse.ArgumentParser(description="Customize generated static html files")
    parser.add_argument("--root", default=".", help="project root")
    parser.add_argument("--site-title", help="replace <title> and navbar title text")
    parser.add_argument("--avatar-url", help="replace current author avatar URL")
    parser.add_argument("--telegram-url", help="replace Telegram link in card/reward entry")
    parser.add_argument(
        "--category",
        action="append",
        default=[],
        help='category rename, format: "旧名字=新名字", can pass multiple times',
    )

    args = parser.parse_args()
    root = Path(args.root)
    html_files = sorted(root.rglob("*.html"))

    old_avatar = "https://bu.dusays.com/2023/04/27/64496e511b09c.jpg"
    old_tg = "https://t.me/+_xmrD69vLCVhMjMx"

    rename_pairs: list[tuple[str, str]] = []
    for item in args.category:
        if "=" not in item:
            raise SystemExit(f"Invalid --category value: {item}")
        old, new = item.split("=", 1)
        rename_pairs.append((old, new))

    changed = 0
    for path in html_files:
        text = path.read_text(encoding="utf-8")
        original = text

        if args.site_title:
            text = replace_all(text, "<title>Hexo</title>", f"<title>{args.site_title}</title>")
            text = replace_all(text, '<div class="title">Hexo</div>', f'<div class="title">{args.site_title}</div>')

        if args.avatar_url:
            text = replace_all(text, old_avatar, args.avatar_url)

        if args.telegram_url:
            text = replace_all(text, old_tg, args.telegram_url)

        for old, new in rename_pairs:
            text = replace_all(text, f'categoryButtonText">{old}<', f'categoryButtonText">{new}<')
            text = replace_all(text, f'id="{old}"><a href="/">{old}</a>', f'id="{new}"><a href="/">{new}</a>')

        if text != original:
            path.write_text(text, encoding="utf-8")
            changed += 1

    print(f"Updated {changed} files")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
