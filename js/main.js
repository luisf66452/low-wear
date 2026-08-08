(() => {
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const LWD = window.LowWearData;
  const euro = LWD.euro;

  /* ---------------- Shopify checkout integration ----------------
     Products checkout for real through Shopify (Storefront API) instead
     of the site's local demo cart. The API calls themselves live in
     LWD.Shopify (js/data.js) so admin.html and flash-offer.js can reuse
     them without loading this whole file. The site's own size / version /
     personalization UI stays as-is — we just send the choice to Shopify as
     cart line-item attributes and hand off to Shopify's hosted checkout,
     since the Buy Button widget has no field for a custom name/number. */
  const SHOPIFY_PRODUCTS = LWD.SHOPIFY_PRODUCTS;

  /* ---------------- state ---------------- */
  const STORE_KEY_CART_ID = 'lw_shopify_cart_id';
  const STORE_KEY_FAV  = 'lw_fav';

  const loadJSON = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  };

  // The real Shopify cart (see LWD.Shopify in js/data.js), persisted by id
  // so a customer can add several products over several page visits before
  // finally checking out once, with everything in the same cart. Kept null
  // until the first successful add/load.
  let shopifyCart = null;
  let favs = loadJSON(STORE_KEY_FAV, []);

  const saveFavs = () => localStorage.setItem(STORE_KEY_FAV, JSON.stringify(favs));

  async function loadCartFromStorage() {
    const id = localStorage.getItem(STORE_KEY_CART_ID);
    if (!id) return;
    try {
      shopifyCart = await LWD.Shopify.getCart(id);
      if (!shopifyCart) localStorage.removeItem(STORE_KEY_CART_ID); // expired on Shopify's side
    } catch { shopifyCart = null; }
    updateCounts();
    renderCart();
  }

  async function addLineToCart(variantId, quantity, attributes) {
    if (shopifyCart && shopifyCart.id) {
      shopifyCart = await LWD.Shopify.addCartLine(shopifyCart.id, variantId, quantity, attributes);
    } else {
      shopifyCart = await LWD.Shopify.createCart(variantId, quantity, attributes);
      localStorage.setItem(STORE_KEY_CART_ID, shopifyCart.id);
    }
    updateCounts();
    renderCart();
    return shopifyCart;
  }

  async function updateCartLineQty(lineId, quantity) {
    if (!shopifyCart) return;
    shopifyCart = await LWD.Shopify.updateCartLine(shopifyCart.id, lineId, quantity);
    updateCounts();
    renderCart();
  }

  async function removeCartLine(lineId) {
    if (!shopifyCart) return;
    shopifyCart = await LWD.Shopify.removeCartLine(shopifyCart.id, lineId);
    updateCounts();
    renderCart();
  }

  async function applyCouponCode(code) {
    if (!shopifyCart || !shopifyCart.id) throw new Error('empty-cart');
    shopifyCart = await LWD.Shopify.applyDiscountCode(shopifyCart.id, code);
    renderCart();
    return shopifyCart;
  }

  async function removeCouponCode() {
    if (!shopifyCart || !shopifyCart.id) return;
    shopifyCart = await LWD.Shopify.removeDiscountCode(shopifyCart.id);
    renderCart();
  }

  /* ---------------- toast ---------------- */
  const toast = $('#toast');
  let toastTimer;
  function showToast(msg) {
    if (!toast) return;
    toast.querySelector('.toast-msg').textContent = msg;
    toast.classList.add('is-open');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-open'), 2600);
  }

  /* ---------------- scroll reveal ---------------- */
  const revealObserver = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' })
    : null;
  function observeReveals() {
    $$('.reveal:not(.is-visible)').forEach(el => {
      if (revealObserver) revealObserver.observe(el);
      else el.classList.add('is-visible');
    });
  }

  /* ---------------- overlays ---------------- */
  const scrim = $('#scrim');
  const cartDrawer = $('#cart-drawer');
  const favDrawer = $('#fav-drawer');
  const searchPanel = $('#search-panel');
  const mobileNav = $('#mobile-nav');

  const allOverlays = [cartDrawer, favDrawer, searchPanel, mobileNav, ...$$('.modal-box')].filter(Boolean);

  function closeAllOverlays() {
    allOverlays.forEach(el => { el.classList.remove('is-open'); el.setAttribute('inert', ''); });
    scrim?.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
  }

  function openOverlay(el) {
    closeAllOverlays();
    if (!el) return;
    el.classList.add('is-open');
    el.removeAttribute('inert');
    scrim?.classList.add('is-open');
    document.body.classList.add('no-scroll');
  }

  scrim?.addEventListener('click', closeAllOverlays);
  $$('[data-close-overlay]').forEach(b => b.addEventListener('click', closeAllOverlays));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAllOverlays(); });

  $('#cart-toggle')?.addEventListener('click', () => { openOverlay(cartDrawer); renderCart(); });
  $$('.js-cart-toggle').forEach(b => b.addEventListener('click', () => { openOverlay(cartDrawer); renderCart(); }));
  $('#fav-toggle')?.addEventListener('click', () => { openOverlay(favDrawer); renderFavDrawer(); });
  $$('.js-fav-toggle').forEach(b => b.addEventListener('click', () => { openOverlay(favDrawer); renderFavDrawer(); }));
  $('#search-toggle')?.addEventListener('click', () => { openOverlay(searchPanel); setTimeout(() => $('#search-input')?.focus(), 100); });
  $$('.js-search-toggle').forEach(b => b.addEventListener('click', () => { openOverlay(searchPanel); setTimeout(() => $('#search-input')?.focus(), 100); }));
  $('#account-toggle')?.addEventListener('click', () => openOverlay($('#login-modal')));
  $('#footer-account')?.addEventListener('click', (e) => { e.preventDefault(); openOverlay($('#login-modal')); });
  $('#footer-privacy')?.addEventListener('click', (e) => { e.preventDefault(); openOverlay($('#privacy-modal')); });
  $('#footer-terms')?.addEventListener('click', (e) => { e.preventDefault(); openOverlay($('#terms-modal')); });
  $('#footer-exchange')?.addEventListener('click', (e) => { e.preventDefault(); openOverlay($('#exchange-modal')); });
  $('#footer-faq')?.addEventListener('click', (e) => { e.preventDefault(); openOverlay($('#faq-modal')); });

  /* ---------------- sobre / unboxing — vídeos ----------------
     Only play a video once it's actually on screen — mobile browsers
     throttle or suspend off-screen <video> playback for battery/data
     reasons, and since these grids sit well below the fold, calling
     play() once at page load left every clip stuck paused on phones. */
  const aboutVideoCards = $$('.about-video-card');
  const videoObserver = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const video = $('.about-video', entry.target);
          if (!video) return;
          if (entry.isIntersecting) video.play().catch(() => {});
          else video.pause();
        });
      }, { threshold: 0.35 })
    : null;
  aboutVideoCards.forEach(card => {
    const video = $('.about-video', card);
    const muteBtn = $('.about-video-mute', card);
    if (!video) return;
    if (videoObserver) videoObserver.observe(card);
    else video.play().catch(() => {}); // no IntersectionObserver support — best effort
    video.addEventListener('error', () => card.classList.add('has-error'));
    muteBtn?.addEventListener('click', () => {
      video.muted = !video.muted;
      muteBtn.setAttribute('aria-pressed', String(!video.muted));
      muteBtn.setAttribute('aria-label', video.muted ? 'Ativar som' : 'Silenciar');
    });
  });
  $('#nav-toggle')?.addEventListener('click', () => openOverlay(mobileNav));

  /* ---------------- header on scroll ---------------- */
  const header = $('.site-header');
  const heroBgWord = $('.hero-bg-word');
  function onScroll() {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 40);
    if (heroBgWord) heroBgWord.style.transform = `translateY(${Math.min(window.scrollY, 600) * 0.15}px)`;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------------- cart ---------------- */
  // Reverse lookup so a Shopify cart line (which only knows the Shopify
  // numeric product id) can be matched back to our own catalog entry for
  // its name/photo/team, and — for the "escolha 6, pague 3" progress panel
  // — whether it's a participating product.
  const SHOPIFY_ID_TO_PRODUCT_ID = Object.fromEntries(
    Object.entries(LWD.SHOPIFY_PRODUCTS).map(([id, v]) => [v.shopifyProductId, id])
  );

  function renderCart() {
    const body = $('#drawer-body');
    const foot = $('#drawer-foot');
    if (!body) return;
    const lines = shopifyCart?.lines || [];
    if (lines.length === 0) {
      body.innerHTML = `
        <div class="drawer-empty">
          <svg viewBox="0 0 24 24"><path d="M3 6h2l2.4 12.2a2 2 0 0 0 2 1.8h8.5a2 2 0 0 0 2-1.6L21 8H6"/><circle cx="10" cy="21" r="1"/><circle cx="18" cy="21" r="1"/></svg>
          <p>O seu carrinho está vazio.<br>Adicione a sua próxima camisola.</p>
        </div>`;
      if (foot) foot.style.display = 'none';
      renderPromoProgress(lines);
      updateCounts();
      return;
    }
    if (foot) foot.style.display = 'block';
    body.innerHTML = lines.map((line) => {
      const productId = SHOPIFY_ID_TO_PRODUCT_ID[line.productId];
      const p = productId ? LWD.getProduct(productId) : null;
      const name = p ? LWD.fullName(p) : line.productTitle;
      const media = p ? LWD.productMedia(p) : '';
      const sizeAttr = line.attributes.find((a) => a.key === 'Tamanho');
      const otherAttrs = line.attributes.filter((a) => a.key !== 'Tamanho').map((a) => a.value).join(' · ');
      return `
      <div class="cart-line" data-line-id="${line.id}">
        <div class="cl-media${media.startsWith('<img') ? ' has-photo' : ''}">${media}</div>
        <div class="cl-info">
          <div class="cl-name">${name}</div>
          <div class="cl-meta">${sizeAttr ? `Tam. ${sizeAttr.value}` : line.variantTitle}${otherAttrs ? ` · ${otherAttrs}` : ''}</div>
          <div class="cl-row">
            <div class="qty-stepper">
              <button data-act="dec" aria-label="Diminuir quantidade">−</button>
              <span>${line.quantity}</span>
              <button data-act="inc" aria-label="Aumentar quantidade">+</button>
            </div>
            <span class="cl-price">${euro(line.lineTotal)}</span>
          </div>
          <button class="cl-remove" data-act="remove">Remover</button>
        </div>
      </div>`;
    }).join('');

    const totalsEl = $('#drawer-totals');
    if (totalsEl) {
      // cart.cost.subtotalAmount is already computed *after* discounts (both
      // automatic and code-based), so it always equals totalAmount — the
      // undiscounted total has to be rebuilt from each line's per-unit price.
      const originalTotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
      const savings = originalTotal - shopifyCart.total;
      totalsEl.innerHTML = savings > 0.004
        ? `<div class="drawer-subtotal drawer-subtotal-crossed"><span>Subtotal</span><span>${euro(originalTotal)}</span></div>
           <div class="drawer-subtotal drawer-subtotal-discount"><span>Desconto</span><span>−${euro(savings)}</span></div>
           <div class="drawer-subtotal"><span>Total</span><strong>${euro(shopifyCart.total)}</strong></div>`
        : `<div class="drawer-subtotal"><span>Total</span><strong>${euro(shopifyCart.total)}</strong></div>`;
    }
    renderCouponUI();
    renderPromoProgress(lines);
    updateCounts();
  }

  function renderCouponUI() {
    const msgEl = $('#cart-coupon-msg');
    const inputEl = $('#cart-coupon-input');
    if (!msgEl) return;
    const active = (shopifyCart?.discountCodes || []).find((d) => d.applicable);
    if (active) {
      msgEl.innerHTML = `<span class="coupon-ok">Código "${active.code}" aplicado.</span> <button type="button" class="coupon-remove" id="cart-coupon-remove">Remover</button>`;
      if (inputEl) inputEl.value = '';
    } else {
      const invalid = (shopifyCart?.discountCodes || []).find((d) => !d.applicable);
      msgEl.innerHTML = invalid ? `<span class="coupon-error">Código "${invalid.code}" inválido ou não aplicável a este carrinho.</span>` : '';
    }
  }

  $('#cart-coupon-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = $('#cart-coupon-input');
    const code = input?.value.trim();
    if (!code) return;
    if (!shopifyCart || !shopifyCart.lines?.length) {
      const msgEl = $('#cart-coupon-msg');
      if (msgEl) msgEl.innerHTML = `<span class="coupon-error">Adicione produtos ao carrinho antes de aplicar um código.</span>`;
      return;
    }
    const btn = $('#cart-coupon-btn');
    if (btn) btn.disabled = true;
    try {
      await applyCouponCode(code);
    } catch {
      const msgEl = $('#cart-coupon-msg');
      if (msgEl) msgEl.innerHTML = `<span class="coupon-error">Não foi possível aplicar este código. Tente novamente.</span>`;
    } finally {
      if (btn) btn.disabled = false;
    }
  });

  $('#drawer-foot')?.addEventListener('click', async (e) => {
    if (e.target.id === 'cart-coupon-remove') await removeCouponCode();
  });

  $('#drawer-body')?.addEventListener('click', async (e) => {
    const line = e.target.closest('.cart-line');
    if (!line || !shopifyCart) return;
    const lineId = line.dataset.lineId;
    const current = shopifyCart.lines.find((l) => l.id === lineId);
    if (!current) return;
    const act = e.target.dataset.act;
    try {
      if (act === 'inc') await updateCartLineQty(lineId, current.quantity + 1);
      if (act === 'dec') await updateCartLineQty(lineId, Math.max(1, current.quantity - 1));
      if (act === 'remove') await removeCartLine(lineId);
    } catch { showToast('Erro ao atualizar o carrinho. Tenta novamente.'); }
  });

  /* ---------------- "Escolha 6, pague 3" cart progress ----------------
     Reads live off the real cart, so it always matches what's actually
     there. This panel is a preview only — the discount that really lands
     is whatever Shopify's own Buy X Get Y automatic discount calculates
     at checkout (see PROMO_CONFIG note in js/data.js), so it's labelled
     as an estimate rather than a promise. */
  function renderPromoProgress(lines) {
    const el = $('#cart-promo-progress');
    if (!el) return;
    if (!LWD.isPromoActive()) { el.style.display = 'none'; el.innerHTML = ''; return; }

    const required = LWD.PROMO_CONFIG.requiredQuantity;
    const freeQty = LWD.PROMO_CONFIG.freeQuantity;

    const eligibleUnitPrices = [];
    lines.forEach((line) => {
      const productId = SHOPIFY_ID_TO_PRODUCT_ID[line.productId];
      if (productId && LWD.isPromoEligible(productId)) {
        for (let i = 0; i < line.quantity; i++) eligibleUnitPrices.push(line.unitPrice);
      }
    });
    const count = eligibleUnitPrices.length;
    el.style.display = 'block';

    if (count === 0) {
      el.innerHTML = `<p class="promo-progress-text">Adicione ${required} camisas participantes da promoção de inauguração para ativar "Escolha ${required}, pague ${required - freeQty}".</p>`;
      return;
    }
    if (count >= required) {
      const sorted = [...eligibleUnitPrices].sort((a, b) => a - b);
      const freeTotal = sorted.slice(0, freeQty).reduce((s, v) => s + v, 0);
      el.innerHTML = `
        <div class="promo-progress-active">
          <strong>🎉 PROMOÇÃO ATIVADA!</strong>
          <p>Escolheu ${count} camisas participantes${count > required ? ` — a promoção aplica-se às primeiras ${required}` : ''}, e vai pagar apenas pelas ${required - freeQty} de maior valor.</p>
          <p class="promo-progress-savings">Poupança estimada: ${euro(freeTotal)} <span class="promo-progress-note">(confirmada no checkout)</span></p>
        </div>`;
      return;
    }
    const remaining = required - count;
    const messages = {
      1: 'Ótima escolha! Adicione mais 5 camisas para ativar a promoção.',
      2: 'Faltam 4 camisas para desbloquear a promoção.',
      3: 'Faltam 3 camisas para desbloquear a promoção.',
      4: 'Faltam 2 camisas para desbloquear a promoção.',
      5: 'Falta apenas 1 camisa para ativar a oferta.',
    };
    el.innerHTML = `
      <p class="promo-progress-text">${messages[count] || `Faltam ${remaining} camisas para desbloquear a promoção.`}</p>
      <div class="promo-progress-bar"><div class="promo-progress-fill" style="width:${Math.min(100, (count / required) * 100)}%"></div></div>
      <a href="index.html#catalogo" class="btn btn-ghost btn-sm promo-progress-cta">ESCOLHER MAIS UMA</a>`;
  }

  function updateCounts() {
    const cartCount = (shopifyCart?.lines || []).reduce((s, l) => s + l.quantity, 0);
    $$('.js-cart-count').forEach(el => { el.textContent = cartCount; el.style.display = cartCount ? 'flex' : 'none'; });
    $$('.js-fav-count').forEach(el => { el.textContent = favs.length; el.style.display = favs.length ? 'flex' : 'none'; });
  }

  /* ---------------- favorites ---------------- */
  function toggleFav(id) {
    if (favs.includes(id)) { favs = favs.filter(f => f !== id); showToast('Removido dos favoritos'); }
    else { favs.push(id); showToast('Adicionado aos favoritos'); }
    saveFavs();
    updateCounts();
    $$(`.product-card[data-id="${id}"] .fav-btn`).forEach(b => b.classList.toggle('is-active', favs.includes(id)));
    if (favDrawer?.classList.contains('is-open')) renderFavDrawer();
  }

  function renderFavDrawer() {
    const body = $('#fav-drawer-body');
    if (!body) return;
    const products = favs.map(id => LWD.getProduct(id)).filter(Boolean);
    if (products.length === 0) {
      body.innerHTML = `
        <div class="drawer-empty">
          <svg viewBox="0 0 24 24"><path d="M12 21s-7-4.6-9.5-9C.6 8.4 2.4 4.5 6.3 4.1 8.7 3.9 10.7 5 12 6.8 13.3 5 15.3 3.9 17.7 4.1c3.9.4 5.7 4.3 3.8 7.9C19 16.4 12 21 12 21Z"/></svg>
          <p>Ainda sem favoritos.<br>Toque no coração de uma camisola para a guardar aqui.</p>
        </div>`;
      return;
    }
    body.innerHTML = products.map(p => `
      <div class="cart-line" data-id="${p.id}">
        <div class="cl-media${p.photos && p.photos.length ? ' has-photo' : ''}">${LWD.productMedia(p)}</div>
        <div class="cl-info">
          <div class="cl-name">${LWD.fullName(p)}</div>
          <div class="cl-meta">${LWD.TYPE_LABEL[p.type]} · ${p.season} · ${euro(p.price)}</div>
          <div class="cl-row">
            <a class="btn btn-ghost btn-sm" href="produto.html?id=${p.id}">Ver produto</a>
          </div>
          <button class="cl-remove" data-act="unfav">Remover</button>
        </div>
      </div>`).join('');
  }

  $('#fav-drawer-body')?.addEventListener('click', (e) => {
    if (e.target.dataset.act === 'unfav') {
      const line = e.target.closest('.cart-line');
      toggleFav(line.dataset.id);
    }
  });

  /* ---------------- product card builder ---------------- */
  function tagClass(tag) {
    switch (tag) {
      case 'Novo': return 'tag-new';
      case 'Mais vendido': return 'tag-best';
      case 'Edição especial': return 'tag-limited';
      case 'Retro': return 'tag-retro';
      case 'Últimas unidades': return 'tag-sale';
      case 'Esgotado': return 'tag-off';
      default: return 'tag-off';
    }
  }

  function productCardHTML(p, i) {
    const team = LWD.getTeam(p.teamSlug);
    const esgotado = p.availability === 'esgotado';
    const delay = (typeof i === 'number') ? `style="--reveal-delay:${(i % 8) * 60}ms;"` : '';
    const sizesHTML = ['S', 'M', 'L', 'XL'].map(s => {
      const avail = p.sizes.includes(s) && !esgotado;
      return `<button class="size-chip${avail ? '' : ' is-disabled'}" ${avail ? '' : 'disabled'}>${s}</button>`;
    }).join('');
    return `
      <article class="product-card reveal${esgotado ? ' is-esgotado' : ''}" data-id="${p.id}" ${delay}>
        ${p.tag ? `<div class="kit-tag ${tagClass(p.tag)}">${p.tag}</div>` : ''}
        <button class="fav-btn${favs.includes(p.id) ? ' is-active' : ''}" aria-label="Adicionar aos favoritos">
          <svg viewBox="0 0 24 24"><path d="M12 21s-7-4.6-9.5-9C.6 8.4 2.4 4.5 6.3 4.1 8.7 3.9 10.7 5 12 6.8 13.3 5 15.3 3.9 17.7 4.1c3.9.4 5.7 4.3 3.8 7.9C19 16.4 12 21 12 21Z"/></svg>
        </button>
        <a class="product-media${p.photos && p.photos.length ? ' has-photo' : ''}" href="produto.html?id=${p.id}">${LWD.productMedia(p)}</a>
        <div class="product-info">
          <div class="p-eyebrow"><span>${team.name}</span><span>${p.season}</span></div>
          <h3><a href="produto.html?id=${p.id}">${p.name}</a></h3>
          <div class="p-price">
            <span class="now">${euro(p.price)}</span>
            ${p.was ? `<span class="was">${euro(p.was)}</span>` : ''}
          </div>
          ${(!esgotado && LWD.isPromoActive() && LWD.isPromoEligible(p.id)) ? `<div class="promo-card-badge">LEVE 6 · PAGUE 3</div>` : ''}
          ${esgotado ? `<div class="p-stock">Esgotado — nova reposição em breve</div>` : ''}
          <div class="size-row">${sizesHTML}</div>
          <div class="product-actions">
            <a class="btn btn-primary btn-block" href="produto.html?id=${p.id}">Ver produto</a>
          </div>
        </div>
      </article>`;
  }

  function wireProductGrid(container) {
    if (!container || container.dataset.wired) return;
    container.dataset.wired = '1';
    container.addEventListener('click', (e) => {
      const card = e.target.closest('.product-card');
      if (!card) return;
      const id = card.dataset.id;

      if (e.target.closest('.size-chip')) {
        const chip = e.target.closest('.size-chip');
        if (chip.disabled) return;
        $$('.size-chip', card).forEach(c => c.classList.remove('is-selected'));
        chip.classList.add('is-selected');
        return;
      }
      if (e.target.closest('.fav-btn')) {
        e.preventDefault();
        toggleFav(id);
      }
    });
  }

  /* ---------------- team card builder ---------------- */
  function teamCardHTML(t, i) {
    const count = LWD.getProductsByTeam(t.slug).length;
    const delay = (typeof i === 'number') ? `--reveal-delay:${(i % 8) * 70}ms;` : '';
    return `
      <a class="team-card reveal" href="equipa.html?slug=${t.slug}" style="--team-color:${t.main};${delay}">
        <div class="team-media">${LWD.jerseySVG(t.main, t.trim)}</div>
        <div class="team-crest">${t.short.slice(0, 2).toUpperCase()}</div>
        <div class="team-card-body">
          <span class="team-count">${count} modelos disponíveis</span>
          <h3>${t.name}</h3>
          <span class="btn btn-primary btn-sm">Ver camisas</span>
        </div>
      </a>`;
  }

  function renderTeamGrid(container) {
    if (!container) return;
    container.innerHTML = LWD.TEAMS.map(teamCardHTML).join('');
  }

  /* ---------------- catalog (filters) ---------------- */
  function renderCatalog() {
    const grid = $('#catalog-grid');
    if (!grid) return;
    const vals = {
      equipa: $('#f-equipa')?.value || '',
      tipo: $('#f-tipo')?.value || '',
      temporada: $('#f-temporada')?.value || '',
      tamanho: $('#f-tamanho')?.value || '',
      preco: $('#f-preco')?.value || '',
      disponibilidade: $('#f-disponibilidade')?.value || '',
    };
    const results = LWD.PRODUCTS.filter(p => {
      // "Catálogo completo" agora é o catálogo brasileiro — o futebol
      // português vive só na secção #futebol-portugues (ver country:'PT').
      const team = LWD.getTeam(p.teamSlug);
      if (team && team.country === 'PT') return false;
      if (vals.equipa && p.teamSlug !== vals.equipa) return false;
      if (vals.tipo && p.type !== vals.tipo) return false;
      if (vals.temporada && p.season !== vals.temporada) return false;
      if (vals.tamanho && !p.sizes.includes(vals.tamanho)) return false;
      if (vals.disponibilidade && p.availability !== vals.disponibilidade) return false;
      if (vals.preco === 'baixo' && p.price > 85) return false;
      if (vals.preco === 'medio' && (p.price <= 85 || p.price > 95)) return false;
      if (vals.preco === 'alto' && p.price <= 95) return false;
      return true;
    });
    grid.innerHTML = results.length
      ? results.map(productCardHTML).join('')
      : `<p style="grid-column:1/-1;padding:40px;text-align:center;color:var(--muted);">Sem camisolas para estes filtros.</p>`;
    wireProductGrid(grid);
    observeReveals();
    const countEl = $('#filter-count');
    if (countEl) countEl.textContent = `${results.length} camisola${results.length === 1 ? '' : 's'}`;
  }

  $$('.filter-bar select').forEach(s => s.addEventListener('change', renderCatalog));

  /* ---------------- featured ---------------- */
  function renderFeatured(container) {
    if (!container) return;
    const products = LWD.FEATURED_IDS.map(id => LWD.getProduct(id)).filter(Boolean);
    container.innerHTML = products.map(productCardHTML).join('');
    wireProductGrid(container);
  }

  /* ---------------- Futebol Português ----------------
     Separate section, not mixed into the Brazilian catalog/featured
     grids. Pulls every product whose team has country:'PT' (see
     TEAMS in js/data.js), so adding Benfica/Sporting/Porto later is
     just adding their team + products there — nothing here to touch.
     The whole section hides itself if no PT product exists yet. */
  function renderPortugalSection() {
    const section = $('#futebol-portugues');
    const grid = $('#pt-grid');
    const strip = $('#pt-teaser-strip');
    if (!section || !grid) return;
    const ptTeamSlugs = LWD.TEAMS.filter(t => t.country === 'PT').map(t => t.slug);
    const products = LWD.PRODUCTS.filter(p => ptTeamSlugs.includes(p.teamSlug));
    if (!products.length) { section.hidden = true; if (strip) strip.hidden = true; return; }
    section.hidden = false;
    if (strip) strip.hidden = false;
    grid.innerHTML = products.map(productCardHTML).join('');
    wireProductGrid(grid);
  }

  /* ---------------- search ---------------- */
  const searchInput = $('#search-input');
  const searchResults = $('#search-results');
  searchInput?.addEventListener('input', () => {
    const q = searchInput.value.trim().toLowerCase();
    if (!searchResults) return;
    if (!q) { searchResults.innerHTML = ''; return; }
    const matches = LWD.PRODUCTS.filter(p => {
      const team = LWD.getTeam(p.teamSlug);
      return LWD.fullName(p).toLowerCase().includes(q) || team.name.toLowerCase().includes(q) || team.short.toLowerCase().includes(q);
    }).slice(0, 8);
    searchResults.innerHTML = matches.length
      ? matches.map(p => `
        <a class="search-result-item" href="produto.html?id=${p.id}">
          ${LWD.productMedia(p)}
          <span><span class="sr-name">${LWD.fullName(p)}</span><span class="sr-price">${euro(p.price)}</span></span>
        </a>`).join('')
      : `<p style="color:var(--muted);font-family:var(--font-mono);font-size:12px;">Sem resultados para "${q}"</p>`;
  });

  /* ---------------- header anchors: Lançamentos / Mais vendidos ---------------- */
  $$('.js-filter-novo').forEach(a => a.addEventListener('click', (e) => {
    if (!$('#catalog-grid')) return;
    e.preventDefault();
    const sel = $('#f-tipo'); if (sel) sel.value = '';
    document.querySelector('#catalogo')?.scrollIntoView({ behavior: 'smooth' });
  }));
  $$('.js-scroll-featured').forEach(a => a.addEventListener('click', (e) => {
    if (!$('#featured-grid')) return;
    e.preventDefault();
    document.querySelector('#mais-procuradas')?.scrollIntoView({ behavior: 'smooth' });
  }));

  /* ---------------- newsletter ----------------
     Signs the email up for real via LWD.Shopify.newsletterSignup (creates a
     Shopify customer with marketing consent — visible in Shopify Admin →
     Customers), instead of just showing a toast and discarding it. */
  $('#newsletter-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = $('#newsletter-email');
    const btn = e.target.querySelector('button[type="submit"]');
    const email = input.value.trim();
    if (!email) return;
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'A inscrever…';
    try {
      await LWD.Shopify.newsletterSignup(email);
      showToast('Inscrição confirmada. Bem-vindo à bancada.');
      input.value = '';
    } catch (err) {
      showToast('Não foi possível concluir a inscrição. Tenta novamente.');
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  });

  /* ---------------- login modal switch ---------------- */
  $('#to-register')?.addEventListener('click', () => { openOverlay($('#register-modal')); });
  $('#to-login')?.addEventListener('click', () => { openOverlay($('#login-modal')); });
  $$('#login-modal form, #register-modal form').forEach(f => f.addEventListener('submit', (e) => {
    e.preventDefault(); closeAllOverlays(); showToast('Sessão iniciada com sucesso');
  }));

  /* ---------------- checkout ---------------- */
  $('#checkout-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    if (!shopifyCart || !shopifyCart.lines.length) { showToast('O seu carrinho está vazio'); return; }
    window.location.href = shopifyCart.checkoutUrl;
  });

  /* ---------------- size guide ---------------- */
  $$('.size-guide-link').forEach(l => l.addEventListener('click', (e) => { e.preventDefault(); openOverlay($('#size-guide-modal')); }));

  /* ============================================================
     TEAM PAGE (equipa.html?slug=...)
     ============================================================ */
  function initTeamPage() {
    const root = $('[data-page="team"]');
    if (!root) return;
    const params = new URLSearchParams(location.search);
    const slug = params.get('slug') || 'selecao';
    const team = LWD.getTeam(slug) || LWD.TEAMS[0];
    let products = LWD.getProductsByTeam(team.slug);

    document.title = `${team.name} — Low Wear`;
    $('#team-name').textContent = team.tagline;
    $('#team-text').textContent = team.text;
    $('#team-count').textContent = `${products.length} modelos disponíveis`;
    $('.team-banner').style.setProperty('--team-color', team.main);
    $$('.js-team-name').forEach(el => el.textContent = team.name);

    const grid = $('#team-products-grid');
    function renderTeamProducts() {
      const sort = $('#team-sort')?.value || 'novidade';
      const sorted = [...products];
      if (sort === 'preco-asc') sorted.sort((a, b) => a.price - b.price);
      else if (sort === 'preco-desc') sorted.sort((a, b) => b.price - a.price);
      else if (sort === 'popularidade') sorted.sort((a, b) => (b.tag === 'Mais vendido' ? 1 : 0) - (a.tag === 'Mais vendido' ? 1 : 0));
      grid.innerHTML = sorted.map(productCardHTML).join('');
      wireProductGrid(grid);
      observeReveals();
    }
    $('#team-sort')?.addEventListener('change', renderTeamProducts);
    renderTeamProducts();
  }

  /* ============================================================
     PRODUCT PAGE (produto.html?id=...)
     ============================================================ */
  function initProductPage() {
    const root = $('[data-page="product"]');
    if (!root) return;
    const params = new URLSearchParams(location.search);
    const id = params.get('id') || LWD.PRODUCTS[0].id;
    const p = LWD.getProduct(id) || LWD.PRODUCTS[0];
    const team = LWD.getTeam(p.teamSlug);

    document.title = `${LWD.fullName(p)} | Low Wear`;
    $('#breadcrumb-team').textContent = team.name;
    $('#breadcrumb-team').href = `equipa.html?slug=${team.slug}`;
    $('#breadcrumb-product').textContent = p.name;
    $('#pdp-name').textContent = LWD.fullName(p);
    $('#pdp-sub').textContent = `${LWD.TYPE_LABEL[p.type]} · Temporada ${p.season}`;
    $('#pdp-price').innerHTML = p.was
      ? `<span>${euro(p.price)}</span><span class="was">${euro(p.was)}</span>`
      : `<span>${euro(p.price)}</span>`;

    const promoBadgeEl = $('#pdp-promo-badge');
    if (promoBadgeEl) {
      promoBadgeEl.innerHTML = (p.availability !== 'esgotado' && LWD.isPromoActive() && LWD.isPromoEligible(p.id))
        ? `<div class="promo-card-badge promo-pdp-badge">LEVE 6 · PAGUE 3</div>
           <p class="promo-pdp-note">Produto participante da promoção de inauguração. <a href="#" class="js-promo-how">Ver regras da promoção</a></p>`
        : '';
    }

    if (p.tag) {
      $('#pdp-tag').textContent = p.tag;
      $('#pdp-tag').className = `kit-tag ${tagClass(p.tag)}`;
      $('#pdp-tag').style.position = 'static';
    } else {
      $('#pdp-tag').style.display = 'none';
    }
    $('#pdp-type-tag').textContent = LWD.TYPE_LABEL[p.type];

    const gallery = LWD.productGallery(p);
    const hasPhoto = !!(p.photos && p.photos.length);
    const thumbsEl = $('#pdp-thumbs');
    const mainOuter = $('#pdp-main');
    const mainEl = $('#pdp-main-media');
    const zoomHint = $('#zoom-hint');
    const spinHint = $('#spin-hint');
    thumbsEl.innerHTML = gallery.map((media, i) => `<button class="pdp-thumb${i === 0 ? ' is-active' : ''}${hasPhoto ? ' has-photo' : ''}" aria-label="Imagem ${i + 1}">${media}</button>`).join('');
    mainOuter.classList.toggle('has-photo', hasPhoto);
    mainEl.innerHTML = gallery[0];
    $$('.pdp-thumb', thumbsEl).forEach((thumb, i) => thumb.addEventListener('click', () => {
      $$('.pdp-thumb', thumbsEl).forEach(t => t.classList.remove('is-active'));
      thumb.classList.add('is-active');
      mainEl.innerHTML = gallery[i];
    }));

    const spinFrames = (p.spin && p.spin.length > 1) ? p.spin : null;
    if (spinFrames) {
      mainOuter.classList.add('has-spin');
      if (zoomHint) zoomHint.style.display = 'none';
      if (spinHint) spinHint.style.display = 'flex';
      let frameIndex = 0;
      let dragStartX = 0;
      let dragStartIndex = 0;
      let dragging = false;
      let dragMoved = 0;
      const setFrame = (i) => {
        frameIndex = ((i % spinFrames.length) + spinFrames.length) % spinFrames.length;
        mainEl.innerHTML = `<img src="${spinFrames[frameIndex]}" alt="${LWD.fullName(p)} — ângulo ${frameIndex + 1}">`;
      };
      mainOuter.addEventListener('pointerdown', (e) => {
        dragging = true; dragMoved = 0;
        dragStartX = e.clientX; dragStartIndex = frameIndex;
        mainOuter.classList.add('is-dragging');
        mainOuter.setPointerCapture(e.pointerId);
      });
      const pxPerFrame = Math.max(320 / spinFrames.length, 8);
      mainOuter.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        const dx = e.clientX - dragStartX;
        dragMoved = Math.abs(dx);
        setFrame(dragStartIndex - Math.round(dx / pxPerFrame));
      });
      mainOuter.addEventListener('pointerup', () => { dragging = false; mainOuter.classList.remove('is-dragging'); });
      mainOuter.addEventListener('pointerleave', () => { dragging = false; mainOuter.classList.remove('is-dragging'); });
    } else {
      mainOuter.addEventListener('click', () => mainOuter.classList.toggle('is-zoomed'));
    }

    const sizesEl = $('#pdp-sizes');
    const esgotado = p.availability === 'esgotado';
    sizesEl.innerHTML = ['S', 'M', 'L', 'XL'].map(s => {
      const avail = p.sizes.includes(s) && !esgotado;
      return `<button class="size-chip${avail ? '' : ' is-disabled'}" ${avail ? '' : 'disabled'}>${s}</button>`;
    }).join('');
    $$('.size-chip', sizesEl).forEach(chip => chip.addEventListener('click', () => {
      if (chip.disabled) return;
      $$('.size-chip', sizesEl).forEach(c => c.classList.remove('is-selected'));
      chip.classList.add('is-selected');
    }));
    if (esgotado) {
      $('#pdp-stock-note').style.display = 'block';
      $('#pdp-stock-note').textContent = 'Esgotado nesta seleção de tamanhos — nova reposição em breve.';
    } else if (p.availability === 'ultimas-unidades') {
      $('#pdp-stock-note').style.display = 'block';
      $('#pdp-stock-note').textContent = 'Últimas unidades disponíveis nesta referência.';
    }

    const versionWrap = $('#version-toggle');
    let selectedVersion = 'Adepto';
    if (versionWrap) {
      $$('.version-toggle button', versionWrap).forEach(btn => btn.addEventListener('click', () => {
        $$('.version-toggle button', versionWrap).forEach(b => b.classList.remove('is-selected'));
        btn.classList.add('is-selected');
        selectedVersion = btn.textContent.trim();
      }));
    }

    const pdpTabs = $$('.pdp-tab-btn');
    pdpTabs.forEach(btn => btn.addEventListener('click', () => {
      pdpTabs.forEach(b => b.classList.remove('is-active'));
      $$('.pdp-tab-panel').forEach(pn => pn.classList.remove('is-active'));
      btn.classList.add('is-active');
      $(`#tab-${btn.dataset.tab}`)?.classList.add('is-active');
    }));

    function buildPdpProduct() {
      const selected = $('.size-chip.is-selected', sizesEl);
      if (!selected) { showToast('Escolha um tamanho'); return null; }
      const nameInput = $('#custom-name');
      const numInput = $('#custom-number');
      let custom = '';
      if (nameInput?.value || numInput?.value) custom = `${nameInput.value.toUpperCase()} ${numInput.value}`.trim();
      return {
        id: p.id, name: LWD.fullName(p), type: LWD.TYPE_LABEL[p.type],
        price: p.price + (custom ? 8 : 0), size: selected.textContent.trim(),
        custom, version: versionWrap ? selectedVersion : '',
        media: gallery[0],
      };
    }
    const shopifyMap = SHOPIFY_PRODUCTS[p.id];
    const addBtn = $('#pdp-add-cart');
    const buyBtn = $('#pdp-buy-now');
    if (shopifyMap) {
      const runAdd = async (btn, { goToCheckout }) => {
        const item = buildPdpProduct();
        if (!item) return;
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'A preparar…';
        try {
          const variants = await LWD.Shopify.fetchVariants(shopifyMap.shopifyProductId);
          const variant = LWD.Shopify.pickVariant(variants, item.size);
          if (!variant || !variant.availableForSale) {
            showToast('Este tamanho está esgotado.');
            return;
          }
          const attributes = [{ key: 'Tamanho', value: item.size }];
          if (item.version) attributes.push({ key: 'Versão', value: item.version });
          if (item.custom) attributes.push({ key: 'Personalização', value: item.custom });
          await addLineToCart(variant.id, 1, attributes);
          if (goToCheckout) {
            window.location.href = shopifyCart.checkoutUrl;
          } else {
            showToast(`${LWD.fullName(p)} adicionada ao carrinho`);
            openOverlay(cartDrawer);
          }
        } catch (err) {
          showToast('Erro ao contactar a loja. Tenta novamente.');
        } finally {
          btn.disabled = false;
          btn.textContent = originalText;
        }
      };
      addBtn?.addEventListener('click', () => runAdd(addBtn, { goToCheckout: false }));
      buyBtn?.addEventListener('click', () => runAdd(buyBtn, { goToCheckout: true }));
    } else {
      addBtn?.addEventListener('click', () => showToast('Este produto ainda não está disponível para compra.'));
      buyBtn?.addEventListener('click', () => showToast('Este produto ainda não está disponível para compra.'));
    }

    const favBtn = $('#pdp-fav-btn');
    if (favBtn) {
      favBtn.classList.toggle('is-active', favs.includes(p.id));
      favBtn.addEventListener('click', () => { toggleFav(p.id); favBtn.classList.toggle('is-active', favs.includes(p.id)); });
    }

    $$('.js-team-name').forEach(el => el.textContent = team.name);
    const related = LWD.getProductsByTeam(p.teamSlug).filter(rp => rp.id !== p.id).slice(0, 4);
    const relatedGrid = $('#related-grid');
    if (relatedGrid) {
      relatedGrid.innerHTML = related.map(productCardHTML).join('');
      wireProductGrid(relatedGrid);
    }
  }

  /* ---------------- boot ---------------- */
  renderTeamGrid($('#team-grid'));
  renderFeatured($('#featured-grid'));
  renderPortugalSection();
  if ($('#catalog-grid')) renderCatalog();
  initTeamPage();
  initProductPage();
  updateCounts();
  observeReveals();
  loadCartFromStorage();

  window.LowWear = { toggleFav, openOverlay, closeAllOverlays };
})();
