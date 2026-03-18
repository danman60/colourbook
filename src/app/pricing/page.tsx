import Link from 'next/link';
import { Palette, Check, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto animate-fade-in">
        <Link href="/" className="flex items-center gap-2 cursor-pointer">
          <Palette className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold font-heading text-foreground">Colourbook</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/login"><Button variant="ghost" className="cursor-pointer">Log in</Button></Link>
          <Link href="/signup"><Button className="cursor-pointer">Get Started</Button></Link>
        </div>
      </nav>

      <section className="px-6 py-20 max-w-5xl mx-auto">
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            Simple Pricing
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">Simple, Family-Friendly Pricing</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Start free. Print when you&apos;re ready.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Free Tier */}
          <Card className="border-2 border-border animate-fade-in-up stagger-1 hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="text-center pb-4">
              <CardTitle className="font-heading text-2xl">Free</CardTitle>
              <p className="text-5xl font-heading font-bold mt-2">$0</p>
              <p className="text-muted-foreground">Forever</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {[
                  '20 AI-generated coloring pages',
                  'Upload unlimited family photos',
                  'Download B&W PDF pages',
                  'Build and preview books',
                  'Print at home anytime',
                ].map(feature => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <div className="rounded-full bg-accent/10 p-0.5 mt-0.5 shrink-0">
                      <Check className="h-3.5 w-3.5 text-accent" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="block">
                <Button variant="outline" className="w-full cursor-pointer gap-2 hover:bg-muted/50 transition-colors">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Printed Book */}
          <Card className="border-2 border-primary relative animate-fade-in-up stagger-2 shadow-lg shadow-primary/10 hover:shadow-xl hover:shadow-primary/15 transition-shadow duration-300">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium shadow-sm">
              Most Popular
            </div>
            <CardHeader className="text-center pb-4">
              <CardTitle className="font-heading text-2xl">Printed Book</CardTitle>
              <p className="text-5xl font-heading font-bold mt-2">$29.99<span className="text-base font-normal text-muted-foreground"> CAD</span></p>
              <p className="text-muted-foreground">Per book + shipping</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {[
                  'Everything in Free',
                  'Professionally printed & bound',
                  'Up to 10 pages included',
                  '$1/page for additional pages',
                  'Flat-rate shipping',
                  'Printed by local Canadian shops',
                  'Perfect gift for kids & grandparents',
                ].map(feature => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <div className="rounded-full bg-primary/10 p-0.5 mt-0.5 shrink-0">
                      <Check className="h-3.5 w-3.5 text-primary" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="block">
                <Button className="w-full cursor-pointer gap-2 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/25 transition-all duration-300">
                  Start Creating <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="max-w-2xl mx-auto mt-20 animate-fade-in">
          <h2 className="text-2xl font-heading font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: 'How does the AI generation work?',
                a: 'Upload a photo of your family member, describe a fun scene, and our AI creates a unique coloring page featuring them in that scene. The result is clean line art perfect for coloring.',
              },
              {
                q: 'Can I print pages at home?',
                a: 'Every coloring page you generate can be downloaded as a PDF for free. Print as many copies as you like on your home printer.',
              },
              {
                q: 'How long does printing take?',
                a: 'Printed books are produced by local Canadian print shops. Typical turnaround is 5-7 business days plus shipping.',
              },
              {
                q: 'Is the content safe for kids?',
                a: 'All generated content is family-friendly and moderated. Our AI is specifically tuned to create cheerful, age-appropriate coloring pages.',
              },
            ].map((faq, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-6">
                <h3 className="font-heading font-semibold mb-2">{faq.q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
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
