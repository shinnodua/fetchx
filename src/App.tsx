import { useState } from 'react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
} from './components';

function App() {
  const [isLoading, setIsLoading] = useState(false);

  const simulateLoading = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-8 md:p-12 lg:p-24 selection:bg-primary-200 selection:text-primary-900">
      <div className="max-w-5xl mx-auto space-y-16">
        <header className="space-y-4">
          <Badge variant="primary" className="mb-4">
            Flamingo Design System
          </Badge>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-secondary-500">
            Components Showcase
          </h1>
          <p className="text-lg text-foreground/70 max-w-2xl">
            A beautiful, modern, and accessible collection of UI components
            built with Tailwind CSS and Framer Motion, inspired by the Flamingo
            Design System.
          </p>
        </header>

        {/* Buttons Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold border-b border-foreground/10 pb-2">
            Buttons
          </h2>
          <div className="flex flex-wrap gap-4 items-center p-6 rounded-2xl bg-white/50 dark:bg-black/20 border border-foreground/5 backdrop-blur-sm">
            <Button
              variant="primary"
              onClick={simulateLoading}
              isLoading={isLoading}
            >
              Primary
            </Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="glass">Glassmorphism</Button>
            <Button variant="primary" size="sm">
              Small
            </Button>
            <Button variant="primary" size="lg">
              Large
            </Button>
          </div>
        </section>

        {/* Inputs Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold border-b border-foreground/10 pb-2">
            Inputs
          </h2>
          <div className="grid md:grid-cols-2 gap-8 p-6 rounded-2xl bg-white/50 dark:bg-black/20 border border-foreground/5 backdrop-blur-sm">
            <Input
              label="Email address"
              type="email"
              placeholder="jane@example.com"
            />
            <Input label="Password" type="password" placeholder="••••••••" />
            <Input
              label="Username"
              placeholder="jane_doe"
              leftIcon={<span className="text-lg">@</span>}
            />
            <Input
              label="Search"
              placeholder="Search components..."
              error="Search query is too short."
            />
          </div>
        </section>

        {/* Badges Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold border-b border-foreground/10 pb-2">
            Badges
          </h2>
          <div className="flex flex-wrap gap-4 items-center p-6 rounded-2xl bg-white/50 dark:bg-black/20 border border-foreground/5 backdrop-blur-sm">
            <Badge variant="primary">New Feature</Badge>
            <Badge variant="secondary">In Progress</Badge>
            <Badge variant="outline">v2.0.1</Badge>
            <Badge variant="ghost">Archived</Badge>
          </div>
        </section>

        {/* Cards Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold border-b border-foreground/10 pb-2">
            Cards
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card variant="default">
              <CardHeader>
                <CardTitle>Standard Card</CardTitle>
                <CardDescription>
                  A basic card with default styling.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/80">
                  This card uses standard borders and subtle shadows for a clean
                  look.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full">
                  View Details
                </Button>
              </CardFooter>
            </Card>

            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Elevated Card</CardTitle>
                <CardDescription>
                  A card that stands out from the page.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/80">
                  Utilizes deeper shadows and no borders to create a floating
                  effect.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="primary" size="sm" className="w-full">
                  Get Started
                </Button>
              </CardFooter>
            </Card>

            <Card variant="glass" className="relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-secondary-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="relative z-10">
                <CardTitle>Glass Card</CardTitle>
                <CardDescription>Premium frosted glass effect.</CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <p className="text-sm text-foreground/80">
                  Combines backdrop blur and subtle borders for a modern,
                  stunning aesthetic.
                </p>
              </CardContent>
              <CardFooter className="relative z-10">
                <Button variant="glass" size="sm" className="w-full">
                  Explore
                </Button>
              </CardFooter>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;
