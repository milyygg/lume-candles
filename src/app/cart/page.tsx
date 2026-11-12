import { CartPage } from "@/components/cart-page";
export const metadata = {
  title: "Корзина",
  robots: { index: false, follow: false },
};
export default function Page() {
  return (
    <div className="wrap page-content">
      <CartPage />
    </div>
  );
}
