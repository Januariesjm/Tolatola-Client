import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

export default function AuthCodeErrorPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Verification Link Invalid</CardTitle>
          <CardDescription>
            The verification link has expired or is invalid.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            This could happen if:
          </p>
          <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
            <li>The link has expired (links expire after 24 hours)</li>
            <li>The link has already been used</li>
            <li>The link was copied incorrectly</li>
          </ul>
          <div className="pt-4 space-y-2">
            <Button asChild className="w-full">
              <Link href="/auth/login">Go to Login</Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/auth/sign-up">Sign Up Again</Link>
            </Button>
            <p className="text-xs text-center text-muted-foreground pt-2">
              Need help? Contact{" "}
              <a href="mailto:support@tolatola.co" className="text-primary hover:underline">
                support@tolatola.co
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

