import type React from 'react';
import { Card, CardContent } from '../../../components';

export const TypographyDemo: React.FC = () => {
  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-semibold">Typography</h2>
      <Card variant="default">
        <CardContent className="space-y-6 pt-6">
          <div>
            <h1 className="text-4xl font-bold">Heading 1</h1>
            <p className="text-xs text-foreground/50">text-4xl font-bold</p>
          </div>
          <div>
            <h2 className="text-3xl font-semibold">Heading 2</h2>
            <p className="text-xs text-foreground/50">text-3xl font-semibold</p>
          </div>
          <div>
            <h3 className="text-2xl font-medium">Heading 3</h3>
            <p className="text-xs text-foreground/50">text-2xl font-medium</p>
          </div>
          <div>
            <p className="text-base">
              Body paragraph: The quick brown fox jumps over the lazy dog.
            </p>
            <p className="text-xs text-foreground/50">text-base</p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};
export default TypographyDemo;
