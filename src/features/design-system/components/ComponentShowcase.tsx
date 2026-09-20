import type React from 'react';
import { useEffect, useState } from 'react';
import { InfoIcon } from '../../../assets/svgs';
import {
  Accordion,
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
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
  Tooltip,
} from '../../../components';
import { ToastDemo } from './ToastDemo';

export const ComponentShowcase: React.FC = () => {
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
              <DropdownMenuItem className="text-primary-600 hover:text-primary-700 focus:text-primary-700">
                Log out
              </DropdownMenuItem>
            </DropdownMenu>

            {/* Popover */}
            <Popover trigger={<Button variant="outline">Open Popover</Button>}>
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
              <span className="text-sm font-medium">Skeleton Placeholders</span>
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
                  <InfoIcon title="Information icon" className="w-5 h-5" />
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
              <Checkbox label="Accept terms and conditions" defaultChecked />
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
  );
};
export default ComponentShowcase;
