"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  addToCart,
  cartTotal,
  lineKey,
  restoreCart,
  validateSelection,
  type Selection,
} from "@/lib/cart";
type Store = {
  items: Selection[];
  ready: boolean;
  storageError: boolean;
  total: number;
  count: number;
  add: (s: Selection) => void;
  remove: (key: string) => void;
  update: (key: string, s: Selection) => void;
  clear: () => void;
};
const Context = createContext<Store | null>(null);
const storageKey = "lume-cart-v1";
const subscribe = (callback: () => void) => {
  window.addEventListener("lume-cart", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("lume-cart", callback);
    window.removeEventListener("storage", callback);
  };
};
const snapshot = () => {
  try {
    return localStorage.getItem(storageKey) || "[]";
  } catch {
    return "[]";
  }
};
export function StoreProvider({ children }: { children: ReactNode }) {
  const raw = useSyncExternalStore(subscribe, snapshot, () => "[]");
  const ready = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const items = restoreCart(raw),
    [storageError, setStorageError] = useState(false);
  const save = (value: Selection[]) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(value));
      window.dispatchEvent(new Event("lume-cart"));
      setStorageError(false);
    } catch {
      setStorageError(true);
      throw new Error(
        "Браузер не разрешает сохранить корзину. Разрешите локальное хранилище.",
      );
    }
  };
  const store: Store = {
    items,
    ready,
    storageError,
    total: cartTotal(items),
    count: items.reduce((s, l) => s + l.quantity, 0),
    add: (s) => save(addToCart(restoreCart(snapshot()), s)),
    remove: (key) =>
      save(restoreCart(snapshot()).filter((l) => lineKey(l) !== key)),
    update: (key, s) => {
      const current = restoreCart(snapshot());
      save(
        addToCart(
          current.filter((l) => lineKey(l) !== key),
          validateSelection(s),
        ),
      );
    },
    clear: () => save([]),
  };
  return <Context.Provider value={store}>{children}</Context.Provider>;
}
export function useCart() {
  const context = useContext(Context);
  if (!context) throw new Error("Cart provider missing");
  return context;
}
export function Reveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("seen");
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    document
      .querySelectorAll("[data-reveal]")
      .forEach((e) => observer.observe(e));
    return () => observer.disconnect();
  }, []);
  return null;
}
