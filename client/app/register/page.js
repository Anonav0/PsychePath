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
import { UserPlus, User, Mail, Lock, Eye, EyeOff, Info } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    if (formData.password.length < 8) {
      const err = "Password must be at least 8 characters long";
      setErrorMessage(err);
      toast.error("Validation Error", err);
      setLoading(false);
      return;
    }

    try {
      const res = await authService.register(formData);
      const welcome = `Welcome, ${formData.firstName}!`;
      setSuccessMessage("Account created successfully! Redirecting...");
      toast.success(welcome, "Your student profile has been created.");
      setTimeout(() => {
        router.push("/");
      }, 700);
    } catch (err) {
      const errText =
        err.message || "Registration failed. Please check your information.";
      setErrorMessage(errText);
      toast.error("Registration Failed", errText);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 py-12">
      <Card className="w-full max-w-lg shadow-md border-border bg-white">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto p-3 rounded-2xl bg-primary/10 text-primary w-fit mb-2">
            <UserPlus className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            Create Student Account
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Begin your psychometric assessment & personalized learning path
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

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  First Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Alex"
                    className="pl-9"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Last Name
                </label>
                <Input
                  name="lastName"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Chen"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-slate-700">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="alex.chen@example.com"
                  className="pl-9"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-slate-700">
                Password (min 8 characters)
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="pl-9 pr-10"
                  disabled={loading}
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

            <div className="flex items-center gap-2 p-3 rounded-lg bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-900 leading-relaxed">
              <Info className="h-4 w-4 text-indigo-600 shrink-0" />
              <span>
                New accounts automatically receive the verified{" "}
                <strong>STUDENT</strong> role.
              </span>
            </div>

            <Button
              type="submit"
              variant="default"
              size="lg"
              loading={loading}
              className="w-full text-sm font-semibold"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center border-t border-border py-4 text-xs text-muted-foreground">
          <p>
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-primary hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
