import type React from 'react';

const primaryBgClasses: Record<number, string> = {
  50: 'bg-primary-50',
  100: 'bg-primary-100',
  200: 'bg-primary-200',
  300: 'bg-primary-300',
  400: 'bg-primary-400',
  500: 'bg-primary-500',
  600: 'bg-primary-600',
  700: 'bg-primary-700',
  800: 'bg-primary-800',
  900: 'bg-primary-900',
};

const secondaryBgClasses: Record<number, string> = {
  50: 'bg-secondary-50',
  100: 'bg-secondary-100',
  200: 'bg-secondary-200',
  300: 'bg-secondary-300',
  400: 'bg-secondary-400',
  500: 'bg-secondary-500',
  600: 'bg-secondary-600',
  700: 'bg-secondary-700',
  800: 'bg-secondary-800',
  900: 'bg-secondary-900',
};

export const ColorPalette: React.FC = () => {
  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-semibold">Color Palette</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Primary Colors */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Primary (Flamingo)</h3>
          <div className="grid grid-cols-5 gap-2">
            {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((step) => (
              <div key={step} className="flex flex-col items-center gap-1">
                <div
                  className={`w-12 h-12 rounded-lg shadow-sm ${primaryBgClasses[step] || ''}`}
                />
                <span className="text-xs text-foreground/50">{step}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Secondary Colors */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Secondary (Teal)</h3>
          <div className="grid grid-cols-5 gap-2">
            {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((step) => (
              <div key={step} className="flex flex-col items-center gap-1">
                <div
                  className={`w-12 h-12 rounded-lg shadow-sm ${secondaryBgClasses[step] || ''}`}
                />
                <span className="text-xs text-foreground/50">{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
export default ColorPalette;
