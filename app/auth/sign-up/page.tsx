import { Suspense } from "react"
import { SignUpForm } from "./sign-up-form"

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      }
    >
      <SignUpForm />
    </Suspense>
  )
}
