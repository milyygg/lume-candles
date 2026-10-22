import { Checkout } from "@/components/checkout";
export const metadata = {
  title: "Оформление заявки",
  robots: { index: false, follow: false },
};
export default function Page() {
  return (
    <div className="wrap page-content">
      <Checkout />
    </div>
  );
}
