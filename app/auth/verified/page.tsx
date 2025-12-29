"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { HeaderAnimatedText } from "@/components/layout/header-animated-text"
import { CheckCircle2 } from "lucide-react"

export default function VerifiedPage() {
    return (
        <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-primary/5 via-background to-accent/5 relative overflow-hidden">
            <div className="absolute inset-0 -z-10">
                <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse animation-delay-2000" />
            </div>

            <div className="w-full max-w-sm animate-fade-in-up">
                <div className="flex flex-col gap-6">
                    <Link href="/" className="flex items-center gap-3 justify-center hover:scale-105 transition-transform">
                        <Image src="/tolalogo.jpg" alt="TOLA" width={120} height={40} className="h-12 w-auto" />
                        <HeaderAnimatedText />
                    </Link>
                    <Card className="backdrop-blur-sm bg-card/95 shadow-xl border-primary/10">
                        <CardHeader className="text-center pb-2">
                            <div className="mx-auto bg-green-100 p-3 rounded-full mb-4 w-fit">
                                <CheckCircle2 className="h-8 w-8 text-green-600" />
                            </div>
                            <CardTitle className="text-2xl text-green-700">Account Verified!</CardTitle>
                            <CardDescription>Your email has been successfully verified.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-center space-y-2">
                                <p className="text-sm text-muted-foreground">
                                    Thank you for verifying your email address. You can now access all features of your account.
                                </p>
                            </div>

                            <Link href="/auth/login">
                                <Button className="w-full bg-green-600 hover:bg-green-700">Continue to Login</Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
