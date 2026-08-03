(() => {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ---------------- password gate ----------------
     Client-side only: the hash below is visible to anyone who reads this
     file, so this is a deterrent against casual access, not real security.
     A real gate needs server-side auth (e.g. once the Shopify backend exists). */
  const LOCK_HASH = 'ab33a1e85afddfd2fd3d02faa8682ac9ccb2d22b394c6232bafd3bca79418afc';
  const LOCK_SESSION_KEY = 'lw_admin_unlocked';

  async function sha256Hex(text) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function unlockAdmin() {
    $('#admin-lock-wrap').hidden = true;
    $('#admin-wrap').hidden = false;
  }

  if (sessionStorage.getItem(LOCK_SESSION_KEY) === '1') {
    unlockAdmin();
  } else {
    $('#admin-lock-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = $('#admin-lock-pass');
      const hash = await sha256Hex(input.value);
      if (hash === LOCK_HASH) {
        sessionStorage.setItem(LOCK_SESSION_KEY, '1');
        unlockAdmin();
      } else {
        $('#admin-lock-error').style.display = 'block';
        input.value = '';
        input.focus();
      }
    });
  }

  /* ================= flash offer (oferta relâmpago) ================= */
  const LWD = window.LowWearData;
  if (LWD) {
    const KEY_CONFIG = 'lw_flash_config';
    const KEY_CAMPAIGN = 'lw_flash_campaign';
    const KEY_LOG = 'lw_flash_log';
    const KEY_TOTAL_REDEMPTIONS = 'lw_flash_total_redemptions';

    const DEFAULT_CONFIG = {
      minDiscount: 10, maxDiscount: 30, eligibleProductIds: [], minStockSizes: 2,
      startDate: null, endDate: null, frequencyDays: 3, maxRedemptions: 0,
    };

    // Must match FLASH_DISCOUNT_CODES in js/flash-offer.js and the real
    // discount codes created in Shopify Admin → Discounts.
    const FLASH_DISCOUNT_STEPS = [10, 15, 20, 25, 30];

    const loadJSON = (key, fallback) => {
      try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
    };
    const save = (key, val) => localStorage.setItem(key, JSON.stringify(val));
    const loadConfig = () => ({ ...DEFAULT_CONFIG, ...loadJSON(KEY_CONFIG, {}) });

    function getEligibleProducts(config) {
      const pool = config.eligibleProductIds.length
        ? config.eligibleProductIds.map(id => LWD.getProduct(id)).filter(Boolean)
        : LWD.PRODUCTS.slice();
      const shopifyProducts = LWD.SHOPIFY_PRODUCTS || {};
      return pool.filter(p => p.availability !== 'esgotado' && p.sizes.length >= config.minStockSizes && shopifyProducts[p.id]);
    }

    function pickDiscountStep(minDiscount, maxDiscount) {
      const inRange = FLASH_DISCOUNT_STEPS.filter((v) => v >= minDiscount && v <= maxDiscount);
      const pool = inRange.length ? inRange : FLASH_DISCOUNT_STEPS;
      return pool[Math.floor(Math.random() * pool.length)];
    }

    function forceNewCampaign() {
      const config = loadConfig();
      const eligible = getEligibleProducts(config);
      if (!eligible.length) {
        currentBox.innerHTML = '<div class="flash-current-card">Nenhum produto elegível (verifica o estoque mínimo, a lista de produtos participantes, e se os produtos já estão ligados à Shopify).</div>';
        return;
      }
      const now = Date.now();
      const product = eligible[Math.floor(Math.random() * eligible.length)];
      const discountPct = pickDiscountStep(config.minDiscount, config.maxDiscount);
      const campaign = { id: 'FLASH-' + now + '-' + Math.random().toString(36).slice(2, 6), productId: product.id, discountPct, startedAt: now, endsAt: now + config.frequencyDays * 86400000 };
      save(KEY_CAMPAIGN, campaign);
      const log = loadJSON(KEY_LOG, []);
      log.push({ campaignId: campaign.id, productId: product.id, discountPct, periodStart: campaign.startedAt, periodEnd: campaign.endsAt, views: 0, clicks: 0, purchases: 0 });
      save(KEY_LOG, log);
    }

    const productList = $('#flash-product-list');
    const configForm = $('#flash-config-form');
    const currentBox = $('#flash-admin-current');
    const logBox = $('#flash-admin-log');

    function renderProductChecklist(config) {
      if (!productList) return;
      productList.innerHTML = LWD.PRODUCTS.map(p => `
        <label class="admin-product-row">
          <input type="checkbox" value="${p.id}" ${config.eligibleProductIds.includes(p.id) ? 'checked' : ''}>
          ${LWD.fullName(p)}${p.availability === 'esgotado' ? ' — esgotado' : ''}
        </label>`).join('');
    }

    function fillConfigForm(config) {
      $('#fc-min').value = config.minDiscount;
      $('#fc-max').value = config.maxDiscount;
      $('#fc-stock').value = config.minStockSizes;
      $('#fc-freq').value = config.frequencyDays;
      $('#fc-start').value = config.startDate || '';
      $('#fc-end').value = config.endDate || '';
      $('#fc-max-red').value = config.maxRedemptions;
      renderProductChecklist(config);
    }

    function renderCurrentCampaign() {
      const campaign = loadJSON(KEY_CAMPAIGN, null);
      const totalRedemptions = loadJSON(KEY_TOTAL_REDEMPTIONS, 0);
      const config = loadConfig();
      if (!currentBox) return;
      if (!campaign) {
        currentBox.innerHTML = `<div class="flash-current-card">Nenhuma campanha ativa ainda — será criada automaticamente na próxima visita de um cliente ao site (ou usa "Forçar nova oferta agora").</div>`;
        return;
      }
      const product = LWD.getProduct(campaign.productId);
      const endsAt = new Date(campaign.endsAt).toLocaleString('pt-PT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
      currentBox.innerHTML = `
        <div class="flash-current-card">
          <span class="flash-current-title">${product ? LWD.fullName(product) : campaign.productId}</span>
          <span>Desconto: <strong>${campaign.discountPct}%</strong> · Termina em: <strong>${endsAt}</strong></span>
          <span>Utilizações totais: <strong>${totalRedemptions}${config.maxRedemptions > 0 ? ' / ' + config.maxRedemptions : ''}</strong></span>
        </div>`;
    }

    function renderLog() {
      if (!logBox) return;
      const log = loadJSON(KEY_LOG, []).slice().reverse();
      if (!log.length) {
        logBox.innerHTML = '<p class="admin-empty">Ainda sem campanhas registadas.</p>';
        return;
      }
      const rows = log.map(entry => {
        const product = LWD.getProduct(entry.productId);
        const conv = entry.views > 0 ? ((entry.purchases / entry.views) * 100).toFixed(1) : '0.0';
        const period = new Date(entry.periodStart).toLocaleDateString('pt-PT') + ' – ' + new Date(entry.periodEnd).toLocaleDateString('pt-PT');
        return `
          <div class="admin-flash-log-row">
            <span>${product ? LWD.fullName(product) : entry.productId} (-${entry.discountPct}%)</span>
            <span>${period}</span>
            <span>${entry.views} vistas</span>
            <span>${entry.clicks} cliques</span>
            <span>${entry.purchases} checkouts</span>
            <span>${conv}% conv.</span>
          </div>`;
      }).join('');
      logBox.innerHTML = `
        <div class="admin-flash-log-row admin-flash-log-head">
          <span>Produto</span><span>Período</span><span>Vistas</span><span>Cliques</span><span>Checkouts iniciados</span><span>Conversão</span>
        </div>` + rows;
    }

    configForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const eligibleProductIds = Array.from(productList.querySelectorAll('input:checked')).map(i => i.value);
      const config = {
        minDiscount: Number($('#fc-min').value),
        maxDiscount: Number($('#fc-max').value),
        minStockSizes: Number($('#fc-stock').value),
        frequencyDays: Number($('#fc-freq').value),
        startDate: $('#fc-start').value || null,
        endDate: $('#fc-end').value || null,
        maxRedemptions: Number($('#fc-max-red').value) || 0,
        eligibleProductIds,
      };
      save(KEY_CONFIG, config);
      renderCurrentCampaign();
    });

    $('#flash-force-new')?.addEventListener('click', () => {
      forceNewCampaign();
      renderCurrentCampaign();
      renderLog();
    });

    $('#flash-reset-redemptions')?.addEventListener('click', () => {
      save(KEY_TOTAL_REDEMPTIONS, 0);
      renderCurrentCampaign();
    });

    fillConfigForm(loadConfig());
    renderCurrentCampaign();
    renderLog();
  }
})();
