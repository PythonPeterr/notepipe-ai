"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Plug,
  FileText,
  History,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/connections", label: "Connections", icon: Plug },
  { href: "/templates", label: "Templates", icon: FileText },
  { href: "/runs", label: "Run History", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) {
        setEmail(user.email);
      }
    });
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  };

  const initials = email
    ? email
        .split("@")[0]
        .slice(0, 2)
        .toUpperCase()
    : "NP";

  return (
    <aside className="w-60 bg-white border-r border-border flex flex-col py-4">
      <div className="px-4 mb-6 flex items-center gap-2">
        <div className="h-6 w-6 bg-black rounded-sm" />
        <span className="font-bold text-sm">Notepipe</span>
      </div>

      <nav className="flex-1 px-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-colors relative",
                isActive
                  ? "bg-neutral-50 text-neutral-900 font-medium before:absolute before:left-0 before:top-1 before:bottom-1 before:w-0.5 before:bg-[#E05A4E] before:rounded-full"
                  : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50"
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-xs bg-neutral-100">
              {initials}
            </AvatarFallback>
          </Avatar>
          <p className="text-xs font-medium flex-1 truncate">{email}</p>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleSignOut}
          >
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
