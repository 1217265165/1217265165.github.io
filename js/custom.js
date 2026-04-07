/* Worker API base URL fallback list (same-origin first) */
var WORKER_BASE_FALLBACKS = [
  'https://1217265165.m1217265165.workers.dev'
];

(function () {
  var SOFTWARE_TARGET_PATH = '/equipment/';

  function normalizePathname(pathname) {
    var value = String(pathname || '/').split('?')[0].split('#')[0];
    if (!value.startsWith('/')) {
      value = '/' + value;
    }
    if (value.endsWith('/index.html')) {
      value = value.slice(0, -'index.html'.length);
    }
    if (!value.endsWith('/')) {
      value += '/';
    }
    return value;
  }

  function isSoftwareCategoryPath(pathname) {
    var rawPath = normalizePathname(pathname || '/');
    var decodedPath = normalizePathname(decodeURIComponent(rawPath));
    return rawPath === '/categories/%E8%BD%AF%E4%BB%B6/' || decodedPath === '/categories/软件/';
  }

  function isSoftwareCategoryHref(href) {
    var target = String(href || '').trim();
    if (!target) {
      return false;
    }

    if (target.startsWith('#') || target.toLowerCase().startsWith('javascript:')) {
      return false;
    }

    try {
      var resolved = new URL(target, window.location.origin);
      return isSoftwareCategoryPath(resolved.pathname || '/');
    } catch (error) {
      return false;
    }
  }

  function patchSoftwareCategoryLinks(root) {
    var scope = root || document;
    var links = scope.querySelectorAll('a[href]');

    Array.prototype.forEach.call(links, function (link) {
      var href = link.getAttribute('href') || '';
      if (!isSoftwareCategoryHref(href)) {
        return;
      }

      link.setAttribute('href', SOFTWARE_TARGET_PATH);
    });
  }

  function bindSoftwareCategoryClickGuard() {
    document.addEventListener(
      'click',
      function (event) {
        if (!event || event.defaultPrevented) {
          return;
        }

        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
          return;
        }

        var node = event.target;
        while (node && node !== document) {
          if (node.tagName && node.tagName.toLowerCase() === 'a') {
            break;
          }
          node = node.parentElement;
        }

        if (!node || !node.tagName || node.tagName.toLowerCase() !== 'a') {
          return;
        }

        var href = node.getAttribute('href') || '';
        if (!isSoftwareCategoryHref(href)) {
          return;
        }

        event.preventDefault();
        if (window.pjax && typeof window.pjax.loadUrl === 'function') {
          window.pjax.loadUrl(SOFTWARE_TARGET_PATH);
          return;
        }
        window.location.assign(SOFTWARE_TARGET_PATH);
      },
      true
    );
  }

  function hideKnowledgePageOuterTitle(root) {
    var scope = root || document;
    var pages = scope.querySelectorAll('#page');

    Array.prototype.forEach.call(pages, function (pageEl) {
      var articleContainer = pageEl.querySelector('#article-container');
      var hasKnowledgeLayout = !!(articleContainer && articleContainer.querySelector('.kb-page'));
      if (!hasKnowledgeLayout) {
        return;
      }

      var directChildren = pageEl.children || [];
      for (var i = 0; i < directChildren.length; i += 1) {
        var child = directChildren[i];
        if (child && child.classList && child.classList.contains('page-title')) {
          child.style.display = 'none';
          break;
        }
      }
    });
  }

  function syncSoftwareEntrance() {
    if (!window || !window.location) {
      return;
    }

    var isSoftwareCategory = isSoftwareCategoryPath(window.location.pathname || '/');

    if (isSoftwareCategory) {
      window.location.replace(SOFTWARE_TARGET_PATH);
      return;
    }

    patchSoftwareCategoryLinks(document);
    hideKnowledgePageOuterTitle(document);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncSoftwareEntrance);
  } else {
    syncSoftwareEntrance();
  }
  document.addEventListener('pjax:complete', syncSoftwareEntrance);
  bindSoftwareCategoryClickGuard();

  function getPaymentMode() {
    if (window.PaymentEngine && typeof window.PaymentEngine.getMode === 'function') {
      return window.PaymentEngine.getMode();
    }

    return 'STRIPE';
  }

  function getCheckoutButtonText() {
    return getPaymentMode() === 'VMQ' ? 'Get Access (Lab)' : 'Get Access (Stripe)';
  }

  function getProductVisual(productId) {
    if (productId === 'hbrb') {
      return { icon: '📊', spec: 'HBRB | Rule Fusion | Precision Tuning' };
    }
    if (productId === 'spec') {
      return { icon: '🛰️', spec: 'SCPI | Spectrum Pipeline | Auto Capture' };
    }

    return { icon: '🧠', spec: 'GenAI API | Credential Delivery | One-time Code' };
  }

  function normalizeBase(base) {
    return String(base || '').replace(/\/$/, '');
  }

  function appendBaseCandidates(target, candidates) {
    if (!Array.isArray(candidates)) {
      return;
    }

    candidates.forEach(function (base) {
      if (typeof base === 'string' && base.trim()) {
        target.push(normalizeBase(base));
      }
    });
  }

  function isJsonLikeResponse(response, text) {
    var contentType = (response && response.headers && response.headers.get('content-type')) || '';
    if (/application\/json|\+json/i.test(contentType)) {
      return true;
    }

    var trimmed = String(text || '').trim();
    return trimmed.charAt(0) === '{' || trimmed.charAt(0) === '[';
  }

  function getApiBases() {
    var bases = [];
    var host = (window && window.location && window.location.hostname) || '';
    var isGithubPages = /github\.io$/i.test(host);

    // In github.io deployments, same-origin has no /api backend and always 404.
    if (!isGithubPages && window && window.location && window.location.origin) {
      bases.push(normalizeBase(window.location.origin));
    }

    appendBaseCandidates(bases, window && window.SHOP_API_BASES);

    if (window && window.PAYMENT_CONFIG && Array.isArray(window.PAYMENT_CONFIG.apiBases)) {
      appendBaseCandidates(bases, window.PAYMENT_CONFIG.apiBases);
    }

    if (
      window &&
      window.PAYMENT_CONFIG &&
      window.PAYMENT_CONFIG.stripe &&
      typeof window.PAYMENT_CONFIG.stripe.apiBase === 'string'
    ) {
      appendBaseCandidates(bases, [window.PAYMENT_CONFIG.stripe.apiBase]);
    }

    // Always keep worker fallback endpoints for github.io deployment.
    appendBaseCandidates(bases, WORKER_BASE_FALLBACKS);

    var uniq = [];
    bases.forEach(function (base) {
      if (!base) return;
      if (uniq.indexOf(base) === -1) uniq.push(base);
    });

    return uniq;
  }

  async function fetchFromApi(path, options) {
    var bases = getApiBases();
    var errors = [];
    var lastResult = null;

    for (var i = 0; i < bases.length; i += 1) {
      var base = bases[i];
      var url = base + path;

      try {
        var response = await fetch(url, options || {});
        var text = await response.text();
        var result = { response: response, base: base, text: text };
        lastResult = result;

        var isJson = isJsonLikeResponse(response, text);

        // Retry next base for all non-OK responses when available.
        if ((!response.ok || !isJson) && i < bases.length - 1) {
          errors.push(
            base +
              ' => ' +
              (response.ok ? '非 JSON 响应' : 'HTTP ' + response.status) +
              (!isJson && text
                ? ' | ' + String(text).replace(/\s+/g, ' ').slice(0, 120)
                : '')
          );
          continue;
        }

        return result;
      } catch (error) {
        errors.push(base + ' => ' + (error && error.message ? error.message : 'network error'));
      }
    }

    // If we did get a response from the last base, return it for caller-specific handling.
    if (lastResult) {
      return lastResult;
    }

    throw new Error('接口请求失败：' + errors.join(' | '));
  }

  async function readJsonResponse(response, preloadedText) {
    var text = typeof preloadedText === 'string' ? preloadedText : await response.text();
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

  function getLocalFallbackProducts() {
    return [
      {
        id: 'hbrb',
        name: 'HBRB 故障诊断算法包',
        description: '接口暂不可达，当前仅展示商品信息。',
        amount: 9900,
        badgeText: '暂不可下单',
        badgeHot: true,
        coverText: 'HBRB',
        coverClass: 'cover-hbrb',
        buttonText: '接口恢复后可购买',
        soldOut: true,
        inventoryLabel: '接口不可达'
      },
      {
        id: 'spec',
        name: '频谱分析自动化工具',
        description: '接口暂不可达，当前仅展示商品信息。',
        amount: 100,
        badgeText: '暂不可下单',
        badgeHot: false,
        coverText: 'SPEC',
        coverClass: 'cover-spec',
        buttonText: '接口恢复后可购买',
        soldOut: true,
        inventoryLabel: '接口不可达'
      },
      {
        id: 'gemini',
        name: 'Gemini账号:账号—密码—邮箱—2FA',
        description: '接口暂不可达，当前仅展示商品信息。',
        amount: 5000,
        badgeText: '暂不可下单',
        badgeHot: false,
        coverText: 'Gemini Pro',
        coverClass: 'cover-api',
        buttonText: '接口恢复后可购买',
        soldOut: true,
        inventoryLabel: '接口不可达'
      }
    ];
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
      var visual = getProductVisual(product.id);

      var cover = document.createElement('div');
      cover.className = 'shop-v3-cover ' + (product.coverClass || getDefaultCoverClass(product.id));

      var icon = document.createElement('span');
      icon.className = 'shop-v3-icon';
      icon.textContent = visual.icon;
      cover.appendChild(icon);

      var coverText = document.createElement('span');
      coverText.className = 'shop-v3-cover-text';
      coverText.textContent = product.coverText || getDefaultCoverText(product.id);
      cover.appendChild(coverText);

      var body = document.createElement('div');
      body.className = 'shop-v3-body';

      var badge = document.createElement('span');
      badge.className = product.badgeHot ? 'shop-v3-badge hot' : 'shop-v3-badge';
      badge.textContent = product.badgeText || getDefaultBadgeText(product.id);

      var title = document.createElement('h3');
      title.textContent = product.name || '';

      var desc = document.createElement('p');
      desc.textContent = product.description || '';

      var spec = document.createElement('p');
      spec.className = 'shop-v3-spec';
      spec.textContent = visual.spec;

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
      button.setAttribute('data-product-name', product.name || 'Cloud Lab Access');
      button.setAttribute('data-product-amount', String(Number(product.amount || 0)));
      button.setAttribute('data-payment-provider', getPaymentMode());
      button.setAttribute('data-provider', getPaymentMode());
      button.setAttribute('data-offline-text', 'Lab Offline');
      button.textContent = product.soldOut ? '库存不足' : getCheckoutButtonText();
      if (product.soldOut) {
        button.disabled = true;
      }

      actions.appendChild(button);
      foot.appendChild(meta);
      foot.appendChild(actions);

      body.appendChild(badge);
      body.appendChild(title);
      body.appendChild(desc);
      body.appendChild(spec);
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
      var fetched = await fetchFromApi('/api/products', {
        method: 'GET',
        headers: {
          'cache-control': 'no-store'
        }
      });
      var response = fetched.response;
      var data = await readJsonResponse(response, fetched.text);

      if (!response.ok) {
        throw new Error(data.error || ('加载商品失败（HTTP ' + response.status + '）'));
      }

      renderShopProducts(container, data.products || [], data.currency || 'cny');
    } catch (error) {
      renderShopProducts(container, getLocalFallbackProducts(), 'cny');

      var oldWarn = document.querySelector('.shop-api-warning');
      if (oldWarn && oldWarn.parentNode) {
        oldWarn.parentNode.removeChild(oldWarn);
      }

      var warn = document.createElement('p');
      warn.className = 'shop-api-warning';
      warn.textContent =
        '支付接口临时不可用，已切换为展示模式。' +
        (error instanceof Error ? ' ' + error.message : '');
      container.parentNode && container.parentNode.appendChild(warn);
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
        button.textContent = getPaymentMode() === 'VMQ' ? '创建实验订单...' : '跳转支付中...';

        try {
          if (window.PaymentEngine && typeof window.PaymentEngine.start === 'function') {
            await window.PaymentEngine.start({
              id: productId,
              name: button.getAttribute('data-product-name') || 'Cloud Lab Access',
              amount: Number(button.getAttribute('data-product-amount') || 0)
            });
            button.disabled = false;
            button.textContent = originalText;
            return;
          }

          var fetched = await fetchFromApi('/api/create-checkout-session', {
            method: 'POST',
            headers: {
              'content-type': 'application/json'
            },
            body: JSON.stringify({ productId: productId })
          });
          var response = fetched.response;

          var data = await readJsonResponse(response, fetched.text);
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
      var fetched = await fetchFromApi('/api/delivery?session_id=' + encodeURIComponent(sessionId), {
        method: 'GET',
        headers: {
          'cache-control': 'no-store'
        }
      });
      var response = fetched.response;
      var data = await readJsonResponse(response, fetched.text);

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
    if (window.PaymentEngine && typeof window.PaymentEngine.init === 'function') {
      window.PaymentEngine.init();
    }

    await loadProducts();
    bindCheckoutButtons();
    loadDelivery();
  }

  document.addEventListener('DOMContentLoaded', initShopAutomation);
  document.addEventListener('pjax:complete', initShopAutomation);
  if (document.readyState !== 'loading') initShopAutomation();
})();

/* Home top-right dashboard: rotating insight + Lab status hook */
(function () {
  var intervalId = null;
  var insightList = [
    '$\\beta_{nk} = \\frac{\\mu_{nk}}{\\sum_j \\mu_{nj}}$',
    '$\\Delta f = f_{measured} - f_{reference}$',
    '$R_{module} = \\arg\\max_k\\; P(F_k\\mid x)$'
  ];
  var index = 0;

  function setLabStatus(online, text) {
    var cards = document.querySelectorAll('[data-lab-status]');
    cards.forEach(function (card) {
      card.classList.remove('is-online', 'is-offline');
      card.classList.add(online ? 'is-online' : 'is-offline');
    });

    var texts = document.querySelectorAll('[data-lab-status-text]');
    texts.forEach(function (node) {
      node.textContent = text || (online ? 'Tunnel Online' : 'Lab Offline');
    });
  }

  function fallbackLabHealthCheck() {
    var config = window.PAYMENT_CONFIG || {};
    var vmq = config.vmq || {};
    var base = String(vmq.baseUrl || '').replace(/\/$/, '');
    if (!base || /your-cpolar-subdomain/.test(base)) {
      setLabStatus(false, 'Lab Offline · 未配置 cpolar');
      return;
    }

    var healthPath = vmq.healthPath || '/health';
    fetch(base + healthPath + '?t=' + Date.now(), {
      method: 'GET',
      headers: {
        'cache-control': 'no-store'
      }
    })
      .then(function (response) {
        setLabStatus(!!(response && response.ok), response && response.ok ? 'Tunnel Online' : 'Lab Offline');
      })
      .catch(function () {
        setLabStatus(false, 'Lab Offline');
      });
  }

  function renderInsight() {
    var target = document.querySelector('[data-lab-insight]');
    if (!target) return;

    target.innerHTML = insightList[index];
    index = (index + 1) % insightList.length;

    if (window.MathJax && typeof window.MathJax.typesetPromise === 'function') {
      window.MathJax.typesetPromise([target]).catch(function () {});
    }
  }

  function initDashboard() {
    var dashboard = document.querySelector('.research-dashboard');
    if (!dashboard) return;

    if (intervalId) {
      clearInterval(intervalId);
    }

    renderInsight();
    intervalId = setInterval(renderInsight, 5500);

    if (window.PaymentEngine && typeof window.PaymentEngine.healthCheckVmq === 'function') {
      window.PaymentEngine.healthCheckVmq();
      return;
    }

    fallbackLabHealthCheck();
  }

  document.addEventListener('DOMContentLoaded', initDashboard);
  document.addEventListener('pjax:complete', initDashboard);
  if (document.readyState !== 'loading') initDashboard();
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
