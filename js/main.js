(() => {
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const LWD = window.LowWearData;
  const euro = LWD.euro;

  /* ---------------- Shopify checkout integration ----------------
     Products listed here check out for real through Shopify (Storefront
     API) instead of the site's local demo cart. The site's own size /
     version / personalization UI stays as-is — we just send the choice
     to Shopify as cart line-item attributes and hand off to Shopify's
     hosted checkout, since the Buy Button widget has no field for a
     custom name/number. Add an entry per product as it goes live on Shopify. */
  const SHOPIFY_DOMAIN = 'rbdfwr-dv.myshopify.com';
  const SHOPIFY_STOREFRONT_TOKEN = 'e8db550bd1d8b8f84400bf90b6df3bf6';
  const SHOPIFY_API_VERSION = '2024-01';
  const SHOPIFY_PRODUCTS = {
    'sel-principal-24': { shopifyProductId: '16381716201821' },
    'sel-especial-24': { shopifyProductId: '16381717447005' },
    'sel-alt-24': { shopifyProductId: '16381716857181' },
    'fla-principal-24': { shopifyProductId: '16381717807453' },
    'fla-alt-24': { shopifyProductId: '16381718331741' },
    'fla-extra-24': { shopifyProductId: '16381721051485' },
    'cor-principal-24': { shopifyProductId: '16381721215325' },
    'cor-extra-24': { shopifyProductId: '16381721674077' },
    'sao-principal-24': { shopifyProductId: '16381721903453' },
    'sao-retro': { shopifyProductId: '16381722263901' },
    'pal-principal-24': { shopifyProductId: '16381722362205' },
    'pal-retro': { shopifyProductId: '16381722624349' },
    'santos-principal-24': { shopifyProductId: '16381722755421' },
    'santos-extra-24': { shopifyProductId: '16381723050333' },
    'cru-principal-24': { shopifyProductId: '16381724131677' },
    'cru-alt-24': { shopifyProductId: '16381724328285' },
  };

  async function shopifyGraphQL(query, variables) {
    const res = await fetch(`https://${SHOPIFY_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_TOKEN },
      body: JSON.stringify({ query, variables }),
    });
    return res.json();
  }

  async function fetchShopifyVariants(productId) {
    const result = await shopifyGraphQL(
      `query($id: ID!) { product(id: $id) { variants(first: 20) { edges { node {
        id availableForSale selectedOptions { name value }
      } } } } }`,
      { id: `gid://shopify/Product/${productId}` }
    );
    return result?.data?.product?.variants?.edges.map((e) => e.node) || [];
  }

  function pickShopifyVariant(variants, size) {
    if (!variants.length) return null;
    if (variants.length === 1) return variants[0];
    const match = variants.find((v) => v.selectedOptions.some((o) => o.value.toUpperCase() === String(size).toUpperCase()));
    return match || variants[0];
  }

  async function createShopifyCheckout(variantId, attributes) {
    const result = await shopifyGraphQL(
      `mutation($input: CartInput!) { cartCreate(input: $input) {
        cart { checkoutUrl }
        userErrors { field message }
      } }`,
      { input: { lines: [{ quantity: 1, merchandiseId: variantId, attributes }] } }
    );
    const errors = result?.data?.cartCreate?.userErrors;
    if (errors && errors.length) throw new Error(errors.map((e) => e.message).join(', '));
    return result?.data?.cartCreate?.cart?.checkoutUrl || null;
  }

  /* ---------------- state ---------------- */
  const STORE_KEY_CART = 'lw_cart';
  const STORE_KEY_FAV  = 'lw_fav';

  const loadJSON = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  };

  let cart = loadJSON(STORE_KEY_CART, []);
  let favs = loadJSON(STORE_KEY_FAV, []);

  const saveCart = () => localStorage.setItem(STORE_KEY_CART, JSON.stringify(cart));
  const saveFavs = () => localStorage.setItem(STORE_KEY_FAV, JSON.stringify(favs));

  // Lets other independently-loaded modules (e.g. js/flash-offer.js) write to lw_cart
  // via localStorage and ask this module to re-read + re-render + open the drawer,
  // without any direct coupling between the two scripts.
  window.addEventListener('lw:cart-sync', () => { cart = loadJSON(STORE_KEY_CART, []); renderCart(); });
  window.addEventListener('lw:open-cart', () => { cart = loadJSON(STORE_KEY_CART, []); openOverlay(cartDrawer); renderCart(); });

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

  /* ---------------- sobre — vídeos de relatos ---------------- */
  $$('.about-video-card').forEach(card => {
    const video = $('.about-video', card);
    const muteBtn = $('.about-video-mute', card);
    if (!video) return;
    video.play().catch(() => {}); // ignore autoplay-blocked rejections; user can still tap to play
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
  function renderCart() {
    const body = $('#drawer-body');
    const foot = $('#drawer-foot');
    if (!body) return;
    if (cart.length === 0) {
      body.innerHTML = `
        <div class="drawer-empty">
          <svg viewBox="0 0 24 24"><path d="M3 6h2l2.4 12.2a2 2 0 0 0 2 1.8h8.5a2 2 0 0 0 2-1.6L21 8H6"/><circle cx="10" cy="21" r="1"/><circle cx="18" cy="21" r="1"/></svg>
          <p>O seu carrinho está vazio.<br>Adicione a sua próxima camisola.</p>
        </div>`;
      if (foot) foot.style.display = 'none';
      updateCounts();
      return;
    }
    if (foot) foot.style.display = 'block';
    body.innerHTML = cart.map((item, i) => `
      <div class="cart-line" data-idx="${i}">
        <div class="cl-media${item.media && item.media.startsWith('<img') ? ' has-photo' : ''}">${item.media}</div>
        <div class="cl-info">
          <div class="cl-name">${item.name}</div>
          <div class="cl-meta">${item.type} · Tam. ${item.size}${item.custom ? ` · ${item.custom}` : ''}${item.version ? ` · ${item.version}` : ''}</div>
          <div class="cl-row">
            <div class="qty-stepper">
              <button data-act="dec" aria-label="Diminuir quantidade">−</button>
              <span>${item.qty}</span>
              <button data-act="inc" aria-label="Aumentar quantidade">+</button>
            </div>
            <span class="cl-price">${euro(item.price * item.qty)}</span>
          </div>
          <button class="cl-remove" data-act="remove">Remover</button>
        </div>
      </div>`).join('');

    const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const discount = window.__discount || 0;
    const total = Math.max(subtotal - discount, 0);
    const totalsEl = $('#drawer-totals');
    if (totalsEl) {
      totalsEl.innerHTML = `
        ${discount > 0 ? `<div class="drawer-subtotal"><span>Desconto</span><span>−${euro(discount)}</span></div>` : ''}
        <div class="drawer-subtotal"><span>Subtotal</span><strong>${euro(total)}</strong></div>`;
    }
    updateCounts();
  }

  $('#drawer-body')?.addEventListener('click', (e) => {
    const line = e.target.closest('.cart-line');
    if (!line) return;
    const idx = Number(line.dataset.idx);
    const act = e.target.dataset.act;
    if (act === 'inc') cart[idx].qty++;
    if (act === 'dec') cart[idx].qty = Math.max(1, cart[idx].qty - 1);
    if (act === 'remove') cart.splice(idx, 1);
    saveCart();
    renderCart();
  });

  function updateCounts() {
    const cartCount = cart.reduce((s, i) => s + i.qty, 0);
    $$('.js-cart-count').forEach(el => { el.textContent = cartCount; el.style.display = cartCount ? 'flex' : 'none'; });
    $$('.js-fav-count').forEach(el => { el.textContent = favs.length; el.style.display = favs.length ? 'flex' : 'none'; });
  }

  $('#promo-apply')?.addEventListener('click', () => {
    const val = $('#promo-input').value.trim().toUpperCase();
    if (val === 'LOWWEAR10') {
      const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
      window.__discount = +(subtotal * 0.10).toFixed(2);
      showToast('Código aplicado: -10% no total');
    } else if (val) {
      showToast('Código promocional inválido');
    }
    renderCart();
  });

  function addToCart(product) {
    const existing = cart.find(i => i.id === product.id && i.size === product.size && i.custom === product.custom && i.version === product.version);
    if (existing) existing.qty += 1;
    else cart.push({ ...product, qty: 1 });
    saveCart();
    renderCart();
    showToast(`${product.name} adicionada ao carrinho`);
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

  /* ---------------- newsletter ---------------- */
  $('#newsletter-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('#newsletter-email');
    if (input.value.trim()) {
      showToast('Inscrição confirmada. Bem-vindo à bancada.');
      input.value = '';
    }
  });

  /* ---------------- login modal switch ---------------- */
  $('#to-register')?.addEventListener('click', () => { openOverlay($('#register-modal')); });
  $('#to-login')?.addEventListener('click', () => { openOverlay($('#login-modal')); });
  $$('#login-modal form, #register-modal form').forEach(f => f.addEventListener('submit', (e) => {
    e.preventDefault(); closeAllOverlays(); showToast('Sessão iniciada com sucesso');
  }));

  /* ---------------- checkout (local cart fallback) ----------------
     Every catalog product now checks out for real through Shopify
     (see goToShopifyCheckout below), so this local cart only ever fills
     up from the Flash Offer popup or a future product not yet linked
     to Shopify. It has no order tracking — it just confirms and clears. */
  $('#checkout-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    if (cart.length === 0) { showToast('O seu carrinho está vazio'); return; }
    openOverlay($('#checkout-modal'));
  });
  $('#checkout-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('lw:checkout-complete', { detail: { items: cart } }));
    cart = [];
    saveCart();
    renderCart();
    closeAllOverlays();
    showToast('Obrigado! Vamos entrar em contacto brevemente.');
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
    if (shopifyMap) {
      const addBtn = $('#pdp-add-cart');
      const buyBtn = $('#pdp-buy-now');
      const goToShopifyCheckout = async (btn) => {
        const item = buildPdpProduct();
        if (!item) return;
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'A preparar…';
        try {
          const variants = await fetchShopifyVariants(shopifyMap.shopifyProductId);
          const variant = pickShopifyVariant(variants, item.size);
          if (!variant || !variant.availableForSale) {
            showToast('Este tamanho está esgotado.');
            return;
          }
          const attributes = [{ key: 'Tamanho', value: item.size }];
          if (item.version) attributes.push({ key: 'Versão', value: item.version });
          if (item.custom) attributes.push({ key: 'Personalização', value: item.custom });
          const checkoutUrl = await createShopifyCheckout(variant.id, attributes);
          if (checkoutUrl) window.location.href = checkoutUrl;
          else showToast('Não foi possível iniciar o checkout. Tenta novamente.');
        } catch (err) {
          showToast('Erro ao contactar a loja. Tenta novamente.');
        } finally {
          btn.disabled = false;
          btn.textContent = originalText;
        }
      };
      addBtn?.addEventListener('click', () => goToShopifyCheckout(addBtn));
      buyBtn?.addEventListener('click', () => goToShopifyCheckout(buyBtn));
    } else {
      $('#pdp-add-cart')?.addEventListener('click', () => { const item = buildPdpProduct(); if (item) addToCart(item); });
      $('#pdp-buy-now')?.addEventListener('click', () => { const item = buildPdpProduct(); if (item) { addToCart(item); openOverlay(cartDrawer); } });
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
  if ($('#catalog-grid')) renderCatalog();
  initTeamPage();
  initProductPage();
  updateCounts();
  observeReveals();

  window.LowWear = { addToCart, toggleFav };
})();
