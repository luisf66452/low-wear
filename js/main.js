(() => {
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const LWD = window.LowWearData;
  const euro = LWD.euro;

  /* ---------------- Shopify Buy Button integration ----------------
     Products listed here use the real Shopify checkout (via the Buy
     Button SDK) instead of the site's local demo cart. Add an entry
     per product as it gets its own Shopify Buy Button set up. */
  const SHOPIFY_DOMAIN = 'rbdfwr-dv.myshopify.com';
  const SHOPIFY_STOREFRONT_TOKEN = 'e8db550bd1d8b8f84400bf90b6df3bf6';
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
  let shopifyClientPromise = null;
  function loadShopifyBuySDK() {
    if (window.ShopifyBuy && window.ShopifyBuy.UI) return Promise.resolve();
    if (shopifyClientPromise) return shopifyClientPromise;
    shopifyClientPromise = new Promise((resolve) => {
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js';
      script.onload = resolve;
      (document.head || document.body).appendChild(script);
    });
    return shopifyClientPromise;
  }
  function mountShopifyBuyButton(mountEl, shopifyProductId) {
    loadShopifyBuySDK().then(() => {
      const client = ShopifyBuy.buildClient({ domain: SHOPIFY_DOMAIN, storefrontAccessToken: SHOPIFY_STOREFRONT_TOKEN });
      ShopifyBuy.UI.onReady(client).then((ui) => {
        ui.createComponent('product', {
          id: shopifyProductId,
          node: mountEl,
          moneyFormat: '%E2%82%AC%7B%7Bamount_with_comma_separator%7D%7D',
          options: {
            product: {
              styles: {
                product: { '@media (min-width: 601px)': { 'max-width': '100%', 'margin-left': '0', 'margin-bottom': '0' } },
                button: {
                  'background-color': '#49e08a', color: '#072016', 'font-family': "'Space Mono', 'Courier New', monospace",
                  'font-size': '13.5px', 'text-transform': 'uppercase', 'letter-spacing': '.03em',
                  'border-radius': '3px', padding: '13px 20px', ':hover': { 'background-color': '#3fc978' },
                  ':focus': { 'background-color': '#3fc978' },
                },
                select: {
                  'background-color': '#121310', color: '#f4f3ec',
                  border: '1px solid rgba(244,243,236,.22)', 'border-radius': '3px',
                  padding: '12px 13px', 'font-size': '13.5px', ':focus': { 'border-color': '#49e08a' },
                },
                label: {
                  color: '#82827a', 'font-family': "'Space Mono', 'Courier New', monospace",
                  'font-size': '10.5px', 'text-transform': 'uppercase', 'letter-spacing': '.05em',
                },
              },
              text: { button: 'Adicionar ao carrinho' },
              contents: { img: false, title: false, price: false },
            },
            option: {
              styles: {
                label: {
                  color: '#82827a', 'font-family': "'Space Mono', 'Courier New', monospace",
                  'font-size': '10.5px', 'text-transform': 'uppercase', 'letter-spacing': '.05em',
                },
                select: {
                  'background-color': '#121310', color: '#f4f3ec',
                  border: '1px solid rgba(244,243,236,.22)', 'border-radius': '3px',
                  padding: '12px 13px', 'font-size': '13.5px', ':focus': { 'border-color': '#49e08a' },
                },
              },
            },
            modalProduct: {
              contents: { img: false, imgWithCarousel: true, button: false, buttonWithQuantity: true },
              text: { button: 'Adicionar ao carrinho' },
            },
            cart: { text: { total: 'Subtotal', button: 'Finalizar compra' } },
          },
        });
      });
    });
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
  $('#footer-track')?.addEventListener('click', (e) => { e.preventDefault(); openOverlay($('#track-modal')); });
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

  /* ---------------- order tracking ---------------- */
  const STORE_KEY_ORDERS = 'lw_orders';
  let orders = loadJSON(STORE_KEY_ORDERS, []);
  const saveOrders = () => localStorage.setItem(STORE_KEY_ORDERS, JSON.stringify(orders));

  const TRACK_ICONS = {
    box:   '<svg viewBox="0 0 24 24"><path d="M3 7 12 3l9 4-9 4-9-4Z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/></svg>',
    shirt: '<svg viewBox="0 0 24 24"><path d="M8 4 4 7l2 3 2-1v10h8V9l2 1 2-3-4-3-2 2h-4L8 4Z"/></svg>',
    van:   '<svg viewBox="0 0 24 24"><path d="M3 7h11v8H3z"/><path d="M14 10h4l3 3v2h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></svg>',
    plane: '<svg viewBox="0 0 24 24"><path d="m3 11 18-8-8 18-2-8-8-2Z"/></svg>',
    home:  '<svg viewBox="0 0 24 24"><path d="M4 11 12 4l8 7"/><path d="M6 10v9h12v-9"/><path d="m9.5 14.5 2 2 4-4"/></svg>',
  };

  const TRACK_STEPS = [
    { key:'confirmed', label:'Pedido confirmado', icon:'box', location:'Low Wear — centro de preparação', desc:'Recebemos o teu pedido e o pagamento foi confirmado.' },
    { key:'preparing', label:'Em preparação', icon:'shirt', location:'Low Wear — centro de preparação', desc:'A tua camisola está a ser preparada com todo o cuidado.' },
    { key:'carrier', label:'A caminho da transportadora', icon:'van', location:'Centro de triagem, Portugal', desc:'A encomenda foi entregue à transportadora.' },
    { key:'international', label:'Transporte internacional', icon:'plane', location:'Em trânsito internacional', desc:'A tua camisa está a viajar até ao destino.' },
    { key:'out', label:'Saiu para entrega', icon:'van', location:'Centro de distribuição local', desc:'A tua camisola está a caminho da tua morada.' },
    { key:'delivered', label:'Entregue', icon:'home', location:'Entregue na morada de destino', desc:'A tua encomenda chegou! Esperamos que representes o teu time com orgulho. 💚' },
  ];

  function createOrder(name, email) {
    const id = 'LW-' + Math.floor(100000 + Math.random() * 900000);
    const trackingCode = 'LWBR' + Math.random().toString(36).slice(2, 10).toUpperCase();
    const carrier = ['CTT Expresso', 'DPD', 'GLS'][Math.floor(Math.random() * 3)];
    const items = cart.map(i => ({ id: i.id, name: i.name, size: i.size, qty: i.qty, price: i.price, media: i.media }));
    const order = {
      id, name, email: email.trim().toLowerCase(), trackingCode, carrier, items,
      total: cart.reduce((s, i) => s + i.price * i.qty, 0),
      createdAt: Date.now(),
      // statusIndex is set manually (by the store) as the order actually progresses —
      // see admin.html. It does not advance automatically.
      statusIndex: 0,
      stepTimestamps: { [TRACK_STEPS[0].key]: Date.now() },
    };
    orders.push(order);
    saveOrders();
    return order;
  }

  function getOrderStatus(order) {
    const idx = order.statusIndex ?? 0;
    const timestamps = order.stepTimestamps || {};
    const steps = TRACK_STEPS.map((s, i) => ({
      ...s,
      state: i < idx ? 'done' : i === idx ? 'current' : 'pending',
      timestamp: timestamps[s.key] || null,
    }));
    return { currentIndex: idx, steps, isDelivered: idx === TRACK_STEPS.length - 1 };
  }

  function fmtDateTime(ts) {
    if (!ts) return '—';
    return new Date(ts).toLocaleString('pt-PT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }
  function renderTrackResult(order) {
    const status = getOrderStatus(order);
    const current = status.steps[status.currentIndex];
    const view = $('#track-result-view');
    if (!view) return;

    view.innerHTML = `
      <div class="track-head">
        <div>
          <span class="track-order-id">${order.id}</span>
          <h3>Acompanhamento da encomenda</h3>
        </div>
        <button class="btn btn-ghost btn-sm" id="track-back">Nova pesquisa</button>
      </div>

      <div class="track-demo-flag">
        <svg viewBox="0 0 24 24"><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg>
        Estado atualizado manualmente pela equipa Low Wear — ainda sem integração automática com a transportadora.
      </div>

      <div class="track-progress">
        ${status.steps.map(s => `
          <div class="track-step is-${s.state}">
            <div class="track-step-icon">${TRACK_ICONS[s.icon]}</div>
            <div class="track-step-label">${s.label}</div>
          </div>`).join('')}
      </div>

      <div class="track-detail-card${status.isDelivered ? ' is-delivered' : ''}">
        <div class="track-detail-icon">${TRACK_ICONS[current.icon]}</div>
        <div>
          <h4>${current.label}</h4>
          <p class="track-detail-desc">${current.desc}</p>
          <div class="track-detail-meta">
            <span>${fmtDateTime(current.timestamp)}</span>
            <span>${current.location}</span>
          </div>
        </div>
      </div>

      ${status.isDelivered ? `<div class="track-delivered-msg">A tua encomenda chegou! Esperamos que representes o teu time com orgulho. 💚</div>` : ''}

      <div class="track-order-summary">
        <div class="track-items">
          ${order.items.map(i => `
            <div class="track-item">
              <div class="track-item-media">${i.media || ''}</div>
              <div>
                <div class="track-item-name">${i.name}</div>
                <div class="track-item-meta">Tam. ${i.size} · Qtd ${i.qty}</div>
              </div>
            </div>`).join('') || '<p class="track-item-meta">Sem artigos associados a esta encomenda.</p>'}
        </div>
        <div class="track-codes">
          <div class="track-code-row"><span>Transportadora</span><strong>${order.carrier}</strong></div>
          <div class="track-code-row">
            <span>Código de rastreamento</span><strong>${order.trackingCode}</strong>
            <button class="btn btn-ghost btn-sm" id="track-copy" type="button" data-code="${order.trackingCode}">Copiar código</button>
          </div>
        </div>
        <div class="track-actions">
          <button class="btn btn-ghost" id="track-details" type="button">Ver detalhes da encomenda</button>
          <a class="btn btn-ghost" href="mailto:almeidaferreiraluisgustavo@gmail.com?subject=Apoio%20-%20Encomenda%20${order.id}">Contactar apoio</a>
        </div>
        <div class="track-details-box" id="track-details-box" style="display:none;">
          <div><span>Nome</span><strong>${order.name || '—'}</strong></div>
          <div><span>E-mail</span><strong>${order.email}</strong></div>
          <div><span>Data da encomenda</span><strong>${fmtDateTime(order.createdAt)}</strong></div>
          <div><span>Total</span><strong>${euro(order.total)}</strong></div>
        </div>
        <p class="track-note">Algumas atualizações podem demorar algumas horas a aparecer.</p>
      </div>`;

    $('#track-form-view').style.display = 'none';
    view.style.display = 'block';

    $('#track-back')?.addEventListener('click', () => {
      view.style.display = 'none';
      view.innerHTML = '';
      $('#track-form-view').style.display = 'block';
    });
    $('#track-copy')?.addEventListener('click', (e) => {
      const code = e.currentTarget.dataset.code;
      navigator.clipboard?.writeText(code).then(() => showToast('Código copiado')).catch(() => {});
    });
    $('#track-details')?.addEventListener('click', (e) => {
      const box = $('#track-details-box');
      const open = box.style.display !== 'none';
      box.style.display = open ? 'none' : 'block';
      e.currentTarget.textContent = open ? 'Ver detalhes da encomenda' : 'Ocultar detalhes';
    });
  }

  $('#track-toggle')?.addEventListener('click', () => openOverlay($('#track-modal')));
  $('#track-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const num = $('#tr-num').value.trim().toUpperCase();
    const email = $('#tr-email').value.trim().toLowerCase();
    const errorEl = $('#track-error');
    orders = loadJSON(STORE_KEY_ORDERS, []); // re-read in case an admin updated the status meanwhile
    const order = orders.find(o => o.id.toUpperCase() === num && o.email === email);
    if (!order) {
      if (errorEl) {
        errorEl.style.display = 'block';
        errorEl.textContent = 'Não encontrámos nenhuma encomenda com esses dados. Verifica o número e o e-mail utilizados na compra.';
      }
      return;
    }
    if (errorEl) errorEl.style.display = 'none';
    renderTrackResult(order);
  });

  /* ---------------- checkout (demo) ---------------- */
  $('#checkout-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    if (cart.length === 0) { showToast('O seu carrinho está vazio'); return; }
    openOverlay($('#checkout-modal'));
  });
  $('#checkout-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#co-name').value.trim();
    const email = $('#co-email').value.trim();
    const order = createOrder(name, email);
    window.dispatchEvent(new CustomEvent('lw:checkout-complete', { detail: { items: cart } }));
    cart = [];
    saveCart();
    renderCart();
    closeAllOverlays();
    showToast(`Encomenda ${order.id} confirmada!`);
    setTimeout(() => {
      openOverlay($('#track-modal'));
      $('#tr-num').value = order.id;
      $('#tr-email').value = order.email;
      renderTrackResult(order);
    }, 400);
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
    $('#pdp-add-cart')?.addEventListener('click', () => { const item = buildPdpProduct(); if (item) addToCart(item); });
    $('#pdp-buy-now')?.addEventListener('click', () => { const item = buildPdpProduct(); if (item) { addToCart(item); openOverlay(cartDrawer); } });

    const shopifyMap = SHOPIFY_PRODUCTS[p.id];
    if (shopifyMap) {
      sizesEl.closest('.pdp-block')?.style.setProperty('display', 'none');
      versionWrap?.style.setProperty('display', 'none');
      $('#personalize-block')?.style.setProperty('display', 'none');
      const actions = $('.pdp-actions');
      actions.style.display = 'none';
      const mount = document.createElement('div');
      mount.id = 'shopify-buy-' + p.id;
      actions.insertAdjacentElement('afterend', mount);
      mountShopifyBuyButton(mount, shopifyMap.shopifyProductId);
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
