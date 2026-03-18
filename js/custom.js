/* Worker API base URL */
var WORKER_BASE = 'https://1217265165.m1217265165.workers.dev';

/* 动态格言轮播 - Banner subtitle */
(function () {
  var quotes = [
    "频谱是机器的语言，诊断是解读的艺术。",
    "HBRB: 在不确定性中寻找确定性的逻辑。",
    "算法是灵魂，C++ 与 Qt 是其坚实的骨架。",
    "从微弱信号中捕捉系统失效的先兆。",
    "Gemini API: 探索生成式 AI 在垂直领域的落地。",
    "Done is better than perfect. | 持续迭代中"
  ];

  var index = 0;
  var intervalId = null;

  function getTarget() {
    return document.querySelector("#todayCard .todayCard-tips");
  }

  function rotate() {
    var el = getTarget();
    if (!el) return;
    el.style.transition = "opacity 0.4s ease";
    el.style.opacity = "0";
    setTimeout(function () {
      index = (index + 1) % quotes.length;
      el.textContent = quotes[index];
      el.style.opacity = "1";
    }, 400);
  }

  function init() {
    var el = getTarget();
    if (!el) return;
    el.textContent = quotes[0];
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(rotate, 5000);
  }

  // Run on DOMContentLoaded and on pjax
  document.addEventListener("DOMContentLoaded", init);
  document.addEventListener("pjax:complete", init);
  // Also try immediately in case DOM is already loaded
  if (document.readyState !== "loading") init();
})();

(function () {
  async function readJsonResponse(response) {
    var text = await response.text();
    if (!text) {
      return {};
    }

    try {
      return JSON.parse(text);
    } catch {
      return {
        error: '接口返回了非 JSON 响应'
      };
    }
  }

  function formatPrice(amount, currency) {
    var major = Number(amount || 0) / 100;
    if (String(currency || '').toLowerCase() === 'cny') {
      return '￥' + major.toFixed(major % 1 === 0 ? 0 : 2);
    }
    return major.toFixed(2) + ' ' + String(currency || '').toUpperCase();
  }

  function getDefaultCoverClass(productId) {
    if (productId === 'hbrb') return 'cover-hbrb';
    if (productId === 'spec') return 'cover-spec';
    return 'cover-api';
  }

  function getDefaultCoverText(productId) {
    if (productId === 'hbrb') return 'HBRB';
    if (productId === 'spec') return 'SPEC';
    return 'API';
  }

  function getDefaultBadgeText(productId) {
    return productId === 'hbrb' ? '热销' : '自动发货';
  }

  function getInventoryLabel(product) {
    if (typeof product.inventoryLabel === 'string' && product.inventoryLabel) {
      return product.inventoryLabel;
    }

    if (Number.isFinite(product.inventory)) {
      return '剩余 ' + product.inventory + ' 份';
    }

    return '';
  }

  function renderShopProducts(container, products, currency) {
    container.innerHTML = '';

    if (!products || !products.length) {
      var emptyCard = document.createElement('article');
      emptyCard.className = 'shop-v3-card';
      var emptyBody = document.createElement('div');
      emptyBody.className = 'shop-v3-body';
      var emptyTitle = document.createElement('h3');
      emptyTitle.textContent = '暂无商品';
      var emptyDesc = document.createElement('p');
      emptyDesc.textContent = '当前未配置可售商品，请稍后再试。';
      emptyBody.appendChild(emptyTitle);
      emptyBody.appendChild(emptyDesc);
      emptyCard.appendChild(emptyBody);
      container.appendChild(emptyCard);
      return;
    }

    products.forEach(function (product) {
      var card = document.createElement('article');
      card.className = 'shop-v3-card';

      var cover = document.createElement('div');
      cover.className = 'shop-v3-cover ' + (product.coverClass || getDefaultCoverClass(product.id));
      cover.textContent = product.coverText || getDefaultCoverText(product.id);

      var body = document.createElement('div');
      body.className = 'shop-v3-body';

      var badge = document.createElement('span');
      badge.className = product.badgeHot ? 'shop-v3-badge hot' : 'shop-v3-badge';
      badge.textContent = product.badgeText || getDefaultBadgeText(product.id);

      var title = document.createElement('h3');
      title.textContent = product.name || '';

      var desc = document.createElement('p');
      desc.textContent = product.description || '';

      var foot = document.createElement('div');
      foot.className = 'shop-v3-foot';

      var meta = document.createElement('div');
      meta.className = 'shop-v3-meta';

      var price = document.createElement('strong');
      price.textContent = formatPrice(product.amount, currency);
      meta.appendChild(price);

      var inventoryLabel = getInventoryLabel(product);
      if (inventoryLabel) {
        var stock = document.createElement('span');
        stock.className = product.soldOut ? 'shop-v3-stock sold-out' : 'shop-v3-stock';
        stock.textContent = inventoryLabel;
        meta.appendChild(stock);
      }

      var actions = document.createElement('div');
      actions.className = 'shop-v3-actions';

      var button = document.createElement('button');
      button.className = 'shop-checkout-btn';
      button.type = 'button';
      button.setAttribute('data-product-id', product.id);
      button.textContent = product.soldOut ? '库存不足' : (product.buttonText || 'Stripe 自动发货');
      if (product.soldOut) {
        button.disabled = true;
      }

      actions.appendChild(button);
      foot.appendChild(meta);
      foot.appendChild(actions);

      body.appendChild(badge);
      body.appendChild(title);
      body.appendChild(desc);
      body.appendChild(foot);

      card.appendChild(cover);
      card.appendChild(body);
      container.appendChild(card);
    });
  }

  async function loadProducts() {
    var container = document.querySelector('[data-shop-products]');
    if (!container) return;

    try {
      var response = await fetch(WORKER_BASE + '/api/products', {
        method: 'GET',
        headers: {
          'cache-control': 'no-store'
        }
      });
      var data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.error || ('加载商品失败（HTTP ' + response.status + '）'));
      }

      renderShopProducts(container, data.products || [], data.currency || 'cny');
    } catch (error) {
      container.innerHTML = '';
      var errorCard = document.createElement('article');
      errorCard.className = 'shop-v3-card';
      var errorBody = document.createElement('div');
      errorBody.className = 'shop-v3-body';
      var errorTitle = document.createElement('h3');
      errorTitle.textContent = '商品加载失败';
      var errorDesc = document.createElement('p');
      errorDesc.textContent = error instanceof Error ? error.message : '请稍后刷新重试。';
      errorBody.appendChild(errorTitle);
      errorBody.appendChild(errorDesc);
      errorCard.appendChild(errorBody);
      container.appendChild(errorCard);
    }
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }

    var textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return Promise.resolve();
  }

  function createDeliveryParagraph(text, className) {
    var paragraph = document.createElement('p');
    if (className) paragraph.className = className;
    paragraph.textContent = text;
    return paragraph;
  }

  function renderDeliveryContent(contentEl, delivery) {
    contentEl.innerHTML = '';

    if (!delivery || !delivery.type) {
      contentEl.textContent = '未收到可用的交付内容。';
      return;
    }

    if (delivery.type === 'text') {
      contentEl.textContent = delivery.content || '';
      return;
    }

    if (delivery.title) {
      contentEl.appendChild(createDeliveryParagraph(delivery.title, 'shop-delivery-item-title'));
    }

    if (delivery.type === 'link') {
      var linkButton = document.createElement('a');
      linkButton.className = 'shop-delivery-link';
      linkButton.href = delivery.url;
      linkButton.target = '_blank';
      linkButton.rel = 'noopener noreferrer';
      linkButton.textContent = delivery.buttonLabel || '立即下载';
      contentEl.appendChild(linkButton);
      if (delivery.note) {
        contentEl.appendChild(createDeliveryParagraph(delivery.note, 'shop-delivery-item-note'));
      }
      return;
    }

    if (delivery.type === 'fixed_code' || delivery.type === 'one_time_code') {
      var codeWrap = document.createElement('div');
      codeWrap.className = 'shop-delivery-code-wrap';

      var codeText = document.createElement('code');
      codeText.className = 'shop-delivery-code';
      codeText.textContent = delivery.code || '';
      codeWrap.appendChild(codeText);

      var copyButton = document.createElement('button');
      copyButton.type = 'button';
      copyButton.className = 'shop-delivery-copy';
      copyButton.textContent = '复制';
      copyButton.addEventListener('click', function () {
        copyText(delivery.code || '').then(function () {
          copyButton.textContent = '已复制 ✓';
          copyButton.classList.add('copied');
          setTimeout(function () {
            copyButton.textContent = '复制';
            copyButton.classList.remove('copied');
          }, 2000);
        });
      });
      codeWrap.appendChild(copyButton);
      contentEl.appendChild(codeWrap);

      if (delivery.note) {
        contentEl.appendChild(createDeliveryParagraph(delivery.note, 'shop-delivery-item-note'));
      }
      return;
    }

    contentEl.textContent = '暂不支持的交付类型。';
  }

  function bindCheckoutButtons() {
    var buttons = document.querySelectorAll('.shop-checkout-btn');
    buttons.forEach(function (button) {
      if (button.dataset.bound === 'true') return;
      button.dataset.bound = 'true';
      button.addEventListener('click', async function () {
        var productId = button.getAttribute('data-product-id');
        if (!productId) return;

        var originalText = button.textContent;
        button.disabled = true;
        button.textContent = '跳转支付中...';

        try {
          var response = await fetch(WORKER_BASE + '/api/create-checkout-session', {
            method: 'POST',
            headers: {
              'content-type': 'application/json'
            },
            body: JSON.stringify({ productId: productId })
          });

          var data = await readJsonResponse(response);
          if (!response.ok || !data.url) {
            throw new Error(data.error || ('创建支付会话失败（HTTP ' + response.status + '）'));
          }

          window.location.href = data.url;
        } catch (error) {
          button.disabled = false;
          button.textContent = originalText;
          window.alert(error instanceof Error ? error.message : '支付初始化失败');
        }
      });
    });
  }

  function setBadge(page, state) {
    var badge = page.querySelector('[data-delivery-badge]');
    if (!badge) return;
    badge.className = 'shop-delivery-badge ' + state;
    if (state === 'loading') { badge.textContent = '···'; }
    else if (state === 'success') { badge.textContent = '✓'; }
    else if (state === 'error') { badge.textContent = '✕'; }
  }

  async function loadDelivery() {
    var page = document.querySelector('[data-shop-delivery-page]');
    if (!page) return;

    var params = new URLSearchParams(window.location.search);
    var sessionId = params.get('session_id');
    var statusEl = page.querySelector('[data-delivery-status]');
    var titleEl = page.querySelector('[data-delivery-title]');
    var contentEl = page.querySelector('[data-delivery-content]');

    if (!sessionId) {
      setBadge(page, 'error');
      titleEl.textContent = '无法读取发货信息';
      statusEl.textContent = '缺少 session_id 参数，请通过支付成功页面的链接访问。';
      return;
    }

    setBadge(page, 'loading');
    statusEl.textContent = '正在核验支付状态，请稍候…';

    try {
      var response = await fetch(WORKER_BASE + '/api/delivery?session_id=' + encodeURIComponent(sessionId), {
        method: 'GET',
        headers: {
          'cache-control': 'no-store'
        }
      });
      var data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.error || ('自动发货失败（HTTP ' + response.status + '）'));
      }

      setBadge(page, 'success');
      titleEl.textContent = data.productName || '交付内容';
      statusEl.textContent = '支付已确认 · 以下为您的交付内容，请妥善保存';
      renderDeliveryContent(contentEl, data.delivery);
    } catch (error) {
      setBadge(page, 'error');
      titleEl.textContent = '发货出现问题';
      statusEl.textContent = error instanceof Error ? error.message : '自动发货失败，请联系客服';
    }
  }

  async function initShopAutomation() {
    await loadProducts();
    bindCheckoutButtons();
    loadDelivery();
  }

  document.addEventListener('DOMContentLoaded', initShopAutomation);
  document.addEventListener('pjax:complete', initShopAutomation);
  if (document.readyState !== 'loading') initShopAutomation();
})();

/* Local Search fallback: ensure popup search works even when theme parser misses matches */
(function () {
  var fallbackDataPromise = null;

  function forceCloseSearchPopup() {
    var dialog = document.querySelector('#local-search .search-dialog');
    var mask = document.getElementById('search-mask');

    document.body.style.width = '';
    document.body.style.overflow = '';

    if (dialog) {
      dialog.style.animation = 'none';
      dialog.style.display = 'none';
    }

    if (mask) {
      mask.style.animation = 'none';
      mask.style.display = 'none';
    }
  }

  function jumpToFirstSearchHit() {
    var resultContainer = document.getElementById('local-search-results');
    if (!resultContainer) return;

    var firstLink = resultContainer.querySelector('.search-result-title');
    if (!firstLink) return;

    var href = firstLink.getAttribute('href');
    if (!href) return;

    forceCloseSearchPopup();

    if (window.pjax && typeof window.pjax.loadUrl === 'function') {
      window.pjax.loadUrl(href);
      return;
    }

    window.location.href = href;
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function loadFallbackEntries() {
    if (fallbackDataPromise) return fallbackDataPromise;

    var searchPath =
      (window.GLOBAL_CONFIG && window.GLOBAL_CONFIG.localSearch && window.GLOBAL_CONFIG.localSearch.path) ||
      '/search.xml';

    fallbackDataPromise = fetch(searchPath, { cache: 'no-store' })
      .then(function (response) {
        if (!response.ok) throw new Error('search index fetch failed');
        return response.text();
      })
      .then(function (xmlText) {
        var xml = new window.DOMParser().parseFromString(xmlText, 'text/xml');
        return Array.prototype.map.call(xml.querySelectorAll('entry'), function (entry) {
          var titleNode = entry.querySelector('title');
          var urlNode = entry.querySelector('url');
          var contentNode = entry.querySelector('content');
          var tags = Array.prototype.map.call(entry.querySelectorAll('tags > tag'), function (tagNode) {
            return (tagNode.textContent || '').trim();
          });

          return {
            title: (titleNode && titleNode.textContent) || '',
            url: (urlNode && urlNode.textContent) || '',
            content: ((contentNode && contentNode.textContent) || '').replace(/<[^>]+>/g, ' '),
            tags: tags
          };
        });
      })
      .catch(function () {
        return [];
      });

    return fallbackDataPromise;
  }

  function renderFallbackResults(container, keyword, hits) {
    if (!container) return;

    if (!hits.length) {
      container.innerHTML =
        '<div id="local-search__hits-empty">找不到您查询的内容：' + escapeHtml(keyword) + '</div>';
      return;
    }

    var html = '<div class="search-result-list">';
    hits.forEach(function (item) {
      var url = item.url && item.url.charAt(0) === '/' ? item.url : '/' + String(item.url || '').replace(/^\/+/, '');
      var title = escapeHtml(item.title || '无标题');
      var snippet = escapeHtml(item.snippet || '');

      html += '<div class="local-search__hit-item">';
      html += '<div class="search-left" style="width:0"></div>';
      html += '<div class="search-right" style="width:100%">';
      html += '<a href="' + url + '" class="search-result-title">' + title + '</a>';
      if (snippet) {
        html += '<p class="search-result">' + snippet + '</p>';
      }
      if (item.tags && item.tags.length) {
        html += '<div class="search-result-tags">';
        item.tags.forEach(function (tag) {
          var safeTag = escapeHtml(tag);
          html += '<a class="tag-list" href="/tags/' + encodeURIComponent(tag) + '/" data-pjax-state>#' + safeTag + '</a>';
        });
        html += '</div>';
      }
      html += '</div></div>';
    });
    html += '</div>';

    container.innerHTML = html;
  }

  function bindSearchFallback() {
    var input = document.querySelector('#local-search-input input');
    var resultContainer = document.getElementById('local-search-results');
    if (!input || !resultContainer) return;
    if (input.dataset.kbFallbackBound === '1') return;

    input.dataset.kbFallbackBound = '1';
    var timer = null;

    input.addEventListener('input', function () {
      if (timer) window.clearTimeout(timer);

      timer = window.setTimeout(function () {
        var keyword = (input.value || '').trim().toLowerCase();
        if (!keyword) return;

        // Theme local-search renders first; fallback only steps in when no hit item is rendered.
        if (resultContainer.querySelector('.local-search__hit-item')) {
          return;
        }

        loadFallbackEntries().then(function (entries) {
          var hits = [];

          entries.forEach(function (entry) {
            var title = (entry.title || '').toLowerCase();
            var content = (entry.content || '').toLowerCase();
            var tags = (entry.tags || []).join(' ').toLowerCase();

            if (title.indexOf(keyword) === -1 && content.indexOf(keyword) === -1 && tags.indexOf(keyword) === -1) {
              return;
            }

            var snippetSource = entry.content || '';
            var idx = snippetSource.toLowerCase().indexOf(keyword);
            var start = idx > 20 ? idx - 20 : 0;
            var end = idx > -1 ? idx + 80 : 80;
            var snippet = snippetSource.slice(start, end).trim();
            if (start > 0) snippet = '...' + snippet;
            if (end < snippetSource.length) snippet += '...';

            hits.push({
              title: entry.title,
              url: entry.url,
              tags: entry.tags,
              snippet: snippet
            });
          });

          renderFallbackResults(resultContainer, keyword, hits.slice(0, 30));
        });
      }, 220);
    });

    input.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter') return;

      event.preventDefault();

      input.dispatchEvent(new Event('input', { bubbles: true }));

      window.setTimeout(function () {
        jumpToFirstSearchHit();
      }, 120);
    });

    if (!document.body.dataset.kbSearchPopupBound) {
      document.body.dataset.kbSearchPopupBound = '1';

      document.addEventListener(
        'click',
        function (event) {
          var closeBtn = event.target && event.target.closest && event.target.closest('#local-search .search-close-button');
          var mask = document.getElementById('search-mask');

          if (closeBtn || (mask && event.target === mask)) {
            event.preventDefault();
            forceCloseSearchPopup();
          }
        },
        true
      );

      document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
          forceCloseSearchPopup();
        }
      });
    }
  }

  document.addEventListener('DOMContentLoaded', bindSearchFallback);
  document.addEventListener('pjax:complete', bindSearchFallback);
  if (document.readyState !== 'loading') bindSearchFallback();
})();
