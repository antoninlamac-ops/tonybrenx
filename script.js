// HLAVNÍ PŘEPÍNAČ E-SHOPU (true = zapnuto, false = vypnuto)
const isShopActive = false;

document.addEventListener("DOMContentLoaded", () => {
  // --- TELEGRAM NOTIFIKACE PŘI NÁVŠTĚVĚ WEBU ---
  const telegramToken = "8928473457:AAFCNqXyQJHfTM3pmz0SszWjTh129uEuS6s";
  const chatId = "8969155178";
  const message = "👀 Někdo právě otevřel tvůj web Tony Brenx!";
  const url = `https://api.telegram.org/bot${telegramToken}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(message)}`;
  
  // Odeslání na pozadí (neviditelné pro návštěvníka)
  fetch(url).catch(err => console.log('Telegram notice error:', err));
  // ---------------------------------------------

  if (isShopActive) {
    const shopSec = document.getElementById('shop');
    if (shopSec) shopSec.style.display = '';
    const cartBtn = document.getElementById('cart-floating-btn');
    if (cartBtn) cartBtn.style.display = 'flex';
    document.querySelectorAll('.nav-shop').forEach(el => {
      el.style.display = el.tagName === 'A' ? 'inline-flex' : '';
    });
    loadPacketaScriptIfNeeded();
  }
});

function loadPacketaScriptIfNeeded() {
  if (window.Packeta || document.getElementById('packeta-widget-lib')) return;
  const s = document.createElement('script');
  s.id = 'packeta-widget-lib';
  s.src = 'https://widget.packeta.com/www/js/library.js';
  document.head.appendChild(s);
}

const pageLoadTime = Date.now();
const MIN_HUMAN_FILL_TIME = 3000;

function looksLikeBot() {
  return (Date.now() - pageLoadTime) < MIN_HUMAN_FILL_TIME;
}

function postWithTimeout(url, formData, timeoutMs = 15000) {
  return Promise.race([
    fetch(url, { method: 'POST', body: formData, mode: 'no-cors' }),
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs))
  ]);
}

const homeBtn = document.getElementById('home-btn');
const menuToggle = document.getElementById('menu-toggle');
const navLinks = document.getElementById('nav-links');
if (menuToggle && navLinks) {
  menuToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
  navLinks.querySelectorAll('a').forEach(l => l.addEventListener('click', () => navLinks.classList.remove('open')));
}
if (homeBtn && navLinks) {
  homeBtn.addEventListener('click', e => { e.preventDefault(); navLinks.classList.remove('open'); window.scrollTo({top:0,behavior:'smooth'}); });
}

const g = document.getElementById('gallery');
const lb = document.getElementById('lb');
const big = document.getElementById('lb-img');
const closeBtn = document.getElementById('close-lb');
const loadMoreBtn = document.getElementById('load-more');
const hidePhotosBtn = document.getElementById('hide-photos');
const scrollTopBtn = document.getElementById('scroll-top');

let photoIds = [
  1, 2, 3, 4, 5, 6, 7, 8,
  10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
  20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
  30, 31, 32, 33, 34, 35, 36, 37, 38, 39,
  40, 41, 42, 43, 44, 45, 46, 47, 48, 49,
  50, 51, 52, 53, 54, 55
];

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
photoIds = shuffleArray(photoIds);

const totalPhotos = photoIds.length;
const isMobile = window.innerWidth <= 768;
const initialBatch = isMobile ? 10 : 30;
const stepBatch = isMobile ? 10 : 30;
let currentLoadedCount = 0;

function updateButtons() {
  if (loadMoreBtn) loadMoreBtn.style.display = currentLoadedCount >= totalPhotos ? 'none' : 'inline-flex';
  if (hidePhotosBtn) hidePhotosBtn.style.display = currentLoadedCount > initialBatch ? 'inline-flex' : 'none';
}

function renderBatch(count) {
  if (!g) return;
  const next = photoIds.slice(currentLoadedCount, currentLoadedCount + count);
  next.forEach((id, idx) => {
    const a = document.createElement('a');
    a.href = `img-web/foto-${id}.webp`;
    a.setAttribute('aria-label', `Černobílá fotografie ${id}`);
    a.style.animation = `revealPhoto 0.5s ease both ${idx * 0.04}s`;
    
    const im = document.createElement('img');
    im.src = `img-web/foto-${id}.webp`;
    im.alt = `Autorská černobílá fotografie z ulice a portrét od Tony Brenx - snímek ${id}`;
    im.loading = 'lazy';
    im.draggable = false;
    im.oncontextmenu = () => false;
    
    a.appendChild(im);
    g.appendChild(a);
  });
  currentLoadedCount += next.length;
  updateButtons();
}

if (g) {
  renderBatch(initialBatch);
  if (loadMoreBtn) loadMoreBtn.addEventListener('click', () => renderBatch(stepBatch));
  if (hidePhotosBtn) {
    hidePhotosBtn.addEventListener('click', () => {
      const children = Array.from(g.children);
      for (let i = initialBatch; i < children.length; i++) {
        g.removeChild(children[i]);
      }
      currentLoadedCount = initialBatch;
      updateButtons();
      const tvorbaSec = document.getElementById('tvorba');
      if (tvorbaSec) tvorbaSec.scrollIntoView({behavior:'smooth'});
    });
  }
}

const priceCards = document.querySelectorAll('.price-card');
priceCards.forEach(card => {
  card.addEventListener('pointerdown', () => {
    priceCards.forEach(c => c.classList.remove('active-tap'));
    card.classList.add('active-tap');
  });
});
document.addEventListener('pointerdown', (e) => {
  if (!e.target.closest('.price-card')) priceCards.forEach(c => c.classList.remove('active-tap'));
});

if (isShopActive) {
  const productsData = [
    {
      id: 't1', category: 'trika', badge: 'Heavy 240g', title: 'Tee „REVÍR“ Black', price: 890,
      desc: 'Oversized střih z prémiové těžké 100% bavlny (240 g/m²). Černobílý sítotisk s vysokou trvanlivostí. Vyrobeno pro každodenní street nošení.',
      images: ['img-web/foto-1.webp', 'img-web/foto-2.webp', 'img-web/foto-3.webp'],
      variants: [{ name: 'S', price: 890 }, { name: 'M', price: 890 }, { name: 'L', price: 890 }, { name: 'XL', price: 890 }]
    },
    {
      id: 't2', category: 'trika', badge: 'Acid Wash', title: 'Tee „BROKEN PLACE“', price: 950,
      desc: 'Vintage acid wash úprava, syrový streetový vibe, limitovaná série. Každý kus má unikátní strukturu oprání.',
      images: ['img-web/foto-5.webp', 'img-web/foto-6.webp', 'img-web/foto-7.webp'],
      variants: [{ name: 'S', price: 950 }, { name: 'M', price: 950 }, { name: 'L', price: 950 }, { name: 'XL', price: 950 }]
    },
    {
      id: 't3', category: 'trika', badge: 'Boxy Fit', title: 'Tee „RAW ATMOSPHERE“', price: 890,
      desc: 'Pevný límec, spadlá ramena a autorský print nočního města. Gramáž 220g.',
      images: ['img-web/foto-12.webp', 'img-web/foto-13.webp', 'img-web/foto-14.webp'],
      variants: [{ name: 'S', price: 890 }, { name: 'M', price: 890 }, { name: 'L', price: 890 }, { name: 'XL', price: 890 }]
    },
    {
      id: 'h1', category: 'headwear', badge: '3D Výšivka', title: 'SnapBack „TB SIGNATURE“', price: 790,
      desc: 'Klasický 6-panel střih, matná černá, zelený spodek kšiltu a precizní 3D výšivka loga Tony Brenx.',
      images: ['img-web/foto-20.webp', 'img-web/foto-21.webp'],
      variants: [{ name: 'Univerzální velikost (Nastavitelný snap)', price: 790 }]
    },
    {
      id: 'p1', category: 'postery', badge: 'Archival Matte', title: 'Poster „URBAN SHADOW“', price: 590,
      desc: 'Černobílý kontrastní tisk ze sokolovských ulic. Hluboká černá barva na archivním matném papíře 250g.',
      images: ['img-web/foto-25.webp', 'img-web/foto-26.webp'],
      variants: [{ name: 'A3 (30x42 cm)', price: 590 }, { name: 'A2 (42x59 cm)', price: 840 }]
    },
    {
      id: 'p2', category: 'postery', badge: 'Fine-Art', title: 'Poster „NOCTURNAL DRIFT“', price: 590,
      desc: 'Filmový frame z nočního natáčení s mlžnou atmosférou. Vysoké rozlišení a jemné analogové zrno.',
      images: ['img-web/foto-33.webp', 'img-web/foto-34.webp'],
      variants: [{ name: 'A3 (30x42 cm)', price: 590 }, { name: 'A2 (42x59 cm)', price: 840 }]
    },
    {
      id: 'p3', category: 'postery', badge: '310g Print', title: 'Poster „VINTAGE FLARE“', price: 650,
      desc: 'Charakteristický swirl bokeh focený vintage sklem Helios 44-2 na plném full-frame snímači.',
      images: ['img-web/foto-42.webp', 'img-web/foto-43.webp'],
      variants: [{ name: 'A3 (30x42 cm)', price: 650 }, { name: 'A2 (42x59 cm)', price: 900 }]
    },
    {
      id: 'p4', category: 'postery', badge: 'Limitovaná Edice', title: 'Poster „REVÍR KRUŠNOHOŘÍ“', price: 650,
      desc: 'Industriální krajina Krušných hor pod těžkými mraky. Ručně signováno autorem na rubu.',
      images: ['img-web/foto-50.webp', 'img-web/foto-51.webp'],
      variants: [{ name: 'A3 (30x42 cm)', price: 650 }, { name: 'A2 (42x59 cm)', price: 900 }]
    }
  ];

  const shopGrid = document.getElementById('shop-grid-container');
  if (shopGrid) {
    function renderShopGrid() {
      shopGrid.innerHTML = '';
      productsData.forEach(prod => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.dataset.category = prod.category;
        card.onclick = (e) => {
          if (!e.target.closest('button') && !e.target.closest('select')) {
            openProductModal(prod.id);
          }
        };

        let selectHtml = '';
        if (prod.variants.length > 1) {
          selectHtml = `<select class="product-select" id="quick-opt-${prod.id}" onclick="event.stopPropagation()">
            ${prod.variants.map((v, i) => `<option value="${v.name}" ${i===1?'selected':''}>${v.name}</option>`).join('')}
          </select>`;
        }

        card.innerHTML = `
          <div class="product-img-box">
            <span class="product-badge">${prod.badge}</span>
            <img src="${prod.images[0]}" alt="${prod.title}" loading="lazy" draggable="false" oncontextmenu="return false;">
          </div>
          <div class="product-info">
            <h3 class="product-title">${prod.title}</h3>
            <p class="product-desc">${prod.desc.substring(0, 75)}...</p>
            <div class="product-meta">
              <span class="product-price">${prod.price} Kč</span>
              ${selectHtml}
            </div>
            <button class="btn-buy" onclick="event.stopPropagation(); handleQuickBuy('${prod.id}')">
              Do košíku
            </button>
          </div>
        `;
        shopGrid.appendChild(card);
      });
    }
    renderShopGrid();
  }

  function updateFilterCounts() {
    const counts = { all: productsData.length };
    productsData.forEach(p => { counts[p.category] = (counts[p.category] || 0) + 1; });
    document.querySelectorAll('.shop-filter-btn').forEach(btn => {
      const f = btn.dataset.filter;
      const label = btn.textContent.replace(/\s*\(\d+\)\s*$/, '').trim();
      btn.textContent = `${label} (${counts[f] || 0})`;
    });
  }
  updateFilterCounts();

  const filterBtns = document.querySelectorAll('.shop-filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const f = btn.dataset.filter;
      document.querySelectorAll('.product-card').forEach(card => {
        card.style.display = (f === 'all' || card.dataset.category === f) ? 'flex' : 'none';
      });
    });
  });
}

let currentProduct = null;
let currentProdImgIndex = 0;
const prodModal = document.getElementById('product-detail-modal');
const pmZoomBox = document.getElementById('pm-zoom-container');
const pmActiveImg = document.getElementById('pm-active-image');
const pmThumbsBox = document.getElementById('pm-thumbs-container');
const pmBadge = document.getElementById('pm-badge');
const pmTitle = document.getElementById('pm-title');
const pmPrice = document.getElementById('pm-price');
const pmDesc = document.getElementById('pm-desc');
const pmVariantSelect = document.getElementById('pm-variant-select');
const pmAddToCartBtn = document.getElementById('pm-add-to-cart-btn');

function openProductModal(productId) {
  if (!isShopActive) return;
  currentProduct = productsData.find(p => p.id === productId);
  if (!currentProduct) return;

  currentProdImgIndex = 0;
  resetZoom();

  if (pmBadge) pmBadge.textContent = currentProduct.badge;
  if (pmTitle) pmTitle.textContent = currentProduct.title;
  if (pmPrice) pmPrice.textContent = currentProduct.price + ' Kč';
  if (pmDesc) pmDesc.textContent = currentProduct.desc;

  if (pmVariantSelect) {
    pmVariantSelect.innerHTML = currentProduct.variants.map(v => `<option value="${v.name}" data-price="${v.price}">${v.name} (${v.price} Kč)</option>`).join('');
    pmVariantSelect.onchange = () => {
      const selectedOpt = pmVariantSelect.options[pmVariantSelect.selectedIndex];
      if (pmPrice) pmPrice.textContent = selectedOpt.dataset.price + ' Kč';
    };
  }

  updateProductImageDisplay();
  if (prodModal) prodModal.classList.add('open');
}

function updateProductImageDisplay() {
  if (!pmActiveImg || !currentProduct) return;
  pmActiveImg.src = currentProduct.images[currentProdImgIndex];
  if (pmThumbsBox) {
    pmThumbsBox.innerHTML = '';
    currentProduct.images.forEach((imgUrl, idx) => {
      const thumb = document.createElement('div');
      thumb.className = `pm-thumb ${idx === currentProdImgIndex ? 'active' : ''}`;
      thumb.innerHTML = `<img src="${imgUrl}" alt="thumb" draggable="false" oncontextmenu="return false;">`;
      thumb.onclick = () => {
        currentProdImgIndex = idx;
        resetZoom();
        updateProductImageDisplay();
      };
      pmThumbsBox.appendChild(thumb);
    });
  }
}

function prevProductImage(e) {
  if (e) e.stopPropagation();
  resetZoom();
  currentProdImgIndex = (currentProdImgIndex - 1 + currentProduct.images.length) % currentProduct.images.length;
  updateProductImageDisplay();
}

function nextProductImage(e) {
  if (e) e.stopPropagation();
  resetZoom();
  currentProdImgIndex = (currentProdImgIndex + 1) % currentProduct.images.length;
  updateProductImageDisplay();
}

function closeProductModal() {
  if (prodModal) prodModal.classList.remove('open');
  resetZoom();
}

if (prodModal) {
  prodModal.addEventListener('click', e => {
    if (e.target === prodModal) closeProductModal();
  });
}

let isZoomed = false;
function toggleZoom() {
  isZoomed = !isZoomed;
  if (isZoomed) {
    if (pmZoomBox) pmZoomBox.classList.add('zoomed');
  } else {
    resetZoom();
  }
}
function resetZoom() {
  isZoomed = false;
  if (pmZoomBox) pmZoomBox.classList.remove('zoomed');
  if (pmActiveImg) pmActiveImg.style.transformOrigin = 'center center';
}

const toggleZoomBtn = document.getElementById('pm-toggle-zoom');
if (toggleZoomBtn) {
  toggleZoomBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleZoom();
  });
}
if (pmZoomBox) {
  pmZoomBox.addEventListener('click', (e) => {
    if (e.target.closest('.pm-nav-arrow') || e.target.closest('.pm-zoom-btn')) return;
    toggleZoom();
  });
  pmZoomBox.addEventListener('mousemove', (e) => {
    if (!isZoomed || !pmActiveImg) return;
    const rect = pmZoomBox.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    pmActiveImg.style.transformOrigin = `${x}% ${y}%`;
  });
}

if (pmAddToCartBtn && pmVariantSelect) {
  pmAddToCartBtn.onclick = () => {
    const selectedOpt = pmVariantSelect.options[pmVariantSelect.selectedIndex];
    const variantName = selectedOpt.value;
    const price = parseInt(selectedOpt.dataset.price);
    addToCart(currentProduct.title, price, variantName);
    closeProductModal();
  };
}

function handleQuickBuy(prodId) {
  const prod = productsData.find(p => p.id === prodId);
  if (!prod) return;
  let variant = prod.variants[0].name;
  let price = prod.variants[0].price;
  const selectElem = document.getElementById(`quick-opt-${prodId}`);
  if (selectElem) {
    variant = selectElem.value;
    const vObj = prod.variants.find(v => v.name === variant);
    if (vObj) price = vObj.price;
  }
  addToCart(prod.title, price, variant);
}

let cart = JSON.parse(localStorage.getItem('tb_cart')) || [];
const cartFloatingBtn = document.getElementById('cart-floating-btn');
const cartModal = document.getElementById('cart-modal');
const closeCartBtn = document.getElementById('close-cart-btn');
const cartCount = document.getElementById('cart-count');
const cartItemsContainer = document.getElementById('cart-items-container');
const cartTotalPrice = document.getElementById('cart-total-price');

function openCartModal() { if (cartModal) cartModal.classList.add('open'); }
function closeCartModal() { if (cartModal) cartModal.classList.remove('open'); }

function updateCartUI() {
  localStorage.setItem('tb_cart',
