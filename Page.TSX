import { ProductShelf } from "@/components/ui/skincare-product-shelf";
import { HAIR_PRODUCTS } from "@/lib/hair-products";

export default function ShopPage() {
  // Валюта выводится после числа: «890 ₽». Поменяйте символ на свой.
  return <ProductShelf products={HAIR_PRODUCTS} currency="₽" />;
}
