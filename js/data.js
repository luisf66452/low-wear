/* Low Wear — catálogo Brasil (dados do site) */
(() => {
  const TEAMS = [
    {
      slug: 'selecao', name: 'Seleção Brasileira', short: 'Seleção',
      main: '#f6d21e', trim: '#0b3d2e',
      tagline: 'Seleção Brasileira — Vista o penta',
      text: 'Modelos escolhidos para quem canta o hino antes de qualquer jogo e leva o Brasil para onde for.',
    },
    {
      slug: 'flamengo', name: 'Flamengo', short: 'Mengão',
      main: '#a2110a', trim: '#121212',
      tagline: 'Flamengo — Vista o rubro-negro',
      text: 'Modelos escolhidos para quem leva o Flamengo no peito, no estádio e na rua.',
    },
    {
      slug: 'corinthians', name: 'Corinthians', short: 'Timão',
      main: '#f4f3ec', trim: '#121212',
      tagline: 'Corinthians — Vista o Timão',
      text: 'Modelos para a Fiel que enche estádios e não abre mão das suas cores.',
    },
    {
      slug: 'sao-paulo', name: 'São Paulo', short: 'Tricolor',
      main: '#f4f3ec', trim: '#a2110a',
      tagline: 'São Paulo — Vista o Tricolor',
      text: 'Modelos para quem carrega a tradição do Morumbi em cada detalhe.',
    },
    {
      slug: 'palmeiras', name: 'Palmeiras', short: 'Verdão',
      main: '#0b6e2c', trim: '#f4f3ec',
      tagline: 'Palmeiras — Vista o Verdão',
      text: 'Modelos para a maior torcida do alviverde, dentro e fora da Academia.',
    },
    {
      slug: 'santos', name: 'Santos', short: 'Peixe',
      main: '#f4f3ec', trim: '#121212',
      tagline: 'Santos — Vista o Peixe',
      text: 'Modelos para quem carrega o legado do Rei do Futebol na Vila Belmiro.',
    },
    {
      slug: 'cruzeiro', name: 'Cruzeiro', short: 'Raposa',
      main: '#0b3da0', trim: '#f4f3ec',
      tagline: 'Cruzeiro — Vista a Raposa',
      text: 'Modelos para a Cabulosa que nunca deixou de acreditar.',
    },
  ];

  const TYPE_LABEL = {
    principal: 'Camisa Principal',
    alternativa: 'Camisa Alternativa',
    extra: 'Camisa Extra',
    retro: 'Camisa Retro',
    especial: 'Edição Especial',
  };

  const P = (id, teamSlug, type, name, season, price, sizes, tag, availability, main, trim, opts) => {
    opts = opts || {};
    return {
      id, teamSlug, type, name, season, price, was: opts.was || null,
      sizes, tag: tag || null, availability: availability || 'disponivel', main, trim,
      photos: opts.photos || null,
      // Vista 360°: para ativar, preencher com os caminhos das fotos rodadas, por ordem.
      // Convenção de pasta sugerida: img/spin/<id>/01.jpg … 24.jpg (24 a 36 fotos, ângulos iguais).
      spin: opts.spin || null,
    };
  };

  const PRODUCTS = [
    // Seleção Brasileira
    P('sel-principal-24', 'selecao', 'principal', 'Amarelinha da Copa', '2024', 59.9, ['S','M','L'], 'Novo', 'disponivel', '#f6d21e', '#0b3d2e',
      { photos: ['img/spin/selecao-principal/01.png'],
        spin: ['img/spin/selecao-principal/01.png', 'img/spin/selecao-principal/02.png', 'img/spin/selecao-principal/03.png', 'img/spin/selecao-principal/04.png', 'img/spin/selecao-principal/05.png', 'img/spin/selecao-principal/06.png', 'img/spin/selecao-principal/07.png', 'img/spin/selecao-principal/08.png', 'img/spin/selecao-principal/09.png', 'img/spin/selecao-principal/10.png'] }),
    P('sel-alt-24', 'selecao', 'alternativa', 'Azul da Copa', '2024', 54.9, ['S','M','L'], 'Mais vendido', 'disponivel', '#0b3da0', '#f6d21e',
      { photos: ['img/spin/selecao-alt/01.png'],
        spin: Array.from({length: 21}, (_, i) => `img/spin/selecao-alt/${String(i + 1).padStart(2, '0')}.png`) }),
    P('sel-especial-24', 'selecao', 'especial', 'Amarelinha Classica', '2024', 59.9, ['S','M','L'], 'Edição especial', 'disponivel', '#f6d21e', '#0b3d2e',
      { photos: ['img/spin/selecao-especial/01.png'],
        spin: Array.from({length: 24}, (_, i) => `img/spin/selecao-especial/${String(i + 1).padStart(2, '0')}.png`) }),

    // Flamengo
    P('fla-principal-24', 'flamengo', 'principal', 'Manto Rubro-Negro', '2024', 69.9, ['S','M','L'], 'Novo', 'disponivel', '#a2110a', '#121212',
      { photos: ['img/spin/flamengo-principal/01.png'],
        spin: Array.from({length: 24}, (_, i) => `img/spin/flamengo-principal/${String(i + 1).padStart(2, '0')}.png`) }),
    P('fla-alt-24', 'flamengo', 'alternativa', 'Manto Rubro-Negro Branco', '2024', 64.9, ['S','M','L'], 'Mais vendido', 'disponivel', '#f4f3ec', '#a2110a',
      { photos: ['img/spin/flamengo-alt/01.png'],
        spin: Array.from({length: 24}, (_, i) => `img/spin/flamengo-alt/${String(i + 1).padStart(2, '0')}.png`) }),
    P('fla-extra-24', 'flamengo', 'extra', 'Manto Rubro-Negro diferenciado', '2024', 59.9, ['S','M','L'], null, 'disponivel', '#f4f3ec', '#a2110a',
      { photos: ['img/spin/flamengo-extra/01.png'],
        spin: Array.from({length: 24}, (_, i) => `img/spin/flamengo-extra/${String(i + 1).padStart(2, '0')}.png`) }),

    // Corinthians
    P('cor-principal-24', 'corinthians', 'principal', 'Fiel Alvinegra', '2024', 69.9, ['S','M','L'], 'Novo', 'disponivel', '#f4f3ec', '#121212',
      { photos: ['img/spin/corinthians-principal/01.png'],
        spin: Array.from({length: 24}, (_, i) => `img/spin/corinthians-principal/${String(i + 1).padStart(2, '0')}.png`) }),
    P('cor-extra-24', 'corinthians', 'extra', 'Fiel Alvinegra diferenciada', '2024', 54.9, ['S','M','L'], 'Edição especial', 'disponivel', '#f4f3ec', '#121212',
      { photos: ['img/spin/corinthians-extra/01.png'],
        spin: Array.from({length: 24}, (_, i) => `img/spin/corinthians-extra/${String(i + 1).padStart(2, '0')}.png`) }),

    // São Paulo
    P('sao-principal-24', 'sao-paulo', 'principal', 'Soberana Tricolor New Balance', '2024', 69.9, ['S','M','L'], 'Novo', 'disponivel', '#f4f3ec', '#a2110a',
      { photos: ['img/spin/sao-paulo-principal/01.png'],
        spin: Array.from({length: 24}, (_, i) => `img/spin/sao-paulo-principal/${String(i + 1).padStart(2, '0')}.png`) }),
    P('sao-retro', 'sao-paulo', 'retro', 'Soberana Tricolor', '2019', 69.9, ['M','L'], 'Retro', 'disponivel', '#f4f3ec', '#a2110a',
      { photos: ['img/spin/sao-paulo-retro/01.png'],
        spin: Array.from({length: 24}, (_, i) => `img/spin/sao-paulo-retro/${String(i + 1).padStart(2, '0')}.png`) }),

    // Palmeiras
    P('pal-principal-24', 'palmeiras', 'principal', 'Verdão Classico', '2024', 69.9, ['S','M','L'], 'Mais vendido', 'disponivel', '#0b6e2c', '#f4f3ec',
      { photos: ['img/spin/palmeiras-principal/01.png'],
        spin: Array.from({length: 24}, (_, i) => `img/spin/palmeiras-principal/${String(i + 1).padStart(2, '0')}.png`) }),
    P('pal-retro', 'palmeiras', 'retro', 'Verdão Retro', '2019', 69.9, ['M','L'], 'Retro', 'disponivel', '#0b6e2c', '#f4f3ec',
      { photos: ['img/spin/palmeiras-retro-360/01.png'],
        spin: Array.from({length: 24}, (_, i) => `img/spin/palmeiras-retro-360/${String(i + 1).padStart(2, '0')}.png`) }),

    // Santos
    P('santos-principal-24', 'santos', 'principal', 'Peixe Classico', '2024', 69.9, ['S','M','L'], 'Novo', 'disponivel', '#f4f3ec', '#121212',
      { photos: ['img/spin/santos-principal/01.png'],
        spin: Array.from({length: 24}, (_, i) => `img/spin/santos-principal/${String(i + 1).padStart(2, '0')}.png`) }),
    P('santos-extra-24', 'santos', 'extra', 'Peixe Diferenciado', '2024', 59.9, ['S','M','L'], null, 'disponivel', '#121212', '#f4f3ec',
      { photos: ['img/spin/santos-extra/01.png'],
        spin: Array.from({length: 24}, (_, i) => `img/spin/santos-extra/${String(i + 1).padStart(2, '0')}.png`) }),

    // Cruzeiro
    P('cru-principal-24', 'cruzeiro', 'principal', 'Manto Celeste Azul', '2024', 69.9, ['S','M','L'], 'Novo', 'disponivel', '#0b3da0', '#f4f3ec',
      { photos: ['img/spin/cruzeiro-principal/01.png'],
        spin: Array.from({length: 24}, (_, i) => `img/spin/cruzeiro-principal/${String(i + 1).padStart(2, '0')}.png`) }),
    P('cru-alt-24', 'cruzeiro', 'alternativa', 'Manto Celeste Branco', '2024', 64.9, ['S','M','L'], 'Mais vendido', 'disponivel', '#f4f3ec', '#0b3da0',
      { photos: ['img/spin/cruzeiro-alt/01.png'],
        spin: Array.from({length: 24}, (_, i) => `img/spin/cruzeiro-alt/${String(i + 1).padStart(2, '0')}.png`) }),
  ];

  const FEATURED_IDS = [
    'sel-principal-24', 'fla-principal-24', 'cor-principal-24', 'sao-principal-24',
    'pal-principal-24', 'santos-principal-24', 'cru-principal-24',
  ];

  function euro(n) {
    return n.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });
  }

  function getTeam(slug) { return TEAMS.find(t => t.slug === slug) || null; }
  function getProduct(id) { return PRODUCTS.find(p => p.id === id) || null; }
  function getProductsByTeam(slug) { return PRODUCTS.filter(p => p.teamSlug === slug); }
  function fullName(p) {
    const team = getTeam(p.teamSlug);
    return `${team ? team.name : ''} — ${p.name}`;
  }

  function jerseySVG(main, trim, collarBg) {
    collarBg = collarBg || '#0b0c0a';
    return `<svg viewBox="0 0 240 260" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M60 18 L94 4 Q120 24 146 4 L180 18 L214 54 L190 90 L172 74 L172 236 Q120 252 68 236 L68 74 L50 90 L26 54 Z" fill="${main}"/>
      <path d="M60 18 L94 4 L100 16 L67 32 Z" fill="${trim}"/>
      <path d="M180 18 L146 4 L140 16 L173 32 Z" fill="${trim}"/>
      <path d="M94 4 Q120 24 146 4 L146 16 Q120 34 94 16 Z" fill="${collarBg}"/>
      <rect x="190" y="68" width="24" height="16" rx="2" fill="${trim}"/>
      <rect x="26" y="68" width="24" height="16" rx="2" fill="${trim}"/>
      <circle cx="102" cy="62" r="10" fill="${trim}"/>
      <rect x="90" y="150" width="60" height="14" rx="2" fill="${collarBg}" opacity="0.18"/>
    </svg>`;
  }

  function productMedia(p, alt) {
    alt = alt || fullName(p);
    if (p.photos && p.photos.length) {
      return `<img src="${p.photos[0]}" alt="${alt}" loading="lazy">`;
    }
    return jerseySVG(p.main, p.trim);
  }

  function productGallery(p) {
    if (p.photos && p.photos.length) {
      return p.photos.map(src => `<img src="${src}" alt="${fullName(p)}" loading="lazy">`);
    }
    return [jerseySVG(p.main, p.trim)];
  }

  /* ============================================================
     PROMOÇÃO DE INAUGURAÇÃO — "Escolha 6, pague 3"
     Single source of truth for every date, rule and text used by the
     campaign (top bar, hero section, countdown, badges, popup, cart
     progress, "como funciona"). Edit this object only — nothing else —
     to change dates, eligible products, or to turn the campaign off.
     ============================================================ */
  const PROMO_CONFIG = {
    promotionEnabled: true,
    // ISO 8601 with explicit Europe/Lisbon offset (WEST = +01:00 in August,
    // no DST change inside this window) so the countdown is correct
    // regardless of the visitor's own timezone.
    promotionStart: '2026-08-04T00:00:00+01:00',
    promotionEnd: '2026-08-25T23:59:59+01:00',
    promotionTimeZone: 'Europe/Lisbon',
    // Empty = every product in the catalog participates. List specific
    // product ids (see PRODUCTS above) to restrict participation instead.
    eligibleProducts: [],
    requiredQuantity: 6,
    freeQuantity: 3,
    maximumApplicationsPerOrder: 1,
  };

  function isPromoActive(now) {
    now = now || Date.now();
    if (!PROMO_CONFIG.promotionEnabled) return false;
    const start = new Date(PROMO_CONFIG.promotionStart).getTime();
    const end = new Date(PROMO_CONFIG.promotionEnd).getTime();
    return now >= start && now <= end;
  }

  function isPromoEligible(productId) {
    const list = PROMO_CONFIG.eligibleProducts;
    if (!list || !list.length) return true;
    return list.includes(productId);
  }

  // Products checking out for real through Shopify. Shared here (rather than
  // in js/main.js) so admin.html and js/flash-offer.js can also use it
  // without loading the whole storefront script.
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

  /* ---------------- Shopify Storefront API ---------------- */
  const SHOPIFY_DOMAIN = 'rbdfwr-dv.myshopify.com';
  const SHOPIFY_STOREFRONT_TOKEN = 'e8db550bd1d8b8f84400bf90b6df3bf6';
  const SHOPIFY_API_VERSION = '2024-01';

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
    // No discount code param: any discount comes from a Shopify *automatic*
    // discount (Shopify Admin → Discounts → Automatic), which applies itself
    // to eligible carts without needing a code passed here.
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

  // Creates a throwaway cart for one unit of the variant to see whether
  // Shopify applies an automatic discount to it, and if so, how much. Used
  // by the Flash Offer engine to find a product that currently has a real
  // discount configured in Shopify, and to read the real percentage back
  // instead of guessing one client-side.
  async function checkShopifyAutomaticDiscount(variantId) {
    // Note: cart.cost.subtotalAmount is already computed *after* per-line
    // (product-level) automatic discounts, so it equals totalAmount even
    // when a discount applied — comparing those two would miss it. The
    // undiscounted price only survives on the line's amountPerQuantity, so
    // that's what has to be compared against the line's discounted total.
    const result = await shopifyGraphQL(
      `mutation($input: CartInput!) { cartCreate(input: $input) {
        cart { lines(first: 1) { edges { node {
          cost { totalAmount { amount } amountPerQuantity { amount } }
        } } } }
        userErrors { field message }
      } }`,
      { input: { lines: [{ quantity: 1, merchandiseId: variantId }] } }
    );
    const line = result?.data?.cartCreate?.cart?.lines?.edges?.[0]?.node;
    if (!line) return { pct: 0 };
    const undiscounted = parseFloat(line.cost.amountPerQuantity.amount);
    const total = parseFloat(line.cost.totalAmount.amount);
    if (!(undiscounted > 0) || !(total < undiscounted)) return { pct: 0 };
    const pct = Math.round((1 - total / undiscounted) * 100);
    return { pct };
  }

  // Signs an email up for marketing consent as a real Shopify customer (the
  // newsletter list you see in Shopify Admin → Customers), instead of just
  // showing a success toast and throwing the address away. customerCreate
  // requires a password even for a "just subscribe" signup, so we generate
  // a random one the visitor never sees — they can set their own later via
  // "forgot password" if they ever want to log in to an account.
  async function shopifyNewsletterSignup(email) {
    const randomPassword = Array.from(crypto.getRandomValues(new Uint8Array(18)))
      .map((b) => b.toString(36)).join('').slice(0, 24) + 'Aa1!';
    const result = await shopifyGraphQL(
      `mutation($input: CustomerCreateInput!) { customerCreate(input: $input) {
        customer { id }
        customerUserErrors { field message code }
      } }`,
      { input: { email, password: randomPassword, acceptsMarketing: true } }
    );
    const errors = result?.data?.customerCreate?.customerUserErrors || [];
    const alreadySubscribed = errors.some((e) => e.code === 'TAKEN');
    if (errors.length && !alreadySubscribed) throw new Error(errors.map((e) => e.message).join(', '));
    return true;
  }

  /* ---------------- persistent multi-item cart ----------------
     Previously every "Adicionar ao carrinho" / "Comprar agora" click
     created a brand-new one-item Shopify cart and redirected straight to
     checkout. That made it impossible for a customer to ever hold more
     than one product at once, which breaks any multi-item promotion (e.g.
     "buy 6 pay 3") since Shopify can only apply that discount if all 6
     lines are sitting in the SAME cart when checkout is reached. These
     functions manage one real Shopify cart, persisted by id in
     localStorage, that lines get added to over time. */
  const CART_FIELDS = `
    id checkoutUrl
    discountCodes { code applicable }
    cost { subtotalAmount { amount } totalAmount { amount } }
    lines(first: 100) { edges { node {
      id quantity attributes { key value }
      cost { totalAmount { amount } amountPerQuantity { amount } }
      merchandise { ... on ProductVariant {
        id title
        product { id title }
      } }
    } } }
  `;

  function parseCart(cart) {
    if (!cart) return null;
    return {
      id: cart.id,
      checkoutUrl: cart.checkoutUrl,
      subtotal: parseFloat(cart.cost.subtotalAmount.amount),
      total: parseFloat(cart.cost.totalAmount.amount),
      discountCodes: (cart.discountCodes || []).map((d) => ({ code: d.code, applicable: d.applicable })),
      lines: cart.lines.edges.map((e) => ({
        id: e.node.id,
        quantity: e.node.quantity,
        attributes: e.node.attributes,
        lineTotal: parseFloat(e.node.cost.totalAmount.amount),
        unitPrice: parseFloat(e.node.cost.amountPerQuantity.amount),
        variantId: e.node.merchandise.id,
        variantTitle: e.node.merchandise.title,
        productId: e.node.merchandise.product.id.replace('gid://shopify/Product/', ''),
        productTitle: e.node.merchandise.product.title,
      })),
    };
  }

  async function createShopifyCart(variantId, quantity, attributes) {
    const result = await shopifyGraphQL(
      `mutation($input: CartInput!) { cartCreate(input: $input) { cart { ${CART_FIELDS} } userErrors { field message } } }`,
      { input: { lines: [{ quantity, merchandiseId: variantId, attributes }] } }
    );
    const errors = result?.data?.cartCreate?.userErrors;
    if (errors && errors.length) throw new Error(errors.map((e) => e.message).join(', '));
    return parseCart(result?.data?.cartCreate?.cart);
  }

  async function addShopifyCartLine(cartId, variantId, quantity, attributes) {
    const result = await shopifyGraphQL(
      `mutation($cartId: ID!, $lines: [CartLineInput!]!) { cartLinesAdd(cartId: $cartId, lines: $lines) { cart { ${CART_FIELDS} } userErrors { field message } } }`,
      { cartId, lines: [{ quantity, merchandiseId: variantId, attributes }] }
    );
    const errors = result?.data?.cartLinesAdd?.userErrors;
    if (errors && errors.length) throw new Error(errors.map((e) => e.message).join(', '));
    return parseCart(result?.data?.cartLinesAdd?.cart);
  }

  async function removeShopifyCartLine(cartId, lineId) {
    const result = await shopifyGraphQL(
      `mutation($cartId: ID!, $lineIds: [ID!]!) { cartLinesRemove(cartId: $cartId, lineIds: $lineIds) { cart { ${CART_FIELDS} } userErrors { field message } } }`,
      { cartId, lineIds: [lineId] }
    );
    const errors = result?.data?.cartLinesRemove?.userErrors;
    if (errors && errors.length) throw new Error(errors.map((e) => e.message).join(', '));
    return parseCart(result?.data?.cartLinesRemove?.cart);
  }

  async function updateShopifyCartLine(cartId, lineId, quantity) {
    const result = await shopifyGraphQL(
      `mutation($cartId: ID!, $lines: [CartLineUpdateInput!]!) { cartLinesUpdate(cartId: $cartId, lines: $lines) { cart { ${CART_FIELDS} } userErrors { field message } } }`,
      { cartId, lines: [{ id: lineId, quantity }] }
    );
    const errors = result?.data?.cartLinesUpdate?.userErrors;
    if (errors && errors.length) throw new Error(errors.map((e) => e.message).join(', '));
    return parseCart(result?.data?.cartLinesUpdate?.cart);
  }

  async function fetchShopifyCart(cartId) {
    const result = await shopifyGraphQL(
      `query($id: ID!) { cart(id: $id) { ${CART_FIELDS} } }`,
      { id: cartId }
    );
    return parseCart(result?.data?.cart);
  }

  // Redeems a real Shopify discount code (created in Shopify Admin →
  // Discounts) against the live cart. Shopify itself decides whether the
  // code is valid/applicable — we never compute a discount client-side.
  async function applyShopifyDiscountCode(cartId, code) {
    const result = await shopifyGraphQL(
      `mutation($cartId: ID!, $codes: [String!]!) { cartDiscountCodesUpdate(cartId: $cartId, discountCodes: $codes) { cart { ${CART_FIELDS} } userErrors { field message } } }`,
      { cartId, codes: [code] }
    );
    const errors = result?.data?.cartDiscountCodesUpdate?.userErrors;
    if (errors && errors.length) throw new Error(errors.map((e) => e.message).join(', '));
    return parseCart(result?.data?.cartDiscountCodesUpdate?.cart);
  }

  async function removeShopifyDiscountCode(cartId) {
    const result = await shopifyGraphQL(
      `mutation($cartId: ID!) { cartDiscountCodesUpdate(cartId: $cartId, discountCodes: []) { cart { ${CART_FIELDS} } userErrors { field message } } }`,
      { cartId }
    );
    const errors = result?.data?.cartDiscountCodesUpdate?.userErrors;
    if (errors && errors.length) throw new Error(errors.map((e) => e.message).join(', '));
    return parseCart(result?.data?.cartDiscountCodesUpdate?.cart);
  }

  const Shopify = {
    PRODUCTS: SHOPIFY_PRODUCTS,
    fetchVariants: fetchShopifyVariants,
    pickVariant: pickShopifyVariant,
    createCheckout: createShopifyCheckout,
    checkAutomaticDiscount: checkShopifyAutomaticDiscount,
    newsletterSignup: shopifyNewsletterSignup,
    createCart: createShopifyCart,
    addCartLine: addShopifyCartLine,
    removeCartLine: removeShopifyCartLine,
    updateCartLine: updateShopifyCartLine,
    getCart: fetchShopifyCart,
    applyDiscountCode: applyShopifyDiscountCode,
    removeDiscountCode: removeShopifyDiscountCode,
  };

  window.LowWearData = {
    TEAMS, PRODUCTS, TYPE_LABEL, FEATURED_IDS, SHOPIFY_PRODUCTS, Shopify,
    euro, getTeam, getProduct, getProductsByTeam, fullName, jerseySVG, productMedia, productGallery,
    PROMO_CONFIG, isPromoActive, isPromoEligible,
  };
})();
