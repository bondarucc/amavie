"use client";
import { BasketIcon } from "@phosphor-icons/react";
import styles from "./page.module.css";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBasket } from "./basket/BasketProvider";

export default function TopBar() {
  return (
    <header className="grid grid-cols-[minmax(2.75rem,1fr)_minmax(0,auto)_minmax(2.75rem,1fr)] items-start">
      <div />
      <NavBar />
      <div className="flex justify-end">
        <BasketLink />
      </div>
    </header>
  );
}

function BasketLink() {
  const { items, ready } = useBasket();
  const count = items.length;
  const label = ready && count > 0 ? `Корзина, ${count}` : "Корзина";

  return (
    <Link
      href="/basket"
      aria-label={label}
      className="flex items-center gap-1.5 p-3 pr-gutter text-sm text-foreground"
    >
      <BasketIcon />
      {ready && count > 0 ? (
        <span className="tabular-nums">{count}</span>
      ) : null}
    </Link>
  );
}

function NavBar() {
  const pathname = usePathname();
  return (
    <NavigationMenu className={cn(styles.navBar, "max-w-full min-w-0")}>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuLink
            className="px-1.5 sm:px-3"
            render={<Link href="/">Главная</Link>}
          />
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink
            className="px-1.5 sm:px-3"
            active={pathname.includes("catalog")}
            render={<Link href="/catalog">Каталог</Link>}
          />
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink className="px-1.5 sm:px-3">
            Коллаборации
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink
            className="px-1.5 sm:px-3"
            active={pathname.includes("blog")}
            render={<Link href="/blog">Блог</Link>}
          />
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
