"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import authService from "../../services/authService";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/components/ui/use-toast";
import {
  Mail,
  Lock,
  LogIn,
  Eye,
  EyeOff,
  Shield,
  GraduationCap,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await authService.login({ email, password });
      const welcome = `Welcome back, ${res.data.user.firstName}!`;
      setSuccessMessage(`${welcome} Redirecting...`);
      toast.success(welcome, "You have signed in successfully.");
      setTimeout(() => {
        router.push("/");
      }, 900);
    } catch (err) {
      const errText = err.message || "Invalid email or password";
      setErrorMessage(errText);
      toast.error("Authentication failed", errText);
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (type) => {
    if (type === "admin") {
      setEmail("admin@psychepath.io");
      setPassword("AdminPassword2026!");
      toast.info(
        "Admin Credentials Selected",
        "Ready to sign in as Administrator.",
      );
    } else if (type === "student") {
      setEmail("alex.chen@example.com");
      setPassword("StudentPassword2026!");
      toast.info(
        "Student Credentials Selected",
        "Ready to sign in as Alex Chen.",
      );
    }
    setErrorMessage("");
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 py-12">
      <Card className="w-full max-w-md shadow-xl border-border/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto p-3 rounded-2xl bg-primary/10 text-primary w-fit mb-2">
            <LogIn className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Sign In to PsychePath
          </CardTitle>
          <CardDescription className="text-sm">
            Access your personalized learning journey and analytics
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          {errorMessage && (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert variant="success">
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label
                className="text-xs font-semibold text-foreground flex items-center gap-1.5"
                htmlFor="email"
              >
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Email Address</span>
              </label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <label
                className="text-xs font-semibold text-foreground flex items-center gap-1.5"
                htmlFor="password"
              >
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Password</span>
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="default"
              size="lg"
              loading={loading}
              className="w-full text-sm font-semibold"
            >
              {loading ? "Authenticating..." : "Sign In"}
            </Button>
          </form>

          <div className="pt-4 border-t space-y-2">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-center">
              Quick Fill Demo Accounts
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fillCredentials("admin")}
                className="text-xs border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300 gap-1.5"
              >
                <Shield className="h-3.5 w-3.5" />
                <span>Admin Demo</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fillCredentials("student")}
                className="text-xs border-sky-500/30 text-sky-400 hover:bg-sky-500/10 hover:text-sky-300 gap-1.5"
              >
                <GraduationCap className="h-3.5 w-3.5" />
                <span>Student Demo</span>
              </Button>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-center border-t py-4 text-xs text-muted-foreground">
          <p>
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-semibold text-primary hover:underline"
            >
              Create student account
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
