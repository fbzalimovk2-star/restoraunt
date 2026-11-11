// Использование: node localize.mjs components/ui/skincare-product-shelf.tsx
// Делает копию файла (.bak), затем: русские тексты, бренд AURA, цены вида «1 290 ₽».
import fs from "node:fs";

const file = process.argv[2];
if (!file || !fs.existsSync(file)) {
  console.error("Укажите путь к файлу компонента, например: node localize.mjs components/ui/skincare-product-shelf.tsx");
  process.exit(1);
}

const R = [
  // бренд (в шапке и на упаковке)
  ['SKASMAN', 'AURA'],
  // формат цен
  ['const INK = "#111111";', 'const INK = "#111111";\nconst fmt = (n: number, cur: string) => `${Math.round(n).toLocaleString("ru-RU")} ${cur}`;'],
  ['`${p.name}, ${currency}${p.price}`', '`${p.name}, ${fmt(p.price, currency)}`'],
  ['>{currency}{p.price}</div>', '>{fmt(p.price, currency)}</div>'],
  ['{currency}{price.toFixed(2)}', '{fmt(price, currency)}'],
  ['{currency}{(p.compareAt * (price / p.price)).toFixed(2)}', '{fmt(p.compareAt * (price / p.price), currency)}'],
  ['{currency}{(p.price * (i > 0 ? 1.7 : 1)).toFixed(2)}', '{fmt(p.price * (i > 0 ? 1.7 : 1), currency)}'],
  // тексты
  ['["Skincare", "Treatments and fragrance", "Body and lips"]', '["Очищение", "Уход", "Стайлинг и окрашивание"]'],
  ['`Bag, ${bag} ${bag === 1 ? "item" : "items"}`', '`Корзина, товаров: ${bag}`'],
  ['>Drag to turn</p>', '>Потяните, чтобы повернуть</p>'],
  ['`Rated ${p.rating} out of 5`', '`Оценка ${p.rating} из 5`'],
  ['{p.reviews.toLocaleString()} ratings', '{p.reviews.toLocaleString("ru-RU")} оценок'],
  ['/> Shelf', '/> Назад'],
  ['>Size</legend>', '>Объём</legend>'],
  ['"Decrease quantity"', '"Уменьшить количество"'],
  ['"Increase quantity"', '"Увеличить количество"'],
  ['{added ? "Added to Bag" : "Add to Bag"}', '{added ? "Добавлено" : "В корзину"}'],
  ['Delivery:', 'Доставка:'],
  ['Free, arrives in 2 to 3 days', 'Бесплатно, 2–3 дня'],
  ['Pickup:', 'Самовывоз:'],
  ['Ready today at most stores', 'Сегодня в большинстве салонов'],
  ['useState("Details" as string | null)', 'useState("Описание" as string | null)'],
  ['["Details", <ul', '["Описание", <ul'],
  ['["Ingredients", <p', '["Состав", <p'],
  ['["How to use", <p', '["Применение", <p'],
];

let s = fs.readFileSync(file, "utf8");
fs.writeFileSync(file + ".bak", s);
let missed = 0;
for (const [from, to] of R) {
  if (!s.includes(from)) { console.warn("НЕ НАЙДЕНО:", from); missed++; continue; }
  s = s.split(from).join(to);
}
fs.writeFileSync(file, s);
console.log(missed ? `Применено ${R.length - missed} из ${R.length}. Остальное поправьте вручную.` : `Готово: применено ${R.length} замен. Копия: ${file}.bak`);
