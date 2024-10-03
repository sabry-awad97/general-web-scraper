import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, WifiOff } from "lucide-react";

interface ConnectionStatusProps {
  isConnected: boolean;
  connectionError: string | null;
}

export default function ConnectionStatus({
  isConnected,
  connectionError,
}: ConnectionStatusProps) {
  if (!isConnected) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2 text-lg">Connecting to server...</span>
      </div>
    );
  }

  if (connectionError) {
    return (
      <Alert variant="destructive" className="mb-4">
        <WifiOff className="h-4 w-4" />
        <AlertTitle>Connection Error</AlertTitle>
        <AlertDescription>
          Unable to connect to the event source. Please check your internet
          connection and try again.
          {connectionError && (
            <span className="mt-2 block text-sm opacity-75">
              Error details: {connectionError}
            </span>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
