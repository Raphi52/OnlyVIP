import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "VIP Only Blog — Creator Tips & Guides",
  description:
    "Tips, guides, and insights for content creators. Learn how to grow your audience, maximize earnings, and succeed on VIP Only — the best OnlyFans alternative in 2026.",
  keywords: [
    "VIP only",
    "creator tips",
    "content creator guide",
    "onlyfans alternative",
    "how to make money as creator",
    "VipOnly blog",
  ],
};

// Blog posts data - can be moved to database later
const blogPosts = [
  {
    slug: "best-onlyfans-alternatives-2026",
    title: "Best OnlyFans Alternatives in 2026 — Top Creator Platforms",
    excerpt:
      "Looking for the best OnlyFans alternative in 2026? Compare top creator subscription platforms including VIP Only, Fansly, and more.",
    date: "2026-01-01",
    category: "Comparisons",
    readTime: "10 min read",
  },
  {
    slug: "how-to-become-successful-creator",
    title: "How to Become a Successful Content Creator in 2026",
    excerpt:
      "Learn the essential steps to launch your creator career on VIP Only. From setting up your profile to growing your subscriber base.",
    date: "2026-01-01",
    category: "Creator Tips",
    readTime: "8 min read",
  },
  {
    slug: "maximize-earnings-exclusive-content",
    title: "Maximize Your Earnings with Exclusive Content",
    excerpt:
      "Discover strategies to increase your revenue on VIP Only through exclusive photos, videos, and VIP-only posts.",
    date: "2026-01-01",
    category: "Monetization",
    readTime: "6 min read",
  },
  {
    slug: "engage-your-vip-subscribers",
    title: "10 Ways to Engage Your VIP Subscribers",
    excerpt:
      "Keep your fans coming back with these proven engagement strategies for VIP Only creators.",
    date: "2026-01-01",
    category: "Engagement",
    readTime: "5 min read",
  },
  {
    slug: "pricing-your-content-guide",
    title: "The Complete Guide to Pricing Your VIP Content",
    excerpt:
      "Find the perfect price point for your exclusive content. Tips from top VIP Only creators.",
    date: "2026-01-01",
    category: "Monetization",
    readTime: "7 min read",
  },
  {
    slug: "growing-audience-social-media",
    title: "Growing Your VIP Only Audience Through Social Media",
    excerpt:
      "Learn how to leverage Instagram, Twitter, and TikTok to drive traffic to your VIP Only profile.",
    date: "2026-01-01",
    category: "Growth",
    readTime: "9 min read",
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-black">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              VIP Only Blog
            </h1>
            <p className="text-xl text-gray-400">
              Tips, guides, and insights for creators and fans
            </p>
          </div>

          {/* Blog Posts List */}
          <div className="space-y-8">
            {blogPosts.map((post) => (
              <article
                key={post.slug}
                className="bg-gray-900 rounded-xl p-6 hover:bg-gray-800 transition-colors"
              >
                <Link href={`/blog/${post.slug}`}>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="bg-purple-600/20 text-purple-400 px-3 py-1 rounded-full">
                        {post.category}
                      </span>
                      <span>{post.date}</span>
                      <span>•</span>
                      <span>{post.readTime}</span>
                    </div>
                    <h2 className="text-2xl font-semibold text-white hover:text-purple-400 transition-colors">
                      {post.title}
                    </h2>
                    <p className="text-gray-400">{post.excerpt}</p>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
