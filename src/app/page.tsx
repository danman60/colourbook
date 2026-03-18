import Link from 'next/link';
import { Palette, Upload, Wand2, BookOpen, Printer, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2 cursor-pointer">
          <Palette className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold font-heading text-foreground">Colourbook</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/pricing">
            <Button variant="ghost" className="cursor-pointer">Pricing</Button>
          </Link>
          <Link href="/login">
            <Button variant="ghost" className="cursor-pointer">Log in</Button>
          </Link>
          <Link href="/signup">
            <Button className="cursor-pointer">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-20 md:py-32 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-6">
          <Sparkles className="h-4 w-4" />
          AI-Powered Family Coloring Books
        </div>
        <h1 className="text-4xl md:text-6xl font-heading font-bold text-foreground leading-tight mb-6">
          Turn Your Family Photos Into{' '}
          <span className="text-primary">Beautiful Coloring Books</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          Upload photos of your family, let AI create stunning coloring pages, and order a
          professionally printed book — or download free PDFs to color at home.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/signup">
            <Button size="lg" className="cursor-pointer text-base px-8 gap-2">
              Start Creating <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/pricing">
            <Button size="lg" variant="outline" className="cursor-pointer text-base px-8">
              View Pricing
            </Button>
          </Link>
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          20 free coloring pages included — no credit card required
        </p>
      </section>

      {/* How It Works */}
      <section className="px-6 py-20 bg-card border-y border-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-heading font-bold text-center mb-16">
            How It Works
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                icon: Upload,
                title: 'Upload Photos',
                description: 'Add photos of your family members — kids, parents, grandparents, even pets!',
                color: 'bg-primary/10 text-primary',
              },
              {
                icon: Wand2,
                title: 'Generate Pages',
                description: 'Choose fun scenes and our AI transforms them into beautiful coloring pages.',
                color: 'bg-warm-amber/20 text-foreground',
              },
              {
                icon: BookOpen,
                title: 'Build Your Book',
                description: 'Arrange your favorite pages into a custom coloring book.',
                color: 'bg-teal/10 text-teal',
              },
              {
                icon: Printer,
                title: 'Print & Enjoy',
                description: 'Download free PDFs or order a professionally printed and bound book.',
                color: 'bg-primary/10 text-primary',
              },
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className={`inline-flex rounded-2xl p-4 mb-4 ${step.color}`}>
                  <step.icon className="h-8 w-8" />
                </div>
                <h3 className="font-heading font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="px-6 py-20 max-w-5xl mx-auto text-center">
        <h2 className="text-3xl font-heading font-bold mb-4">
          Made for Families, By Families
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-10">
          Every coloring book is unique — featuring your family in fun, imaginative scenes
          that kids (and adults!) will love to colour.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { stat: '20', label: 'Free pages per account' },
            { stat: '$29.99', label: 'Printed book starting price' },
            { stat: '100%', label: 'Family-friendly content' },
          ].map((item, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-8">
              <p className="text-3xl font-heading font-bold text-primary">{item.stat}</p>
              <p className="text-muted-foreground mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 bg-primary">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-heading font-bold text-primary-foreground mb-4">
            Ready to Create Your Family&apos;s Coloring Book?
          </h2>
          <p className="text-primary-foreground/80 mb-8">
            Start with 20 free coloring pages. No credit card needed.
          </p>
          <Link href="/signup">
            <Button size="lg" variant="secondary" className="cursor-pointer text-base px-8 gap-2">
              Get Started Free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-border">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            <span className="font-heading font-bold">Colourbook</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Colourbook. Made with love for families.
          </p>
        </div>
      </footer>
    </div>
  );
}
