(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // Хранилище (localStorage) — демо-версия без сервера
  const ls = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
    set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch {} }
  };

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
    ls.set('aura_session', { name: u.name, email: u.email });
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
      const u = ls.get('aura_users', []).find(u => u.email === email);
      if (u && u.hash === await hash(q('password').value, email)) return finish(u, false);
      err(q('password'), 'Неверный email или пароль');
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
    const users = ls.get('aura_users', []);
    if (users.some(u => u.email === email)) { err(q('email'), 'Этот email уже зарегистрирован'); return shake(f); }
    const u = { name, email, hash: await hash(p, email) };
    ls.set('aura_users', [...users, u]);
    finish(u, true);
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
    if (ls.get('aura_session')) { ls.set('aura_session', null); updateUI(); toast('Вы вышли из аккаунта'); }
    else openModal('login');
  });
  $('#bookBtn').addEventListener('click', () => {
    if (!ls.get('aura_session')) { toast('Создайте аккаунт, чтобы записаться'); openModal('register'); }
    else toast('Заявка принята — мастер скоро свяжется с вами ✂');
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

  const header = $('#header');
  addEventListener('scroll', () => header.classList.toggle('sc', scrollY > 20), { passive: true });

  updateUI();
})();
