import SignInForm from "../../components/auth/SignInForm";
import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";

export default function SignIn() {
  return (
    <>
      <PageMeta title="CLUB | Sign In" description="Sign in to CLUB management system" />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
