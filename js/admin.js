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

  /* ---------------- tabs ---------------- */
  $$('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.admin-tab').forEach(t => { t.classList.remove('is-active'); t.setAttribute('aria-selected', 'false'); });
      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');
      $$('.admin-panel').forEach(p => { p.hidden = true; });
      $(`#admin-panel-${tab.dataset.tab}`).hidden = false;
    });
  });

  const STORE_KEY_ORDERS = 'lw_orders';
  const STEP_KEYS = ['confirmed', 'preparing', 'carrier', 'international', 'out', 'delivered'];
  const STEP_LABELS = ['Pedido confirmado', 'Em preparação', 'A caminho da transportadora', 'Transporte internacional', 'Saiu para entrega', 'Entregue'];

  const loadOrders = () => {
    try { return JSON.parse(localStorage.getItem(STORE_KEY_ORDERS)) || []; }
    catch { return []; }
  };
  const saveOrders = (list) => localStorage.setItem(STORE_KEY_ORDERS, JSON.stringify(list));

  let orders = loadOrders();
  let current = null;

  const searchForm = $('#admin-search-form');
  const resultBox = $('#admin-result');
  const listBox = $('#admin-order-list');

  function renderList() {
    if (!listBox) return;
    if (!orders.length) {
      listBox.innerHTML = '<p class="admin-empty">Ainda não há encomendas guardadas neste navegador.</p>';
      return;
    }
    listBox.innerHTML = orders.slice().reverse().map(o => `
      <button class="admin-order-row" type="button" data-id="${o.id}">
        <span>${o.id}</span><span>${o.email}</span><span>${STEP_LABELS[o.statusIndex ?? 0]}</span>
      </button>`).join('');
  }

  function selectOrder(id) {
    current = orders.find(o => o.id.toUpperCase() === id.toUpperCase());
    if (!current) {
      resultBox.innerHTML = '<p class="admin-empty">Encomenda não encontrada.</p>';
      return;
    }
    renderOrder();
  }

  function renderOrder() {
    resultBox.innerHTML = `
      <div class="admin-order-head">
        <strong>${current.id}</strong>
        <span>${current.email}</span>
        <span>${current.items.map(i => `${i.name} (x${i.qty})`).join(', ') || 'Sem artigos'}</span>
      </div>
      <div class="admin-steps">
        ${STEP_LABELS.map((label, i) => `
          <button class="admin-step-btn${(current.statusIndex ?? 0) === i ? ' is-active' : ''}" type="button" data-idx="${i}">${i + 1}. ${label}</button>
        `).join('')}
      </div>
      <p class="admin-hint">Clica numa etapa para a definir como estado atual da encomenda. O cliente vê a atualização assim que consultar novamente o acompanhamento.</p>`;
  }

  searchForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    orders = loadOrders();
    const num = $('#admin-order-num').value.trim();
    if (!num) return;
    selectOrder(num);
    renderList();
  });

  resultBox?.addEventListener('click', (e) => {
    const btn = e.target.closest('.admin-step-btn');
    if (!btn || !current) return;
    const idx = Number(btn.dataset.idx);
    current.statusIndex = idx;
    current.stepTimestamps = current.stepTimestamps || {};
    for (let i = 0; i <= idx; i++) {
      if (!current.stepTimestamps[STEP_KEYS[i]]) current.stepTimestamps[STEP_KEYS[i]] = Date.now();
    }
    for (let i = idx + 1; i < STEP_KEYS.length; i++) {
      delete current.stepTimestamps[STEP_KEYS[i]];
    }
    saveOrders(orders);
    renderOrder();
    renderList();
  });

  listBox?.addEventListener('click', (e) => {
    const row = e.target.closest('.admin-order-row');
    if (!row) return;
    selectOrder(row.dataset.id);
    $('#admin-order-num').value = row.dataset.id;
  });

  renderList();

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

    const loadJSON = (key, fallback) => {
      try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
    };
    const save = (key, val) => localStorage.setItem(key, JSON.stringify(val));
    const loadConfig = () => ({ ...DEFAULT_CONFIG, ...loadJSON(KEY_CONFIG, {}) });

    function getEligibleProducts(config) {
      const pool = config.eligibleProductIds.length
        ? config.eligibleProductIds.map(id => LWD.getProduct(id)).filter(Boolean)
        : LWD.PRODUCTS.slice();
      return pool.filter(p => p.availability !== 'esgotado' && p.sizes.length >= config.minStockSizes);
    }

    function forceNewCampaign() {
      const config = loadConfig();
      const eligible = getEligibleProducts(config);
      if (!eligible.length) {
        currentBox.innerHTML = '<div class="flash-current-card">Nenhum produto elegível (verifica o estoque mínimo e a lista de produtos participantes).</div>';
        return;
      }
      const now = Date.now();
      const product = eligible[Math.floor(Math.random() * eligible.length)];
      const discountPct = Math.round(config.minDiscount + Math.random() * (config.maxDiscount - config.minDiscount));
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
            <span>${entry.purchases} compras</span>
            <span>${conv}% conv.</span>
          </div>`;
      }).join('');
      logBox.innerHTML = `
        <div class="admin-flash-log-row admin-flash-log-head">
          <span>Produto</span><span>Período</span><span>Vistas</span><span>Cliques</span><span>Compras</span><span>Conversão</span>
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
