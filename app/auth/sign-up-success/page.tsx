import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Store, Mail, CheckCircle } from "lucide-react";

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <Link href="/" className="inline-flex items-center justify-center gap-2 mb-4">
            <Store className="h-8 w-8 text-primary" />
            <span className="font-serif text-2xl font-semibold text-foreground">P2P Market</span>
          </Link>
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-primary/10">
              <CheckCircle className="h-12 w-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Check your email</CardTitle>
          <CardDescription>
            {"We've sent you a confirmation link to verify your account."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-secondary rounded-lg flex items-center gap-3">
            <Mail className="h-5 w-5 text-primary" />
            <p className="text-sm text-muted-foreground">
              Click the link in your email to activate your account
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            {"Didn't receive the email? Check your spam folder or try signing up again."}
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button asChild className="w-full">
            <Link href="/auth/login">Go to login</Link>
          </Button>
          <Button variant="ghost" asChild className="w-full">
            <Link href="/">Return home</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
