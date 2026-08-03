/* ============================================================
   Low Wear — Oferta Relâmpago Surpresa
   Client-side campaign engine + popup.

   Honesty note: this static site has no server/database, so "campaign
   state" lives in localStorage (shared with admin.html) instead of a
   real backend. The countdown, stock check and one-offer-per-browser
   rule are all real *for this browser*, but a campaign generated here
   isn't synced across different visitors/devices.

   The discount itself is real: the campaign only ever picks a product that
   currently has a Shopify *automatic* discount configured for it (Shopify
   Admin → Discounts → Automatic discount), and reads the actual percentage
   back from Shopify instead of guessing one client-side. Accepting sends
   the customer straight to Shopify's real checkout (via LWD.Shopify, see
   js/data.js), where that same automatic discount applies itself — no
   code needed. If no participating product currently has an automatic
   discount active in Shopify, no campaign is shown at all.
   ============================================================ */
(() => {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const LWD = window.LowWearData;
  if (!LWD) return;
  const euro = LWD.euro;

  const KEY_CONFIG = 'lw_flash_config';
  const KEY_CAMPAIGN = 'lw_flash_campaign';
  const KEY_LOG = 'lw_flash_log';
  const KEY_OFFER_STATE = 'lw_flash_offer_state';
  const KEY_TOTAL_REDEMPTIONS = 'lw_flash_total_redemptions';
  const SESSION_KEY_SHOWN = 'lw_flash_shown_session';

  const DEFAULT_CONFIG = {
    minDiscount: 10,
    maxDiscount: 30,
    eligibleProductIds: [],   // empty = every in-stock product is eligible
    minStockSizes: 2,         // proxy for "estoque mínimo": nº de tamanhos ainda disponíveis
    startDate: null,          // ISO date, campaign program window (optional)
    endDate: null,
    frequencyDays: 3,
    maxRedemptions: 0,        // 0 = sem limite
  };

  const OFFER_MINUTES = 10;

  const loadJSON = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  };
  const save = (key, val) => localStorage.setItem(key, JSON.stringify(val));

  function loadConfig() { return { ...DEFAULT_CONFIG, ...loadJSON(KEY_CONFIG, {}) }; }
  function loadCampaign() { return loadJSON(KEY_CAMPAIGN, null); }
  function loadLog() { return loadJSON(KEY_LOG, []); }
  function loadOfferState() { return loadJSON(KEY_OFFER_STATE, null); }
  function saveOfferState(s) { save(KEY_OFFER_STATE, s); }
  function getTotalRedemptions() { return loadJSON(KEY_TOTAL_REDEMPTIONS, 0); }
  function bumpTotalRedemptions() { save(KEY_TOTAL_REDEMPTIONS, getTotalRedemptions() + 1); }

  function updateLog(campaignId, patch) {
    const log = loadLog();
    const entry = log.find(l => l.campaignId === campaignId);
    if (entry) Object.assign(entry, patch(entry));
    save(KEY_LOG, log);
  }

  function getEligibleProducts(config) {
    const pool = config.eligibleProductIds && config.eligibleProductIds.length
      ? config.eligibleProductIds.map(id => LWD.getProduct(id)).filter(Boolean)
      : LWD.PRODUCTS.slice();
    const shopifyProducts = LWD.SHOPIFY_PRODUCTS || {};
    return pool.filter(p => p.availability !== 'esgotado' && p.sizes.length >= config.minStockSizes && shopifyProducts[p.id]);
  }

  function withinProgramWindow(config, now) {
    if (config.startDate && now < new Date(config.startDate).getTime()) return false;
    if (config.endDate && now > new Date(config.endDate).getTime() + 86400000 - 1) return false;
    return true;
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Checks each eligible product against Shopify for a real, currently-active
  // automatic discount, and returns the first one found (preferring one whose
  // percentage falls in the admin's configured min/max range). Returns null
  // if none of the eligible products has an automatic discount right now.
  async function findProductWithRealDiscount(config) {
    const candidates = shuffle(getEligibleProducts(config));
    let fallback = null;
    for (const product of candidates) {
      const shopifyEntry = LWD.SHOPIFY_PRODUCTS[product.id];
      const variants = await LWD.Shopify.fetchVariants(shopifyEntry.shopifyProductId);
      const variant = variants[0];
      if (!variant) continue;
      const { pct } = await LWD.Shopify.checkAutomaticDiscount(variant.id);
      if (pct <= 0) continue;
      if (pct >= config.minDiscount && pct <= config.maxDiscount) return { product, discountPct: pct };
      if (!fallback) fallback = { product, discountPct: pct };
    }
    return fallback;
  }

  async function generateCampaign(config, now) {
    const found = await findProductWithRealDiscount(config);
    if (!found) return null;
    const campaign = {
      id: 'FLASH-' + now + '-' + Math.random().toString(36).slice(2, 6),
      productId: found.product.id,
      discountPct: found.discountPct,
      startedAt: now,
      endsAt: now + config.frequencyDays * 86400000,
    };
    save(KEY_CAMPAIGN, campaign);
    const log = loadLog();
    log.push({ campaignId: campaign.id, productId: found.product.id, discountPct: found.discountPct, periodStart: campaign.startedAt, periodEnd: campaign.endsAt, views: 0, clicks: 0, purchases: 0 });
    save(KEY_LOG, log);
    return campaign;
  }

  // Returns the current live campaign, creating/rotating it as needed. Returns
  // null when no offer should run right now (outside program window, capped,
  // nothing eligible in stock, or no eligible product has a real Shopify
  // automatic discount active).
  async function getOrCreateCampaign() {
    const config = loadConfig();
    const now = Date.now();
    if (!withinProgramWindow(config, now)) return null;
    if (config.maxRedemptions > 0 && getTotalRedemptions() >= config.maxRedemptions) return null;

    let campaign = loadCampaign();
    if (campaign && now < campaign.endsAt) {
      const product = LWD.getProduct(campaign.productId);
      const stillEligible = product && product.availability !== 'esgotado' && product.sizes.length >= config.minStockSizes;
      if (stillEligible) return campaign;
      // product sold out mid-cycle — roll a fresh campaign immediately
    }
    return generateCampaign(config, now);
  }

  function fmtMMSS(msLeft) {
    const total = Math.max(0, Math.floor(msLeft / 1000));
    const m = String(Math.floor(total / 60)).padStart(2, '0');
    const s = String(total % 60).padStart(2, '0');
    return `${m}:${s}`;
  }

  /* ---------------- popup rendering ---------------- */
  const popupRoot = $('#flash-popup-root');
  let countdownTimer = null;

  function anyBlockingOverlayOpen() {
    return !!document.querySelector('.drawer.is-open, .modal-box.is-open, .search-panel.is-open, .mobile-nav.is-open');
  }

  function closePopup() {
    if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
    popupRoot.innerHTML = '';
    document.removeEventListener('keydown', onPopupKeydown);
  }

  function onPopupKeydown(e) {
    if (e.key === 'Escape') declineOffer();
  }

  function declineOffer() {
    const state = loadOfferState();
    if (state) { state.status = 'declined'; saveOfferState(state); }
    closePopup();
  }

  function renderPopup(campaign, product, state) {
    const discounted = +(product.price * (1 - campaign.discountPct / 100)).toFixed(2);
    const sizesHTML = product.sizes.map(s => `<button type="button" class="flash-size-chip" data-size="${s}">${s}</button>`).join('');

    popupRoot.innerHTML = `
      <div class="flash-scrim"></div>
      <div class="flash-popup" role="dialog" aria-modal="true" aria-label="Oferta relâmpago surpresa">
        <button class="flash-close" type="button" aria-label="Fechar">
          <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>
        </button>
        <div class="flash-media">${LWD.productMedia(product)}</div>
        <div class="flash-body">
          <div class="flash-kicker" id="flash-kicker">VOCÊ DESBLOQUEOU UMA OFERTA SECRETA 🔥</div>
          <p class="flash-sub">Esta camisa foi selecionada para você com <strong>${campaign.discountPct}% de desconto</strong>.</p>
          <h3 class="flash-name">${LWD.fullName(product)}</h3>
          <div class="flash-price-row">
            <span class="flash-was">${euro(product.price)}</span>
            <span class="flash-now">${euro(discounted)}</span>
            <span class="flash-save">-${campaign.discountPct}%</span>
          </div>
          <div class="flash-sizes">
            <span class="flash-sizes-label">Tamanho</span>
            <div class="flash-size-row">${sizesHTML}</div>
            <p class="flash-size-error" id="flash-size-error" style="display:none;">Escolhe um tamanho para continuar.</p>
          </div>
          <div class="flash-urgency" id="flash-urgency">Você tem apenas <strong id="flash-countdown">10:00</strong> para garantir esta oferta. Depois disso, o preço volta ao normal.</div>
          <p class="flash-size-error" id="flash-checkout-error" style="display:none;"></p>
          <button class="btn btn-primary flash-cta" id="flash-cta" type="button">GARANTIR MINHA CAMISA AGORA</button>
          <p class="flash-cta-note">Vais ser encaminhado para o checkout seguro da Shopify com o desconto já aplicado.</p>
          <button class="flash-decline" id="flash-decline" type="button">Não quero aproveitar esta oferta</button>
        </div>
      </div>`;

    document.addEventListener('keydown', onPopupKeydown);
    $('.flash-scrim', popupRoot).addEventListener('click', declineOffer);
    $('.flash-close', popupRoot).addEventListener('click', declineOffer);
    $('#flash-decline', popupRoot).addEventListener('click', declineOffer);

    let selectedSize = null;
    popupRoot.querySelectorAll('.flash-size-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        popupRoot.querySelectorAll('.flash-size-chip').forEach(c => c.classList.remove('is-selected'));
        chip.classList.add('is-selected');
        selectedSize = chip.dataset.size;
        $('#flash-size-error').style.display = 'none';
      });
    });

    $('#flash-cta').addEventListener('click', () => {
      updateLog(campaign.id, (e) => ({ clicks: e.clicks + 1 }));
      if (!selectedSize) { $('#flash-size-error').style.display = 'block'; return; }
      const liveProduct = LWD.getProduct(product.id);
      if (!liveProduct || liveProduct.availability === 'esgotado' || !liveProduct.sizes.includes(selectedSize)) {
        $('#flash-size-error').textContent = 'Este tamanho deixou de estar disponível.';
        $('#flash-size-error').style.display = 'block';
        return;
      }
      acceptOffer(campaign, liveProduct, selectedSize, state);
    });

    tickCountdown(campaign, state, () => {
      // ran out of time while popup was still open and undecided
      const s = loadOfferState();
      if (s && s.status === 'shown') { s.status = 'expired'; saveOfferState(s); }
      closePopup();
    });
  }

  function tickCountdown(campaign, state, onExpire) {
    function tick() {
      const msLeft = state.acceptByTs - Date.now();
      if (msLeft <= 0) {
        if (countdownTimer) clearInterval(countdownTimer);
        onExpire();
        return;
      }
      const urgencyEl = $('#flash-urgency');
      if (msLeft <= 2 * 60000 && urgencyEl && !urgencyEl.classList.contains('is-critical')) {
        urgencyEl.classList.add('is-critical');
        urgencyEl.innerHTML = 'ÚLTIMA CHANCE: a sua oferta está prestes a desaparecer! <strong id="flash-countdown"></strong>';
      }
      const countdownEl = $('#flash-countdown');
      if (countdownEl) countdownEl.textContent = fmtMMSS(msLeft);
      const kickerEl = $('#flash-kicker');
      if (kickerEl && msLeft <= 2 * 60000) kickerEl.classList.add('is-critical');
    }
    tick();
    countdownTimer = setInterval(tick, 1000);
  }

  async function acceptOffer(campaign, product, size, state) {
    const shopifyEntry = LWD.SHOPIFY_PRODUCTS?.[product.id];
    const errorEl = $('#flash-checkout-error');
    const ctaBtn = $('#flash-cta');
    if (!shopifyEntry) {
      if (errorEl) { errorEl.textContent = 'Esta oferta não está disponível para checkout de momento.'; errorEl.style.display = 'block'; }
      return;
    }
    const originalText = ctaBtn.textContent;
    ctaBtn.disabled = true;
    ctaBtn.textContent = 'A preparar…';
    if (errorEl) errorEl.style.display = 'none';
    try {
      const variants = await LWD.Shopify.fetchVariants(shopifyEntry.shopifyProductId);
      const variant = LWD.Shopify.pickVariant(variants, size);
      if (!variant || !variant.availableForSale) {
        if (errorEl) { errorEl.textContent = 'Este tamanho deixou de estar disponível.'; errorEl.style.display = 'block'; }
        return;
      }
      const checkoutUrl = await LWD.Shopify.createCheckout(
        variant.id,
        [{ key: 'Tamanho', value: size }, { key: 'Oferta relâmpago', value: `-${campaign.discountPct}%` }]
      );
      if (!checkoutUrl) {
        if (errorEl) { errorEl.textContent = 'Não foi possível iniciar o checkout. Tenta novamente.'; errorEl.style.display = 'block'; }
        return;
      }
      state.status = 'accepted';
      saveOfferState(state);
      bumpTotalRedemptions();
      updateLog(campaign.id, (entry) => ({ purchases: entry.purchases + 1 }));
      window.location.href = checkoutUrl;
    } catch (err) {
      if (errorEl) { errorEl.textContent = 'Erro ao contactar a loja. Tenta novamente.'; errorEl.style.display = 'block'; }
    } finally {
      ctaBtn.disabled = false;
      ctaBtn.textContent = originalText;
    }
  }

  /* ---------------- trigger scheduling ---------------- */
  async function maybeShowPopup() {
    if (sessionStorage.getItem(SESSION_KEY_SHOWN)) return;
    if (anyBlockingOverlayOpen()) { setTimeout(maybeShowPopup, 3000); return; }

    const campaign = await getOrCreateCampaign();
    if (!campaign) return;
    if (sessionStorage.getItem(SESSION_KEY_SHOWN)) return; // re-check: time passed awaiting Shopify
    const product = LWD.getProduct(campaign.productId);
    if (!product) return;

    let state = loadOfferState();
    if (state && state.campaignId === campaign.id) return; // already shown/declined/accepted/expired for this campaign
    if (state && state.campaignId !== campaign.id) state = null; // stale, from a previous campaign

    const now = Date.now();
    state = { campaignId: campaign.id, status: 'shown', poppedAt: now, acceptByTs: now + OFFER_MINUTES * 60000 };
    saveOfferState(state);
    sessionStorage.setItem(SESSION_KEY_SHOWN, '1');
    updateLog(campaign.id, (entry) => ({ views: entry.views + 1 }));

    renderPopup(campaign, product, state);
  }

  function init() {
    if (sessionStorage.getItem(SESSION_KEY_SHOWN)) return;

    const delayMs = (15 + Math.random() * 25) * 1000; // 15–40s
    const timerId = setTimeout(maybeShowPopup, delayMs);

    let interestArmed = false;
    setTimeout(() => { interestArmed = true; }, 5000); // ignore "interest" in the first 5s

    const interestHandler = () => {
      if (!interestArmed) return;
      document.removeEventListener('click', interestHandler, true);
      clearTimeout(timerId);
      maybeShowPopup();
    };
    // Only non-navigational interest signals: clicking a link (product photo/
    // name) would otherwise unload the page before the popup can render.
    document.addEventListener('click', (e) => {
      if (e.target.closest('.js-add-cart, .size-chip')) interestHandler();
    }, true);

    // Landing directly on a product page is itself a strong interest signal.
    if (document.body.dataset.page === 'product') setTimeout(interestHandler, 5000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
