import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, Link } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { loginSchema, type LoginInput } from "@/validation/auth";
import { login } from "@/api/auth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";

export default function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: login,
    onSuccess: () => {
      // Invalidate the current user query so it fetches the new session
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      navigate("/admin");
    },
    onError: (error: any) => {
      setErrorMsg(error?.message || "An error occurred during sign in.");
    },
  });

  const onSubmit = (data: LoginInput) => {
    setErrorMsg("");
    mutate(data);
  };

  return (
    <div className="flex min-h-svh items-center justify-center p-6 bg-muted/40">
      <div className="w-full max-w-sm p-6 bg-background rounded-xl border shadow-sm">
        <h1 className="text-2xl font-semibold mb-6 text-center">Sign In</h1>
        
        {errorMsg && (
          <Alert variant="destructive" className="mb-4 p-3 text-sm">
            {errorMsg}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
            </div>
            <Input
              id="password"
              type="password"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="underline hover:text-primary">
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
