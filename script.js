(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // Хранилище (localStorage) — демо-версия без сервера
  const ls = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
    set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch {} }
  };

  // === Supabase: лёгкий вариант без библиотеки, через REST ===
  // Вставьте данные проекта (Project Settings → API). Пока пусто — работает демо на localStorage.
  const SUPABASE_URL = '';  // например https://xxxx.supabase.co
  const SUPABASE_KEY = '';  // anon / publishable key (НЕ service_role!)
  const useSb = !!(SUPABASE_URL && SUPABASE_KEY);

  async function sb(path, body, token) {
    const r = await fetch(SUPABASE_URL + '/auth/v1/' + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY, ...(token && { Authorization: 'Bearer ' + token }) },
      body: JSON.stringify(body || {})
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.msg || d.error_description || d.message || 'Ошибка сервера');
    return d;
  }

  const auth = {
    async login(email, pass) {
      if (useSb) {
        const d = await sb('token?grant_type=password', { email, password: pass });
        const m = (d.user && d.user.user_metadata) || {};
        return { name: m.name || email.split('@')[0], email, token: d.access_token };
      }
      const u = ls.get('aura_users', []).find(u => u.email === email);
      if (!u || u.hash !== await hash(pass, email)) throw new Error('Invalid login credentials');
      return u;
    },
    async register(name, email, pass) {
      if (useSb) {
        const d = await sb('signup', { email, password: pass, data: { name } });
        return d.access_token ? { name, email, token: d.access_token } : null; // null = нужно подтвердить email
      }
      const users = ls.get('aura_users', []);
      if (users.some(u => u.email === email)) throw new Error('User already registered');
      const u = { name, email, hash: await hash(pass, email) };
      ls.set('aura_users', [...users, u]);
      return u;
    },
    logout(s) { if (useSb && s.token) sb('logout', null, s.token).catch(() => {}); }
  };

  const ruErr = m =>
    /invalid login/i.test(m) ? 'Неверный email или пароль' :
    /already/i.test(m) ? 'Этот email уже зарегистрирован' :
    /not confirmed/i.test(m) ? 'Сначала подтвердите email по ссылке из письма' :
    /password/i.test(m) ? 'Пароль слишком простой' :
    /fetch|network/i.test(m) ? 'Нет связи с сервером' : m;
  const busy = (f, on) => { $('[type=submit]', f).disabled = on; };

  async function hash(pass, salt) {
    const str = salt + ':' + pass;
    if (window.crypto && crypto.subtle) {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
      return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
    }
    let h = 5381; for (const c of str) h = ((h << 5) + h + c.charCodeAt(0)) | 0;
    return String(h);
  }

  // Уведомления
  let tt;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 3200);
  }

  // Модальное окно
  const modal = $('#modal'), tabs = $('.tabs');
  function setTab(name) {
    tabs.dataset.active = name;
    $$('.tab').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
    $$('.form').forEach(f => { const on = f.dataset.f === name; f.classList.toggle('active', on); f.inert = !on; });
    setTimeout(() => { const i = $('.form.active input'); i && i.focus(); }, 280);
  }
  function openModal(tab = 'login') {
    modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; setTab(tab);
  }
  function closeModal() {
    modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  $$('[data-close]').forEach(b => b.addEventListener('click', closeModal));
  $$('.tab').forEach(b => b.addEventListener('click', () => setTab(b.dataset.tab)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  // Ошибки полей
  const err = (el, msg) => {
    const f = el.closest('.field');
    f.classList.toggle('error', !!msg);
    $('.err', f).textContent = msg || '';
    return !!msg;
  };
  const shake = form => { form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake'); };
  $$('.field input').forEach(i => i.addEventListener('input', () => err(i, '')));
  const okEmail = v => /^\S+@\S+\.\S+$/.test(v);

  // Интерфейс в зависимости от сессии
  function updateUI() {
    const s = ls.get('aura_session');
    const h = $('#hello');
    h.hidden = !s;
    h.textContent = s ? 'Привет, ' + s.name.split(' ')[0] + '!' : '';
    $('#authBtn').textContent = s ? 'Выйти' : 'Войти';
  }
  function finish(u, isNew) {
    ls.set('aura_session', { name: u.name, email: u.email, token: u.token });
    closeModal();
    $$('.form').forEach(f => f.reset());
    $('.meter').style.setProperty('--s', 0);
    updateUI();
    toast(isNew ? 'Аккаунт создан. Добро пожаловать, ' + u.name + '!' : 'С возвращением, ' + u.name + '!');
  }

  // Вход
  $('#loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target, q = n => f.elements[n];
    const email = q('email').value.trim().toLowerCase();
    let bad = err(q('email'), okEmail(email) ? '' : 'Введите корректный email');
    bad = err(q('password'), q('password').value ? '' : 'Введите пароль') || bad;
    if (!bad) {
      busy(f, true);
      try { return finish(await auth.login(email, q('password').value), false); }
      catch (x) { err(q('password'), ruErr(x.message)); }
      finally { busy(f, false); }
    }
    shake(f);
  });

  // Регистрация
  $('#regForm').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target, q = n => f.elements[n];
    const name = q('fullname').value.trim(), email = q('email').value.trim().toLowerCase(), p = q('password').value;
    const bad = [
      err(q('fullname'), name.length >= 2 ? '' : 'Минимум 2 символа'),
      err(q('email'), okEmail(email) ? '' : 'Введите корректный email'),
      err(q('password'), p.length >= 6 ? '' : 'Минимум 6 символов'),
      err(q('confirm'), q('confirm').value === p ? '' : 'Пароли не совпадают')
    ].some(Boolean);
    if (bad) return shake(f);
    busy(f, true);
    try {
      const u = await auth.register(name, email, p);
      if (u) return finish(u, true);
      closeModal(); f.reset();
      toast('Мы отправили письмо — подтвердите email и войдите');
    } catch (x) {
      const m = ruErr(x.message);
      err(/зарегистр/.test(m) ? q('email') : q('password'), m);
      shake(f);
    } finally { busy(f, false); }
  });

  // Индикатор надёжности пароля
  $('#regForm').elements.password.addEventListener('input', e => {
    const p = e.target.value; let s = 0;
    if (p.length >= 6) s++;
    if (p.length >= 10) s++;
    if (/[A-ZА-Я]/.test(p) && /[a-zа-я]/.test(p)) s++;
    if (/\d/.test(p) && /[^\w\s]/.test(p)) s++;
    $('.meter').style.setProperty('--s', p ? Math.max(s, 1) : 0);
  });

  // Кнопки
  $('#authBtn').addEventListener('click', () => {
    const s = ls.get('aura_session');
    if (s) { auth.logout(s); ls.set('aura_session', null); updateUI(); toast('Вы вышли из аккаунта'); }
    else openModal('login');
  });
  $('#bookBtn').addEventListener('click', () => {
    if (!ls.get('aura_session')) { toast('Создайте аккаунт, чтобы записаться'); openModal('register'); }
    else toast('Заявка принята — мастер скоро свяжется с вами ✂');
  });

  // Галерея стрижек: 12 иллюстраций + «Примерка цвета» волос
  // [название, w/m, описание, цвет волос, задняя часть (длина), передняя часть (чёлка/верх), виски, фото(необязательно)]
  const FADE = 'M33 68Q31 52 38 54L40 74ZM87 68Q89 52 82 54L80 74Z';
  const CUTS = [
    ['Боб', 'w', 'Чёткий силуэт до подбородка, подходит к любой густоте волос.', '#8a3f2c', 'M24 80Q18 22 60 20Q102 22 96 80L96 104Q80 110 76 98L44 98Q40 110 24 104Z', 'M32 62Q34 28 62 26Q90 28 88 62Q78 40 58 40Q44 44 32 62Z'],
    ['Пикси', 'w', 'Дерзкая короткая стрижка, открывает лицо и скулы.', '#e0b45a', '', 'M31 62Q26 26 62 22Q98 26 89 62Q82 44 68 46Q54 36 31 62Z'],
    ['Каскад', 'w', 'Многослойная стрижка: объём без потери длины.', '#3b2a22', 'img/bob.jpg'],
    ['Каре с чёлкой', 'w', 'Прямая чёлка и ровный срез — графичный и стильный образ.', '#1c1c1e', 'M25 82Q20 24 60 22Q100 24 95 82L95 100Q78 104 76 94L44 94Q42 104 25 100Z', 'M31 58Q28 24 60 22Q92 24 89 58L88 52Q60 56 32 52Z'],
    ['Длинные волны', 'w', 'Мягкие локоны по всей длине для праздника и каждого дня.', '#b0503c', 'M20 80Q10 20 60 18Q110 20 100 80Q112 100 98 118Q110 134 92 138L28 138Q10 134 22 118Q8 100 20 80Z', 'M33 62Q36 28 60 26Q84 28 87 62Q76 42 60 42Q44 42 33 62Z'],
    ['Высокий хвост', 'w', 'Собранные волосы: удобно, свежо и открывает шею.', '#7a5a3a', 'M78 30Q112 14 108 56Q106 92 92 118Q90 84 84 56Z', 'M32 60Q34 28 60 26Q86 28 88 60Q78 42 60 42Q44 42 32 60Z'],
    ['Фейд', 'm', 'Плавный переход от почти нуля на висках к длине сверху.', '#2a2020', '', 'M36 56Q34 28 60 27Q86 28 84 56Q72 42 60 42Q48 42 36 56Z', FADE],
    ['Андеркат', 'm', 'Выбритые виски и длинная верхняя часть для укладки.', '#8a5a3b', '', 'M34 56Q28 16 66 16Q98 20 86 54Q76 34 58 42Q44 40 34 56Z', FADE],
    ['Классика', 'm', 'Аккуратная стрижка с боковым пробором на каждый день.', '#4a3a30', '', 'M32 64Q30 28 62 26Q92 28 88 64Q84 42 70 40Q56 46 44 40Q36 48 32 64Z'],
    ['Кроп', 'm', 'Короткая рваная чёлка: минимум ухода, максимум характера.', '#b79a6a', '', 'M33 58Q32 30 60 28Q88 30 87 58L86 46L78 52L70 43L60 50L50 43L42 52L34 46Z'],
    ['Помпадур', 'm', 'Высокий объём сверху и короткие бока — смелый ретро-стиль.', '#1f1a18', '', 'M32 62Q22 14 62 12Q102 14 88 62Q84 40 62 36Q40 40 32 62Z', FADE],
    ['Лонг', 'm', 'Длинные мужские волосы с центральным пробором.', '#5a3a28', 'M26 80Q20 24 60 22Q100 24 94 80L98 116Q84 120 80 100L40 100Q36 120 22 116Z', 'M33 62Q34 28 60 26Q86 28 87 62Q80 44 62 40Q40 44 33 62Z']
  ];
  const SKIN = ['#f0c8a4', '#e3b48c', '#c68e66', '#f6d7bd', '#a56f4b', '#edc09a'];
  const cuts = $('#cutsGrid');
  cuts.innerHTML = CUTS.map(([n, g, d, h, b, f, fade, img], i) =>
    `<article class="card cut" data-g="${g}" data-reveal style="--d:${(i % 4) * .07}s;--h0:${h};--sk:${SKIN[i % 6]}">
      <div class="cut-img">${img ? `<img src="${img}" alt="${n}" loading="lazy">` :
        `<svg viewBox="0 0 120 140" role="img" aria-label="${n}">${b ? `<path class="hair" d="${b}"/>` : ''}<use href="#face" width="120" height="140"/><path class="hair" d="${f}"/><path class="hair shine" d="${f}"/>${fade ? `<path class="hair fade" d="${fade}"/>` : ''}</svg>`}</div>
      <h3>${n}</h3><p>${d}</p></article>`).join('');

  // Примерка цвета: выберите оттенок — волосы на всех иллюстрациях плавно перекрашиваются
  const SW = [['Родной', ''], ['Шоколад', '#4a2c1e'], ['Медь', '#b0503c'], ['Блонд', '#e0b45a'], ['Платина', '#e8e2d0'], ['Вишня', '#8a1f3d'], ['Сирень', '#9a7bd0'], ['Графит', '#2b2b2e']];
  const sw = $('#swatches');
  sw.innerHTML = '<span class="sw-l">Примерка цвета:</span>' + SW.map(([n, c], i) =>
    `<button class="sw${i ? '' : ' on'}" data-c="${c}" style="--c:${c || 'transparent'}" title="${n}" aria-label="${n}"></button>`).join('');
  sw.addEventListener('click', e => {
    const b = e.target.closest('.sw'); if (!b) return;
    $$('.sw', sw).forEach(x => x.classList.toggle('on', x === b));
    if (b.dataset.c) cuts.style.setProperty('--tint', b.dataset.c); else cuts.style.removeProperty('--tint');
  });

  // Анимации при прокрутке
  const count = el => {
    const to = +el.dataset.count, t0 = performance.now();
    (function step(t) {
      const p = Math.min((t - t0) / 1600, 1);
      el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))).toLocaleString('ru-RU');
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  };
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in'); io.unobserve(e.target);
    if (e.target.dataset.count) count(e.target);
  }), { threshold: .2 });
  $$('[data-reveal],[data-count]').forEach(el => io.observe(el));

  // Фильтр стрижек
  $$('.chip').forEach(c => c.addEventListener('click', () => {
    $$('.chip').forEach(x => x.classList.toggle('active', x === c));
    $$('.cut').forEach(el => {
      const show = c.dataset.f === 'all' || el.dataset.g === c.dataset.f;
      el.hidden = !show;
      if (show) { el.classList.remove('in'); void el.offsetWidth; el.classList.add('in'); }
    });
  }));

  const header = $('#header');
  addEventListener('scroll', () => header.classList.toggle('sc', scrollY > 20), { passive: true });

  updateUI();
})();
