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
    P('sel-principal-24', 'selecao', 'principal', 'Amarelinha da Copa', '2024', 99.90, ['S','M','L'], 'Novo', 'disponivel', '#f6d21e', '#0b3d2e',
      { photos: ['img/spin/selecao-principal/01.png'],
        spin: ['img/spin/selecao-principal/01.png', 'img/spin/selecao-principal/02.png', 'img/spin/selecao-principal/03.png', 'img/spin/selecao-principal/04.png', 'img/spin/selecao-principal/05.png', 'img/spin/selecao-principal/06.png', 'img/spin/selecao-principal/07.png', 'img/spin/selecao-principal/08.png', 'img/spin/selecao-principal/09.png', 'img/spin/selecao-principal/10.png'] }),
    P('sel-alt-24', 'selecao', 'alternativa', 'Azul da Copa', '2024', 94.90, ['S','M','L'], 'Mais vendido', 'disponivel', '#0b3da0', '#f6d21e',
      { photos: ['img/spin/selecao-alt/01.png'],
        spin: Array.from({length: 21}, (_, i) => `img/spin/selecao-alt/${String(i + 1).padStart(2, '0')}.png`) }),
    P('sel-especial-24', 'selecao', 'especial', 'Amarelinha Classica', '2024', 89.90, ['S','M','L'], 'Edição especial', 'disponivel', '#f6d21e', '#0b3d2e',
      { photos: ['img/spin/selecao-especial/01.png'],
        spin: Array.from({length: 24}, (_, i) => `img/spin/selecao-especial/${String(i + 1).padStart(2, '0')}.png`) }),

    // Flamengo
    P('fla-principal-24', 'flamengo', 'principal', 'Manto Rubro-Negro', '2024', 89.90, ['S','M','L'], 'Novo', 'disponivel', '#a2110a', '#121212',
      { photos: ['img/spin/flamengo-principal/01.png'],
        spin: Array.from({length: 24}, (_, i) => `img/spin/flamengo-principal/${String(i + 1).padStart(2, '0')}.png`) }),
    P('fla-alt-24', 'flamengo', 'alternativa', 'Manto Rubro-Negro Branco', '2024', 84.90, ['S','M','L'], 'Mais vendido', 'disponivel', '#f4f3ec', '#a2110a',
      { photos: ['img/spin/flamengo-alt/01.png'],
        spin: Array.from({length: 24}, (_, i) => `img/spin/flamengo-alt/${String(i + 1).padStart(2, '0')}.png`) }),
    P('fla-extra-24', 'flamengo', 'extra', 'Manto Rubro-Negro diferenciado', '2024', 79.90, ['S','M','L'], null, 'disponivel', '#f4f3ec', '#a2110a',
      { photos: ['img/spin/flamengo-extra/01.png'],
        spin: Array.from({length: 24}, (_, i) => `img/spin/flamengo-extra/${String(i + 1).padStart(2, '0')}.png`) }),

    // Corinthians
    P('cor-principal-24', 'corinthians', 'principal', 'Fiel Alvinegra', '2024', 89.90, ['S','M','L'], 'Novo', 'disponivel', '#f4f3ec', '#121212',
      { photos: ['img/spin/corinthians-principal/01.png'],
        spin: Array.from({length: 24}, (_, i) => `img/spin/corinthians-principal/${String(i + 1).padStart(2, '0')}.png`) }),
    P('cor-extra-24', 'corinthians', 'extra', 'Fiel Alvinegra diferenciada', '2024', 84.90, ['S','M','L'], 'Edição especial', 'disponivel', '#f4f3ec', '#121212',
      { photos: ['img/spin/corinthians-extra/01.png'],
        spin: Array.from({length: 24}, (_, i) => `img/spin/corinthians-extra/${String(i + 1).padStart(2, '0')}.png`) }),

    // São Paulo
    P('sao-principal-24', 'sao-paulo', 'principal', 'Soberana Tricolor New Balance', '2024', 89.90, ['S','M','L'], 'Novo', 'disponivel', '#f4f3ec', '#a2110a',
      { photos: ['img/spin/sao-paulo-principal/01.png'],
        spin: Array.from({length: 24}, (_, i) => `img/spin/sao-paulo-principal/${String(i + 1).padStart(2, '0')}.png`) }),
    P('sao-retro', 'sao-paulo', 'retro', 'Soberana Tricolor', '2019', 99.90, ['M','L'], 'Retro', 'disponivel', '#f4f3ec', '#a2110a',
      { photos: ['img/spin/sao-paulo-retro/01.png'],
        spin: Array.from({length: 24}, (_, i) => `img/spin/sao-paulo-retro/${String(i + 1).padStart(2, '0')}.png`) }),

    // Palmeiras
    P('pal-principal-24', 'palmeiras', 'principal', 'Verdão Classico', '2024', 89.90, ['S','M','L'], 'Mais vendido', 'disponivel', '#0b6e2c', '#f4f3ec',
      { photos: ['img/spin/palmeiras-principal/01.png'],
        spin: Array.from({length: 24}, (_, i) => `img/spin/palmeiras-principal/${String(i + 1).padStart(2, '0')}.png`) }),
    P('pal-retro', 'palmeiras', 'retro', 'Verdão Retro', '2019', 99.90, ['M','L'], 'Retro', 'disponivel', '#0b6e2c', '#f4f3ec',
      { photos: ['img/spin/palmeiras-retro-360/01.png'],
        spin: Array.from({length: 24}, (_, i) => `img/spin/palmeiras-retro-360/${String(i + 1).padStart(2, '0')}.png`) }),

    // Santos
    P('santos-principal-24', 'santos', 'principal', 'Peixe Classico', '2024', 89.90, ['S','M','L'], 'Novo', 'disponivel', '#f4f3ec', '#121212',
      { photos: ['img/spin/santos-principal/01.png'],
        spin: Array.from({length: 24}, (_, i) => `img/spin/santos-principal/${String(i + 1).padStart(2, '0')}.png`) }),
    P('santos-extra-24', 'santos', 'extra', 'Peixe Diferenciado', '2024', 79.90, ['S','M','L'], null, 'disponivel', '#121212', '#f4f3ec',
      { photos: ['img/spin/santos-extra/01.png'],
        spin: Array.from({length: 24}, (_, i) => `img/spin/santos-extra/${String(i + 1).padStart(2, '0')}.png`) }),

    // Cruzeiro
    P('cru-principal-24', 'cruzeiro', 'principal', 'Manto Celeste Azul', '2024', 89.90, ['S','M','L'], 'Novo', 'disponivel', '#0b3da0', '#f4f3ec',
      { photos: ['img/spin/cruzeiro-principal/01.png'],
        spin: Array.from({length: 24}, (_, i) => `img/spin/cruzeiro-principal/${String(i + 1).padStart(2, '0')}.png`) }),
    P('cru-alt-24', 'cruzeiro', 'alternativa', 'Manto Celeste Branco', '2024', 84.90, ['S','M','L'], 'Mais vendido', 'disponivel', '#f4f3ec', '#0b3da0',
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

  // Products checking out for real through Shopify (see js/main.js for the
  // Storefront API calls). Shared here so admin.html and flash-offer.js can
  // also know which products have a real checkout without loading main.js.
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

  window.LowWearData = {
    TEAMS, PRODUCTS, TYPE_LABEL, FEATURED_IDS, SHOPIFY_PRODUCTS,
    euro, getTeam, getProduct, getProductsByTeam, fullName, jerseySVG, productMedia, productGallery,
  };
})();
