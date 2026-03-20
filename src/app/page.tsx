import Link from 'next/link';
import { Palette, Upload, Wand2, BookOpen, Printer, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HeroAnimated } from '@/components/landing/hero-animated';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto animate-fade-in">
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

      {/* Hero — animated with motion + SparklesText */}
      <HeroAnimated />

      {/* Sample Preview */}
      <section className="px-6 pb-8 max-w-5xl mx-auto animate-fade-in-up stagger-6">
        <div className="relative bg-card rounded-3xl border border-border shadow-xl p-8 md:p-12">
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
            {[
              { bg: 'bg-primary/5', border: 'border-primary/20' },
              { bg: 'bg-secondary/5', border: 'border-secondary/20' },
              { bg: 'bg-accent/5', border: 'border-accent/20' },
              { bg: 'bg-primary/5', border: 'border-primary/20' },
              { bg: 'bg-secondary/5', border: 'border-secondary/20' },
            ].map((style, i) => (
              <div
                key={i}
                className={`aspect-[3/4] ${style.bg} ${style.border} border-2 border-dashed rounded-2xl flex items-center justify-center ${i >= 3 ? 'hidden md:flex' : ''}`}
              >
                <div className="text-center space-y-2">
                  <Palette className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground/40 mx-auto" />
                  <p className="text-[10px] md:text-xs text-muted-foreground/40 font-medium">Page {i + 1}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-6">
            Your custom coloring book pages will appear here
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-20 bg-card border-y border-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-center mb-4">
            How It Works
          </h2>
          <p className="text-muted-foreground text-center mb-16 max-w-lg mx-auto">
            Four simple steps to create a one-of-a-kind coloring book your family will treasure
          </p>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                icon: Upload,
                title: 'Upload Photos',
                description: 'Add photos of your family members — kids, parents, grandparents, even pets!',
                color: 'bg-primary/10 text-primary',
                step: '01',
              },
              {
                icon: Wand2,
                title: 'Generate Pages',
                description: 'Choose fun scenes and our AI transforms them into beautiful coloring pages.',
                color: 'bg-secondary/10 text-secondary',
                step: '02',
              },
              {
                icon: BookOpen,
                title: 'Build Your Book',
                description: 'Arrange your favorite pages into a custom coloring book.',
                color: 'bg-accent/10 text-accent',
                step: '03',
              },
              {
                icon: Printer,
                title: 'Print & Enjoy',
                description: 'Download free PDFs or order a professionally printed and bound book.',
                color: 'bg-primary/10 text-primary',
                step: '04',
              },
            ].map((step, i) => (
              <div key={i} className="text-center group">
                <div className="relative inline-block">
                  <span className="absolute -top-2 -right-2 text-[10px] font-bold text-muted-foreground/40 font-heading">{step.step}</span>
                  <div className={`inline-flex rounded-2xl p-4 mb-4 ${step.color} group-hover:scale-110 transition-transform duration-300`}>
                    <step.icon className="h-8 w-8" />
                  </div>
                </div>
                <h3 className="font-heading font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="px-6 py-20 max-w-5xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
          Made for Families, By Families
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-12">
          Every coloring book is unique — featuring your family in fun, imaginative scenes
          that kids (and adults!) will love to colour.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { stat: '20', label: 'Free pages per account', color: 'text-primary' },
            { stat: '$29.99', label: 'Printed book starting price', color: 'text-secondary' },
            { stat: '100%', label: 'Family-friendly content', color: 'text-accent' },
          ].map((item, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-8 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <p className={`text-4xl font-heading font-bold ${item.color}`}>{item.stat}</p>
              <p className="text-muted-foreground mt-2">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials / Use Cases */}
      <section className="px-6 py-20 bg-card border-y border-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-heading font-bold text-center mb-12">
            Perfect For Every Occasion
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'Birthday Gifts',
                description: 'Create a personalized coloring book starring the birthday kid in their favorite scenes.',
                icon: '🎂',
              },
              {
                title: 'Holiday Traditions',
                description: 'Design festive coloring pages with your whole family — a new tradition they\'ll love.',
                icon: '🎄',
              },
              {
                title: 'Grandparent Gifts',
                description: 'The most thoughtful gift: a coloring book featuring all the grandkids.',
                icon: '💝',
              },
            ].map((item, i) => (
              <div key={i} className="bg-background rounded-2xl p-6 border border-border hover:shadow-md transition-shadow duration-300">
                <span className="text-3xl mb-3 block">{item.icon}</span>
                <h3 className="font-heading font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 bg-gradient-to-br from-primary to-primary/80">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-primary-foreground mb-4">
            Ready to Create Your Family&apos;s Coloring Book?
          </h2>
          <p className="text-primary-foreground/80 mb-8 text-lg">
            Start with 20 free coloring pages. No credit card needed.
          </p>
          <Link href="/signup">
            <Button size="lg" variant="secondary" className="cursor-pointer text-base px-8 gap-2 shadow-lg hover:shadow-xl transition-all duration-300">
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
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link href="/login" className="hover:text-foreground transition-colors">Log In</Link>
            <Link href="/signup" className="hover:text-foreground transition-colors">Sign Up</Link>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Colourbook. Made with love for families.
          </p>
        </div>
      </footer>
    </div>
  );
}
