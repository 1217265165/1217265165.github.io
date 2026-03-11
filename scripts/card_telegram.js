'use strict';

/**
 * Injects a Telegram join card into the sidebar, immediately before
 * the .sticky_layout section, when aside.card_telegram is enabled.
 */
hexo.extend.filter.register('after_render:html', function (str) {
  const themeConfig = hexo.theme.config;
  const cardTelegramConfig =
    themeConfig.aside && themeConfig.aside.card_telegram;

  if (!cardTelegramConfig || !cardTelegramConfig.enable) {
    return str;
  }

  const telegramUrl = cardTelegramConfig.url || 'https://t.me/';
  const telegramLabel = cardTelegramConfig.label || '加入 Telegram';

  const svgPath =
    'M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z';

  // Use double quotes for the onclick attribute so inner single quotes are safe
  const telegramCard =
    `<div class="card-widget anzhiyu-right-widget" id="card-telegram"` +
    ` onclick="window.open('${telegramUrl}','_blank')">` +
    `<div id="flip-wrapper"><div id="flip-content">` +
    `<div class="face" style="background: linear-gradient(135deg, #0088cc 0%, #2ca5e0 100%);` +
    ` display: flex; flex-direction: column; align-items: center;` +
    ` justify-content: center; color: white; font-family: inherit;">` +
    `<svg style="width:50px;height:50px;fill:white;" viewBox="0 0 24 24"` +
    ` xmlns="http://www.w3.org/2000/svg"><path d="${svgPath}"/></svg>` +
    `<p style="margin:8px 0 0; font-size:13px; font-weight:600;">${telegramLabel}</p>` +
    `</div></div></div></div>`;

  // .sticky_layout is unique to the sidebar widget area; insert once per page
  if (str.includes('<div class="sticky_layout">')) {
    str = str.replace(
      '<div class="sticky_layout">',
      telegramCard + '<div class="sticky_layout">'
    );
  }

  return str;
});
