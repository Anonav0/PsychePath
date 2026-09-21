"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import authService from "../services/authService";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Compass,
  LayoutDashboard,
  Brain,
  Sparkles,
  Route,
  TrendingUp,
  User,
  Shield,
  Menu,
  LogOut,
  LogIn,
  UserPlus,
} from "lucide-react";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const updateUser = () => {
      setUser(authService.getUser());
    };

    updateUser();
    window.addEventListener("auth_state_changed", updateUser);
    return () => window.removeEventListener("auth_state_changed", updateUser);
  }, []);

  const handleLogout = () => {
    authService.clearSession();
    window.location.href = "/login";
  };

  const navLinks = [
    { href: "/", label: "Home", icon: Compass, public: true },
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      authOnly: true,
    },
    { href: "/assessments", label: "Assessments", icon: Brain, public: true },
    {
      href: "/recommendations",
      label: "Recommendations",
      icon: Sparkles,
      public: true,
    },
    {
      href: "/learning-path",
      label: "Learning Path",
      icon: Route,
      authOnly: true,
    },
    { href: "/progress", label: "Progress", icon: TrendingUp, authOnly: true },
    { href: "/profile", label: "Profile", icon: User, authOnly: true },
  ];

  const visibleLinks = navLinks.filter((link) => {
    if (link.authOnly && !user) return false;
    return true;
  });

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-white/95 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-bold text-lg tracking-tight text-foreground hover:opacity-90 transition-opacity"
          >
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Compass className="h-5 w-5" />
            </div>
            <span className="font-extrabold tracking-tight">PsychePath</span>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {visibleLinks.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "text-primary bg-primary/10 font-semibold"
                    : "text-slate-600 hover:text-foreground hover:bg-slate-100/80",
                )}
              >
                <Icon className="h-4 w-4 opacity-80" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {user?.role === "ADMIN" && (
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-1.5 ml-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors border",
                pathname?.startsWith("/admin")
                  ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100",
              )}
            >
              <Shield className="h-4 w-4 text-indigo-600" />
              <span>Admin Console</span>
            </Link>
          )}
        </nav>

        {/* Desktop Auth Controls */}
        <div className="hidden lg:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs font-semibold text-foreground leading-tight">
                  {user.firstName} {user.lastName}
                </div>
                <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                  {user.role}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-slate-600 hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  <LogIn className="h-4 w-4 mr-1.5" />
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="default" size="sm">
                  <UserPlus className="h-4 w-4 mr-1.5" />
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Trigger */}
        <div className="flex lg:hidden items-center gap-2">
          {user?.role === "ADMIN" && (
            <Link href="/admin">
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2 text-xs border-indigo-200 text-indigo-700 bg-indigo-50"
              >
                <Shield className="h-3.5 w-3.5" />
              </Button>
            </Link>
          )}

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Toggle Navigation Menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[300px] sm:w-[350px] p-6 flex flex-col justify-between bg-white"
            >
              <div>
                <SheetHeader className="text-left pb-4 border-b border-border">
                  <SheetTitle className="flex items-center gap-2 text-lg font-bold">
                    <Compass className="h-5 w-5 text-primary" />
                    <span>PsychePath</span>
                  </SheetTitle>
                  <p className="text-xs text-muted-foreground">
                    Psychometric Learning Platform
                  </p>
                </SheetHeader>

                <nav className="flex flex-col gap-1.5 mt-6">
                  {visibleLinks.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors",
                          isActive
                            ? "text-primary bg-primary/10 font-semibold"
                            : "text-slate-600 hover:text-foreground hover:bg-slate-100",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}

                  {user?.role === "ADMIN" && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors mt-2 border",
                        pathname?.startsWith("/admin")
                          ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                          : "bg-slate-50 text-slate-700 border-slate-200",
                      )}
                    >
                      <Shield className="h-4 w-4 text-indigo-600" />
                      <span>Admin Console</span>
                    </Link>
                  )}
                </nav>
              </div>

              {/* Mobile Drawer Footer Auth */}
              <div className="pt-6 border-t border-border mt-auto">
                {user ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-foreground">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {user.email}
                        </div>
                      </div>
                      <Badge variant="secondary">{user.role}</Badge>
                    </div>
                    <Button
                      variant="destructive"
                      className="w-full justify-center"
                      onClick={() => {
                        setMobileOpen(false);
                        handleLogout();
                      }}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link href="/login" onClick={() => setMobileOpen(false)}>
                      <Button
                        variant="outline"
                        className="w-full justify-center"
                      >
                        <LogIn className="h-4 w-4 mr-2" />
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/register" onClick={() => setMobileOpen(false)}>
                      <Button
                        variant="default"
                        className="w-full justify-center"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Create Account
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
