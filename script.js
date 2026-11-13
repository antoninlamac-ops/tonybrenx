/* ---------- Jazyk a měna stránky ----------
   Jazyk se bere z atributu lang na <html> (cs / en / de).
   Shop se zapíná atributem data-shop="on" na <html>. Český web má zatím shop vypnutý.
   Pro EN/DE se ceny a doprava zobrazují v EUR. */
const PAGE_LANG = (document.documentElement.lang || 'cs').slice(0, 2);
// Skrytý náhled pro majitele: otevřete web s ?nahled=tb (vypnutí: ?nahled=off).
// Zapne shop i platbu kartou jen v tomto prohlížeči, veřejnost vidí web beze změny.
const PREVIEW_ALLOWED = false; // náhled vypnutý; zapnout změnou na true
const PREVIEW = PREVIEW_ALLOWED && (() => {
  try {
    const q = new URLSearchParams(location.search).get('nahled');
    if (q === 'tb') sessionStorage.setItem('tb_preview', '1');
    if (q === 'off') sessionStorage.removeItem('tb_preview');
    return sessionStorage.getItem('tb_preview') === '1';
  } catch (e) { return false; }
})();
const isShopActive = document.documentElement.dataset.shop === 'on' || PREVIEW;

const LANG_CONFIG = {
  cs: { locale: 'cs-CZ', currency: 'CZK', packetaCountry: 'cz', packetaLang: 'cs' },
  en: { locale: 'en-GB', currency: 'EUR', packetaCountry: 'cz,sk,pl,de,at,hu', packetaLang: 'en' },
  de: { locale: 'de-DE', currency: 'EUR', packetaCountry: 'cz,sk,pl,de,at,hu', packetaLang: 'de' },
};
const CFG = LANG_CONFIG[PAGE_LANG] || LANG_CONFIG.cs;
const CUR = CFG.currency;
const CART_KEY = 'tb_cart_' + CUR;

// Platba kartou přes Stripe. Zapnout až po otestování testovací kartou.
const STRIPE_ENABLED = PREVIEW; // pro všechny: změnit na true

// Doprava (Zásilkovna). EUR hodnoty jsou ZATÍM ORIENTAČNÍ - potvrďte před spuštěním.
const SHIPPING_FEE = { CZK: 79, EUR: 4.9 };

// Předobjednávka. Dokud je enabled false nebo chybí datum, na webu se nic nezobrazí.
// Před spuštěním doplňte: until (ISO datum s časovou zónou), productIds a discount.
const PRESALE = {
  enabled: false,
  until: null, // DOPLNIT, např. '2027-01-15T10:00:00+01:00'
  productIds: [], // DOPLNIT, např. ['m1']
  discount: 0.1, // DOPLNIT, 10 % sleva
};

const moneyFmt = new Intl.NumberFormat(CFG.locale, {
  style: 'currency',
  currency: CUR,
  minimumFractionDigits: CUR === 'CZK' ? 0 : 2,
  maximumFractionDigits: CUR === 'CZK' ? 0 : 2,
});
function formatMoney(amount) { return moneyFmt.format(amount); }

document.addEventListener("DOMContentLoaded", () => {
  initConsent();
  initInteractions();
  initPaymentChoice();
  if (new URLSearchParams(location.search).get('platba') === 'ok') {
    cart = [];
    localStorage.removeItem(CART_KEY);
    updateCartUI();
  }

  if (isShopActive) {
    const shopSec = document.getElementById('shop');
    if (shopSec) shopSec.style.display = '';
    const cartBtn = document.getElementById('cart-floating-btn');
    if (cartBtn) cartBtn.style.display = 'flex';
    document.querySelectorAll('.nav-shop').forEach(el => {
      el.style.display = el.tagName === 'A' ? 'inline-flex' : '';
    });
    loadPacketaScriptIfNeeded();
    initPresale();
  }
});

/* ---------- Texty podle jazyka ---------- */
const I18N = {
  cs: {
    alertNoPacketa: 'Knihovna Zásilkovny se ještě nenačetla.',
    alertPickPoint: 'Vyber prosím výdejní místo nebo Z-BOX Zásilkovny.',
    cartEmpty: 'Košík je zatím prázdný.',
    cartTotal: 'Zboží celkem:',
    toCheckout: 'Přejít k objednávce',
    remove: 'Odebrat',
    cartTitle: 'Váš Košík',
    checkoutTitle: 'Objednávka merche',
    sending: 'Odesílám...',
    submitOrder: 'Dokončit a odeslat',
    addToCart: 'Do košíku',
    presaleBadge: 'Předobjednávka',
    presaleTitle: 'Předobjednávka',
    presaleEnds: 'Sleva končí za',
    presaleOver: 'Předobjednávka skončila',
    presaleShip: 'Zboží odesíláme po vydání. Předpokládaný termín doplníme.',
    orderOk: 'Objednávka byla úspěšně odeslána!',
    orderOkPay: 'Objednávka byla úspěšně odeslána! Instrukce k platbě dorazí do e-mailu.',
    orderErr: 'Došlo k chybě připojení. Napiš prosím na antonin.lamac@gmail.com.',
    contactOk: 'Díky za poptávku! Zpráva byla odeslána, brzy se ti ozvu.',
    contactOkShort: 'Díky za poptávku! Zpráva byla odeslána.',
    contactErr: 'Došlo k chybě připojení. Napiš prosím na antonin.lamac@gmail.com.',
    submitContact: 'Odeslat poptávku',
    withdrawOk: 'Oznámení bylo úspěšně odesláno.',
    withdrawErr: 'Došlo k chybě. Napiš na antonin.lamac@gmail.com.',
    withdrawSubmit: 'Odeslat odstoupení',
    withdrawTitle: 'Odstoupení od smlouvy',
    withdrawLabels: { vs: 'Číslo objednávky (VS) *', name: 'Jméno a příjmení *', email: 'E-mail *', account: 'Číslo účtu pro vrácení peněz *' },
    legalTitles: { terms: 'Obchodní podmínky', privacy: 'Ochrana soukromí (GDPR)' },
    variants: { S: 'S', M: 'M', L: 'L', XL: 'XL', univ: 'Univerzální velikost (Nastavitelný snap)', A3: 'A3 (30x42 cm)', A2: 'A2 (42x59 cm)' },
    products: {
      t1: { badge: 'Heavy 240g', title: 'Tee „REVÍR“ Black', desc: 'Oversized střih z prémiové těžké 100% bavlny (240 g/m²). Černobílý sítotisk s vysokou trvanlivostí. Vyrobeno pro každodenní street nošení.' },
      t2: { badge: 'Acid Wash', title: 'Tee „BROKEN PLACE“', desc: 'Vintage acid wash úprava, syrový streetový vibe, limitovaná série. Každý kus má unikátní strukturu oprání.' },
      t3: { badge: 'Boxy Fit', title: 'Tee „RAW ATMOSPHERE“', desc: 'Pevný límec, spadlá ramena a autorský print nočního města. Gramáž 220g.' },
      m1: { badge: '[DOPLNIT]', title: '[DOPLNIT NÁZEV MIKINY]', desc: '[DOPLNIT POPIS MIKINY]' },
      h1: { badge: '3D Výšivka', title: 'SnapBack „TB SIGNATURE“', desc: 'Klasický 6-panel střih, matná černá, zelený spodek kšiltu a precizní 3D výšivka loga Tony Brenx.' },
      p1: { badge: 'Archival Matte', title: 'Poster „URBAN SHADOW“', desc: 'Černobílý kontrastní tisk ze sokolovských ulic. Hluboká černá barva na archivním matném papíře 250g.' },
      p2: { badge: 'Fine-Art', title: 'Poster „NOCTURNAL DRIFT“', desc: 'Filmový frame z nočního natáčení s mlžnou atmosférou. Vysoké rozlišení a jemné analogové zrno.' },
      p3: { badge: '310g Print', title: 'Poster „VINTAGE FLARE“', desc: 'Charakteristický swirl bokeh focený vintage sklem Helios 44-2 na plném full-frame snímači.' },
      p4: { badge: 'Limitovaná Edice', title: 'Poster „REVÍR KRUŠNOHOŘÍ“', desc: 'Industriální krajina Krušných hor pod těžkými mraky. Ručně signováno autorem na rubu.' },
    },
    legal: {
      terms: `
      <p class="legal-box">
        <strong>Provozovatel:</strong> Antonín Lamač (Tony Brenx), IČO: 87481235, Palackého 364, Svatava 357 03.<br>
        <strong>Kontakt:</strong> antonin.lamac@gmail.com
      </p>
      <h4>1. Všeobecná ustanovení</h4>
      <p>Tyto podmínky upravují prodej autorského merche a fine-art tisků přes tento web a vztahy mezi provozovatelem a kupujícím.</p>
      <h4>2. Objednávka a cena</h4>
      <p>Objednávka je odeslána vyplněním formuláře. Cena zboží a způsob dopravy jsou uvedeny v košíku před odesláním. Provozovatel potvrdí objednávku e-mailem.</p>
      <h4>3. Platba a dodání</h4>
      <p>Platba probíhá bankovním převodem. Instrukce s číslem účtu a variabilním symbolem přijdou do e-mailu. Splatnost je 48 hodin od odeslání objednávky. Doručení zajišťuje Zásilkovna na výdejní místo, nebo je možné osobní předání v Sokolově.</p>
      <h4>4. Odstoupení od smlouvy</h4>
      <p>Spotřebitel může odstoupit od kupní smlouvy do 14 dnů od převzetí zboží. Formulář pro odstoupení je v zápatí webu. Výjimkou je zboží upravené podle přání zákazníka nebo zhotovené pro jeho osobu (např. tisk s vlastním výběrem fotografie).</p>
      <h4>5. Reklamace a řešení sporů</h4>
      <p>Vady uplatňujte e-mailem na adrese uvedené výše. Spotřebitel může také využít mimosoudní řešení sporů u České obchodní inspekce (adr.coi.cz).</p>
    `,
      privacy: `
      <p class="legal-box">
        <strong>Správce:</strong> Antonín Lamač (Tony Brenx), IČO: 87481235, Palackého 364, Svatava 357 03.<br>
        <strong>Kontakt:</strong> antonin.lamac@gmail.com
      </p>
      <h4>1. Jaké údaje zpracovávám</h4>
      <p>Z poptávkového formuláře jméno, e-mail, telefon a obsah zprávy. Z objednávky navíc jméno, e-mail, telefon, způsob dopravy a u Zásilkovny vybrané výdejní místo. Z formuláře pro odstoupení číslo objednávky, jméno, e-mail a číslo účtu pro vrácení peněz.</p>
      <h4>2. Účely a právní základ</h4>
      <p>Vyřízení poptávky nebo objednávky (plnění smlouvy nebo jednání o ní, čl. 6 odst. 1 písm. b) GDPR). Účetní a daňové povinnosti (čl. 6 odst. 1 písm. c). Ochrana webu před zneužitím formuláře (oprávněný zájem, čl. 6 odst. 1 písm. f). Měření návštěvnosti jen s tvým souhlasem (čl. 6 odst. 1 písm. a).</p>
      <h4>3. Příjemci</h4>
      <p>Formuláře jsou zpracovávány přes Google (Google Apps Script a Google Tabulky) a Zásilkovna s.r.o. pro doručení. Web je hostován na GitHub Pages. Měření návštěvnosti provozuje Google Analytics, a to jen po přijetí souhlasu.</p>
      <h4>4. Doba uložení</h4>
      <p>Poptávky nejdéle 1 rok od poslední komunikace. Objednávky a doklady po dobu stanovenou účetními a daňovými předpisy. Údaje k odstoupení po dobu nutnou k vyřízení a doložení. Údaje z analytiky podle nastavení Google Analytics.</p>
      <h4>5. Cookies a úložiště prohlížeče</h4>
      <p>Obsah košíku a tvoje volba souhlasu se ukládají do úložiště prohlížeče (localStorage). Jde o nezbytné údaje pro provoz webu. Analytické cookies Google se načtou až po přijetí souhlasu. Souhlas můžeš kdykoli odvolat vymazáním údajů webu v prohlížeči.</p>
      <h4>6. Tvoje práva</h4>
      <p>Máš právo na přístup k údajům, opravu, výmaz, omezení zpracování, přenositelnost a vznést námitku. Stížnost můžeš podat u Úřadu pro ochranu osobních údajů (uoou.cz).</p>
    `,
    },
    alt: {
      1: 'Žena v pruhovaném tričku se opírá o dřevěné zábradlí lavičky, tmavé pozadí',
      2: 'Muž s kulečníkovým tágem v květované košili se dívá do objektivu',
      3: 'Muž v klobouku a obleku s odznakem The Three Corners, světelný bokeh v pozadí',
      4: 'Kouř stoupá z ohně, dvě osoby v kapucích v zimním slunci, pohled zezadu',
      5: 'Starší muž s úsměvem vzhlíží u baru, před ním pivní sklenice a láhev',
      6: 'Sousoší soch na střeše betonové budovy pod zataženou oblohou',
      7: 'Ulice s graffiti na roletách a výlohách, černobílá street fotografie',
      8: 'Dva lidé s batohy fotografují kovovou věž na šedém nebi',
      10: 'Starší muž v čepici hraje na housle a dívá se směrem k fotografovi',
      11: 'Fasáda cihlové budovy s nápisem DOLPHIN HOUSE, pohled zdola',
      12: 'Dítě nalévá šumivé víno z láhve s nápisem FRIZZANTE do sklenice na tmavém pozadí',
      13: 'Houslista s brýlemi a klarinetista hrají pod markýzou v ulici',
      14: 'Ruka drží sklenici s rytím Víno z Čejkovic na rozmazaném pozadí',
      15: 'Siluety postav zahalených průhlednou fólií, černobílá fotografie z uliční série',
      16: 'Postavy zahalené průhlednou fólií, černobílá fotografie z uliční série',
      17: 'Postavy zahalené průhlednou fólií, černobílá fotografie z uliční série',
      18: 'Postavy zahalené průhlednou fólií, černobílá fotografie z uliční série',
      19: 'Postavy zahalené průhlednou fólií, černobílá fotografie z uliční série',
      20: 'Postavy zahalené průhlednou fólií, černobílá fotografie z uliční série',
      21: 'Siluety zahalené průhlednou fólií, černobílá fotografie',
      22: 'Siluety zahalené průhlednou fólií, černobílá fotografie z uliční série',
      23: 'Siluety zahalené průhlednou fólií, černobílá fotografie',
      24: 'Rozmazaný portrét ženy za průhlednou fólií v tmavém tónu',
      25: 'Mladý muž sedí na kamenné zdi s velkou taškou, za ním klenutá budova',
      26: 'Muž si zakrývá obličej rukou na ulici, v pozadí výloha a policisté',
      27: 'Interiér obchodu v noci, na poličkách sklenice a zboží, nápis Vítejte v pasáži',
      28: 'Pražský hrad a Vltava v noci, dlouhá expozice',
      29: 'Detail muže s kulatými slunečními brýlemi držícího papírový kelímek kávy',
      30: 'Silueta sochy andělánka s křídly proti oblakům',
      31: 'Dřevěné pahýly ve tvaru rukou vyčnívají z trávy',
      32: 'Muž se dívá do telefonu na ulici, odraz v kaluži, cedule sanita-topení-plyn',
      33: 'Detail kliky dveří s malou hloubkou ostrosti',
      34: 'Mladá žena sedí v interiéru rychlého občerstvení s velkými oblouky',
      35: 'Kurýr na kole s doručovací brašnou v pohybu, rozmazané pozadí',
      36: 'Poštovní schránka s nápisem Berlin, za ní zaparkovaná auta',
      37: 'Betonový žlab vedoucí k kamenné zdi, černobílá architektura',
      38: 'Prosklený strop Sony Center v Berlíně s radiálním tvarem',
      39: 'Nákladní kolo s nápisem BERLIN na předním nosiči na kostkové dlažbě',
      40: 'Kus Berlínské zdi s graffiti symbolem míru, chodci a žena v šátku s telefonem',
      41: 'Ulice na Potsdamer Platz, rozmazané auto, žena čeká na zastávce autobusu',
      42: 'Muž stojí před graffiti na Berlínské zdi, žena kráčí kolem',
      43: 'Nástěnná malba Brother\'s Kiss s cyrilicí, žena jde kolem s kolem',
      44: 'Muž kráčí mezi betonovými stélami památníku v Berlíně',
      45: 'Černobílý umělecký snímek postavy v tmavém prostředí, světlo zdůrazňuje tvary',
      46: 'Černobílý portrét osoby v rozepnuté bílé košili proti tmavému pozadí',
      47: 'Muž v čepici u rolet pokrytých graffiti, černobílá street fotografie',
      48: 'Obchod MR SINGH\'S se zavřenou roletou pokrytou graffiti, pohled z ulice',
      49: 'Dřevěné dveře s mosaznou schránkou a nápisem NO JUNK MAIL',
      50: 'Řada cihlových domů s bílým zábradlím, běžec na chodníku a rozmazaný cyklista v popředí',
      51: 'Malý pejsek na vodítku se dívá vzhůru na fotografa na žulové dlažbě',
      52: 'Cyklista na silnici podél nábřeží, v pozadí řada historických domů',
      53: 'Výloha knihkupectví The Library Project s knihami a odrazem lidí v okně',
      54: 'Žena v kšiltovce a mikině s nápisem KEEP WALKING fotografuje výlohu',
      55: 'Vertikální cedule s velkými písmeny proti světlé obloze, pohled zdola',
    },
    altDefault: 'Černobílá fotografie z ulice od Tony Brenx',
  },

  en: {
    alertNoPacketa: 'The Packeta library has not loaded yet.',
    alertPickPoint: 'Please choose a pickup point or a Packeta Z-BOX.',
    cartEmpty: 'Your cart is empty.',
    cartTotal: 'Goods total:',
    toCheckout: 'Go to checkout',
    remove: 'Remove',
    cartTitle: 'Your cart',
    checkoutTitle: 'Merch order',
    sending: 'Sending...',
    submitOrder: 'Complete and send',
    addToCart: 'Add to cart',
    presaleBadge: 'Pre-order',
    presaleTitle: 'Pre-order',
    presaleEnds: 'Pre-order discount ends in',
    presaleOver: 'Pre-order has ended',
    presaleShip: 'Items ship after release. Estimated date to be added.',
    orderOk: 'Your order has been sent!',
    orderOkPay: 'Your order has been sent! Payment instructions will arrive by email.',
    orderErr: 'A connection error occurred. Please write to antonin.lamac@gmail.com.',
    contactOk: 'Thank you for your enquiry! It has been sent, I will get back to you soon.',
    contactOkShort: 'Thank you for your enquiry! It has been sent.',
    contactErr: 'A connection error occurred. Please write to antonin.lamac@gmail.com.',
    submitContact: 'Send enquiry',
    withdrawOk: 'Your withdrawal notice has been sent.',
    withdrawErr: 'An error occurred. Please write to antonin.lamac@gmail.com.',
    withdrawSubmit: 'Send withdrawal notice',
    withdrawTitle: 'Withdrawal from contract',
    withdrawLabels: { vs: 'Order number (VS) *', name: 'Full name *', email: 'Email *', account: 'Bank account (IBAN) for refund *' },
    legalTitles: { terms: 'Terms and conditions', privacy: 'Privacy (GDPR)' },
    variants: { S: 'S', M: 'M', L: 'L', XL: 'XL', univ: 'One size (adjustable snap)', A3: 'A3 (30x42 cm)', A2: 'A2 (42x59 cm)' },
    products: {
      t1: { badge: 'Heavy 240g', title: 'Tee „REVÍR“ Black', desc: 'Oversized cut made from premium heavyweight 100% cotton (240 g/m²). Black-and-white screen print built to last. Made for everyday street wear.' },
      t2: { badge: 'Acid Wash', title: 'Tee „BROKEN PLACE“', desc: 'Vintage acid wash finish, raw street vibe, limited series. Every piece has its own unique wash pattern.' },
      t3: { badge: 'Boxy Fit', title: 'Tee „RAW ATMOSPHERE“', desc: 'Structured collar, dropped shoulders and an original print of the night city. 220 g/m².' },
      m1: { badge: '[TO FILL]', title: '[TO FILL HOODIE NAME]', desc: '[TO FILL HOODIE DESCRIPTION]' },
      h1: { badge: '3D Embroidery', title: 'SnapBack „TB SIGNATURE“', desc: 'Classic 6-panel cut in matte black, green underside of the peak and a precise 3D embroidery of the Tony Brenx logo.' },
      p1: { badge: 'Archival Matte', title: 'Poster „URBAN SHADOW“', desc: 'Black-and-white high-contrast print from the streets of Sokolov. Deep black on archival matte 250 g paper.' },
      p2: { badge: 'Fine-Art', title: 'Poster „NOCTURNAL DRIFT“', desc: 'Film frame from a night shoot with a misty atmosphere. High resolution and fine analogue grain.' },
      p3: { badge: '310g Print', title: 'Poster „VINTAGE FLARE“', desc: 'Characteristic swirl bokeh shot with a vintage Helios 44-2 lens on a full-frame sensor.' },
      p4: { badge: 'Limited Edition', title: 'Poster „REVÍR KRUŠNOHOŘÍ“', desc: 'Industrial landscape of the Ore Mountains under heavy clouds. Hand-signed by the artist on the back.' },
    },
    legal: {
      terms: `
      <p class="legal-box">
        <strong>Operator:</strong> Antonín Lamač (Tony Brenx), Company ID (IČO): 87481235, Palackého 364, 357 03 Svatava, Czech Republic.<br>
        <strong>Contact:</strong> antonin.lamac@gmail.com
      </p>
      <h4>1. General provisions</h4>
      <p>These terms govern the sale of merchandise and fine-art prints through this website and the relationship between the operator and the buyer.</p>
      <h4>2. Order and price</h4>
      <p>An order is placed by completing the form. Prices in EUR and the shipping method are shown in the cart before the order is sent. The seller is not a VAT payer, so the prices shown are final. The operator confirms the order by email.</p>
      <h4>3. Payment and delivery</h4>
      <p>Payment is made by bank transfer in EUR. Payment details are sent by email and payment is due within 48 hours of sending the order. Delivery is by Packeta to a pickup point, or by personal pickup in Sokolov.</p>
      <h4>4. Withdrawal from contract</h4>
      <p>A consumer may withdraw from the purchase contract within 14 days of receiving the goods. The withdrawal form is in the footer of the website. This does not apply to goods made to the customer's specification or made for the customer personally (e.g. a print of a photo chosen by the customer).</p>
      <h4>5. Complaints and dispute resolution</h4>
      <p>Send complaints by email to the address above. Consumers may also use out-of-court dispute resolution with the Czech Trade Inspection Authority (ČOI, adr.coi.cz).</p>
    `,
      privacy: `
      <p class="legal-box">
        <strong>Controller:</strong> Antonín Lamač (Tony Brenx), Company ID (IČO): 87481235, Palackého 364, 357 03 Svatava, Czech Republic.<br>
        <strong>Contact:</strong> antonin.lamac@gmail.com
      </p>
      <h4>1. Data I process</h4>
      <p>From an order: name, email, phone, the chosen shipping method and, for Packeta, the selected pickup point. From the withdrawal form: order number, name, email and the bank account for the refund.</p>
      <h4>2. Purposes and legal basis</h4>
      <p>Handling an order (performance of a contract or steps before concluding it, Art. 6(1)(b) GDPR). Accounting and tax obligations (Art. 6(1)(c)). Protecting the website against form abuse (legitimate interest, Art. 6(1)(f)). Visitor measurement only with your consent (Art. 6(1)(a)).</p>
      <h4>3. Recipients</h4>
      <p>Forms are processed through Google (Google Apps Script and Google Sheets) and Zásilkovna s.r.o. for delivery. The website is hosted on GitHub Pages. Visitor measurement is provided by Google Analytics, and only after you give consent.</p>
      <h4>4. Retention</h4>
      <p>Orders and accounting documents are kept for the period required by accounting and tax rules. Withdrawal data is kept for as long as needed to process and document it. Analytics data follows the Google Analytics settings.</p>
      <h4>5. Cookies and browser storage</h4>
      <p>Cart contents and your consent choice are stored in the browser's local storage. This data is necessary for the website to work. Google Analytics cookies load only after you accept. You can withdraw consent at any time by clearing the website data in your browser.</p>
      <h4>6. Your rights</h4>
      <p>You have the right of access, rectification, erasure, restriction of processing, data portability and to object. You may lodge a complaint with the Czech Office for Personal Data Protection (uoou.cz).</p>
    `,
    },
    alt: {
      1: 'Woman in a striped top leaning on a wooden bench rail, dark background',
      2: 'Man holding a pool cue in a floral shirt, looking into the camera',
      3: 'Man in a hat and suit with a The Three Corners badge, light bokeh in the background',
      4: 'Smoke rising from a fire, two people in hoods in winter sunlight, seen from behind',
      5: 'Older man smiling upwards at a bar, beer glass and bottle in front of him',
      6: 'Group of sculptures on top of a concrete building under an overcast sky',
      7: 'Street with graffiti on shutters and shop windows, black-and-white street photography',
      8: 'Two people with backpacks photographing a metal tower against a grey sky',
      10: 'Older man in a cap playing the violin, looking towards the photographer',
      11: 'Brick building facade with the sign DOLPHIN HOUSE, seen from below',
      12: 'Child pouring sparkling wine from a bottle labelled FRIZZANTE into a glass on a dark background',
      13: 'Violinist with glasses and a clarinet player performing under an awning in the street',
      14: 'Hand holding a glass engraved Víno z Čejkovic against a blurred background',
      15: 'Silhouettes of people wrapped in clear plastic sheeting, black-and-white street series',
      16: 'Figures wrapped in clear plastic sheeting, black-and-white street series',
      17: 'Figures wrapped in clear plastic sheeting, black-and-white street series',
      18: 'Figures wrapped in clear plastic sheeting, black-and-white street series',
      19: 'Figures wrapped in clear plastic sheeting, black-and-white street series',
      20: 'Figures wrapped in clear plastic sheeting, black-and-white street series',
      21: 'Silhouettes wrapped in clear plastic sheeting, black-and-white photograph',
      22: 'Silhouettes wrapped in clear plastic sheeting, black-and-white street series',
      23: 'Silhouettes wrapped in clear plastic sheeting, black-and-white photograph',
      24: 'Blurred portrait of a woman behind clear plastic film, dark tone',
      25: 'Young man sitting on a stone wall with a large bag, an arched building behind him',
      26: 'Man covering his face with his hand in the street, shop window and police officers in the background',
      27: 'Shop interior at night, shelves with jars and products, sign reading Welcome to the arcade',
      28: 'Prague Castle and the Vltava river at night, long exposure',
      29: 'Close-up of a man in round sunglasses holding a paper coffee cup',
      30: 'Silhouette of an angel statue with wings against clouds',
      31: 'Wooden stumps shaped like hands sticking out of the grass',
      32: 'Man looking at his phone in the street, reflected in a puddle, sign sanita-topení-plyn',
      33: 'Close-up of a door handle with shallow depth of field',
      34: 'Young woman sitting inside a fast-food restaurant with large arches',
      35: 'Courier on a bicycle with a delivery bag in motion, blurred background',
      36: 'Post box labelled Berlin, with parked cars behind it',
      37: 'Concrete channel leading to a stone wall, black-and-white architecture',
      38: 'Glass ceiling of the Sony Center in Berlin with a radial structure',
      39: 'Cargo bike with BERLIN on the front rack on cobblestones',
      40: 'Piece of the Berlin Wall with peace-symbol graffiti, pedestrians and a woman in a headscarf looking at her phone',
      41: 'Street at Potsdamer Platz, blurred car, woman waiting at a bus stop',
      42: 'Man standing in front of graffiti on the Berlin Wall, a woman walking past',
      43: 'Brother\'s Kiss mural with Cyrillic lettering, woman walking past with a bicycle',
      44: 'Man walking between the concrete stelae of a memorial in Berlin',
      45: 'Black-and-white artistic image of a figure in a dark setting, light emphasising the forms',
      46: 'Black-and-white portrait of a person in an open white shirt against a dark background',
      47: 'Man in a cap in front of shutters covered in graffiti, black-and-white street photography',
      48: 'Shop MR SINGH\'S with a closed shutter covered in graffiti, view from the street',
      49: 'Wooden door with a brass letterbox and the sign NO JUNK MAIL',
      50: 'Row of brick houses with a white railing, a jogger on the pavement and a blurred cyclist in the foreground',
      51: 'Small dog on a leash looking up at the photographer on granite paving',
      52: 'Cyclist on the road along the embankment, a row of historic houses behind',
      53: 'Window of The Library Project bookshop with books and reflections of people in the glass',
      54: 'Woman in a cap and sweatshirt with KEEP WALKING photographing a shop window',
      55: 'Vertical sign with large letters against a bright sky, seen from below',
    },
    altDefault: 'Black-and-white street photograph by Tony Brenx',
  },

  de: {
    alertNoPacketa: 'Die Packeta-Bibliothek wurde noch nicht geladen.',
    alertPickPoint: 'Bitte wähle eine Abholstelle oder eine Packeta Z-BOX aus.',
    cartEmpty: 'Dein Warenkorb ist noch leer.',
    cartTotal: 'Warenwert gesamt:',
    toCheckout: 'Zur Bestellung',
    remove: 'Entfernen',
    cartTitle: 'Dein Warenkorb',
    checkoutTitle: 'Merch-Bestellung',
    sending: 'Wird gesendet...',
    submitOrder: 'Abschließen und senden',
    addToCart: 'In den Warenkorb',
    presaleBadge: 'Vorbestellung',
    presaleTitle: 'Vorbestellung',
    presaleEnds: 'Vorbestellungsrabatt endet in',
    presaleOver: 'Vorbestellung beendet',
    presaleShip: 'Versand nach Erscheinen. Voraussichtlicher Termin wird ergänzt.',
    orderOk: 'Deine Bestellung wurde erfolgreich gesendet!',
    orderOkPay: 'Deine Bestellung wurde erfolgreich gesendet! Die Zahlungsanweisung kommt per E-Mail.',
    orderErr: 'Es gab einen Verbindungsfehler. Bitte schreibe an antonin.lamac@gmail.com.',
    contactOk: 'Danke für deine Anfrage! Sie wurde gesendet, ich melde mich bald bei dir.',
    contactOkShort: 'Danke für deine Anfrage! Sie wurde gesendet.',
    contactErr: 'Es gab einen Verbindungsfehler. Bitte schreibe an antonin.lamac@gmail.com.',
    submitContact: 'Anfrage senden',
    withdrawOk: 'Deine Widerrufserklärung wurde gesendet.',
    withdrawErr: 'Es ist ein Fehler aufgetreten. Bitte schreibe an antonin.lamac@gmail.com.',
    withdrawSubmit: 'Widerruf senden',
    withdrawTitle: 'Widerruf vom Vertrag',
    withdrawLabels: { vs: 'Bestellnummer (VS) *', name: 'Vor- und Nachname *', email: 'E-Mail *', account: 'Bankkonto (IBAN) für die Rückzahlung *' },
    legalTitles: { terms: 'Allgemeine Geschäftsbedingungen', privacy: 'Datenschutz (DSGVO)' },
    variants: { S: 'S', M: 'M', L: 'L', XL: 'XL', univ: 'Einheitsgröße (verstellbarer Snap)', A3: 'A3 (30 x 42 cm)', A2: 'A2 (42 x 59 cm)' },
    products: {
      t1: { badge: 'Heavy 240g', title: 'Tee „REVÍR“ Black', desc: 'Oversized-Schnitt aus hochwertiger schwerer 100 % Baumwolle (240 g/m²). Schwarz-weißer Siebdruck mit hoher Haltbarkeit. Für den täglichen Streetwear-Look gemacht.' },
      t2: { badge: 'Acid Wash', title: 'Tee „BROKEN PLACE“', desc: 'Vintage-Acid-Wash-Veredelung, roher Streetwear-Vibe, limitierte Serie. Jedes Stück hat eine einzigartige Waschstruktur.' },
      t3: { badge: 'Boxy Fit', title: 'Tee „RAW ATMOSPHERE“', desc: 'Fester Kragen, tiefe Schultern und ein eigener Print einer nächtlichen Stadt. 220 g/m².' },
      m1: { badge: '[ZU ERGÄNZEN]', title: '[NAME DER MIKINA ERGÄNZEN]', desc: '[BESCHREIBUNG DER MIKINA ERGÄNZEN]' },
      h1: { badge: '3D-Stickerei', title: 'SnapBack „TB SIGNATURE“', desc: 'Klassischer 6-Panel-Schnitt in mattem Schwarz, grüne Unterseite des Schirms und präzise 3D-Stickerei des Tony-Brenx-Logos.' },
      p1: { badge: 'Archival Matte', title: 'Poster „URBAN SHADOW“', desc: 'Schwarz-weißer kontrastreicher Druck aus den Straßen von Sokolov. Tiefes Schwarz auf archivfestem Mattpapier mit 250 g.' },
      p2: { badge: 'Fine-Art', title: 'Poster „NOCTURNAL DRIFT“', desc: 'Filmframe aus einer Nachtaufnahme mit nebliger Atmosphäre. Hohe Auflösung und feines analoges Korn.' },
      p3: { badge: '310g Print', title: 'Poster „VINTAGE FLARE“', desc: 'Charakteristisches Swirl-Bokeh, aufgenommen mit dem Vintage-Objektiv Helios 44-2 auf einem Vollformatsensor.' },
      p4: { badge: 'Limitierte Edition', title: 'Poster „REVÍR KRUŠNOHOŘÍ“', desc: 'Industrielandschaft des Erzgebirges unter schweren Wolken. Auf der Rückseite vom Künstler handsigniert.' },
    },
    legal: {
      terms: `
      <p class="legal-box">
        <strong>Betreiber:</strong> Antonín Lamač (Tony Brenx), IČO: 87481235, Palackého 364, 357 03 Svatava, Tschechien.<br>
        <strong>Kontakt:</strong> antonin.lamac@gmail.com
      </p>
      <h4>1. Allgemeines</h4>
      <p>Diese Bedingungen regeln den Verkauf von Merchandise und Fine-Art-Drucken über diese Website sowie das Verhältnis zwischen Betreiber und Käufer.</p>
      <h4>2. Bestellung und Preis</h4>
      <p>Die Bestellung erfolgt durch Ausfüllen des Formulars. Preise in Euro und die Versandart werden vor dem Absenden im Warenkorb angezeigt. Der Verkäufer ist nicht umsatzsteuerpflichtig; die angezeigten Preise sind Endpreise. Der Betreiber bestätigt die Bestellung per E-Mail.</p>
      <h4>3. Zahlung und Lieferung</h4>
      <p>Die Zahlung erfolgt per Banküberweisung in Euro. Die Zahlungsdaten werden per E-Mail gesendet; die Zahlung ist innerhalb von 48 Stunden nach dem Absenden der Bestellung fällig. Die Lieferung erfolgt mit Packeta an eine Abholstelle oder durch persönliche Abholung in Sokolov.</p>
      <h4>4. Widerrufsrecht</h4>
      <p>Verbraucher können innerhalb von 14 Tagen nach Erhalt der Ware vom Kaufvertrag zurücktreten. Das Widerrufsformular befindet sich in der Fußzeile der Website. Ausgenommen sind nach Kundenwunsch angefertigte Waren oder Waren, die persönlich für den Kunden hergestellt wurden (z. B. ein Druck mit einer vom Kunden gewählten Fotografie).</p>
      <h4>5. Reklamation und Streitbeilegung</h4>
      <p>Mängel bitte per E-Mail an die oben genannte Adresse melden. Verbraucher können außerdem die tschechische Handelsinspektion (ČOI, adr.coi.cz) zur außergerichtlichen Streitbeilegung kontaktieren.</p>
    `,
      privacy: `
      <p class="legal-box">
        <strong>Verantwortlicher:</strong> Antonín Lamač (Tony Brenx), IČO: 87481235, Palackého 364, 357 03 Svatava, Tschechien.<br>
        <strong>Kontakt:</strong> antonin.lamac@gmail.com
      </p>
      <h4>1. Welche Daten ich verarbeite</h4>
      <p>Bei einer Bestellung: Name, E-Mail, Telefon, die gewählte Versandart und bei Packeta die ausgewählte Abholstelle. Über das Widerrufsformular: Bestellnummer, Name, E-Mail und das Bankkonto für die Rückzahlung.</p>
      <h4>2. Zwecke und Rechtsgrundlage</h4>
      <p>Abwicklung einer Bestellung (Erfüllung eines Vertrags oder vorvertragliche Maßnahmen, Art. 6 Abs. 1 lit. b DSGVO). Buchhaltungs- und Steuerpflichten (Art. 6 Abs. 1 lit. c). Schutz der Website vor Missbrauch des Formulars (berechtigtes Interesse, Art. 6 Abs. 1 lit. f). Reichweitenmessung nur mit deiner Einwilligung (Art. 6 Abs. 1 lit. a).</p>
      <h4>3. Empfänger</h4>
      <p>Formulare werden über Google (Google Apps Script und Google Tabellen) und die Zásilkovna s.r.o. für die Zustellung verarbeitet. Die Website wird auf GitHub Pages gehostet. Die Reichweitenmessung erfolgt über Google Analytics, und zwar erst nach deiner Einwilligung.</p>
      <h4>4. Speicherdauer</h4>
      <p>Bestellungen und Buchhaltungsbelege werden so lange aufbewahrt, wie es die Buchhaltungs- und Steuervorschriften verlangen. Widerrufsdaten werden so lange gespeichert, wie es für die Abwicklung und den Nachweis nötig ist. Analysedaten richten sich nach den Einstellungen von Google Analytics.</p>
      <h4>5. Cookies und Browserspeicher</h4>
      <p>Der Warenkorbinhalt und deine Einwilligungsentscheidung werden im lokalen Speicher deines Browsers (localStorage) abgelegt. Diese Daten sind für den Betrieb der Website notwendig. Google-Analytics-Cookies werden erst nach deiner Zustimmung geladen. Du kannst die Einwilligung jederzeit widerrufen, indem du die Website-Daten in deinem Browser löschst.</p>
      <h4>6. Deine Rechte</h4>
      <p>Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch. Beschwerden kannst du beim tschechischen Amt für den Schutz personenbezogener Daten (uoou.cz) einreichen.</p>
    `,
    },
    alt: {
      1: 'Frau im gestreiften Oberteil lehnt am Holzgeländer einer Bank, dunkler Hintergrund',
      2: 'Mann mit Billardqueue im Blumenhemd, blickt in die Kamera',
      3: 'Mann mit Hut und Anzug mit dem Abzeichen The Three Corners, Lichtbokeh im Hintergrund',
      4: 'Rauch steigt von einem Feuer auf, zwei Personen mit Kapuzen im winterlichen Sonnenlicht, von hinten',
      5: 'Älterer Mann lächelt nach oben an einer Bar, vor ihm ein Bierglas und eine Flasche',
      6: 'Skulpturengruppe auf dem Dach eines Betongebäudes unter bedecktem Himmel',
      7: 'Straße mit Graffiti auf Rollläden und Schaufenstern, Schwarz-Weiß-Streetfotografie',
      8: 'Zwei Personen mit Rucksäcken fotografieren einen Metallturm vor grauem Himmel',
      10: 'Älterer Mann mit Mütze spielt Geige und blickt zum Fotografen',
      11: 'Fassade eines Backsteingebäudes mit der Aufschrift DOLPHIN HOUSE, Ansicht von unten',
      12: 'Kind gießt Schaumwein aus einer Flasche mit der Aufschrift FRIZZANTE in ein Glas, dunkler Hintergrund',
      13: 'Geiger mit Brille und Klarinettist spielen unter einer Markise auf der Straße',
      14: 'Hand hält ein Glas mit der Gravur Víno z Čejkovic vor unscharfem Hintergrund',
      15: 'Silhouetten von Personen in durchsichtiger Plastikfolie, Schwarz-Weiß-Straßenserie',
      16: 'Figuren in durchsichtiger Plastikfolie, Schwarz-Weiß-Straßenserie',
      17: 'Figuren in durchsichtiger Plastikfolie, Schwarz-Weiß-Straßenserie',
      18: 'Figuren in durchsichtiger Plastikfolie, Schwarz-Weiß-Straßenserie',
      19: 'Figuren in durchsichtiger Plastikfolie, Schwarz-Weiß-Straßenserie',
      20: 'Figuren in durchsichtiger Plastikfolie, Schwarz-Weiß-Straßenserie',
      21: 'Silhouetten in durchsichtiger Folie, Schwarz-Weiß-Fotografie',
      22: 'Silhouetten in durchsichtiger Folie, Schwarz-Weiß-Straßenserie',
      23: 'Silhouetten in durchsichtiger Folie, Schwarz-Weiß-Fotografie',
      24: 'Unscharfes Porträt einer Frau hinter durchsichtiger Folie, dunkler Ton',
      25: 'Junger Mann sitzt mit großer Tasche auf einer Steinmauer, dahinter ein Gebäude mit Torbogen',
      26: 'Mann bedeckt sein Gesicht mit der Hand auf der Straße, im Hintergrund Schaufenster und Polizisten',
      27: 'Ladeninneres bei Nacht, Regale mit Gläsern und Waren, Schild mit der Aufschrift Willkommen in der Passage',
      28: 'Prager Burg und Moldau bei Nacht, Langzeitbelichtung',
      29: 'Nahaufnahme eines Mannes mit runder Sonnenbrille, der einen Pappbecher Kaffee hält',
      30: 'Silhouette einer Engelsstatue mit Flügeln vor Wolken',
      31: 'Hölzerne Baumstümpfe in Form von Händen ragen aus dem Gras',
      32: 'Mann schaut auf der Straße auf sein Handy, Spiegelung in einer Pfütze, Schild sanita-topení-plyn',
      33: 'Nahaufnahme eines Türgriffs mit geringer Schärfentiefe',
      34: 'Junge Frau sitzt in einem Schnellrestaurant mit großen Bögen',
      35: 'Kurier auf dem Fahrrad mit Lieferrucksack in Bewegung, unscharfer Hintergrund',
      36: 'Briefkasten mit der Aufschrift Berlin, dahinter parkende Autos',
      37: 'Betonkanal führt zu einer Steinmauer, Schwarz-Weiß-Architektur',
      38: 'Glasdach des Sony Centers in Berlin mit radialer Struktur',
      39: 'Lastenrad mit der Aufschrift BERLIN am vorderen Gepäckträger auf Kopfsteinpflaster',
      40: 'Stück der Berliner Mauer mit Friedenssymbol-Graffiti, Passanten und eine Frau mit Kopftuch am Handy',
      41: 'Straße am Potsdamer Platz, verschwommenes Auto, Frau wartet an der Bushaltestelle',
      42: 'Mann steht vor Graffiti an der Berliner Mauer, eine Frau geht vorbei',
      43: 'Wandgemälde Brother\'s Kiss mit kyrillischer Schrift, Frau geht mit einem Fahrrad vorbei',
      44: 'Mann geht zwischen den Betonstelen eines Denkmals in Berlin',
      45: 'Schwarz-weiße künstlerische Aufnahme einer Figur im dunklen Raum, das Licht betont die Formen',
      46: 'Schwarz-weißes Porträt einer Person mit offenem weißem Hemd vor dunklem Hintergrund',
      47: 'Mann mit Mütze vor Rollläden voller Graffiti, Schwarz-Weiß-Streetfotografie',
      48: 'Laden MR SINGH\'S mit geschlossenem, besprühtem Rollladen, Blick von der Straße',
      49: 'Holztür mit Messingbriefkasten und dem Schild NO JUNK MAIL',
      50: 'Reihe von Backsteinhäusern mit weißem Geländer, Jogger auf dem Gehweg und ein unscharfer Radfahrer im Vordergrund',
      51: 'Kleiner Hund an der Leine schaut zum Fotografen auf, Granitpflaster',
      52: 'Radfahrer auf der Straße entlang der Uferpromenade, dahinter eine Reihe historischer Häuser',
      53: 'Schaufenster der Buchhandlung The Library Project mit Büchern und Spiegelungen von Menschen',
      54: 'Frau mit Kappe und Sweatshirt mit KEEP WALKING fotografiert ein Schaufenster',
      55: 'Vertikales Schild mit großen Buchstaben vor hellem Himmel, Ansicht von unten',
    },
    altDefault: 'Schwarz-weiße Streetfotografie von Tony Brenx',
  },
};

const T = I18N[PAGE_LANG] || I18N.cs;
function t(key) { return T[key]; }

/* ---------- Katalog produktů (ceny v obou měnách) ----------
   Ceny v EUR jsou ORIENTAČNÍ přepočtem (25 Kč/€, zaokrouhleno). Potvrďte je před spuštěním. */
const PRODUCTS = [
  { id: 't1', category: 'trika', variants: [
      { key: 'S', prices: { CZK: 790, EUR: 40 } }, { key: 'M', prices: { CZK: 790, EUR: 40 } },
      { key: 'L', prices: { CZK: 790, EUR: 40 } }, { key: 'XL', prices: { CZK: 790, EUR: 40 } }] },
  { id: 't2', category: 'trika', variants: [
      { key: 'S', prices: { CZK: 790, EUR: 40 } }, { key: 'M', prices: { CZK: 790, EUR: 40 } },
      { key: 'L', prices: { CZK: 790, EUR: 40 } }, { key: 'XL', prices: { CZK: 790, EUR: 40 } }] },
  { id: 't3', category: 'trika', variants: [
      { key: 'S', prices: { CZK: 790, EUR: 40 } }, { key: 'M', prices: { CZK: 790, EUR: 40 } },
      { key: 'L', prices: { CZK: 790, EUR: 40 } }, { key: 'XL', prices: { CZK: 790, EUR: 40 } }] },
  { id: 'm1', category: 'trika', variants: [
      { key: 'S', prices: { CZK: 1390, EUR: 60 } }, { key: 'M', prices: { CZK: 1390, EUR: 60 } },
      { key: 'L', prices: { CZK: 1390, EUR: 60 } }, { key: 'XL', prices: { CZK: 1390, EUR: 60 } }] },
  { id: 'h1', category: 'headwear', variants: [
      { key: 'univ', prices: { CZK: 590, EUR: 29 } }] },
  { id: 'p1', category: 'postery', variants: [
      { key: 'A3', prices: { CZK: 590, EUR: 24 } }, { key: 'A2', prices: { CZK: 840, EUR: 34 } }] },
  { id: 'p2', category: 'postery', variants: [
      { key: 'A3', prices: { CZK: 590, EUR: 24 } }, { key: 'A2', prices: { CZK: 840, EUR: 34 } }] },
  { id: 'p3', category: 'postery', variants: [
      { key: 'A3', prices: { CZK: 650, EUR: 26 } }, { key: 'A2', prices: { CZK: 900, EUR: 36 } }] },
  { id: 'p4', category: 'postery', variants: [
      { key: 'A3', prices: { CZK: 650, EUR: 26 } }, { key: 'A2', prices: { CZK: 900, EUR: 36 } }] },
];
const PRODUCT_IMAGES = {
  t1: ['/img-web/foto-1.webp', '/img-web/foto-2.webp', '/img-web/foto-3.webp'],
  t2: ['/img-web/foto-5.webp', '/img-web/foto-6.webp', '/img-web/foto-7.webp'],
  t3: ['/img-web/foto-12.webp', '/img-web/foto-13.webp', '/img-web/foto-14.webp'],
  m1: ['/img-web/foto-1.webp'], // DOPLNIT: fotka mikiny
  h1: ['/img-web/foto-20.webp', '/img-web/foto-21.webp'],
  p1: ['/img-web/foto-25.webp', '/img-web/foto-26.webp'],
  p2: ['/img-web/foto-33.webp', '/img-web/foto-34.webp'],
  p3: ['/img-web/foto-42.webp', '/img-web/foto-43.webp'],
  p4: ['/img-web/foto-50.webp', '/img-web/foto-51.webp'],
};

function initPresale() {
  if (!presaleActive()) return;
  const grid = document.getElementById('shop-grid-container');
  if (!grid || document.getElementById('presale-banner')) return;
  const box = document.createElement('div');
  box.id = 'presale-banner';
  box.className = 'presale-banner';
  box.innerHTML = '<strong>' + escapeHtml(t('presaleTitle')) + '</strong><span id="presale-count"></span><small>' + escapeHtml(t('presaleShip')) + '</small>';
  grid.parentNode.insertBefore(box, grid);
  const end = Date.parse(PRESALE.until);
  const out = document.getElementById('presale-count');
  const timer = setInterval(tick, 1000);
  function tick() {
    const left = end - Date.now();
    if (left <= 0) {
      clearInterval(timer);
      const b = document.getElementById('presale-banner');
      if (b) b.remove();
      renderShopGrid();
      updateCartUI();
      return;
    }
    const d = Math.floor(left / 864e5);
    const h = Math.floor((left % 864e5) / 36e5);
    const m = Math.floor((left % 36e5) / 6e4);
    const sec = Math.floor((left % 6e4) / 1e3);
    out.textContent = t('presaleEnds') + ' ' + d + ' d ' + h + ' h ' + m + ' m ' + sec + ' s';
  }
  tick();
}

function findProduct(id) { return PRODUCTS.find(p => p.id === id); }
function productText(id) { return T.products[id] || I18N.cs.products[id]; }
function variantLabel(key) { return T.variants[key] || key; }
function variantPrice(variant) { return variant.prices[CUR]; }
function presaleActive() {
  return PRESALE.enabled && !!PRESALE.until && Date.now() < Date.parse(PRESALE.until);
}
function isPresaleProduct(prodId) {
  return presaleActive() && PRESALE.productIds.includes(prodId);
}
function unitPrice(prod, variant) {
  const base = variantPrice(variant);
  return isPresaleProduct(prod.id) ? Math.round(base * (1 - PRESALE.discount)) : base;
}
function priceHtml(prod) {
  const base = variantPrice(prod.variants[0]);
  const now = unitPrice(prod, prod.variants[0]);
  if (now === base) return formatMoney(base);
  return `<s class="product-price-old">${formatMoney(base)}</s>${formatMoney(now)}`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ---------- Souhlas s cookies a analytika ----------
   Analytika (GA) ani notifikace o návštěvě se nespustí, dokud návštěvník nepřijme. */
const CONSENT_KEY = 'tb_consent';
const GA_ID = 'G-FH4P3QX2RQ';
const VISIT_PING_URL = 'https://script.google.com/macros/s/AKfycbxctDn8h7ZE472yJG_ppNO7Yy6fFOkoUBBvvPVzKR9EOHc_dJR7MAz0N6bf28fBX0fQvA/exec';

function getConsent() {
  try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; }
}

function setConsent(value) {
  try { localStorage.setItem(CONSENT_KEY, value); } catch (e) { /* tichá chyba */ }
}

function initConsent() {
  const banner = document.getElementById('consent-banner');
  const consent = getConsent();
  if (consent === 'accepted') loadAnalytics();
  if (!banner) return;
  if (consent === null) banner.hidden = false;
  banner.addEventListener('click', e => {
    const btn = e.target.closest('[data-consent]');
    if (!btn) return;
    const value = btn.dataset.consent;
    setConsent(value);
    banner.hidden = true;
    if (value === 'accepted') loadAnalytics();
  });
}

function loadAnalytics() {
  if (window.tbAnalyticsLoaded) return;
  window.tbAnalyticsLoaded = true;
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID, { anonymize_ip: true });
  sendVisitNotification();
}

function sendVisitNotification() {
  try {
    const img = new Image();
    img.src = VISIT_PING_URL + '?t=' + Date.now();
  } catch (e) {
    // tichá chyba - notifikace nesmí nijak narušit chod webu
  }
}

/* ---------- Delegované události (nahrazují inline onclick kvůli CSP) ---------- */
function initInteractions() {
  document.addEventListener('click', e => {
    const legal = e.target.closest('[data-legal]');
    if (legal) {
      e.preventDefault();
      openLegalModal(legal.dataset.legal);
      return;
    }
    const el = e.target.closest('[data-action]');
    if (!el) return;
    switch (el.dataset.action) {
      case 'checkout': showCheckoutForm(); break;
      case 'back-cart': backToCartItems(); break;
      case 'packeta': openPacketaWidget(); break;
      case 'close-product': closeProductModal(); break;
      case 'prev-product': prevProductImage(e); break;
      case 'next-product': nextProductImage(e); break;
      case 'close-legal': closeLegalModal(); break;
      case 'remove-cart': removeFromCart(Number(el.dataset.index)); break;
    }
  });

  document.addEventListener('submit', e => {
    if (e.target.id === 'withdraw-form') handleWithdrawSubmit(e);
  });

  document.addEventListener('contextmenu', e => {
    if (e.target.tagName === 'IMG') e.preventDefault();
  });

  const shipping = document.getElementById('order-shipping');
  if (shipping) shipping.addEventListener('change', handleModalShippingChange);
}

function loadPacketaScriptIfNeeded() {
  if (window.Packeta || document.getElementById('packeta-widget-lib')) return;
  const s = document.createElement('script');
  s.id = 'packeta-widget-lib';
  s.src = 'https://widget.packeta.com/www/js/library.js';
  document.head.appendChild(s);
}

// Honeypot: skryté pole _gotcha vyplní jen bot. Časová kontrola byla odstraněna,
// protože zahazovala skutečné zprávy od rychlých uživatelů.
function isHoneypotFilled(form) {
  const hp = form.querySelector('input[name="_gotcha"]');
  return !!(hp && hp.value);
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
    const altText = T.alt[id] || T.altDefault;
    const a = document.createElement('a');
    a.href = `/img-web/large/foto-${id}.webp`;
    a.setAttribute('aria-label', altText);
    a.style.animation = `revealPhoto 0.5s ease both ${idx * 0.04}s`;

    const im = document.createElement('img');
    im.src = `/img-web/thumb/foto-${id}.webp`;
    im.alt = altText;
    im.decoding = 'async';
    im.loading = 'lazy';
    im.draggable = false;

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

/* ---------- Shop: výpis produktů ---------- */
function renderShopGrid() {
  const shopGrid = document.getElementById('shop-grid-container');
  if (!shopGrid) return;
  shopGrid.innerHTML = '';
  PRODUCTS.forEach(prod => {
    const text = productText(prod.id);
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.category = prod.category;
    card.dataset.pid = prod.id;

    const selectHtml = prod.variants.length > 1
      ? `<select class="product-select" aria-label="${escapeHtml(text.title)}">
          ${prod.variants.map((v, i) => `<option value="${escapeHtml(v.key)}" ${i === 1 ? 'selected' : ''}>${escapeHtml(variantLabel(v.key))}</option>`).join('')}
        </select>`
      : '';

    card.innerHTML = `
      <div class="product-img-box">
        <span class="product-badge">${escapeHtml(isPresaleProduct(prod.id) ? t('presaleBadge') : text.badge)}</span>
        <img src="${PRODUCT_IMAGES[prod.id][0]}" alt="${escapeHtml(text.title)}" loading="lazy" draggable="false">
      </div>
      <div class="product-info">
        <h3 class="product-title">${escapeHtml(text.title)}</h3>
        <p class="product-desc">${escapeHtml(text.desc.substring(0, 75))}...</p>
        <div class="product-meta">
          <span class="product-price">${priceHtml(prod)}</span>
          ${selectHtml}
        </div>
        <button type="button" class="btn-buy">${escapeHtml(t('addToCart'))}</button>
      </div>
    `;
    shopGrid.appendChild(card);
  });
}

function initShopGrid() {
  const shopGrid = document.getElementById('shop-grid-container');
  if (!shopGrid) return;
  renderShopGrid();

  // Delegace událostí místo inline onclick (kvůli CSP)
  shopGrid.addEventListener('click', e => {
    const card = e.target.closest('.product-card');
    if (!card) return;
    if (e.target.closest('select')) return;
    if (e.target.closest('.btn-buy')) {
      const select = card.querySelector('.product-select');
      handleQuickBuy(card.dataset.pid, select ? select.value : null);
      return;
    }
    openProductModal(card.dataset.pid);
  });

  function updateFilterCounts() {
    const counts = { all: PRODUCTS.length };
    PRODUCTS.forEach(p => { counts[p.category] = (counts[p.category] || 0) + 1; });
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
if (isShopActive) initShopGrid();

/* ---------- Detail produktu ---------- */
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
  currentProduct = findProduct(productId);
  if (!currentProduct) return;
  const text = productText(productId);

  currentProdImgIndex = 0;
  resetZoom();

  if (pmBadge) pmBadge.textContent = text.badge;
  if (pmTitle) pmTitle.textContent = text.title;
  if (pmDesc) pmDesc.textContent = text.desc;
  if (pmPrice) pmPrice.textContent = formatMoney(currentProduct.variants[0].prices[CUR]);

  if (pmVariantSelect) {
    pmVariantSelect.innerHTML = currentProduct.variants.map(v =>
      `<option value="${escapeHtml(v.key)}" data-price="${v.prices[CUR]}">${escapeHtml(variantLabel(v.key))} (${formatMoney(v.prices[CUR])})</option>`
    ).join('');
    pmVariantSelect.onchange = () => {
      const selectedOpt = pmVariantSelect.options[pmVariantSelect.selectedIndex];
      if (pmPrice) pmPrice.textContent = formatMoney(Number(selectedOpt.dataset.price));
    };
  }

  updateProductImageDisplay();
  if (prodModal) prodModal.classList.add('open');
}

function updateProductImageDisplay() {
  if (!pmActiveImg || !currentProduct) return;
  const images = PRODUCT_IMAGES[currentProduct.id];
  pmActiveImg.src = images[currentProdImgIndex];
  pmActiveImg.alt = productText(currentProduct.id).title;
  if (pmThumbsBox) {
    pmThumbsBox.innerHTML = '';
    images.forEach((imgUrl, idx) => {
      const thumb = document.createElement('div');
      thumb.className = `pm-thumb ${idx === currentProdImgIndex ? 'active' : ''}`;
      thumb.innerHTML = `<img src="${imgUrl}" alt="" draggable="false">`;
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
  const n = PRODUCT_IMAGES[currentProduct.id].length;
  currentProdImgIndex = (currentProdImgIndex - 1 + n) % n;
  updateProductImageDisplay();
}

function nextProductImage(e) {
  if (e) e.stopPropagation();
  resetZoom();
  const n = PRODUCT_IMAGES[currentProduct.id].length;
  currentProdImgIndex = (currentProdImgIndex + 1) % n;
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
    addToCart(currentProduct.id, selectedOpt.value);
    closeProductModal();
  };
}

function handleQuickBuy(prodId, variantKey) {
  const prod = findProduct(prodId);
  if (!prod) return;
  addToCart(prodId, variantKey || prod.variants[0].key);
}

/* ---------- Košík ---------- */
function loadCart() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CART_KEY));
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(i => {
      const prod = i && findProduct(i.pid);
      return prod && typeof i.variant === 'string' &&
        prod.variants.some(v => v.key === i.variant) &&
        Number.isFinite(i.qty) && i.qty > 0;
    }).map(i => ({ pid: i.pid, variant: i.variant, qty: Math.floor(i.qty) }));
  } catch (e) {
    return [];
  }
}
let cart = loadCart();
const cartFloatingBtn = document.getElementById('cart-floating-btn');
const cartModal = document.getElementById('cart-modal');
const closeCartBtn = document.getElementById('close-cart-btn');
const cartCount = document.getElementById('cart-count');
const cartItemsContainer = document.getElementById('cart-items-container');
const cartTotalPrice = document.getElementById('cart-total-price');

// Rozbalí položky košíku na názvy a ceny aktuální měny
function cartLines() {
  return cart.map(item => {
    const prod = findProduct(item.pid);
    const variant = prod && prod.variants.find(v => v.key === item.variant);
    if (!prod || !variant) return null;
    return {
      index: null,
      title: productText(prod.id).title,
      variantLabel: variantLabel(variant.key),
      qty: item.qty,
      unit: unitPrice(prod, variant),
    };
  }).filter(Boolean);
}

function goodsTotal() {
  return cartLines().reduce((acc, line) => acc + line.unit * line.qty, 0);
}

function openCartModal() { if (cartModal) cartModal.classList.add('open'); }
function closeCartModal() { if (cartModal) cartModal.classList.remove('open'); }

function updateCartUI() {
  try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) { /* tichá chyba */ }
  if (cartCount) cartCount.textContent = cart.reduce((acc, item) => acc + item.qty, 0);

  if (!cartItemsContainer) return;
  const checkoutBtn = document.getElementById('go-to-checkout-btn');
  if (cart.length === 0) {
    cartItemsContainer.innerHTML = `<div class="cart-empty-text">${escapeHtml(t('cartEmpty'))}</div>`;
    if (cartTotalPrice) cartTotalPrice.textContent = formatMoney(0);
    if (checkoutBtn) checkoutBtn.style.display = 'none';
    return;
  }

  if (checkoutBtn) checkoutBtn.style.display = 'block';
  cartItemsContainer.innerHTML = '';
  cartLines().forEach((line, index) => {
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <div>
        <div class="cart-item-title">${escapeHtml(line.title)} (x${line.qty})</div>
        <div class="cart-item-variant">${escapeHtml(line.variantLabel)}</div>
      </div>
      <div style="display:flex;align-items:center;">
        <span class="cart-item-price">${formatMoney(line.unit * line.qty)}</span>
        <button type="button" class="cart-remove-btn" data-action="remove-cart" data-index="${index}" title="${escapeHtml(t('remove'))}">✕</button>
      </div>
    `;
    cartItemsContainer.appendChild(div);
  });
  if (cartTotalPrice) cartTotalPrice.textContent = formatMoney(goodsTotal());
  updateCheckoutTotal();
}

function addToCart(productId, variantKey) {
  const existing = cart.find(i => i.pid === productId && i.variant === variantKey);
  if (existing) existing.qty += 1;
  else cart.push({ pid: productId, variant: variantKey, qty: 1 });
  updateCartUI();
  backToCartItems();
  openCartModal();
}

function removeFromCart(index) {
  cart.splice(index, 1);
  updateCartUI();
}

if (cartFloatingBtn) {
  cartFloatingBtn.addEventListener('click', () => {
    backToCartItems();
    openCartModal();
  });
}
if (closeCartBtn) closeCartBtn.addEventListener('click', closeCartModal);
if (cartModal) {
  cartModal.addEventListener('click', e => {
    if (e.target === cartModal) closeCartModal();
  });
}

function showCheckoutForm() {
  if (cart.length === 0) return;
  const viewItems = document.getElementById('cart-view-items');
  const viewCheckout = document.getElementById('cart-view-checkout');
  const modalTitle = document.getElementById('cart-modal-title');
  if (viewItems) viewItems.style.display = 'none';
  if (viewCheckout) viewCheckout.style.display = 'block';
  if (modalTitle) modalTitle.textContent = t('checkoutTitle');
  updateCheckoutTotal();
}

function backToCartItems() {
  const viewItems = document.getElementById('cart-view-items');
  const viewCheckout = document.getElementById('cart-view-checkout');
  const modalTitle = document.getElementById('cart-modal-title');
  if (viewItems) viewItems.style.display = 'block';
  if (viewCheckout) viewCheckout.style.display = 'none';
  if (modalTitle) modalTitle.textContent = t('cartTitle');
}

// Hodnoty způsobu dopravy jsou stabilní kódy, text je v jazyku stránky
function currentShippingCode() {
  const shippingElem = document.getElementById('order-shipping');
  return shippingElem ? shippingElem.value : 'zasilkovna';
}

function handleModalShippingChange() {
  const box = document.getElementById('modal-packeta-box');
  if (box) box.style.display = currentShippingCode() === 'zasilkovna' ? 'flex' : 'none';
  updateCheckoutTotal();
}

function shippingCost() {
  return currentShippingCode() === 'zasilkovna' ? SHIPPING_FEE[CUR] : 0;
}

function updateCheckoutTotal() {
  const finalPriceElem = document.getElementById('order-final-price');
  if (!finalPriceElem) return;
  finalPriceElem.textContent = formatMoney(goodsTotal() + shippingCost());
}
updateCartUI();

let selectedPacketaPoint = null;
const packetaApiKey = 'f277c2daae06a692';

function openPacketaWidget() {
  if (typeof Packeta === 'undefined' || !Packeta.Widget) {
    alert(t('alertNoPacketa'));
    return;
  }
  Packeta.Widget.pick(packetaApiKey, (point) => {
    if (point) {
      selectedPacketaPoint = point;
      const pointId = document.getElementById('packeta-point-id');
      const pointName = document.getElementById('packeta-point-name');
      if (pointId) pointId.value = point.id;
      if (pointName) pointName.value = `${point.name}, ${point.street || ''}, ${point.city || ''} (${point.zip || ''})`;

      const display = document.getElementById('modal-packeta-display');
      const placeName = document.getElementById('modal-packeta-place-name');
      if (display) display.style.display = 'block';
      if (placeName) placeName.textContent = `${point.name} (${point.city || ''})`;
    }
  }, { country: CFG.packetaCountry, language: CFG.packetaLang });
}

const PAY_TEXT = {
  cs: { legend: 'Způsob platby', transfer: 'Bankovní převod', card: 'Platební karta' },
  en: { legend: 'Payment method', transfer: 'Bank transfer', card: 'Card' },
  de: { legend: 'Zahlungsart', transfer: 'Überweisung', card: 'Karte' },
}[PAGE_LANG] || { legend: 'Způsob platby', transfer: 'Bankovní převod', card: 'Platební karta' };

function getPayChoice() {
  const c = document.querySelector('input[name=payment_choice]:checked');
  return c ? c.value : 'transfer';
}

function initPaymentChoice() {
  const form = document.getElementById('order-form');
  if (!STRIPE_ENABLED || !form) return;
  const box = document.createElement('fieldset');
  box.className = 'pay-choice';
  // CZ: převod předvolen, karta jako volba. EN/DE: pouze karta, dokud nebude EUR účet.
  const isCz = PAGE_LANG === 'cs';
  const transfer = isCz
    ? '<label><input type="radio" name="payment_choice" value="transfer" checked> ' + PAY_TEXT.transfer + '</label> '
    : '';
  const card = '<label><input type="radio" name="payment_choice" value="card"' + (isCz ? '' : ' checked') + '> ' + PAY_TEXT.card + '</label>';
  box.innerHTML = '<legend>' + PAY_TEXT.legend + '</legend>' + transfer + card;
  const btn = document.getElementById('order-submit-btn');
  if (btn) btn.parentNode.insertBefore(box, btn);
}

async function postOrder(data) {
  if (!STRIPE_ENABLED) { await postWithTimeout(document.getElementById('order-form').action, data); return null; }
  const res = await fetch(document.getElementById('order-form').action, { method: 'POST', body: data });
  if (!res.ok) throw new Error('order failed');
  return res.json();
}

const orderForm = document.getElementById('order-form');
if (orderForm) {
  orderForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const method = currentShippingCode();
    if (method === 'zasilkovna' && !selectedPacketaPoint) {
      alert(t('alertPickPoint'));
      openPacketaWidget();
      return;
    }

    const total = goodsTotal() + shippingCost();
    const noteElem = document.getElementById('order-note');
    const note = noteElem ? noteElem.value : '';
    const shippingElem = document.getElementById('order-shipping');
    const shippingLabel = shippingElem && shippingElem.selectedOptions[0] ? shippingElem.selectedOptions[0].textContent.trim() : method;

    // Souhrn pro majitele shopu je vždy v češtině (interní e-mail)
    let summary = 'OBJEDNÁVKA MERCHE:\n\n';
    cartLines().forEach(line => {
      summary += `• ${line.title} [${line.variantLabel}] - ${line.qty} ks (${formatMoney(line.unit * line.qty)})\n`;
    });
    summary += `\nJazyk webu: ${PAGE_LANG.toUpperCase()}, měna: ${CUR}\nDoprava: ${shippingLabel}\nPlatba: Bankovní převod\n`;
    if (selectedPacketaPoint) {
      summary += `Pobočka / Z-BOX: ${selectedPacketaPoint.name}, ${selectedPacketaPoint.street}, ${selectedPacketaPoint.city} [ID: ${selectedPacketaPoint.id}]\n`;
    }
    summary += `Celková cena: ${formatMoney(total)}\n`;
    if (note) summary += `Poznámka: ${note}\n`;

    const summaryField = document.getElementById('order-summary-field');
    if (summaryField) summaryField.value = summary;

    const orderSubmitBtn = document.getElementById('order-submit-btn');
    const orderStatus = document.getElementById('order-status');
    if (orderSubmitBtn) {
      orderSubmitBtn.disabled = true;
      orderSubmitBtn.textContent = t('sending');
    }
    if (orderStatus) {
      orderStatus.className = 'form-status';
      orderStatus.style.display = 'none';
    }

    const data = new FormData(orderForm);
    data.set('shipping_method', shippingLabel);
    data.set('shipping_code', method);
    data.set('items', JSON.stringify(cart.map(i => ({ pid: i.pid, variant: i.variant, qty: i.qty }))));
    if (STRIPE_ENABLED && getPayChoice() === 'card') data.set('payment', 'card');
    data.set('language', PAGE_LANG);
    data.set('currency', CUR);

    if (isHoneypotFilled(orderForm)) {
      setTimeout(() => {
        if (orderStatus) {
          orderStatus.textContent = t('orderOk');
          orderStatus.className = 'form-status success';
        }
        cart = [];
        selectedPacketaPoint = null;
        orderForm.reset();
        updateCartUI();
        if (orderSubmitBtn) {
          orderSubmitBtn.disabled = false;
          orderSubmitBtn.textContent = t('submitOrder');
        }
        setTimeout(() => { closeCartModal(); backToCartItems(); }, 3500);
      }, 600);
      return;
    }

    try {
      const result = await postOrder(data);
      if (result && result.status === 'redirect' && result.url) { window.location.href = result.url; return; }
      if (orderStatus) {
        orderStatus.textContent = t('orderOkPay');
        orderStatus.className = 'form-status success';
      }
      cart = [];
      selectedPacketaPoint = null;
      orderForm.reset();
      updateCartUI();
      setTimeout(() => { closeCartModal(); backToCartItems(); }, 3500);
    } catch (err) {
      if (orderStatus) {
        orderStatus.textContent = t('orderErr');
        orderStatus.className = 'form-status error';
      }
    } finally {
      if (orderSubmitBtn) {
        orderSubmitBtn.disabled = false;
        orderSubmitBtn.textContent = t('submitOrder');
      }
    }
  });
}

const contactForm = document.getElementById('contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formSubmitBtn = document.getElementById('form-submit-btn');
    const formStatus = document.getElementById('form-status');
    if (formSubmitBtn) {
      formSubmitBtn.disabled = true;
      formSubmitBtn.textContent = t('sending');
    }
    if (formStatus) {
      formStatus.className = 'form-status';
      formStatus.style.display = 'none';
    }

    const data = new FormData(contactForm);

    if (isHoneypotFilled(contactForm)) {
      setTimeout(() => {
        if (formStatus) {
          formStatus.textContent = t('contactOkShort');
          formStatus.className = 'form-status success';
        }
        contactForm.reset();
        if (formSubmitBtn) {
          formSubmitBtn.disabled = false;
          formSubmitBtn.textContent = t('submitContact');
        }
      }, 600);
      return;
    }

    try {
      await postWithTimeout(contactForm.action, data);
      if (formStatus) {
        formStatus.textContent = t('contactOk');
        formStatus.className = 'form-status success';
      }
      contactForm.reset();
    } catch (err) {
      if (formStatus) {
        formStatus.textContent = t('contactErr');
        formStatus.className = 'form-status error';
      }
    } finally {
      if (formSubmitBtn) {
        formSubmitBtn.disabled = false;
        formSubmitBtn.textContent = t('submitContact');
      }
    }
  });
}

/* ---------- Právní informace ---------- */
function openLegalModal(type) {
  const modal = document.getElementById('legal-modal');
  const title = document.getElementById('legal-title');
  const body = document.getElementById('legal-body');
  if (!modal || !title || !body) return;

  if (type === 'terms') {
    title.textContent = T.legalTitles.terms;
    body.innerHTML = T.legal.terms;
  } else if (type === 'privacy') {
    title.textContent = T.legalTitles.privacy;
    body.innerHTML = T.legal.privacy;
  } else if (type === 'withdraw') {
    const L = T.withdrawLabels;
    title.textContent = T.withdrawTitle;
    body.innerHTML = `
      <form id="withdraw-form">
        <div class="form-group"><label for="w-vs">${L.vs}</label><input type="text" id="w-vs" class="form-control" required></div>
        <div class="form-group"><label for="w-name">${L.name}</label><input type="text" id="w-name" class="form-control" required></div>
        <div class="form-group"><label for="w-email">${L.email}</label><input type="email" id="w-email" class="form-control" required></div>
        <div class="form-group"><label for="w-account">${L.account}</label><input type="text" id="w-account" class="form-control" required></div>
        <button type="submit" id="w-btn" class="btn btn-primary" style="width:100%;margin-top:8px;">${t('withdrawSubmit')}</button>
        <div id="w-status" class="form-status"></div>
      </form>
    `;
  }
  modal.classList.add('open');
}

function closeLegalModal() {
  const modal = document.getElementById('legal-modal');
  if (modal) modal.classList.remove('open');
}

const legalModal = document.getElementById('legal-modal');
if (legalModal) {
  legalModal.addEventListener('click', e => {
    if (e.target === legalModal) closeLegalModal();
  });
}

async function handleWithdrawSubmit(e) {
  e.preventDefault();
  const vs = document.getElementById('w-vs').value;
  const name = document.getElementById('w-name').value;
  const email = document.getElementById('w-email').value;
  const account = document.getElementById('w-account').value;
  const btn = document.getElementById('w-btn');
  const status = document.getElementById('w-status');

  if (btn) { btn.disabled = true; btn.textContent = t('sending'); }

  // Interní zpráva pro majitele je v češtině
  const formData = new FormData();
  formData.append('form_type', 'Odstoupení od kupní smlouvy');
  formData.append('name', name);
  formData.append('email', email);
  formData.append('phone', 'Odstoupení 14 dnů');
  formData.append('service', 'Odstoupení od smlouvy');
  formData.append('language', PAGE_LANG);
  formData.append('message', `ODSTOUPENÍ OD SMLOUVY:\nVS: ${vs}\nÚčet: ${account}`);

  try {
    await postWithTimeout("https://script.google.com/macros/s/AKfycbyZhN-nq-wOZnU4D_kKqqQviFWMmsy_kUMgXflZveLXj25asovkH-YaL9V7eWwiCcM9/exec", formData);
    if (status) {
      status.textContent = t('withdrawOk');
      status.className = 'form-status success';
    }
    setTimeout(() => closeLegalModal(), 3500);
  } catch (err) {
    if (status) {
      status.textContent = t('withdrawErr');
      status.className = 'form-status error';
    }
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = t('withdrawSubmit'); }
  }
}

window.addEventListener('scroll', () => {
  if (scrollTopBtn) {
    if (window.scrollY > 250) scrollTopBtn.classList.add('visible');
    else scrollTopBtn.classList.remove('visible');
  }
}, {passive:true});
if (scrollTopBtn) scrollTopBtn.addEventListener('click', () => window.scrollTo({top:0,behavior:'smooth'}));

/* ---------- Lightbox ---------- */
const list = () => (g ? [...g.querySelectorAll('a')] : []);
let cur = 0;
function show(i) {
  const l = list();
  if (!l.length || !big) return;
  cur = (i + l.length) % l.length;
  big.src = l[cur].href;
  big.alt = l[cur].getAttribute('aria-label') || T.altDefault;
}

if (g) {
  g.addEventListener('click', e => {
    const a = e.target.closest('a');
    if(!a) return;
    e.preventDefault();
    show(list().indexOf(a));
    if (lb && typeof lb.showModal === 'function') lb.showModal();
  });
}

const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
if (prevBtn) prevBtn.onclick = e => { e.stopPropagation(); show(cur-1); };
if (nextBtn) nextBtn.onclick = e => { e.stopPropagation(); show(cur+1); };
if (closeBtn) closeBtn.onclick = e => { e.stopPropagation(); if (lb) lb.close(); };
if (lb) {
  lb.addEventListener('click', e => { if (e.target === lb) lb.close(); });
  lb.addEventListener('keydown', e => {
    if(e.key === 'ArrowLeft') show(cur-1);
    if(e.key === 'ArrowRight') show(cur+1);
  });
}

const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) document.querySelectorAll('nav .nav-links a:not(.external-link)').forEach(a => a.classList.toggle('on', a.hash === '#' + e.target.id));
}), { rootMargin: '-45% 0px -50% 0px' });
document.querySelectorAll('section').forEach(x => io.observe(x));
