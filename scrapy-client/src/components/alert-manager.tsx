import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

interface AlertManagerProps {
  isPending: boolean;
}

export default function AlertManager({ isPending }: AlertManagerProps) {
  if (!isPending) return null;

  return (
    <Alert className="mb-4">
      <Loader2 className="w-4 h-4 animate-spin" />
      <AlertTitle>Scraping in progress</AlertTitle>
      <AlertDescription>
        Please wait while we fetch your data. This may take a few moments.
      </AlertDescription>
    </Alert>
  );
}
