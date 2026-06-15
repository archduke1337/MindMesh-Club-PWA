"use client";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button, Avatar, AvatarImage, AvatarFallback } from "@heroui/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Bell } from "lucide-react";

import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import { Logo } from "@/components/icons";
import { useAuth } from "@/context/AuthContext";
import { databases } from "@/lib/appwrite";
import { DATABASE_ID, COLLECTIONS } from "@/lib/database";
import { Query } from "appwrite";

const getAvatarUrl = (name: string) => {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
};

export const Navbar = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      try {
        const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.NOTIFICATIONS, [
          Query.equal("userId", [user.$id]),
          Query.equal("read", [false]),
          Query.limit(100),
        ]);
        setUnreadCount(response.documents.length);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      }
    };
    fetchNotifications();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const checkAdmin = async () => {
      try {
        const res = await fetch("/api/admin-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email }),
        });
        const data = await res.json();
        setIsAdmin(data.isAdmin);
      } catch {
        setIsAdmin(false);
      }
    };
    checkAdmin();
  }, [user]);

  const showMobileMenu = isMobile === true;
  const showDesktopMenu = isMobile === false;

  return (
    <nav className="sticky top-0 z-40 w-full flex items-center justify-between px-4 py-3 bg-background/80 backdrop-blur-md border-b border-default-100">
      <Link className="flex items-center gap-2" href="/">
        <Logo />
        <p className="font-bold text-inherit">Mind Mesh</p>
      </Link>

      {/* Desktop nav links */}
      {showDesktopMenu && (
        <div className="hidden md:flex items-center gap-1">
          {siteConfig.navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-2 text-sm font-medium text-default-600 hover:text-primary transition-colors rounded-lg hover:bg-default-100"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        {/* Mobile menu dropdown */}
        {showMobileMenu && (
          <Dropdown>
            <DropdownTrigger>
              <Button variant="ghost">Menu</Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Navigation menu">
      {siteConfig.navItems.map((item) => (
            <DropdownItem key={item.href} textValue={item.label}>
              <Link href={item.href}>{item.label}</Link>
            </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        )}

        <ThemeSwitch />

        {!loading && (
          <>
            {user ? (
              <>
                {/* Notifications bell */}
                <Link href="/notifications" className="relative">
                  <Button variant="ghost" isIconOnly size="sm">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-danger text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </Button>
                </Link>

                <Dropdown>
                  <DropdownTrigger>
                    <Avatar className="transition-transform border-2 border-default-300 w-8 h-8">
                      <AvatarImage src={getAvatarUrl(user.name)} alt={user.name} />
                      <AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                  </DropdownTrigger>
                  <DropdownMenu aria-label="Profile Actions">
                    <DropdownItem key="profile" className="h-14 gap-2">
                      <p className="font-semibold">Signed in as</p>
                      <p className="font-semibold">{user.email}</p>
                    </DropdownItem>
                    <DropdownItem key="my-events">
                      <Link href="/events">My Events</Link>
                    </DropdownItem>
                    {isAdmin && (
                      <DropdownItem key="admin">
                        <Link href="/admin">Admin Panel</Link>
                      </DropdownItem>
                    )}
                    {siteConfig.navMenuItems.map((item) => (
                      <DropdownItem key={item.href}>
                        <Link href={item.href} className={item.href === "/logout" ? "text-danger" : ""}>
                          {item.label}
                        </Link>
                      </DropdownItem>
                    ))}
                  </DropdownMenu>
                </Dropdown>
              </>
            ) : (
              <Link href="/login">
                <Button variant="primary">Login</Button>
              </Link>
            )}
          </>
        )}
      </div>
    </nav>
  );
};