import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Separator,
} from '@heroui/react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useAccount } from 'wagmi';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  const { address, isConnected } = useAccount();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <h1 className="text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-secondary-500">
        Welcome to Flamingo UI
      </h1>
      <p className="text-lg text-default-500 max-w-2xl text-center">
        This project has been updated with a beautiful, vibrant Flamingo Design
        System using Tailwind CSS v4 and HeroUI.
      </p>

      <div className="flex gap-4 mt-4">
        <Link to="/design-system" className="inline-block">
          <Button variant="primary">View Design System</Button>
        </Link>
      </div>

      <Card className="max-w-[400px] w-full mt-8 shadow-lg shadow-primary-500/20">
        <CardHeader className="flex gap-3">
          <div className="flex flex-col">
            <p className="text-md font-semibold">Wallet Status</p>
            <p className="text-small text-default-500">
              {isConnected ? 'Connected' : 'Not Connected'}
            </p>
          </div>
        </CardHeader>
        <Separator />
        <CardContent>
          {isConnected ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">Your Address:</p>
              <code className="bg-default-100 p-2 rounded-md break-all text-xs text-primary-600">
                {address}
              </code>
            </div>
          ) : (
            <p className="text-default-500 text-sm">
              Please connect your wallet using the button in the top right
              corner.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
