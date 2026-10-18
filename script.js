// HLAVNÍ PŘEPÍNAČ E-SHOPU (true = zapnuto, false = vypnuto)
const isShopActive = false;

document.addEventListener("DOMContentLoaded", () => {
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
menuToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
navLinks.querySelectorAll('a').forEach(l => l.addEventListener('click', () => navLinks.classList.remove('open')));
homeBtn.addEventListener('click', e => { e.preventDefault(); navLinks.classList.remove('open'); window.scrollTo({top:0,behavior:'smooth'}); });

const g = document.getElementById('gallery');
const lb = document.getElementById('lb');
const big = document.getElementById('lb-img');
const closeBtn = document.getElementById('close-lb');
const loadMoreBtn = document.getElementById('load-more');
const hidePhotosBtn = document.getElementById('hide-photos');
const scrollTopBtn = document.getElementById('scroll-top');

const totalPhotos = 55;
const isMobile = window.innerWidth <= 768;
const initialBatch = isMobile ? 10 : 30;
const stepBatch = isMobile ? 10 : 30;
let currentLoadedCount = 0;

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
let photoIds = shuffleArray(Array.from({length: totalPhotos}, (_, i) => i + 1));

function updateButtons() {
  loadMoreBtn.style.display = currentLoadedCount >= totalPhotos ? 'none' : 'inline-flex';
  hidePhotosBtn.style.display = currentLoadedCount > initialBatch ? 'inline-flex' : 'none';
}

function renderBatch(count) {
  const next = photoIds.slice(currentLoadedCount, currentLoadedCount + count);
  next.forEach((id, idx) => {
    const a = document.createElement('a');
    a.href = `img-web/foto-${id}.webp`;
    a.setAttribute('aria-label', `Fotografie ${id}`);
    a.style.animation = `revealPhoto 0.5s ease both ${idx * 0.04}s`;
    const im = document.createElement('img');
    im.src = `img-web/foto-${id}.webp`;
    im.alt = `Tony Brenx foto ${id}`;
    im.loading = 'lazy';
    im.draggable = false;
    im.oncontextmenu = () => false;
    a.appendChild(im);
    g.appendChild(a);
  });
  currentLoadedCount += next.length;
  updateButtons();
}
renderBatch(initialBatch);
loadMoreBtn.addEventListener('click', () => renderBatch(stepBatch));

hidePhotosBtn.addEventListener('click', () => {
  const children = Array.from(g.children);
  for (let i = initialBatch; i < children.length; i++) {
    g.removeChild(children[i]);
  }
  currentLoadedCount = initialBatch;
  updateButtons();
  document.getElementById('tvorba').scrollIntoView({behavior:'smooth'});
});

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
  currentProduct = productsData.find(p => p.id === productId);
  if (!currentProduct) return;

  currentProdImgIndex = 0;
  resetZoom();

  pmBadge.textContent = currentProduct.badge;
  pmTitle.textContent = currentProduct.title;
  pmPrice.textContent = currentProduct.price + ' Kč';
  pmDesc.textContent = currentProduct.desc;

  pmVariantSelect.innerHTML = currentProduct.variants.map(v => `<option value="${v.name}" data-price="${v.price}">${v.name} (${v.price} Kč)</option>`).join('');
  pmVariantSelect.onchange = () => {
    const selectedOpt = pmVariantSelect.options[pmVariantSelect.selectedIndex];
    pmPrice.textContent = selectedOpt.dataset.price + ' Kč';
  };

  updateProductImageDisplay();
  prodModal.classList.add('open');
}

function updateProductImageDisplay() {
  pmActiveImg.src = currentProduct.images[currentProdImgIndex];
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
  prodModal.classList.remove('open');
  resetZoom();
}

prodModal.addEventListener('click', e => {
  if (e.target === prodModal) closeProductModal();
});

let isZoomed = false;
function toggleZoom() {
  isZoomed = !isZoomed;
  if (isZoomed) {
    pmZoomBox.classList.add('zoomed');
  } else {
    resetZoom();
  }
}
function resetZoom() {
  isZoomed = false;
  pmZoomBox.classList.remove('zoomed');
  pmActiveImg.style.transformOrigin = 'center center';
}

document.getElementById('pm-toggle-zoom').addEventListener('click', (e) => {
  e.stopPropagation();
  toggleZoom();
});
pmZoomBox.addEventListener('click', (e) => {
  if (e.target.closest('.pm-nav-arrow') || e.target.closest('.pm-zoom-btn')) return;
  toggleZoom();
});

pmZoomBox.addEventListener('mousemove', (e) => {
  if (!isZoomed) return;
  const rect = pmZoomBox.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 100;
  const y = ((e.clientY - rect.top) / rect.height) * 100;
  pmActiveImg.style.transformOrigin = `${x}% ${y}%`;
});

pmAddToCartBtn.onclick = () => {
  const selectedOpt = pmVariantSelect.options[pmVariantSelect.selectedIndex];
  const variantName = selectedOpt.value;
  const price = parseInt(selectedOpt.dataset.price);
  addToCart(currentProduct.title, price, variantName);
  closeProductModal();
};

function handleQuickBuy(prodId) {
  const prod = productsData.find(p => p.id === prodId);
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

function openCartModal() { cartModal.classList.add('open'); }
function closeCartModal() { cartModal.classList.remove('open'); }

function updateCartUI() {
  localStorage.setItem('tb_cart', JSON.stringify(cart));
  const totalCount = cart.reduce((acc, item) => acc + item.qty, 0);
  cartCount.textContent = totalCount;
  
  if (cart.length === 0) {
    cartItemsContainer.innerHTML = '<div class="cart-empty-text">Košík je zatím prázdný.</div>';
    cartTotalPrice.textContent = '0 Kč';
    document.getElementById('go-to-checkout-btn').style.display = 'none';
    return;
  }

  document.getElementById('go-to-checkout-btn').style.display = 'block';
  cartItemsContainer.innerHTML = '';
  let sum = 0;
  cart.forEach((item, index) => {
    sum += item.price * item.qty;
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <div>
        <div class="cart-item-title">${item.title} (x${item.qty})</div>
        <div class="cart-item-variant">${item.variant}</div>
      </div>
      <div style="display:flex;align-items:center;">
        <span class="cart-item-price">${item.price * item.qty} Kč</span>
        <button class="cart-remove-btn" onclick="removeFromCart(${index})" title="Odebrat">✕</button>
      </div>
    `;
    cartItemsContainer.appendChild(div);
  });
  cartTotalPrice.textContent = sum.toLocaleString('cs-CZ') + ' Kč';
  updateCheckoutTotal();
}

function addToCart(title, price, variant) {
  const existing = cart.find(i => i.title === title && i.variant === variant);
  if (existing) existing.qty += 1;
  else cart.push({ title, price, variant, qty: 1 });
  updateCartUI();
  backToCartItems();
  openCartModal();
}

function removeFromCart(index) {
  cart.splice(index, 1);
  updateCartUI();
}

cartFloatingBtn.addEventListener('click', () => {
  backToCartItems();
  openCartModal();
});
closeCartBtn.addEventListener('click', closeCartModal);
cartModal.addEventListener('click', e => {
  if (e.target === cartModal) closeCartModal();
});

function showCheckoutForm() {
  if (cart.length === 0) return;
  document.getElementById('cart-view-items').style.display = 'none';
  document.getElementById('cart-view-checkout').style.display = 'block';
  document.getElementById('cart-modal-title').textContent = 'Objednávka merche';
  updateCheckoutTotal();
}

function backToCartItems() {
  document.getElementById('cart-view-items').style.display = 'block';
  document.getElementById('cart-view-checkout').style.display = 'none';
  document.getElementById('cart-modal-title').textContent = 'Váš Košík';
}

function handleModalShippingChange() {
  const method = document.getElementById('order-shipping').value;
  const box = document.getElementById('modal-packeta-box');
  box.style.display = method.includes('Zásilkovna') ? 'flex' : 'none';
  updateCheckoutTotal();
}

function updateCheckoutTotal() {
  const method = document.getElementById('order-shipping').value;
  const shippingCost = method.includes('Zásilkovna') ? 79 : 0;
  const goodsSum = cart.reduce((acc, i) => acc + (i.price * i.qty), 0);
  const total = goodsSum + shippingCost;
  document.getElementById('order-final-price').textContent = total.toLocaleString('cs-CZ') + ' Kč';
}
updateCartUI();

let selectedPacketaPoint = null;
const packetaApiKey = 'f277c2daae06a692';

function openPacketaWidget() {
  if (typeof Packeta === 'undefined' || !Packeta.Widget) {
    alert('Knihovna Zásilkovny se ještě nenačetla. Zkontrolujte připojení k internetu a zkuste to znovu.');
    return;
  }

  const packetaOptions = {
    country: 'cz',
    language: 'cs'
  };

  Packeta.Widget.pick(packetaApiKey, (point) => {
    if (point) {
      selectedPacketaPoint = point;
      document.getElementById('packeta-point-id').value = point.id;
      document.getElementById('packeta-point-name').value = `${point.name}, ${point.street || ''}, ${point.city || ''} (${point.zip || ''})`;
      
      const display = document.getElementById('modal-packeta-display');
      if (display) {
        display.style.display = 'block';
        document.getElementById('modal-packeta-place-name').textContent = `${point.name} (${point.city || ''})`;
      }
    }
  }, packetaOptions);
}

const orderForm = document.getElementById('order-form');
const orderStatus = document.getElementById('order-status');
const orderSubmitBtn = document.getElementById('order-submit-btn');

orderForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const method = document.getElementById('order-shipping').value;
  if (method.includes('Zásilkovna') && !selectedPacketaPoint) {
    alert('Vyber prosím výdejní místo nebo Z-BOX Zásilkovny kliknutím na červené tlačítko.');
    openPacketaWidget();
    return;
  }

  const shippingCost = method.includes('Zásilkovna') ? 79 : 0;
  const goodsSum = cart.reduce((acc, i) => acc + (i.price * i.qty), 0);
  const total = goodsSum + shippingCost;
  const note = document.getElementById('order-note').value;

  let summary = 'OBJEDNÁVKA MERCHE:\n\n';
  cart.forEach(item => {
    summary += `• ${item.title} [${item.variant}] - ${item.qty} ks (${item.price * item.qty} Kč)\n`;
  });
  summary += `\nDoprava: ${method}\n`;
  summary += `Platba: Bankovní převod (splatnost do 48h)\n`;
  if (selectedPacketaPoint) {
    summary += `Pobočka / Z-BOX: ${selectedPacketaPoint.name}, ${selectedPacketaPoint.street}, ${selectedPacketaPoint.city} [ID: ${selectedPacketaPoint.id}]\n`;
  }
  summary += `Celková cena s dopravou: ${total} Kč\n`;
  if (note) summary += `Poznámka: ${note}\n`;

  document.getElementById('order-summary-field').value = summary;

  orderSubmitBtn.disabled = true;
  orderSubmitBtn.textContent = 'Odesílám...';
  orderStatus.className = 'form-status';
  orderStatus.style.display = 'none';

  const data = new FormData(orderForm);

  if (looksLikeBot()) {
    setTimeout(() => {
      orderStatus.textContent = 'Objednávka byla úspěšně odeslána! Platební instrukce s číslem účtu a variabilním symbolem ti dorazí do e-mailu.';
      orderStatus.className = 'form-status success';
      cart = [];
      selectedPacketaPoint = null;
      document.getElementById('modal-packeta-display').style.display = 'none';
      orderForm.reset();
      updateCartUI();
      orderSubmitBtn.disabled = false;
      orderSubmitBtn.textContent = 'Dokončit a odeslat';
      setTimeout(() => { closeCartModal(); backToCartItems(); }, 3500);
    }, 600);
    return;
  }

  try {
    await postWithTimeout(orderForm.action, data);
    orderStatus.textContent = 'Objednávka byla úspěšně odeslána! Platební instrukce s číslem účtu a variabilním symbolem ti dorazí do e-mailu. Pokud instrukce nedorazí do 24 hodin, napiš prosím na antonin.lamac@gmail.com.';
    orderStatus.className = 'form-status success';
    cart = [];
    selectedPacketaPoint = null;
    document.getElementById('modal-packeta-display').style.display = 'none';
    orderForm.reset();
    updateCartUI();
    setTimeout(() => { closeCartModal(); backToCartItems(); }, 3500);
  } catch (err) {
    orderStatus.textContent = 'Došlo k chybě připojení. Zkus to prosím znovu, nebo napiš přímo na antonin.lamac@gmail.com.';
    orderStatus.className = 'form-status error';
  } finally {
    orderSubmitBtn.disabled = false;
    orderSubmitBtn.textContent = 'Dokončit a odeslat';
  }
});

}

const contactForm = document.getElementById('contact-form');
const formStatus = document.getElementById('form-status');
const formSubmitBtn = document.getElementById('form-submit-btn');

contactForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  formSubmitBtn.disabled = true;
  formSubmitBtn.textContent = 'Odesílám...';
  formStatus.className = 'form-status';
  formStatus.style.display = 'none';

  const data = new FormData(contactForm);

  if (looksLikeBot()) {
    setTimeout(() => {
      formStatus.textContent = 'Díky za poptávku! Zpráva byla odeslána, brzy se ti ozvu.';
      formStatus.className = 'form-status success';
      contactForm.reset();
      formSubmitBtn.disabled = false;
      formSubmitBtn.textContent = 'Odeslat poptávku';
    }, 600);
    return;
  }

  try {
    await postWithTimeout(contactForm.action, data);
    formStatus.textContent = 'Díky za poptávku! Zpráva byla odeslána, brzy se ti ozvu. Pokud se do 2 pracovních dnů neozvu, napiš mi prosím přímo na antonin.lamac@gmail.com - mohlo dojít k technické chybě.';
    formStatus.className = 'form-status success';
    contactForm.reset();
  } catch (err) {
    formStatus.textContent = 'Došlo k chybě připojení. Zkus to prosím znovu, nebo napiš přímo na antonin.lamac@gmail.com.';
    formStatus.className = 'form-status error';
  } finally {
    formSubmitBtn.disabled = false;
    formSubmitBtn.textContent = 'Odeslat poptávku';
  }
});

function openLegalModal(type) {
  const modal = document.getElementById('legal-modal');
  const title = document.getElementById('legal-title');
  const body = document.getElementById('legal-body');

  if (type === 'terms') {
    title.textContent = 'Obchodní podmínky';
    body.innerHTML = `
      <p style="background: rgba(255,149,0,0.1); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,149,0,0.3); margin-bottom: 16px;">
        <strong>Provozovatel e-shopu:</strong><br>
        <strong>Jméno:</strong> Antonín Lamač (Tony Brenx)<br>
        <strong>IČO:</strong> 87481235<br>
        <strong>Sídlo:</strong> Palackého 364, Svatava, 357 03<br>
        <strong>E-mail:</strong> antonin.lamac@gmail.com<br>
        <em>Fyzická osoba podnikající dle živnostenského zákona.</em>
      </p>
      
      <h4>1. Všeobecná ustanovení</h4>
      <p>Tyto obchodní podmínky upravují práva a povinnosti smluvních stran vzniklé v souvislosti nebo na základě kupní smlouvy uzavírané mezi prodávajícím a kupujícím prostřednictvím internetového obchodu Tony Brenx.</p>
      
      <h4 style="margin-top:14px;">2. Objednávka a uzavření kupní smlouvy</h4>
      <p>Odesláním objednávky prostřednictvím nákupního košíku kupující potvrzuje, že se seznámil s těmito obchodními podmínkami a souhlasí s nimi. Kupní smlouva vzniká potvrzením objednávky prodávajícím formou automatického e-mailu.</p>
      
      <h4 style="margin-top:14px;">3. Ceny, platba a storno rezervace</h4>
      <p>Veškeré ceny jsou konečné. Platba probíhá výhradně bezhotovostně bankovním převodem na účet prodávajícího (č. ú. 2203409972/2010). Zboží je rezervováno po dobu 48 hodin od odeslání objednávky. Pokud nedojde k připsání platby do 48 hodin, objednávka se automaticky ruší.</p>
      
      <h4 style="margin-top:14px; color:#ff4757;">4. Právo na odstoupení od smlouvy (14 dní)</h4>
      <p>Spotřebitel má právo odstoupit od kupní smlouvy bez udání důvodu ve lhůtě 14 dnů ode dne převzetí zboží. Pro odstoupení můžete využít náš 
      <a href="#" onclick="openLegalModal('withdraw'); return false;" style="color:#ff9500; font-weight:bold; text-decoration:underline;">online formulář pro odstoupení od smlouvy</a>.</p>
      <p style="font-size:0.8rem; color:var(--muted); margin-top:4px;">Právo na odstoupení se nevztahuje na zboží vyrobené nebo upravené podle přání spotřebitele (např. individuálně podepsané velkoformátové tisky na zakázku dle § 1837 občanského zákoníku).</p>
      
      <h4 style="margin-top:14px;">5. Reklamace a záruka</h4>
      <p>Zákonná záruční doba na spotřební zboží činí 24 měsíců. V případě poškození zásilky či vady zboží kontaktujte prodávajícího na e-mailu: <strong>antonin.lamac@gmail.com</strong>.</p>
    `;
  } else if (type === 'privacy') {
    title.textContent = 'Zásady ochrany osobních údajů (GDPR)';
    body.innerHTML = `
      <p style="background: rgba(255,149,0,0.1); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,149,0,0.3); margin-bottom: 16px;">
        <strong>Správce osobních údajů:</strong><br>
        Antonín Lamač, IČO: 87481235, Palackého 364, Svatava 357 03<br>
        <strong>E-mail:</strong> antonin.lamac@gmail.com
      </p>
      <h4>1. Rozsah a účel zpracování</h4>
      <p>Správce zpracovává osobní údaje poskytnuté zákazníkem (jméno, příjmení, e-mail, telefon, zvolené výdejní místo) výhradně za účelem vyřízení objednávky, fakturace, doručení zboží a komunikace ohledně zakázky.</p>
      
      <h4 style="margin-top:14px;">2. Předávání třetím stranám</h4>
      <p>Údaje nezbytné pro doručení jsou předávány přepravci: <strong>Packeta s.r.o. (Zásilkovna)</strong>. Vaše údaje nejsou prodávány ani poskytovány třetím stranám pro marketingové účely.</p>
      
      <h4 style="margin-top:14px;">3. Vaše práva</h4>
      <p>Máte právo na přístup ke svým údajům, jejich opravu, výmaz či omezení zpracování. Kdykoliv se můžete obrátit na správce prostřednictvím e-mailu.</p>
    `;
  } else if (type === 'withdraw') {
    title.textContent = 'Odstoupení od kupní smlouvy';
    body.innerHTML = `
      <p style="margin-bottom: 14px; font-size:0.85rem; color:var(--muted);">
        Jako spotřebitel máte právo odstoupit od smlouvy ve lhůtě 14 dnů od převzetí balíčku. Vyplněním tohoto formuláře odešlete oznámení přímo prodejci.
      </p>
      <form id="withdraw-form" onsubmit="handleWithdrawSubmit(event)">
        <div class="form-group">
          <label>Číslo objednávky / Variabilní symbol *</label>
          <input type="text" id="w-vs" class="form-control" placeholder="např. 26100833" required>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Jméno a příjmení *</label>
            <input type="text" id="w-name" class="form-control" placeholder="Jan Novák" required>
          </div>
          <div class="form-group">
            <label>Váš e-mail *</label>
            <input type="email" id="w-email" class="form-control" placeholder="jmeno@priklad.cz" required>
          </div>
        </div>
        <div class="form-group">
          <label>Číslo účtu pro vrácení platby *</label>
          <input type="text" id="w-account" class="form-control" placeholder="např. 123456789/0100" required>
        </div>
        <div class="form-group">
          <label>Vracené zboží / Důvod (volitelné)</label>
          <textarea id="w-msg" class="form-control" style="min-height:70px;" placeholder="Uveďte zboží, které odesíláte zpět..."></textarea>
        </div>
        <button type="submit" id="w-btn" class="btn btn-primary" style="width:100%; margin-top:8px;">Odeslat oznámení o odstoupení</button>
        <div id="w-status" class="form-status"></div>
      </form>
    `;
  }
  modal.classList.add('open');
}

function closeLegalModal() {
  document.getElementById('legal-modal').classList.remove('open');
}

document.getElementById('legal-modal').addEventListener('click', e => {
  if (e.target === document.getElementById('legal-modal')) closeLegalModal();
});

async function handleWithdrawSubmit(e) {
  e.preventDefault();
  const vs = document.getElementById('w-vs').value;
  const name = document.getElementById('w-name').value;
  const email = document.getElementById('w-email').value;
  const account = document.getElementById('w-account').value;
  const msg = document.getElementById('w-msg').value;
  const btn = document.getElementById('w-btn');
  const status = document.getElementById('w-status');

  btn.disabled = true;
  btn.textContent = 'Odesílám...';

  const formData = new FormData();
  formData.append('form_type', 'Odstoupení od kupní smlouvy');
  formData.append('name', name);
  formData.append('email', email);
  formData.append('phone', 'Odstoupení 14 dnů');
  formData.append('service', 'Odstoupení od smlouvy');
  formData.append('message', `ODSTOUPENÍ OD SMLOUVY:\nČíslo objednávky (VS): ${vs}\nČíslo účtu pro vrácení: ${account}\nZboží / doplňující text: ${msg}`);

  try {
    await postWithTimeout(
      "https://script.google.com/macros/s/AKfycbyZhN-nq-wOZnU4D_kKqqQviFWMmsy_kUMgXflZveLXj25asovkH-YaL9V7eWwiCcM9/exec",
      formData
    );
    status.textContent = 'Oznámení o odstoupení bylo úspěšně odesláno. Brzy tě budu kontaktovat. Pokud se do 2 pracovních dnů neozvu, napiš prosím přímo na antonin.lamac@gmail.com.';
    status.className = 'form-status success';
    setTimeout(() => closeLegalModal(), 3500);
  } catch (err) {
    status.textContent = 'Došlo k chybě připojení. Napiš prosím přímo na antonin.lamac@gmail.com';
    status.className = 'form-status error';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Odeslat oznámení o odstoupení';
  }
}

window.addEventListener('scroll', () => {
  if (window.scrollY > 250) scrollTopBtn.classList.add('visible');
  else scrollTopBtn.classList.remove('visible');
}, {passive:true});
scrollTopBtn.addEventListener('click', () => window.scrollTo({top:0,behavior:'smooth'}));

const list = () => [...g.querySelectorAll('a')];
let cur = 0;
function show(i) {
  const l = list();
  if (!l.length) return;
  cur = (i + l.length) % l.length;
  big.src = l[cur].href;
}
g.addEventListener('click', e => {
  const a = e.target.closest('a');
  if(!a) return;
  e.preventDefault();
  show(list().indexOf(a));
  lb.showModal();
});
document.getElementById('prev').onclick = e => { e.stopPropagation(); show(cur-1); };
document.getElementById('next').onclick = e => { e.stopPropagation(); show(cur+1); };
closeBtn.onclick = e => { e.stopPropagation(); lb.close(); };
lb.addEventListener('click', e => { if (e.target === lb) lb.close(); });
lb.addEventListener('keydown', e => {
  if(e.key === 'ArrowLeft') {
    if (isShopActive && prodModalIsOpen()) prevProductImage();
    else show(cur-1);
  }
  if(e.key === 'ArrowRight') {
    if (isShopActive && prodModalIsOpen()) nextProductImage();
    else show(cur+1);
  }
  if(e.key === 'Escape') {
    if (isShopActive && prodModalIsOpen()) closeProductModal();
  }
});
function prodModalIsOpen() {
  const m = document.getElementById('product-detail-modal');
  return m && m.classList.contains('open');
}

const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) document.querySelectorAll('nav .nav-links a:not(.external-link)').forEach(a => a.classList.toggle('on', a.hash === '#' + e.target.id));
}), { rootMargin: '-45% 0px -50% 0px' });
document.querySelectorAll('section').forEach(x => io.observe(x));