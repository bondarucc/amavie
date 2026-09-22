"use client";
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

export default function TopBar() {
  return (
    <div className="flex justify-center">
      <NavBar />
    </div>
  );
}

function NavBar() {
  const pathname = usePathname();
  return (
    <NavigationMenu className={styles.navBar}>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuLink render={<Link href="/">Главная</Link>} />
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink
            active={pathname.includes("catalog")}
            render={<Link href="/catalog">Каталог</Link>}
          />
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink>Коллаборации</NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink
            active={pathname.includes("blog")}
            render={<Link href="/blog">Блог</Link>}
          />
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
