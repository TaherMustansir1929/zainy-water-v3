"use client";

import * as React from "react";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Key } from "@hugeicons/core-free-icons";
import { moderatorLogin } from "../-server/modMiddleware.function";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { moderatorLoginSchema } from "@/lib/schemas/moderator-login";
import { useModeratorStore } from "@/lib/ui-states/moderator-state";

const GENERIC_AUTH_ERROR = "Invalid credentials.";

export function ModLoginForm() {
  const navigate = useNavigate();
  const setSession = useModeratorStore((state) => state.setSession);
  const [showPassword, setShowPassword] = React.useState(false);

  const form = useForm({
    defaultValues: {
      name: "",
      password: "",
    },
    validators: {
      onSubmit: moderatorLoginSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const response = await moderatorLogin({ data: value });

        setSession({
          moderator: response.moderator,
          issuedAt: response.issuedAt,
          expiresAt: response.expiresAt,
          sessionToken: response.sessionToken,
        });

        toast.success(`Welcome back, ${response.moderator.name}.`);
        await navigate({ to: "/moderator" });
      } catch (error) {
        const message = error instanceof Error ? error.message : GENERIC_AUTH_ERROR;
        toast.error(message || GENERIC_AUTH_ERROR);
      }
    },
  });

  return (
    <form
      id="moderator-login-form"
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <FieldGroup>
        <form.Field
          name="name"
          children={(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Moderator Name</FieldLabel>
                <InputGroup>
                  <InputGroupAddon>
                    <InputGroupText>@</InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    autoComplete="username"
                    placeholder="Enter your moderator name"
                  />
                </InputGroup>
                {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
              </Field>
            );
          }}
        />

        <form.Field
          name="password"
          children={(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                <InputGroup>
                  <InputGroupAddon>
                    <InputGroupText>
                    <HugeiconsIcon icon={Key} className="size-3"/>
                    </InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    id={field.name}
                    name={field.name}
                    type={showPassword ? "text" : "password"}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      type="button"
                      variant="ghost"
                      className="shadow-sm"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      onClick={() => setShowPassword((current) => !current)}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
                {isInvalid ? (
                  <FieldError errors={field.state.meta.errors} />
                ) : null}
              </Field>
            );
          }}
        />
      </FieldGroup>

      <form.Subscribe
        selector={(state) => ({
          canSubmit: state.canSubmit,
          isSubmitting: state.isSubmitting,
        })}
        children={({ canSubmit, isSubmitting }) => (
          <Field orientation="horizontal">
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
              disabled={isSubmitting}
              className="shadow-sm"
            >
              Reset
            </Button>
            <Button
              type="submit"
              form="moderator-login-form"
              disabled={!canSubmit || isSubmitting}
              className="shadow-sm"
            >
              {isSubmitting ? <Spinner className="size-4" /> : null}
              {isSubmitting ? "Signing In..." : "Sign In"}
            </Button>
          </Field>
        )}
      />
    </form>
  );
}
