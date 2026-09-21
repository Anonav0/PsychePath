"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import authService from "../../services/authService";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Users,
  ClipboardList,
  BookOpen,
  ArrowLeft,
  ShieldAlert,
  ShieldCheck,
  Menu,
} from "lucide-react";

export default function AdminLayout({ children, title, subtitle }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const currentUser = authService.getUser();
    if (!currentUser) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    setUser(currentUser);
    setLoading(false);
  }, [router, pathname]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-12 px-4 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  // Access Denied if authenticated user is not an ADMIN
  if (user && user.role !== "ADMIN") {
    return (
      <div className="max-w-md mx-auto my-16 p-6">
        <Alert
          variant="destructive"
          className="border-red-200 bg-white p-6 rounded-xl shadow-md"
        >
          <ShieldAlert className="h-8 w-8 text-red-600 mb-2" />
          <AlertTitle className="text-xl font-bold mb-2 text-slate-900">
            Access Denied
          </AlertTitle>
          <AlertDescription className="text-sm text-slate-600 leading-relaxed mb-6">
            You do not have administrative privileges to view or manage this
            section. This console is strictly reserved for platform
            administrators.
          </AlertDescription>
          <Link href="/dashboard">
            <Button variant="default" className="w-full">
              Return to Student Dashboard
            </Button>
          </Link>
        </Alert>
      </div>
    );
  }

  const navItems = [
    { label: "Overview", href: "/admin", icon: BarChart3 },
    { label: "Learners", href: "/admin/learners", icon: Users },
    { label: "Assessments", href: "/admin/assessments", icon: ClipboardList },
    { label: "Curriculum", href: "/admin/curriculum", icon: BookOpen },
  ];

  const isNavActive = (href) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const NavList = ({ onSelect = () => {} }) => (
    <div className="flex flex-col gap-1.5">
      {navItems.map((item) => {
        const active = isNavActive(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onSelect}
            className={cn(
              "flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors",
              active
                ? "bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200 shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100",
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4",
                active ? "text-indigo-600" : "text-slate-400",
              )}
            />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col md:flex-row bg-background">
      {/* Mobile Top Bar with Drawer Trigger */}
      <div className="md:hidden border-b border-border bg-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-indigo-600" />
          <span className="font-bold text-sm tracking-tight text-slate-900">
            Admin Console
          </span>
        </div>

        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 text-xs">
              <Menu className="h-4 w-4" />
              <span>Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[280px] p-6 flex flex-col justify-between bg-white border-r border-border"
          >
            <div className="space-y-6">
              <SheetHeader className="text-left pb-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-indigo-600" />
                  <SheetTitle className="text-base font-bold text-slate-900">
                    Admin Console
                  </SheetTitle>
                </div>
                <Badge
                  variant="secondary"
                  className="w-fit text-[10px] mt-1 bg-indigo-50 text-indigo-700 border-indigo-200"
                >
                  Administrator
                </Badge>
              </SheetHeader>

              <NavList onSelect={() => setMobileNavOpen(false)} />
            </div>

            <div className="pt-4 border-t border-border">
              <Link href="/dashboard" onClick={() => setMobileNavOpen(false)}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2 text-slate-600 hover:text-slate-900"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Exit to Student App</span>
                </Button>
              </Link>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-white p-5 shrink-0 justify-between">
        <div className="space-y-6">
          <div className="px-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider">
                Console
              </span>
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0 bg-indigo-50 text-indigo-700 border-indigo-200"
              >
                Admin
              </Badge>
            </div>
            <h2 className="text-base font-bold text-slate-900">Management</h2>
          </div>

          <NavList />
        </div>

        <div className="pt-4 border-t border-border">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Exit to Student App</span>
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
        {(title || subtitle) && (
          <div className="mb-6 space-y-1">
            {title && (
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
