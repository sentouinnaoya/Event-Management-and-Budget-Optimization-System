"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "../../lib/schemas";
import { useLoginMutation } from "../../lib/apiSlices";
import { useAppDispatch, useAppSelector } from "../../lib/hooks";
import { setCredentials } from "../../features/auth/authSlice";
import { Button, FieldError, Input, Label, PasswordInput, apiError } from "../../components/ui";
import AuthShell from "../../components/AuthShell";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, initialized } = useAppSelector((s) => s.auth);
  const [login, { isLoading, error }] = useLoginMutation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  useEffect(() => {
    if (initialized && user) router.replace("/dashboard");
  }, [initialized, user, router]);

  async function onSubmit(data: LoginInput) {
    try {
      const result = await login(data).unwrap();
      const info = {
        id: result.id,
        fullName: result.fullName,
        email: result.email,
        role: result.role,
      };
      localStorage.setItem("embos_token", result.token);
      localStorage.setItem("embos_user", JSON.stringify(info));
      dispatch(setCredentials({ token: result.token, user: info }));
      router.replace("/dashboard");
    } catch {
      // error is shown below
    }
  }

  return (
    <AuthShell>
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        ← Back to home
      </Link>
      <div className="rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-700 font-display text-xl font-semibold text-white lg:hidden">
            E
          </span>
          <h1 className="mt-4 font-display text-2xl font-medium text-slate-900">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Sign in to your organizer account
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label required>Email</Label>
            <Input
              type="email"
              invalid={!!errors.email}
              {...register("email")}
            />
            <FieldError message={errors.email?.message} />
          </div>
          <div>
            <Label required>Password</Label>
            <PasswordInput
              invalid={!!errors.password}
              {...register("password")}
            />
            <FieldError message={errors.password?.message} />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {apiError(error)}
            </div>
          )}

          <Button type="submit" loading={isLoading} className="w-full">
            Sign in
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          No account?{" "}
          <Link
            href="/register"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Create one
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
