"use client";
import { Menu } from "@base-ui/react/menu";
import { BasketIcon, CaretDownIcon } from "@phosphor-icons/react";
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
import {
  REGION_LABELS,
  REGIONS,
  isRegion,
  useRegion,
} from "./region/RegionProvider";

export default function TopBar() {
  return (
    <header className="flex flex-wrap items-start sm:flex-nowrap">
      <div className="hidden flex-1 sm:block" />
      <NavBar />
      <div className="ml-auto flex shrink-0 items-start justify-end max-sm:-mt-15 sm:ml-0 sm:flex-1">
        <RegionMenu />
        <BasketLink />
      </div>
    </header>
  );
}

function RegionMenu() {
  const { region, setRegion } = useRegion();

  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label={`Регион, ${REGION_LABELS[region]}`}
        className="flex items-center gap-1 py-3 pr-1 pl-3 text-sm whitespace-nowrap text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50 data-popup-open:bg-muted"
      >
        {REGION_LABELS[region]}
        <CaretDownIcon className="size-3" aria-hidden="true" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner align="end" side="bottom" sideOffset={4}>
          <Menu.Popup className="z-50 min-w-36 rounded-2xl border border-border bg-popover p-1 text-sm text-popover-foreground shadow-md outline-none">
            <Menu.RadioGroup
              value={region}
              onValueChange={(value) => {
                if (isRegion(value)) {
                  setRegion(value);
                }
              }}
            >
              {REGIONS.map((option) => (
                <Menu.RadioItem
                  key={option}
                  value={option}
                  closeOnClick
                  className="cursor-pointer rounded-xl px-3 py-2 outline-none data-checked:font-medium data-highlighted:bg-muted"
                >
                  {REGION_LABELS[option]}
                </Menu.RadioItem>
              ))}
            </Menu.RadioGroup>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
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
    <NavigationMenu
      className={cn(
        styles.navBar,
        "w-full max-w-full flex-none basis-full justify-center sm:w-auto sm:max-w-max sm:basis-auto",
      )}
    >
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
