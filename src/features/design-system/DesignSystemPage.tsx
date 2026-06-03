import type React from 'react';
import { useState } from 'react';
import {
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Dialog,
  Input,
} from '../../components';
import ColorPalette from './components/ColorPalette';
import ComponentShowcase from './components/ComponentShowcase';
import TypographyDemo from './components/TypographyDemo';

export const DesignSystemPage: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="h-full overflow-y-auto bg-background text-foreground p-8 font-sans pb-32">
      <div className="max-w-5xl mx-auto space-y-12">
        <div>
          <Badge variant="primary" className="mb-4">
            Flamingo Design System
          </Badge>
          <h1 className="text-4xl font-bold mb-2">Design System</h1>
          <p className="text-foreground/70">
            A premium, vibrant design language built with custom components.
          </p>
        </div>

        {/* Navigation Section */}
        <section className="space-y-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Components</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Design System</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </section>

        <hr className="border-foreground/10" />

        {/* Colors Section */}
        <ColorPalette />

        <hr className="border-foreground/10" />

        {/* Typography Section */}
        <TypographyDemo />

        <hr className="border-foreground/10" />

        {/* Components Section */}
        <ComponentShowcase />

        {/* Open Centered Dialog Button demo */}
        <section className="p-6 rounded-2xl bg-white/5 dark:bg-black/5 border border-foreground/10 backdrop-blur-sm flex justify-between items-center">
          <div>
            <h4 className="text-sm font-semibold">Centered Overlay demo</h4>
            <p className="text-xs text-foreground/60">
              Demonstrates our custom animated overlay dialog portal.
            </p>
          </div>
          <Button variant="primary" onClick={() => setIsDialogOpen(true)}>
            Open Centered Dialog
          </Button>
        </section>
      </div>

      <Dialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title="Centered Dialog"
        description="This dialog appears perfectly centered on the screen, matching the Figma behavior."
      >
        <div className="space-y-4 py-4">
          <Input label="Name" defaultValue="Jane Doe" />
          <Input label="Username" defaultValue="@janedoe" />
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => setIsDialogOpen(false)}>
            Save Changes
          </Button>
        </div>
      </Dialog>
    </div>
  );
};
export default DesignSystemPage;
