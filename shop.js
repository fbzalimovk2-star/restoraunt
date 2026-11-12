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
  const sizes = p => [p[6], parseInt(p[6]) * 2 + ' мл'];
  const priceOf = (p, s) => (s ? Math.round(p[4] * 1.7 / 10) * 10 : p[4]);
  const split = k => { const [id, s] = k.split(':'); return [byId[id], +s || 0]; };
  // Подробности для карточки: преимущества | состав | применение (замените на свои)
  const X = {
    'shampoo-volume': ['Объём у корней|Без сульфатов|Для окрашенных волос', 'Aqua, Coco-Glucoside, Hydrolyzed Barley Protein, Biotin, Citric Acid.', 'Нанесите на влажные волосы, вспеньте, оставьте на минуту и смойте.'],
    'shampoo-repair': ['Кератин и пантенол|Мягкое очищение|Блеск без утяжеления', 'Aqua, Cocamidopropyl Betaine, Hydrolyzed Keratin, Panthenol, Glycerin.', 'Массируйте по влажным волосам, тщательно смойте, затем нанесите кондиционер.'],
    'shampoo-scalp': ['Для жирной кожи головы|Экстракт мяты|Для ежедневного использования', 'Aqua, Sodium Cocoyl Isethionate, Mentha Piperita Extract, Zinc PCA, Panthenol.', 'Одна-две помпы на влажные волосы, массаж кожи головы, смыть.'],
    'scalp-scrub': ['Мягкий пилинг|Освежает корни|Один раз в неделю', 'Aqua, Sodium Chloride, Glycerin, Cocamidopropyl Betaine, Salicylic Acid.', 'Распределите по влажной коже головы, помассируйте 1–2 минуты и смойте.'],
    'conditioner': ['Увлажнение|Антистатик|Для всех типов волос', 'Aqua, Cetearyl Alcohol, Behentrimonium Chloride, Squalane, Panthenol.', 'Нанесите на длину после шампуня, подержите 2 минуты и смойте.'],
    'hair-mask': ['Масло ши|Протеины шёлка|Без утяжеления', 'Aqua, Butyrospermum Parkii Butter, Hydrolyzed Silk, Cetyl Alcohol, Tocopherol.', 'Нанесите на чистые влажные волосы на 5–10 минут, затем смойте.'],
    'keratin-serum': ['Кератин|Против сечения|Несмываемый уход', 'Aqua, Hydrolyzed Keratin, Glycerin, Panthenol, Cyclopentasiloxane.', 'Нанесите 3–4 капли на влажные кончики и уложите как обычно.'],
    'argan-oil': ['100% масло арганы|Блеск|Против пушистости', 'Argania Spinosa Kernel Oil, Tocopherol.', 'Нанесите пару капель на сухие или влажные кончики.'],
    'heat-protect': ['До 230 °C|Не склеивает|Для всех типов волос', 'Aqua, Alcohol Denat., Panthenol, Polyquaternium-11, Glycerin.', 'Распылите на влажные волосы по длине перед горячей укладкой.'],
    'styling-wax': ['Матовый финиш|Сильная фиксация|Легко смывается', 'Cera Alba, Aqua, Kaolin, Glycerin, Tocopherol.', 'Разогрейте немного воска в ладонях и распределите по сухим волосам.'],
    'tint-balm': ['Холодный оттенок|Смывается за 5–7 процедур|Питает при окрашивании', 'Aqua, Cetearyl Alcohol, Basic Violet 3, Behentrimonium Chloride, Panthenol.', 'Нанесите на влажные волосы в перчатках на 3–5 минут и смойте.'],
    'hairspray': ['Сильная фиксация|Не склеивает|Легко расчёсывается', 'Alcohol Denat., Butane, Isobutane, VP/VA Copolymer, Panthenol.', 'Распылите с расстояния 25–30 см на готовую причёску.']
  };

  // Рисуем упаковку в SVG (d — подпись объёма: включает объёмный вид и печать, которая «едет» при повороте)
  const art = (k, c, cp, ink, d) => {
    const r = (x, y, w, h, rx, f, o = 1) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${f}" opacity="${o}"/>`;
    const body = (x, y, w, h, rx) => r(x, y, w, h, rx, c) + r(x + 5, y + 6, 5, h - 12, 2.5, '#fff', .3);
    const cap = (x, y, w, h, rx = 4) => r(x, y, w, h, rx, cp);
    const lab = (x, y, w, h) => {
      const text = o => `<g transform="translate(${o} 0)"><text x="${x + w / 2}" y="${d ? y + h * .45 : y + h / 2 + 3}" font-size="8" font-weight="700" text-anchor="middle" fill="${ink}" letter-spacing="1">AURA</text>${d ? `<text x="${x + w / 2}" y="${y + h * .78}" font-size="5.5" text-anchor="middle" fill="${ink}" opacity=".7">${d}</text>` : ''}</g>`;
      if (!d) return r(x, y, w, h, 3, '#f6f2ea') + text(0);
      return r(x, y, w, h, 3, '#f6f2ea') + `<clipPath id="lc"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3"/></clipPath><g clip-path="url(#lc)"><g id="lt" data-p="${w * 2.6}">${text(0)}${text(w * 2.6)}</g></g>` + r(x, y, w, h, 3, 'url(#edge)');
    };
    const K = {
      bottle: [body(25, 38, 50, 92, 14) + cap(38, 20, 24, 20), [31, 72, 38, 34]],
      pump: [body(28, 50, 44, 80, 10) + cap(46, 26, 8, 26, 2) + cap(46, 20, 24, 8, 3), [33, 78, 34, 30]],
      jar: [body(18, 72, 64, 56, 10) + cap(16, 54, 68, 22, 6), [26, 90, 48, 26]],
      dropper: [body(30, 62, 40, 68, 10) + cap(36, 44, 28, 20) + `<ellipse cx="50" cy="30" rx="9" ry="16" fill="${cp}"/>`, [33, 84, 34, 28]],
      tube: [`<path d="M32 18H68L62 118H38Z" fill="${c}"/>` + cap(38, 116, 24, 14), [37, 56, 26, 32]],
      mist: [body(32, 58, 36, 72, 10) + cap(41, 42, 18, 18, 2) + cap(37, 24, 26, 20, 5), [35, 84, 30, 28]]
    };
    const [sh, la] = K[k];
    // объём: затемнение по краям цилиндра, блик, тень под упаковкой
    const defs = d ? `<defs><linearGradient id="cyl"><stop offset="0" stop-opacity=".5"/><stop offset=".12" stop-opacity=".12"/><stop offset=".22" stop-color="#fff" stop-opacity=".45"/><stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset=".7" stop-opacity=".08"/><stop offset=".92" stop-opacity=".38"/><stop offset="1" stop-opacity=".55"/></linearGradient><linearGradient id="edge"><stop offset="0" stop-opacity=".35"/><stop offset=".15" stop-opacity="0"/><stop offset=".85" stop-opacity="0"/><stop offset="1" stop-opacity=".35"/></linearGradient><radialGradient id="fl"><stop offset="0" stop-opacity=".3"/><stop offset="1" stop-opacity="0"/></radialGradient></defs><ellipse cx="50" cy="131" rx="34" ry="4" fill="url(#fl)"/>` : '';
    const shade = d ? sh.replace(new RegExp('fill="(' + c + '|' + cp + ')"', 'g'), 'fill="url(#cyl)"') : '';
    return `<svg viewBox="0 0 100 140" aria-hidden="true">${defs}${sh}${shade}${lab(...la)}</svg>`;
  };

  // Каталог (весь текст — наш собственный, не пользовательский ввод)
  $('#products').innerHTML = P.map(([id, k, n, g, pr, old, sz, d, c, cp, ink], i) =>
    `<article class="card prod" data-g="${g}" data-id="${id}" tabindex="0" data-reveal style="--d:${(i % 4) * .07}s">
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
    const ids = Object.keys(cart).filter(i => byId[i.split(':')[0]]);
    const count = ids.reduce((s, i) => s + cart[i], 0);
    const total = ids.reduce((s, i) => s + cart[i] * priceOf(...split(i)), 0);
    const b = $('#badge');
    b.textContent = count; b.hidden = !count;
    b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump');
    $('#items').innerHTML = ids.length ? ids.map(i => {
      const [p, sz] = split(i);
      return `<li><div class="mini">${art(p[1], p[8], p[9], p[10])}</div>
        <div class="info"><b>${p[2]}</b><span>${sizes(p)[sz]} · ${fmt(priceOf(p, sz))}</span>
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
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { if (document.body.classList.contains('cart-open')) setCart(false); else closeP(); } });

  $('#products').addEventListener('click', e => {
    const btn = e.target.closest('.add');
    if (!btn) { const c = e.target.closest('.prod'); if (c) location.hash = c.dataset.id; return; }
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

  // ===== Карточка товара =====
  const pp = $('#pp'), stage = $('#ppBottle');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let cur = null, si = 0, qty = 1, spin = 0, vel = 0, last = null, raf = 0;

  const setSpin = v => { // печать на упаковке «обёрнута» вокруг корпуса и едет при повороте
    spin = v; const g = $('#lt');
    if (g) g.setAttribute('transform', `translate(${-(((v % 1) + 1) % 1) * g.dataset.p} 0)`);
  };
  const drawArt = () => { stage.innerHTML = art(cur[1], cur[8], cur[9], cur[10], sizes(cur)[si]); setSpin(spin); };
  const price = () => { $('#ppPrice').innerHTML = fmt(priceOf(cur, si)) + (cur[5] && !si ? `<s>${fmt(cur[5])}</s>` : ''); };

  function fill() {
    const x = X[cur[0]];
    $('#ppCat').textContent = cur[3]; $('#ppName').textContent = cur[2]; $('#ppTag').textContent = cur[7];
    $('#ppSizes').innerHTML = '<legend>Объём</legend>' + sizes(cur).map((t, i) =>
      `<label class="sz"><input type="radio" name="sz" value="${i}"${i === si ? ' checked' : ''}><span>${t}</span><b>${fmt(priceOf(cur, i))}</b></label>`).join('');
    $('#qVal').textContent = qty; price(); spin = 0; drawArt();
    $('#ppAcc').innerHTML = [['Описание', '<ul>' + x[0].split('|').map(b => `<li>${b}</li>`).join('') + '</ul>'], ['Состав', `<p>${x[1]}</p>`], ['Применение', `<p>${x[2]}</p>`]]
      .map(([t, b], n) => `<details${n ? '' : ' open'}><summary>${t}</summary><div class="dbody">${b}</div></details>`).join('');
  }

  function intro() { // один оборот при открытии
    cancelAnimationFrame(raf);
    if (reduced) return;
    const t0 = performance.now();
    (function f(t) { const p = Math.min((t - t0) / 1100, 1); setSpin(1 - Math.pow(1 - p, 3)); if (p < 1) raf = requestAnimationFrame(f); })(t0);
  }

  // Поворот мышью/пальцем: 1:1 пока держите, затем инерция и остановка лицом вперёд
  stage.addEventListener('pointerdown', e => { stage.setPointerCapture(e.pointerId); cancelAnimationFrame(raf); last = { x: e.clientX, t: e.timeStamp }; vel = 0; });
  stage.addEventListener('pointermove', e => {
    if (!last) return;
    const dx = e.clientX - last.x, dt = Math.max(e.timeStamp - last.t, 1);
    vel = -dx / 380 / dt * 1000; setSpin(spin - dx / 380); last = { x: e.clientX, t: e.timeStamp };
  });
  const release = () => {
    if (!last) return; last = null;
    let t0 = performance.now();
    (function step(t) {
      const dt = (t - t0) / 1000; t0 = t;
      vel *= Math.pow(.04, dt); setSpin(spin + vel * dt);
      if (Math.abs(vel) > .02) { raf = requestAnimationFrame(step); return; }
      const target = Math.round(spin);
      (function settle() { const d = target - spin; setSpin(spin + d * .18); if (Math.abs(d) > .002) raf = requestAnimationFrame(settle); else setSpin(target); })();
    })(t0);
  };
  stage.addEventListener('pointerup', release);
  stage.addEventListener('pointercancel', release);

  $('#ppSizes').addEventListener('change', e => { si = +e.target.value; price(); drawArt(); });
  const setQty = n => { qty = Math.min(9, Math.max(1, n)); $('#qVal').textContent = qty; };
  $('#qMinus').addEventListener('click', () => setQty(qty - 1));
  $('#qPlus').addEventListener('click', () => setQty(qty + 1));
  $('#ppAdd').addEventListener('click', e => {
    const key = cur[0] + (si ? ':1' : '');
    cart[key] = (cart[key] || 0) + qty; save();
    const b = e.currentTarget; b.textContent = 'Добавлено ✓'; setTimeout(() => (b.textContent = 'В корзину'), 1400);
    toast(cur[2] + ' — в корзине');
  });

  // Адрес вида shop.html#shampoo-volume открывает карточку (можно делиться ссылкой)
  function closeP() { if (location.hash) { history.pushState(null, '', location.pathname + location.search); route(); } }
  function route(first) {
    const id = decodeURIComponent(location.hash.slice(1)), open = !!byId[id];
    const apply = () => {
      if (open) { cur = byId[id]; si = 0; qty = 1; fill(); intro(); }
      pp.classList.toggle('open', open); pp.setAttribute('aria-hidden', String(!open));
      document.body.classList.toggle('pp-open', open);
      if (open) $('#ppBack').focus({ preventScroll: true });
    };
    if (!first && !reduced && document.startViewTransition) document.startViewTransition(apply); else apply();
  }
  $('#ppBack').addEventListener('click', closeP);
  addEventListener('hashchange', () => route());
  $('#products').addEventListener('keydown', e => { const c = e.target.closest('.prod'); if (e.key === 'Enter' && c && e.target === c) location.hash = c.dataset.id; });
  route(true);

  render();
})();
