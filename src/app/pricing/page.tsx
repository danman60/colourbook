import Link from 'next/link';
import { Palette, Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
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
        <div className="text-center mb-16">
          <h1 className="text-4xl font-heading font-bold mb-4">Simple, Family-Friendly Pricing</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Start free. Print when you&apos;re ready.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Free Tier */}
          <Card className="border-2 border-border">
            <CardHeader className="text-center pb-4">
              <CardTitle className="font-heading text-2xl">Free</CardTitle>
              <p className="text-4xl font-heading font-bold mt-2">$0</p>
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
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-teal mt-0.5 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="block">
                <Button variant="outline" className="w-full cursor-pointer gap-2">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Printed Book */}
          <Card className="border-2 border-primary relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
              Most Popular
            </div>
            <CardHeader className="text-center pb-4">
              <CardTitle className="font-heading text-2xl">Printed Book</CardTitle>
              <p className="text-4xl font-heading font-bold mt-2">$29.99<span className="text-base font-normal text-muted-foreground"> CAD</span></p>
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
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="block">
                <Button className="w-full cursor-pointer gap-2">
                  Start Creating <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
