import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface ErrorManagerProps {
  crawlError: Error | null;
  modelsError: Error | null;
}

export default function ErrorManager({
  crawlError,
  modelsError,
}: ErrorManagerProps) {
  if (!crawlError && !modelsError) return null;

  return (
    <div className="space-y-4">
      {crawlError && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertTitle>Scraping Error</AlertTitle>
          <AlertDescription>
            {crawlError.message ||
              "An unexpected error occurred during scraping. Please try again or contact support."}
          </AlertDescription>
        </Alert>
      )}
      {modelsError && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertTitle>Models Loading Error</AlertTitle>
          <AlertDescription>
            {modelsError.message ||
              "Failed to load models. Please refresh the page or contact support."}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
