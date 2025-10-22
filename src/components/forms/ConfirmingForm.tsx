"use client";
import * as React from "react";

type Props = {
  action: (formData: FormData) => Promise<void> | void; // server action
  message?: string;
  className?: string;
  children: React.ReactNode;
};

/**
 * Client wrapper that shows a confirmation prompt, then submits to the provided server action.
 * Use in Server Components without passing event handlers from the server.
 */
export default function ConfirmingForm({
  action,
  message = "Are you sure?",
  className,
  children,
}: Props) {
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!confirm(message)) e.preventDefault();
  };
  return (
    <form action={action} onSubmit={onSubmit} className={className}>
      {children}
    </form>
  );
}
