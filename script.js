"use strict";

/* =====================================================
   ВАШИ ДАННЫЕ — меняйте только этот блок.
   Всё ниже (меню, рестораны) на сайте собирается отсюда.
   ===================================================== */

// Валюта в ценах: "₸", "₽", "$" и т.д.
const CURRENCY = "₸";

// Меню: разделы -> блюда. Сейчас тут примеры, замените на свои.
const MENU = {
  "Лапша": [
    { name: "Удон с курицей", desc: "Пшеничная лапша, курица, овощи, соус терияки", price: 2900 },
    { name: "Лагман по-китайски", desc: "Лапша ручной вытяжки, говядина, перец, зелень", price: 3200 },
    { name: "Рисовая лапша с креветками", desc: "Креветки, яйцо, ростки фасоли, арахис", price: 3500 }
  ],
  "Димсамы": [
    { name: "Сяолунбао", desc: "Паровые пельмени с бульоном и свининой, 5 шт.", price: 2400 },
    { name: "Гёдза с курицей", desc: "Обжаренные пельмени, соус понзу, 6 шт.", price: 2200 }
  ],
  "Вок": [
    { name: "Курица кунг-пао", desc: "Курица, арахис, сушёный перец чили", price: 3600 },
    { name: "Говядина с овощами", desc: "Говядина, болгарский перец, брокколи, устричный соус", price: 4100 }
  ],
  "Напитки": [
    { name: "Зелёный чай", desc: "Чайник на двоих", price: 1200 },
    { name: "Домашний лимонад", desc: "Лимон, имбирь, мёд", price: 1400 }
  ]
};

// Рестораны. open/close — часы работы, tz — часовой пояс ресторана.
const LOCATIONS = [
  { name: "Меллстрой дом — Центр", address: "ул. Центральная, 1", phone: "+7 000 000 00 01", open: "10:00", close: "23:00", tz: "Asia/Almaty" },
  { name: "Меллстрой дом — Северный", address: "пр. Мира, 25", phone: "+7 000 000 00 02", open: "11:00", close: "22:00", tz: "Asia/Almaty" }
];

/* ================= Дальше код, его можно не трогать ================= */

const $ = (selector) => document.querySelector(selector);

// Создаёт элемент; текст вставляется безопасно (textContent).
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

const formatPrice = (n) => n.toLocaleString("ru-RU") + "\u00A0" + CURRENCY;

/* ---------- Меню ---------- */
const tabsBox = $("#tabs");
const dishesBox = $("#dishes");

function showCategory(category) {
  const items = MENU[category].map((dish) => {
    const li = el("li", "dish");
    li.append(el("h3", null, dish.name), el("span", "price", formatPrice(dish.price)));
    if (dish.desc) li.append(el("p", null, dish.desc));
    return li;
  });
  dishesBox.replaceChildren(...items);

  tabsBox.querySelectorAll(".tab").forEach((btn) => {
    btn.setAttribute("aria-pressed", String(btn.dataset.category === category));
  });
}

Object.keys(MENU).forEach((category) => {
  const btn = el("button", "tab", category);
  btn.type = "button";
  btn.dataset.category = category;
  btn.addEventListener("click", () => showCategory(category));
  tabsBox.append(btn);
});
showCategory(Object.keys(MENU)[0]);

/* ---------- Рестораны ---------- */

// Открыт ли ресторан сейчас — по времени в часовом поясе самого ресторана.
function isOpenNow(place) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: place.tz || "Asia/Almaty",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(new Date());

  const hours = Number(parts.find((p) => p.type === "hour").value) % 24;
  const minutes = Number(parts.find((p) => p.type === "minute").value);
  const now = hours * 60 + minutes;

  const toMinutes = (t) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const open = toMinutes(place.open);
  const close = toMinutes(place.close);

  // Если закрытие после полуночи (например, 10:00–02:00)
  return close > open ? now >= open && now < close : now >= open || now < close;
}

function renderPlaces() {
  const rows = LOCATIONS.map((place) => {
    const li = el("li", "place");

    const main = el("div");
    main.append(el("h3", null, place.name), el("address", null, place.address));

    const info = el("div");
    const phone = el("a", null, place.phone);
    phone.href = "tel:" + place.phone.replace(/[^\d+]/g, "");
    info.append(el("p", null, `Ежедневно ${place.open}–${place.close}`), phone);

    const open = isOpenNow(place);
    const status = el("span", open ? "status" : "status status-closed", open ? "Открыто сейчас" : "Сейчас закрыто");

    li.append(main, info, status);
    return li;
  });
  $("#places").replaceChildren(...rows);
}
renderPlaces();

/* ---------- Мобильное меню сайта ---------- */
const header = $(".site-header");
const burger = $(".burger");

function setNav(isOpen) {
  header.classList.toggle("is-open", isOpen);
  burger.setAttribute("aria-expanded", String(isOpen));
}

burger.addEventListener("click", () => setNav(!header.classList.contains("is-open")));
document.querySelectorAll(".nav a").forEach((link) => link.addEventListener("click", () => setNav(false)));

/* ---------- Год в подвале ---------- */
$("#year").textContent = new Date().getFullYear();
