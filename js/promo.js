/* ============================================================
   Low Wear — Promoção de inauguração "Escolha 6, pague 3"
   All dates/rules come from LWD.PROMO_CONFIG (js/data.js) — this file
   only renders UI off that config and off LWD.isPromoActive(). It never
   invents its own dates or eligibility logic.

   Honesty note: this file only builds the on-site preview (bar, hero,
   countdown, badges, popup, cart-progress hookup). The discount that
   actually lands at checkout is Shopify's own "Buy X get Y" automatic
   discount — see the setup note printed in initPromoCheckoutNote() and
   the admin instructions delivered separately. Nothing here can set a
   real price; only Shopify's discount engine can.
   ============================================================ */
(() => {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const LWD = window.LowWearData;
  if (!LWD) return;
  const CFG = LWD.PROMO_CONFIG;

  const SESSION_KEY_POPUP_SHOWN = 'lw_promo_popup_shown';

  function fmt2(n) { return String(n).padStart(2, '0'); }

  function timeLeftParts(now) {
    const end = new Date(CFG.promotionEnd).getTime();
    const ms = Math.max(0, end - now);
    return {
      ms,
      days: Math.floor(ms / 86400000),
      hours: Math.floor((ms % 86400000) / 3600000),
      minutes: Math.floor((ms % 3600000) / 60000),
      seconds: Math.floor((ms % 60000) / 1000),
    };
  }

  /* ---------------- layout: keep header below the fixed promo bar ---------------- */
  function layoutPromoBar() {
    const bar = $('#promo-bar');
    const h = (bar && !bar.hidden) ? bar.offsetHeight : 0;
    document.documentElement.style.setProperty('--promo-bar-h', h + 'px');
  }

  /* ---------------- countdown (shared by bar + hero section) ---------------- */
  let countdownTimer = null;
  function tickCountdown() {
    const { ms, days, hours, minutes, seconds } = timeLeftParts(Date.now());
    $$('.promo-countdown-d').forEach((el) => { el.textContent = days; });
    $$('.promo-countdown-h').forEach((el) => { el.textContent = fmt2(hours); });
    $$('.promo-countdown-m').forEach((el) => { el.textContent = fmt2(minutes); });
    $$('.promo-countdown-s').forEach((el) => { el.textContent = fmt2(seconds); });
    if (ms <= 0) {
      clearInterval(countdownTimer);
      deactivateCampaign();
    }
  }

  /* ---------------- show / hide every campaign element ---------------- */
  function activateCampaign() {
    $$('.promo-only').forEach((el) => { el.hidden = false; });
    layoutPromoBar();
    if (!countdownTimer) {
      tickCountdown();
      countdownTimer = setInterval(tickCountdown, 1000);
    }
  }

  function deactivateCampaign() {
    if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
    $$('.promo-only').forEach((el) => { el.hidden = true; el.remove(); });
    document.documentElement.style.setProperty('--promo-bar-h', '0px');
    const popup = $('#promo-popup-root');
    if (popup) popup.innerHTML = '';
  }

  /* ---------------- popup ---------------- */
  const popupRoot = $('#promo-popup-root');
  function anyBlockingOverlayOpen() {
    return !!document.querySelector('.drawer.is-open, .modal-box.is-open, .search-panel.is-open, .mobile-nav.is-open');
  }
  function closePromoPopup() {
    if (popupRoot) popupRoot.innerHTML = '';
    document.removeEventListener('keydown', onPopupKeydown);
  }
  function onPopupKeydown(e) { if (e.key === 'Escape') closePromoPopup(); }

  function renderPromoPopup() {
    if (!popupRoot || sessionStorage.getItem(SESSION_KEY_POPUP_SHOWN)) return;
    if (anyBlockingOverlayOpen()) { setTimeout(renderPromoPopup, 3000); return; }
    if (!LWD.isPromoActive()) return;
    sessionStorage.setItem(SESSION_KEY_POPUP_SHOWN, '1');

    popupRoot.innerHTML = `
      <div class="promo-popup-scrim"></div>
      <div class="promo-popup" role="dialog" aria-modal="true" aria-label="Promoção de inauguração">
        <button class="promo-popup-close" type="button" aria-label="Fechar">
          <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>
        </button>
        <p class="promo-popup-kicker">O SITE ABRIU COM UMA OFERTA GIGANTE.</p>
        <p class="promo-popup-headline">ESCOLHA 6 CAMISAS E PAGUE APENAS 3</p>
        <p class="promo-popup-text">Adicione seis camisas participantes ao carrinho e as três de menor valor ficam grátis automaticamente.</p>
        <a href="index.html#catalogo" class="btn btn-primary promo-popup-cta">COMEÇAR A ESCOLHER</a>
        <button type="button" class="promo-popup-later">Agora não</button>
      </div>`;
    document.addEventListener('keydown', onPopupKeydown);
    $('.promo-popup-scrim', popupRoot).addEventListener('click', closePromoPopup);
    $('.promo-popup-close', popupRoot).addEventListener('click', closePromoPopup);
    $('.promo-popup-later', popupRoot).addEventListener('click', closePromoPopup);
  }

  function schedulePopup() {
    if (document.body.dataset.page === 'checkout') return; // never on checkout (n/a here, but future-proof)
    if (sessionStorage.getItem(SESSION_KEY_POPUP_SHOWN)) return;
    const timerId = setTimeout(renderPromoPopup, 5000);
    let fired = false;
    const onScroll = () => {
      if (fired) return;
      const scrolled = window.scrollY + window.innerHeight;
      const total = document.documentElement.scrollHeight;
      if (total > 0 && scrolled / total >= 0.4) {
        fired = true;
        clearTimeout(timerId);
        window.removeEventListener('scroll', onScroll);
        renderPromoPopup();
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------------- "como funciona" modal open triggers ---------------- */
  $$('.js-promo-how').forEach((btn) => btn.addEventListener('click', (e) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('lw:open-overlay', { detail: { id: 'promo-how-modal' } }));
  }));
  // main.js owns openOverlay/closeAllOverlays; this event lets promo.js ask
  // for a modal to open without duplicating that machinery here.
  window.addEventListener('lw:open-overlay', (e) => {
    const el = document.getElementById(e.detail.id);
    if (el && window.LowWear && window.LowWear.openOverlay) window.LowWear.openOverlay(el);
  });

  /* ---------------- fill in the dates wherever the config text appears ---------------- */
  function fillDateText() {
    const startStr = new Date(CFG.promotionStart).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long' });
    const endStr = new Date(CFG.promotionEnd).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' });
    $$('.promo-date-start').forEach((el) => { el.textContent = startStr; });
    $$('.promo-date-end').forEach((el) => { el.textContent = endStr; });
  }

  function init() {
    if (!LWD.isPromoActive()) { deactivateCampaign(); return; }
    fillDateText();
    activateCampaign();
    schedulePopup();
    window.addEventListener('resize', layoutPromoBar);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
