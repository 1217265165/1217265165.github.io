(function (window) {
  'use strict';

  var DEFAULT_CONFIG = {
    mode: 'STRIPE',
    apiBases: [
      'https://1217265165.m1217265165.workers.dev'
    ],
    vmq: {
      baseUrl: 'https://your-cpolar-subdomain.cpolar.cn',
      createOrderPath: '/api/vmq/create-order',
      healthPath: '/health',
      timeoutMs: 12000,
      staticQr: '/img/image/qrcode-alipay.png'
    },
    stripe: {
      apiBase: '',
      checkoutPath: '/api/create-checkout-session',
      timeoutMs: 12000
    }
  };

  function mergeFlat(base, extra) {
    var output = {};
    var key;

    for (key in base) {
      if (Object.prototype.hasOwnProperty.call(base, key)) {
        output[key] = base[key];
      }
    }

    for (key in (extra || {})) {
      if (Object.prototype.hasOwnProperty.call(extra, key)) {
        output[key] = extra[key];
      }
    }

    return output;
  }

  function normalizeConfig(input) {
    var config = input || {};
    var hasApiBases = Array.isArray(config.apiBases) && config.apiBases.length > 0;

    return {
      mode: config.mode || DEFAULT_CONFIG.mode,
      apiBases: hasApiBases ? config.apiBases.slice() : DEFAULT_CONFIG.apiBases.slice(),
      vmq: mergeFlat(DEFAULT_CONFIG.vmq, config.vmq),
      stripe: mergeFlat(DEFAULT_CONFIG.stripe, config.stripe)
    };
  }

  var PAYMENT_CONFIG = normalizeConfig(window.PAYMENT_CONFIG);
  window.PAYMENT_CONFIG = PAYMENT_CONFIG;

  function normalizeMode(value) {
    return String(value || '').toUpperCase() === 'VMQ' ? 'VMQ' : 'STRIPE';
  }

  function currentMode() {
    return normalizeMode(PAYMENT_CONFIG.mode);
  }

  function normalizeBase(url) {
    return String(url || '').replace(/\/$/, '');
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

  function ensureApiPath(path) {
    var value = String(path || '/api/create-checkout-session');
    return value.charAt(0) === '/' ? value : '/' + value;
  }

  function isAbsoluteHttpUrl(value) {
    return /^https?:\/\//i.test(String(value || ''));
  }

  function getStripeCheckoutTargets() {
    var stripe = PAYMENT_CONFIG.stripe || {};
    var checkoutPath = stripe.checkoutPath || '/api/create-checkout-session';

    if (isAbsoluteHttpUrl(checkoutPath)) {
      return [checkoutPath];
    }

    var path = ensureApiPath(checkoutPath);
    var bases = [];
    var host = (window && window.location && window.location.hostname) || '';
    var isGithubPages = /github\.io$/i.test(host);

    if (!isGithubPages && window && window.location && window.location.origin) {
      bases.push(normalizeBase(window.location.origin));
    }

    appendBaseCandidates(bases, window && window.SHOP_API_BASES);
    appendBaseCandidates(bases, PAYMENT_CONFIG.apiBases);
    appendBaseCandidates(bases, [stripe.apiBase]);

    var uniq = [];
    bases.forEach(function (base) {
      if (!base) return;
      if (uniq.indexOf(base) === -1) {
        uniq.push(base);
      }
    });

    if (!uniq.length && window && window.location && window.location.origin) {
      uniq.push(normalizeBase(window.location.origin));
    }

    return uniq.map(function (base) {
      return base + path;
    });
  }

  function withTimeout(promiseFactory, timeoutMs) {
    return new Promise(function (resolve, reject) {
      var done = false;
      var timer = setTimeout(function () {
        if (done) return;
        done = true;
        reject(new Error('请求超时'));
      }, timeoutMs);

      promiseFactory()
        .then(function (result) {
          if (done) return;
          done = true;
          clearTimeout(timer);
          resolve(result);
        })
        .catch(function (error) {
          if (done) return;
          done = true;
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  function randomCentOffset() {
    return Math.floor(Math.random() * 90) + 10;
  }

  function toYuan(cents) {
    return (Number(cents || 0) / 100).toFixed(2);
  }

  function updateLabUi(online, message) {
    var statusNodes = document.querySelectorAll('[data-lab-status]');
    statusNodes.forEach(function (node) {
      node.classList.remove('is-online', 'is-offline');
      node.classList.add(online ? 'is-online' : 'is-offline');
    });

    var textNodes = document.querySelectorAll('[data-lab-status-text]');
    textNodes.forEach(function (node) {
      node.textContent = message || (online ? 'Tunnel Online' : 'Lab Offline');
    });
  }

  function setVmqButtonState(online) {
    var buttons = document.querySelectorAll('[data-payment-provider="VMQ"], .shop-checkout-btn[data-provider="VMQ"]');
    buttons.forEach(function (button) {
      if (online) {
        if (button.dataset.wasDisabledByHealthcheck === '1') {
          button.disabled = false;
        }
        button.dataset.wasDisabledByHealthcheck = '0';
        return;
      }

      if (!button.disabled) {
        button.dataset.wasDisabledByHealthcheck = '1';
      }
      button.disabled = true;
      if (button.hasAttribute('data-offline-text')) {
        button.textContent = button.getAttribute('data-offline-text');
      }
    });
  }

  function getVmqHealthUrl() {
    var vmq = PAYMENT_CONFIG.vmq || {};
    return normalizeBase(vmq.baseUrl) + (vmq.healthPath || '/health');
  }

  function getVmqCreateUrl() {
    var vmq = PAYMENT_CONFIG.vmq || {};
    return normalizeBase(vmq.baseUrl) + (vmq.createOrderPath || '/api/vmq/create-order');
  }

  function healthCheckVmq() {
    var vmq = PAYMENT_CONFIG.vmq || {};
    var base = normalizeBase(vmq.baseUrl);

    if (!base || /your-cpolar-subdomain/.test(base)) {
      updateLabUi(false, 'Lab Offline · 未配置 cpolar 地址');
      setVmqButtonState(false);
      return Promise.resolve(false);
    }

    var healthUrl = getVmqHealthUrl() + '?t=' + Date.now();
    return withTimeout(function () {
      return fetch(healthUrl, {
        method: 'GET',
        headers: {
          'cache-control': 'no-store'
        }
      });
    }, Number(vmq.timeoutMs || 12000))
      .then(function (response) {
        var ok = !!(response && response.ok);
        updateLabUi(ok, ok ? 'Tunnel Online' : 'Lab Offline');
        setVmqButtonState(ok);
        return ok;
      })
      .catch(function () {
        updateLabUi(false, 'Lab Offline');
        setVmqButtonState(false);
        return false;
      });
  }

  async function createStripeCheckout(productId) {
    var stripe = PAYMENT_CONFIG.stripe || {};
    var timeoutMs = Number(stripe.timeoutMs || 12000);
    var targets = getStripeCheckoutTargets();
    var errors = [];

    for (var i = 0; i < targets.length; i += 1) {
      var checkoutUrl = targets[i];

      try {
        var response = await withTimeout(function () {
          return fetch(checkoutUrl, {
            method: 'POST',
            headers: {
              'content-type': 'application/json'
            },
            body: JSON.stringify({ productId: productId })
          });
        }, timeoutMs);

        var text = await response.text();
        var data = {};

        try {
          data = text ? JSON.parse(text) : {};
        } catch {
          data = { error: 'Stripe 返回了非 JSON 响应' };
        }

        if (!response.ok || !data.url) {
          var reason = data.error || (!response.ok ? 'HTTP ' + response.status : '缺少跳转链接');
          errors.push(checkoutUrl + ' => ' + reason);
          continue;
        }

        return data;
      } catch (error) {
        errors.push(checkoutUrl + ' => ' + (error && error.message ? error.message : 'network error'));
      }
    }

    throw new Error('创建支付会话失败：' + (errors.join(' | ') || '未找到可用接口'));
  }

  function openVmqModal(orderInfo, product) {
    var modal = document.querySelector('[data-vmq-modal]');
    if (!modal) return;

    var amountEl = modal.querySelector('[data-vmq-amount]');
    var orderEl = modal.querySelector('[data-vmq-order]');
    var productEl = modal.querySelector('[data-vmq-product]');
    var qrEl = modal.querySelector('[data-vmq-qr]');
    var statusEl = modal.querySelector('[data-vmq-status]');

    if (amountEl) {
      amountEl.textContent = '￥' + toYuan(orderInfo.uniqueAmount);
    }
    if (orderEl) {
      orderEl.textContent = orderInfo.orderNo || orderInfo.trace || '--';
    }
    if (productEl) {
      productEl.textContent = product && product.name ? product.name : 'Cloud Lab Access';
    }
    if (qrEl) {
      qrEl.src = orderInfo.qrCodeUrl || (PAYMENT_CONFIG.vmq && PAYMENT_CONFIG.vmq.staticQr) || '/img/image/qrcode-alipay.png';
    }
    if (statusEl) {
      statusEl.textContent = '请按精确金额支付，系统将以分角偏移识别订单。';
    }

    modal.classList.add('is-open');
    document.body.classList.add('vmq-modal-open');
  }

  function closeVmqModal() {
    var modal = document.querySelector('[data-vmq-modal]');
    if (!modal) return;
    modal.classList.remove('is-open');
    document.body.classList.remove('vmq-modal-open');
  }

  function bindVmqModal() {
    var modal = document.querySelector('[data-vmq-modal]');
    if (!modal || modal.dataset.bound === '1') return;

    modal.dataset.bound = '1';

    modal.addEventListener('click', function (event) {
      var isClose = event.target.closest('[data-vmq-close]');
      if (isClose || event.target === modal) {
        closeVmqModal();
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        closeVmqModal();
      }
    });
  }

  function createVmqOrder(product) {
    var vmq = PAYMENT_CONFIG.vmq || {};
    var centOffset = randomCentOffset();
    var uniqueAmount = Number(product.amount || 0) + centOffset;
    var trace = 'VMQ-' + Date.now() + '-' + Math.floor(Math.random() * 100000);

    var payload = {
      productId: product.id,
      productName: product.name,
      baseAmount: Number(product.amount || 0),
      centOffset: centOffset,
      uniqueAmount: uniqueAmount,
      uniqueAmountYuan: toYuan(uniqueAmount),
      trace: trace
    };

    return withTimeout(function () {
      return fetch(getVmqCreateUrl(), {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
    }, Number(vmq.timeoutMs || 12000))
      .then(function (response) {
        return response.text().then(function (text) {
          var data = {};
          try {
            data = text ? JSON.parse(text) : {};
          } catch {
            data = {};
          }

          if (!response.ok) {
            throw new Error(data.error || ('Vmq 下单失败（HTTP ' + response.status + '）'));
          }

          return {
            provider: 'VMQ',
            orderNo: data.orderNo || data.order_id || trace,
            trace: trace,
            uniqueAmount: uniqueAmount,
            centOffset: centOffset,
            qrCodeUrl: data.qrCodeUrl || data.qr || vmq.staticQr,
            paymentUrl: data.paymentUrl || data.payUrl || ''
          };
        });
      });
  }

  function start(product) {
    if (!product || !product.id) {
      return Promise.reject(new Error('缺少商品信息'));
    }

    if (currentMode() === 'STRIPE') {
      return createStripeCheckout(product.id).then(function (data) {
        window.location.href = data.url;
        return data;
      });
    }

    return healthCheckVmq().then(function (online) {
      if (!online) {
        throw new Error('Lab Offline：本地支付通道暂不可用');
      }

      return createVmqOrder(product).then(function (orderInfo) {
        openVmqModal(orderInfo, product);
        return orderInfo;
      });
    });
  }

  function init() {
    bindVmqModal();
    if (currentMode() === 'VMQ') {
      healthCheckVmq();
    } else {
      updateLabUi(true, 'Stripe Online');
    }
  }

  window.PaymentEngine = {
    config: PAYMENT_CONFIG,
    init: init,
    start: start,
    closeVmqModal: closeVmqModal,
    healthCheckVmq: healthCheckVmq,
    createStripeCheckout: createStripeCheckout,
    createVmqOrder: createVmqOrder,
    getMode: currentMode,
    setMode: function (mode) {
      PAYMENT_CONFIG.mode = normalizeMode(mode);
      return PAYMENT_CONFIG.mode;
    }
  };
})(window);
