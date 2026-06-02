import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import {
  Accordion,
  Alert,
  Avatar,
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Dialog,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
  Input,
  Pagination,
  Popover,
  Progress,
  Select,
  Skeleton,
  Slider,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  ToastProvider,
  Tooltip,
  useToast,
} from '../components';

export const Route = createFileRoute('/design-system')({
  component: () => (
    <ToastProvider>
      <DesignSystem />
    </ToastProvider>
  ),
});

// A small sub-component to demonstrate Toast firing
const ToastDemo = () => {
  const { toast } = useToast();

  return (
    <div className="flex flex-wrap gap-4">
      <Button
        variant="outline"
        onClick={() =>
          toast({
            title: 'Draft saved',
            description: 'Your post has been saved.',
          })
        }
      >
        Default Toast
      </Button>
      <Button
        variant="primary"
        onClick={() =>
          toast({
            title: 'Success!',
            description: 'Settings updated.',
            type: 'success',
          })
        }
      >
        Success Toast
      </Button>
      <Button
        variant="ghost"
        onClick={() =>
          toast({
            title: 'Error',
            description: 'Failed to fetch data.',
            type: 'error',
          })
        }
      >
        Error Toast
      </Button>
    </div>
  );
};

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

function DesignSystem() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [progress, setProgress] = useState(13);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setProgress(66), 500);
    return () => clearTimeout(timer);
  }, []);

  const accordionItems = [
    {
      id: 'item-1',
      title: 'Is it accessible?',
      content:
        'Yes. It adheres to the WAI-ARIA design pattern and uses semantic HTML where possible.',
    },
    {
      id: 'item-2',
      title: 'Is it styled?',
      content:
        "Yes. It comes with default styles that matches the other components' aesthetic.",
    },
    {
      id: 'item-3',
      title: 'Is it animated?',
      content:
        "Yes. It's animated by default using Framer Motion for buttery smooth transitions.",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground p-8 font-sans pb-32">
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
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Color Palette</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Primary Colors */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Primary (Flamingo)</h3>
              <div className="grid grid-cols-5 gap-2">
                {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map(
                  (step) => (
                    <div
                      key={step}
                      className="flex flex-col items-center gap-1"
                    >
                      <div
                        className={`w-12 h-12 rounded-lg shadow-sm ${primaryBgClasses[step] || ''}`}
                      />
                      <span className="text-xs text-foreground/50">{step}</span>
                    </div>
                  ),
                )}
              </div>
            </div>
            {/* Secondary Colors */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Secondary (Teal)</h3>
              <div className="grid grid-cols-5 gap-2">
                {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map(
                  (step) => (
                    <div
                      key={step}
                      className="flex flex-col items-center gap-1"
                    >
                      <div
                        className={`w-12 h-12 rounded-lg shadow-sm ${secondaryBgClasses[step] || ''}`}
                      />
                      <span className="text-xs text-foreground/50">{step}</span>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </section>

        <hr className="border-foreground/10" />

        {/* Typography Section */}
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
                <p className="text-xs text-foreground/50">
                  text-3xl font-semibold
                </p>
              </div>
              <div>
                <h3 className="text-2xl font-medium">Heading 3</h3>
                <p className="text-xs text-foreground/50">
                  text-2xl font-medium
                </p>
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

        <hr className="border-foreground/10" />

        {/* Components Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Custom Components</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Alerts */}
            <Card variant="default" className="md:col-span-2">
              <CardHeader>
                <CardTitle>Alerts & Toasts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Alert variant="default" title="Default Alert">
                    This is a default alert message for general information.
                  </Alert>
                  <Alert variant="success" title="Success Alert">
                    Your changes have been saved successfully.
                  </Alert>
                </div>
                <hr className="border-foreground/10" />
                <div className="space-y-4">
                  <p className="text-sm font-medium">
                    Toast Notifications (Bottom Right)
                  </p>
                  <ToastDemo />
                </div>
              </CardContent>
            </Card>

            {/* Overlays (Menus, Popovers, Dialogs) */}
            <Card variant="default" className="md:col-span-2">
              <CardHeader>
                <CardTitle>Overlays & Floating Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 flex flex-wrap gap-4">
                {/* Dropdown Menu */}
                <DropdownMenu
                  trigger={<Button variant="outline">Dropdown Menu</Button>}
                >
                  <DropdownMenuItem>Profile Settings</DropdownMenuItem>
                  <DropdownMenuItem>Billing Information</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-500 hover:text-red-600 focus:text-red-600">
                    Log out
                  </DropdownMenuItem>
                </DropdownMenu>

                {/* Popover */}
                <Popover
                  trigger={<Button variant="outline">Open Popover</Button>}
                >
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Dimensions</h4>
                    <p className="text-sm text-foreground/60">
                      Set the dimensions for the layer.
                    </p>
                    <div className="grid gap-2 pt-2">
                      <Input label="Width" defaultValue="100%" />
                    </div>
                  </div>
                </Popover>

                {/* Dialog */}
                <Button variant="primary" onClick={() => setIsDialogOpen(true)}>
                  Open Centered Dialog
                </Button>
              </CardContent>
            </Card>

            {/* Feedback: Progress & Skeletons */}
            <Card variant="default" className="md:col-span-2">
              <CardHeader>
                <CardTitle>Feedback (Progress & Skeleton)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-2">
                  <span className="text-sm font-medium">Loading Progress</span>
                  <Progress value={progress} />
                </div>

                <div className="space-y-4">
                  <span className="text-sm font-medium">
                    Skeleton Placeholders
                  </span>
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Buttons */}
            <Card variant="default">
              <CardHeader>
                <CardTitle>Buttons</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 flex flex-col items-start">
                <div className="flex flex-wrap gap-4">
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                </div>
                <div className="flex flex-wrap gap-4">
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="glass">Glass</Button>
                  <Button variant="primary" isLoading>
                    Loading
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Inputs & Selects */}
            <Card variant="default">
              <CardHeader>
                <CardTitle>Inputs, Select & Textarea</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Email Address"
                  placeholder="Enter your email"
                  type="email"
                />
                <Select
                  label="Role"
                  options={[
                    { value: 'admin', label: 'Administrator' },
                    { value: 'editor', label: 'Editor' },
                    { value: 'viewer', label: 'Viewer' },
                  ]}
                />
                <Textarea
                  label="Bio"
                  placeholder="Tell us a little about yourself"
                />
              </CardContent>
            </Card>

            {/* Badges & Tooltips */}
            <Card variant="default">
              <CardHeader>
                <CardTitle>Badges & Tooltips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-wrap gap-4">
                  <Badge variant="primary">Primary</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="outline">Outline</Badge>
                  <Badge variant="ghost">Ghost</Badge>
                </div>
                <hr className="border-foreground/10" />
                <div className="flex gap-4 items-center">
                  <Tooltip content="This is a primary button">
                    <Button variant="primary" size="sm">
                      Hover Me
                    </Button>
                  </Tooltip>
                  <Tooltip content="More information about this icon">
                    <div className="p-2 rounded-full hover:bg-foreground/10 cursor-help">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <title>Information icon</title>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  </Tooltip>
                </div>
              </CardContent>
            </Card>

            {/* Avatars */}
            <Card variant="default">
              <CardHeader>
                <CardTitle>Avatars</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-end gap-4">
                  <Avatar size="sm" fallback="JD" />
                  <Avatar size="md" fallback="JD" />
                  <Avatar
                    size="lg"
                    fallback="JD"
                    src="https://i.pravatar.cc/150?img=1"
                  />
                  <Avatar
                    size="xl"
                    fallback="JD"
                    src="https://i.pravatar.cc/150?img=5"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Controls */}
            <Card variant="default">
              <CardHeader>
                <CardTitle>Form Controls (Toggles, Checks, Sliders)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col gap-4">
                  <Switch label="Enable notifications" defaultChecked />
                  <Switch label="Dark mode" />
                </div>
                <hr className="border-foreground/10" />
                <div className="flex flex-col gap-4">
                  <Checkbox
                    label="Accept terms and conditions"
                    defaultChecked
                  />
                  <Checkbox label="Subscribe to newsletter" />
                </div>
                <hr className="border-foreground/10" />
                <div className="flex flex-col gap-4">
                  <Slider label="Volume" defaultValue={50} />
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Card variant="default" className="md:col-span-2">
              <CardHeader>
                <CardTitle>Tabs</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="account">
                  <TabsList>
                    <TabsTrigger value="account">Account</TabsTrigger>
                    <TabsTrigger value="password">Password</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                  </TabsList>
                  <TabsContent value="account">
                    <p className="text-sm text-foreground/70 mt-2">
                      Make changes to your account here.
                    </p>
                  </TabsContent>
                  <TabsContent value="password">
                    <p className="text-sm text-foreground/70 mt-2">
                      Change your password here.
                    </p>
                  </TabsContent>
                  <TabsContent value="settings">
                    <p className="text-sm text-foreground/70 mt-2">
                      Manage your app settings here.
                    </p>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Accordion */}
            <Card variant="default" className="md:col-span-2">
              <CardHeader>
                <CardTitle>Accordion</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion items={accordionItems} />
              </CardContent>
            </Card>

            {/* Data Table with Pagination */}
            <Card variant="default" className="md:col-span-2">
              <CardHeader>
                <CardTitle>Data Table</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Invoice</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">INV001</TableCell>
                      <TableCell>
                        <Badge variant="primary">Paid</Badge>
                      </TableCell>
                      <TableCell>Credit Card</TableCell>
                      <TableCell className="text-right">$250.00</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">INV002</TableCell>
                      <TableCell>
                        <Badge variant="secondary">Pending</Badge>
                      </TableCell>
                      <TableCell>PayPal</TableCell>
                      <TableCell className="text-right">$150.00</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">INV003</TableCell>
                      <TableCell>
                        <Badge variant="outline">Unpaid</Badge>
                      </TableCell>
                      <TableCell>Bank Transfer</TableCell>
                      <TableCell className="text-right">$350.00</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                <Pagination
                  currentPage={currentPage}
                  totalPages={5}
                  onPageChange={setCurrentPage}
                />
              </CardContent>
            </Card>
          </div>
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
}
