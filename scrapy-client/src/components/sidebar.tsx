import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useClearScrapingResult } from "@/hooks/useClearScrapingResult";
import { useClipboard } from "@/hooks/useClipboard";
import { secureStorage } from "@/lib/secure-storage";
import { cn } from "@/lib/utils";
import { scrapeSchema } from "@/schemas";
import { ScrapeSchema, ScrapingResult } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Copy,
  Eye,
  EyeOff,
  Info,
  Loader2,
  Lock,
  Unlock,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface Props {
  results: ScrapingResult | null;
  models: string[];
  onSubmit: (data: ScrapeSchema) => void;
  isPending: boolean;
}

const API_KEY_STORAGE_KEY = "gemini_api_key";
const API_KEY_LOCK_PASSWORD_STORAGE_KEY = "gemini_api_key_lock_password";
const API_KEY_LOCKED_STATE_KEY = "gemini_api_key_locked_state";

const Sidebar = ({ models, results, onSubmit, isPending }: Props) => {
  const [showApiKey, setShowApiKey] = useState(false);
  const [isApiKeyLocked, setIsApiKeyLocked] = useState(false);
  const [showLockDialog, setShowLockDialog] = useState(false);
  const [lockPassword, setLockPassword] = useState("");
  const { copyToClipboard, isCopied } = useClipboard();
  const { mutateAsync: clearScrapingResult, isPending: isClearing } =
    useClearScrapingResult();

  const form = useForm<ScrapeSchema>({
    resolver: zodResolver(scrapeSchema),
    defaultValues: {
      model: models[0],
      apiKey: "",
      url: "",
      enableScraping: false,
      tags: [],
      enablePagination: false,
      paginationDetails: undefined,
    },
  });

  useEffect(() => {
    const savedApiKey = secureStorage.getItem(API_KEY_STORAGE_KEY);
    if (savedApiKey) {
      form.setValue("apiKey", savedApiKey);
    }

    // Initialize the locked state from storage
    const lockedState = secureStorage.getItem(API_KEY_LOCKED_STATE_KEY);
    setIsApiKeyLocked(lockedState === "true");
  }, [form]);

  const handleApiKeyChange = (value: string) => {
    form.setValue("apiKey", value);
    if (value) {
      secureStorage.setItem(API_KEY_STORAGE_KEY, value);
    } else {
      secureStorage.removeItem(API_KEY_STORAGE_KEY);
    }
  };

  const handleLockApiKey = () => {
    if (lockPassword) {
      // In a real implementation, you'd want to hash the password and store it securely
      secureStorage.setItem(API_KEY_LOCK_PASSWORD_STORAGE_KEY, lockPassword);
      secureStorage.setItem(API_KEY_LOCKED_STATE_KEY, "true");
      setIsApiKeyLocked(true);
      setShowLockDialog(false);
      setLockPassword("");
    }
  };

  const handleUnlockApiKey = () => {
    if (
      lockPassword === secureStorage.getItem(API_KEY_LOCK_PASSWORD_STORAGE_KEY)
    ) {
      secureStorage.setItem(API_KEY_LOCKED_STATE_KEY, "false");
      setIsApiKeyLocked(false);
      setShowLockDialog(false);
      setLockPassword("");
    } else {
      // Show an error message (you might want to add a state for this)
      console.error("Incorrect password");
    }
  };

  const handleReset = () => {
    form.reset({
      ...form.getValues(),
      url: "",
      tags: [],
    });

    const promise = clearScrapingResult();

    toast.promise(promise, {
      loading: "Resetting...",
      success: "Reset successful",
      error: "Failed to reset",
    });
  };

  return (
    <ScrollArea className="h-screen w-[24rem]">
      <div className="bg-gradient-to-b from-secondary to-background p-4">
        <div className="mb-4 flex items-center space-x-3">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-primary"
          >
            <path
              d="M12 2L2 7L12 12L22 7L12 2Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 17L12 22L22 17"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 12L12 17L22 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <h1 className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-xl font-bold text-transparent">
            Scraper Settings
          </h1>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Model Selection */}
            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Model</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Model" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {models.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* API Key Input */}
            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center text-sm font-medium">
                    API Key
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="ml-1 h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Your API key is securely encrypted and stored
                            locally.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showApiKey ? "text" : "password"}
                        placeholder="Enter your API key"
                        {...field}
                        onChange={(e) => handleApiKeyChange(e.target.value)}
                        className={cn(
                          "pr-24 transition-all duration-300",
                          isApiKeyLocked && "bg-muted",
                        )}
                        disabled={isApiKeyLocked}
                      />
                      <div className="absolute right-0 top-0 flex h-full">
                        <ApiKeyActions
                          showApiKey={showApiKey}
                          setShowApiKey={setShowApiKey}
                          isApiKeyLocked={isApiKeyLocked}
                          copyToClipboard={() => copyToClipboard(field.value)}
                          isCopied={isCopied}
                          setShowLockDialog={setShowLockDialog}
                        />
                      </div>
                    </div>
                  </FormControl>
                  <FormDescription className="text-xs">
                    {field.value && !isApiKeyLocked && (
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs text-muted-foreground"
                        onClick={() => handleApiKeyChange("")}
                      >
                        Clear API Key
                      </Button>
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* URL Input */}
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com"
                      {...field}
                      className="transition-all duration-300"
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Enter the URL to scrape
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Enable Scraping Switch */}
            <FormField
              control={form.control}
              name="enableScraping"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-md border p-3 shadow-sm transition-all duration-300 hover:shadow-md">
                  <div>
                    <FormLabel className="text-sm font-medium">
                      Enable Scraping
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Specify fields to extract
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Fields to Extract */}
            <AnimatePresence>
              {form.watch("enableScraping") && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Fields to Extract
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Add field and press Enter"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && e.currentTarget.value) {
                                e.preventDefault();
                                field.onChange([
                                  ...field.value,
                                  e.currentTarget.value,
                                ]);
                                e.currentTarget.value = "";
                              }
                            }}
                            className="transition-all duration-300"
                          />
                        </FormControl>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {field.value?.map((tag, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="flex cursor-pointer items-center text-xs transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
                            >
                              {tag}
                              <X
                                className="ml-1 h-3 w-3"
                                onClick={() => {
                                  field.onChange(
                                    field.value?.filter((t) => t !== tag),
                                  );
                                }}
                              />
                            </Badge>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Enable Pagination Switch */}
            <FormField
              control={form.control}
              name="enablePagination"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-md border p-3 shadow-sm transition-all duration-300 hover:shadow-md">
                  <div>
                    <FormLabel className="text-sm font-medium">
                      Enable Pagination
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Specify pagination details
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Pagination Details */}
            <AnimatePresence>
              {form.watch("enablePagination") && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <FormField
                    control={form.control}
                    name="paginationDetails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Pagination Details
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="E.g., Next button selector"
                            {...field}
                            className="transition-all duration-300"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit and Reset Buttons */}
            <div className="flex space-x-2">
              <Button
                type="submit"
                className="flex-1 transition-all duration-300"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scraping...
                  </>
                ) : (
                  "Start Scraping"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1 transition-all duration-300"
                onClick={handleReset}
              >
                {isClearing ? "Resetting..." : "Reset Results"}
              </Button>
            </div>
          </form>
        </Form>

        {/* Scraping Summary */}
        <AnimatePresence>
          {results && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="mt-4 overflow-hidden">
                <CardHeader className="bg-primary py-2 text-primary-foreground">
                  <CardTitle className="text-sm font-medium">
                    Scraping Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 p-3 text-sm">
                  <SummaryItem
                    label="Input Tokens"
                    value={results.inputTokens.toString()}
                  />
                  <SummaryItem
                    label="Output Tokens"
                    value={results.outputTokens.toString()}
                  />
                  <SummaryItem
                    label="Total Cost"
                    value={`$${results.totalCost.toFixed(4)}`}
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Lock/Unlock Dialog */}
      <LockUnlockDialog
        isOpen={showLockDialog}
        onClose={() => setShowLockDialog(false)}
        isLocked={isApiKeyLocked}
        password={lockPassword}
        setPassword={setLockPassword}
        onLock={handleLockApiKey}
        onUnlock={handleUnlockApiKey}
      />
    </ScrollArea>
  );
};

interface ApiKeyActionsProps {
  showApiKey: boolean;
  setShowApiKey: (value: boolean) => void;
  isApiKeyLocked: boolean;
  copyToClipboard: () => void;
  isCopied: boolean;
  setShowLockDialog: (value: boolean) => void;
}

const ApiKeyActions = ({
  showApiKey,
  setShowApiKey,
  isApiKeyLocked,
  copyToClipboard,
  isCopied,
  setShowLockDialog,
}: ApiKeyActionsProps) => (
  <>
    <IconButton
      icon={
        showApiKey ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )
      }
      onClick={() => setShowApiKey(!showApiKey)}
      disabled={isApiKeyLocked}
    />
    <IconButton
      icon={
        isCopied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )
      }
      onClick={copyToClipboard}
      disabled={isApiKeyLocked}
    />
    <IconButton
      icon={
        isApiKeyLocked ? (
          <Lock className="h-4 w-4" />
        ) : (
          <Unlock className="h-4 w-4" />
        )
      }
      onClick={() => setShowLockDialog(true)}
    />
  </>
);

interface IconButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

const IconButton = ({ icon, onClick, disabled }: IconButtonProps) => (
  <Button
    type="button"
    variant="ghost"
    size="sm"
    className="h-full px-2 hover:bg-transparent"
    onClick={onClick}
    disabled={disabled}
  >
    {icon}
  </Button>
);

interface SummaryItemProps {
  label: string;
  value: string;
}

const SummaryItem = ({ label, value }: SummaryItemProps) => (
  <div className="flex justify-between">
    <span>{label}:</span>
    <span className="font-semibold">{value}</span>
  </div>
);

interface LockUnlockDialogProps {
  isOpen: boolean;
  onClose: () => void;
  isLocked: boolean;
  password: string;
  setPassword: (value: string) => void;
  onLock: () => void;
  onUnlock: () => void;
}

const LockUnlockDialog = ({
  isOpen,
  onClose,
  isLocked,
  password,
  setPassword,
  onLock,
  onUnlock,
}: LockUnlockDialogProps) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>
          {isLocked ? "Unlock API Key" : "Lock API Key"}
        </DialogTitle>
      </DialogHeader>
      <Input
        type="password"
        placeholder={
          isLocked ? "Enter password to unlock" : "Set a password to lock"
        }
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="mt-4"
      />
      <DialogFooter className="mt-6">
        <Button onClick={onClose} variant="outline">
          Cancel
        </Button>
        <Button onClick={isLocked ? onUnlock : onLock} className="ml-2">
          {isLocked ? "Unlock" : "Lock"}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default Sidebar;
