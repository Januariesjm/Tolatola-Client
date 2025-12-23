import { createClient } from "@/lib/supabase/server"
import SiteHeader from "@/components/layout/site-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Briefcase, Users, TrendingUp, Heart } from "lucide-react"

export default async function CareersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile = null
  let kycStatus = null

  if (user) {
    const { data: profileData } = await supabase.from("users").select("*").eq("id", user.id).maybeSingle()
    profile = profileData

    if (profileData) {
      const { data: kycData } = await supabase
        .from("customer_kyc")
        .select("kyc_status")
        .eq("user_id", user.id)
        .maybeSingle()
      kycStatus = kycData?.kyc_status
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader user={user} profile={profile} kycStatus={kycStatus} />
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-4 text-center">Careers at Dan'g 31</h1>
        <p className="text-xl text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
          Join our team and help shape the future of e-commerce in Tanzania
        </p>

        <div className="max-w-4xl mx-auto space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Why Work With Us?</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              <div className="flex gap-4">
                <TrendingUp className="h-8 w-8 text-primary flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-2">Growth Opportunities</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    We're a fast-growing company with plenty of opportunities for career advancement and skill
                    development.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <Users className="h-8 w-8 text-primary flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-2">Collaborative Culture</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Work with a talented, diverse team that values innovation, creativity, and mutual respect.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <Heart className="h-8 w-8 text-primary flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-2">Meaningful Impact</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Help empower Tanzanian entrepreneurs and contribute to the growth of local businesses.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <Briefcase className="h-8 w-8 text-primary flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-2">Competitive Benefits</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Enjoy competitive salaries, health benefits, and a supportive work environment.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Open Positions</CardTitle>
              <CardDescription>We're always looking for talented individuals to join our team</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-4 hover:border-primary transition-colors">
                <h3 className="font-semibold text-lg mb-2">Software Engineer</h3>
                <p className="text-muted-foreground text-sm mb-3">Full-time • Dar Es Salaam • Engineering</p>
                <p className="text-sm leading-relaxed mb-4">
                  We're looking for a talented software engineer to help build and scale our marketplace platform.
                  Experience with React, Node.js, and PostgreSQL preferred.
                </p>
                <Button size="sm">Apply Now</Button>
              </div>

              <div className="border rounded-lg p-4 hover:border-primary transition-colors">
                <h3 className="font-semibold text-lg mb-2">Customer Support Specialist</h3>
                <p className="text-muted-foreground text-sm mb-3">Full-time • Dodoma • Customer Service</p>
                <p className="text-sm leading-relaxed mb-4">
                  Join our customer support team to help vendors and customers have the best experience on our platform.
                  Fluency in Swahili and English required.
                </p>
                <Button size="sm">Apply Now</Button>
              </div>

              <div className="border rounded-lg p-4 hover:border-primary transition-colors">
                <h3 className="font-semibold text-lg mb-2">Marketing Manager</h3>
                <p className="text-muted-foreground text-sm mb-3">Full-time • Dar Es Salaam • Marketing</p>
                <p className="text-sm leading-relaxed mb-4">
                  Lead our marketing efforts to grow vendor and customer acquisition. Experience in digital marketing
                  and e-commerce preferred.
                </p>
                <Button size="sm">Apply Now</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">How to Apply</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Interested in joining our team? Send your CV and cover letter to{" "}
                <a href="mailto:careers@danggroup.co.tz" className="text-primary hover:underline">
                  careers@danggroup.co.tz
                </a>
              </p>
              <p>
                Please include the position you're applying for in the subject line. We review all applications and will
                contact qualified candidates for interviews.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
