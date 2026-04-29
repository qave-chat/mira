import type { Meta, StoryObj } from "@storybook/react";

import { LoginForm } from "@/module/auth/ui/login-form.ui";

const meta: Meta<typeof LoginForm> = {
  title: "Module/Auth/LoginForm",
  component: LoginForm,
};

export default meta;

type Story = StoryObj<typeof LoginForm>;

export const Default: Story = {
  render: () => (
    <div className="flex min-h-svh items-center justify-center bg-background p-6">
      <LoginForm onGoogleSignIn={() => {}} />
    </div>
  ),
};

export const Submitting: Story = {
  render: () => (
    <div className="flex min-h-svh items-center justify-center bg-background p-6">
      <LoginForm onGoogleSignIn={() => {}} isSubmitting />
    </div>
  ),
};

export const WithError: Story = {
  render: () => (
    <div className="flex min-h-svh items-center justify-center bg-background p-6">
      <LoginForm onGoogleSignIn={() => {}} error="Google sign-in failed" />
    </div>
  ),
};

export const DomainBlocked: Story = {
  render: () => (
    <div className="flex min-h-svh items-center justify-center bg-background p-6">
      <LoginForm
        onGoogleSignIn={() => {}}
        errorTitle="Company account required"
        error="SAI is limited to Skip Loans accounts. Sign in with your @skiploans.com.au Google account."
      />
    </div>
  ),
};
