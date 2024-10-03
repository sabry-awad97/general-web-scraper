import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";

interface AlertManagerProps {
  isPending: boolean;
  isError: boolean;
  crawlError: Error | null;
}

export default function AlertManager({
  isPending,
  isError,
  crawlError,
}: AlertManagerProps) {
  if (isPending) {
    return (
      <Alert className="mb-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertTitle>Scraping in progress</AlertTitle>
        <AlertDescription>
          Please wait while we fetch your data. This may take a few moments.
        </AlertDescription>
      </Alert>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Scraping Failed</AlertTitle>
        <AlertDescription>
          {crawlError?.message ||
            "An unexpected error occurred. Please try again or contact support if the issue persists."}
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
