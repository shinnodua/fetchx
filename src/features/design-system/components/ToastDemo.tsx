import { Button, useToast } from '../../../components';

export function ToastDemo() {
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
}
