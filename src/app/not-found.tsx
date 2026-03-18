import Link from 'next/link';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center">
        <p className="text-7xl font-heading font-bold text-primary mb-4">404</p>
        <h2 className="text-2xl font-heading font-bold mb-2">Page not found</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/">
          <Button className="cursor-pointer gap-2">
            <Home className="h-4 w-4" /> Go Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
