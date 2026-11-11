(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const ls = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
  };
  const fmt = n => Math.round(n).toLocaleString('ru-RU') + ' ₽'; // валюта: поменяйте «₽» на свою

  // Товары (замените на свои): id, вид упаковки, название, группа, цена, старая цена, объём, описание, цвет, крышка, цвет надписи
  const P = [
    ['shampoo-volume', 'bottle', 'Шампунь для объёма', 'Очищение', 890, 1090, '250 мл', 'Приподнимает тонкие волосы у корней, без сульфатов.', '#7a3f14', '#141414', '#111111'],
    ['shampoo-repair', 'bottle', 'Шампунь для восстановления', 'Очищение', 990, 0, '250 мл', 'Бережно очищает и укрепляет повреждённые волосы.', '#e8eef0', '#f4f4f1', '#111111'],
    ['shampoo-scalp', 'pump', 'Шампунь для кожи головы', 'Очищение', 850, 0, '300 мл', 'Свежесть и комфорт для жирной кожи головы.', '#e6efe6', '#2b2b2b', '#2f4a35'],
    ['scalp-scrub', 'jar', 'Скраб для кожи головы', 'Очищение', 1190, 0, '200 мл', 'Мягкий пилинг раз в неделю для глубокого очищения.', '#efe9df', '#e6ddd2', '#5c4b3c'],
    ['conditioner', 'pump', 'Кондиционер для гладкости', 'Уход', 790, 0, '250 мл', 'Лёгкое расчёсывание и блеск без утяжеления.', '#f1ede6', '#e6ddd2', '#6b5a4c'],
    ['hair-mask', 'jar', 'Маска для восстановления', 'Уход', 1490, 0, '200 мл', 'Масло ши и протеины шёлка для сухих волос.', '#e8dbd1', '#e8dbd1', '#6b4f44'],
    ['keratin-serum', 'dropper', 'Сыворотка с кератином', 'Уход', 1690, 0, '50 мл', 'Уплотняет структуру и защищает кончики от сечения.', '#e9eef0', '#f7f7f5', '#111111'],
    ['argan-oil', 'dropper', 'Масло арганы', 'Уход', 1390, 0, '50 мл', 'Питание и блеск для кончиков и непослушных прядей.', '#d9c7a8', '#2b2b2b', '#3c2f22'],
    ['heat-protect', 'mist', 'Термозащитный спрей', 'Стайлинг', 990, 0, '150 мл', 'Защита при горячей укладке до 230 °C.', '#e8eef0', '#f4f4f1', '#111111'],
    ['styling-wax', 'jar', 'Воск для укладки', 'Стайлинг', 1090, 0, '100 мл', 'Матовая текстура и сильная фиксация на весь день.', '#2b2b2b', '#1a1a1a', '#2b2b2b'],
    ['tint-balm', 'tube', 'Тонирующий бальзам', 'Стайлинг', 1290, 0, '150 мл', 'Нейтрализует жёлтый оттенок на светлых волосах.', '#f6f6f3', '#efeee9', '#5a4a7a'],
    ['hairspray', 'mist', 'Лак для волос', 'Стайлинг', 890, 0, '250 мл', 'Эластичная фиксация без склеивания.', '#f1ede6', '#141414', '#3c342d']
  ];
  const byId = Object.fromEntries(P.map(p => [p[0], p]));

  // Рисуем упаковку в SVG
  const art = (k, c, cp, ink) => {
    const r = (x, y, w, h, rx, f, o = 1) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${f}" opacity="${o}"/>`;
    const body = (x, y, w, h, rx) => r(x, y, w, h, rx, c) + r(x + 5, y + 6, 5, h - 12, 2.5, '#fff', .3);
    const lab = (x, y, w, h) => r(x, y, w, h, 3, '#f6f2ea') +
      `<text x="${x + w / 2}" y="${y + h / 2 + 3}" font-size="8" font-weight="700" text-anchor="middle" fill="${ink}" letter-spacing="1">AURA</text>`;
    const cap = (x, y, w, h, rx = 4) => r(x, y, w, h, rx, cp);
    const S = {
      bottle: body(25, 38, 50, 92, 14) + cap(38, 20, 24, 20) + lab(31, 72, 38, 34),
      pump: body(28, 50, 44, 80, 10) + cap(46, 26, 8, 26, 2) + cap(46, 20, 24, 8, 3) + lab(33, 78, 34, 30),
      jar: body(18, 72, 64, 56, 10) + cap(16, 54, 68, 22, 6) + lab(26, 90, 48, 26),
      dropper: body(30, 62, 40, 68, 10) + cap(36, 44, 28, 20) + `<ellipse cx="50" cy="30" rx="9" ry="16" fill="${cp}"/>` + lab(33, 84, 34, 28),
      tube: `<path d="M32 18H68L62 118H38Z" fill="${c}"/>` + cap(38, 116, 24, 14) + lab(37, 56, 26, 32),
      mist: body(32, 58, 36, 72, 10) + cap(41, 42, 18, 18, 2) + cap(37, 24, 26, 20, 5) + lab(35, 84, 30, 28)
    };
    return `<svg viewBox="0 0 100 140" aria-hidden="true">${S[k]}</svg>`;
  };

  // Каталог (весь текст — наш собственный, не пользовательский ввод)
  $('#products').innerHTML = P.map(([id, k, n, g, pr, old, sz, d, c, cp, ink], i) =>
    `<article class="card prod" data-g="${g}" data-reveal style="--d:${(i % 4) * .07}s">
      <div class="shop-img">${art(k, c, cp, ink)}</div>
      <span class="tag">${g}</span><h3>${n}</h3><p>${d}</p>
      <div class="buy"><div class="price">${fmt(pr)}${old ? `<s>${fmt(old)}</s>` : ''}<small>${sz}</small></div>
      <button class="btn btn-primary add" data-id="${id}">В корзину</button></div>
    </article>`).join('');

  // Уведомления
  let tt;
  const toast = m => {
    const t = $('#toast'); t.textContent = m; t.classList.add('show');
    clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 2800);
  };

  // Корзина
  let cart = ls.get('aura_cart', {});
  function save() { ls.set('aura_cart', cart); render(); }
  function render() {
    const ids = Object.keys(cart).filter(i => byId[i]);
    const count = ids.reduce((s, i) => s + cart[i], 0);
    const total = ids.reduce((s, i) => s + cart[i] * byId[i][4], 0);
    const b = $('#badge');
    b.textContent = count; b.hidden = !count;
    b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump');
    $('#items').innerHTML = ids.length ? ids.map(i => {
      const p = byId[i];
      return `<li><div class="mini">${art(p[1], p[8], p[9], p[10])}</div>
        <div class="info"><b>${p[2]}</b><span>${fmt(p[4])}</span>
        <div class="qty"><button data-id="${i}" data-d="-1" aria-label="Меньше">−</button><span>${cart[i]}</span><button data-id="${i}" data-d="1" aria-label="Больше">+</button></div></div>
        <button class="rm" data-id="${i}" data-d="0" aria-label="Удалить">×</button></li>`;
    }).join('') : '<li class="empty">Корзина пуста</li>';
    $('#total').textContent = fmt(total);
    $('#checkout').disabled = !count;
  }

  const setCart = open => document.body.classList.toggle('cart-open', open);
  $('#cartBtn').addEventListener('click', () => setCart(true));
  $('#closeCart').addEventListener('click', () => setCart(false));
  $('#drawerBg').addEventListener('click', () => setCart(false));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setCart(false); });

  $('#products').addEventListener('click', e => {
    const btn = e.target.closest('.add');
    if (!btn) return;
    cart[btn.dataset.id] = (cart[btn.dataset.id] || 0) + 1;
    save();
    btn.textContent = 'Добавлено ✓';
    setTimeout(() => (btn.textContent = 'В корзину'), 1200);
    toast(byId[btn.dataset.id][2] + ' — в корзине');
  });

  $('#items').addEventListener('click', e => {
    const b = e.target.closest('button[data-id]');
    if (!b) return;
    const id = b.dataset.id, d = +b.dataset.d;
    cart[id] = d ? (cart[id] || 0) + d : 0;
    if (cart[id] <= 0) delete cart[id];
    save();
  });

  $('#checkout').addEventListener('click', () => {
    // Заглушка: здесь нужно отправлять заказ на сервер (например, в таблицу Supabase)
    cart = {}; save(); setCart(false);
    toast('Заказ принят — мы свяжемся с вами для подтверждения');
  });

  // Фильтр по группам
  $$('.chip').forEach(c => c.addEventListener('click', () => {
    $$('.chip').forEach(x => x.classList.toggle('active', x === c));
    $$('.prod').forEach(el => {
      const show = c.dataset.f === 'all' || el.dataset.g === c.dataset.f;
      el.hidden = !show;
      if (show) { el.classList.remove('in'); void el.offsetWidth; el.classList.add('in'); }
    });
  }));

  // Приветствие, если пользователь вошёл на главной
  const s = ls.get('aura_session', null);
  if (s && s.name) { const h = $('#hello'); h.hidden = false; h.textContent = 'Привет, ' + s.name.split(' ')[0] + '!'; }

  // Появление при прокрутке и шапка
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .15 });
  $$('[data-reveal]').forEach(el => io.observe(el));
  addEventListener('scroll', () => $('#header').classList.toggle('sc', scrollY > 20), { passive: true });

  render();
})();
