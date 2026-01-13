import Link from "next/link";
import { Smartphone, Calendar, Clock, ArrowRight, User } from "lucide-react";
import { posts, categories } from "./posts";

export const metadata = {
  title: "Blog | CroissantPay",
  description: "News, tutorials, and insights about in-app purchases and mobile monetization",
};

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">CroissantPay</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/docs"
              className="px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
            >
              Docs
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="py-16 px-6 border-b border-border">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">Blog</h1>
          <p className="text-xl text-muted-foreground">
            News, tutorials, and insights about in-app purchases and mobile monetization
          </p>
        </div>
      </section>

      {/* Categories */}
      <section className="py-6 px-6 border-b border-border bg-card/50">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category) => (
              <button
                key={category}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  category === "All"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary hover:bg-secondary/80"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Posts */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="space-y-8">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-colors"
            >
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  {post.category}
                </span>
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {post.date}
                </span>
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {post.readTime}
                </span>
              </div>
              
              <Link href={`/blog/${post.slug}`}>
                <h2 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                  {post.title}
                </h2>
              </Link>
              
              <p className="text-muted-foreground mb-4">{post.excerpt}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="w-4 h-4" />
                  {post.author}
                </div>
                <Link
                  href={`/blog/${post.slug}`}
                  className="flex items-center gap-1 text-primary text-sm font-medium group-hover:gap-2 transition-all"
                >
                  Read more
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </main>

      {/* Newsletter */}
      <section className="py-16 px-6 border-t border-border bg-card/50">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Stay Updated</h2>
          <p className="text-muted-foreground mb-6">
            Subscribe to our newsletter for the latest updates and tutorials
          </p>
          <form className="flex gap-3">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
            />
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              Subscribe
            </button>
          </form>
          <p className="text-xs text-muted-foreground mt-3">
            No spam, unsubscribe at any time.
          </p>
        </div>
      </section>
    </div>
  );
}
