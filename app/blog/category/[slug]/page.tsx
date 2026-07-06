import { redirect } from "next/navigation"

interface PageProps {
  params: { slug: string }
}

export default function BlogCategoryRedirectPage({ params }: PageProps) {
  redirect(`/blog?category=${params.slug}`)
}
