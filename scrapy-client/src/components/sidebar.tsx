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
import { useClipboard } from "@/hooks/useClipboard";
import { secureStorage } from "@/lib/secure-storage";
import { scrapeSchema } from "@/schemas";
import { ScrapeSchema, ScrapingResult } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
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
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

interface SidebarProps {
  models: string[];
  results: ScrapingResult[] | null;
  onSubmit: (data: ScrapeSchema) => void;
  isPending: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  models,
  results,
  onSubmit,
  isPending,
}) => {
  const [showApiKey, setShowApiKey] = useState(false);
  const [isApiKeyLocked, setIsApiKeyLocked] = useState(false);
  const [showLockDialog, setShowLockDialog] = useState(false);
  const [lockPassword, setLockPassword] = useState("");
  const { copyToClipboard, isCopied } = useClipboard();
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
    const savedApiKey = secureStorage.getItem("gemini_api_key");
    if (savedApiKey) {
      form.setValue("apiKey", savedApiKey);
    }
    const lockedState = secureStorage.getItem("gemini_api_key_locked_state");
    setIsApiKeyLocked(lockedState === "true");
  }, [form]);

  const handleApiKeyChange = (value: string) => {
    form.setValue("apiKey", value);
    if (value) {
      secureStorage.setItem("gemini_api_key", value);
    } else {
      secureStorage.removeItem("gemini_api_key");
    }
  };

  const handleLockApiKey = () => {
    if (lockPassword) {
      secureStorage.setItem("gemini_api_key_lock_password", lockPassword);
      secureStorage.setItem("gemini_api_key_locked_state", "true");
      setIsApiKeyLocked(true);
      setShowLockDialog(false);
      setLockPassword("");
    }
  };

  const handleUnlockApiKey = () => {
    if (
      lockPassword === secureStorage.getItem("gemini_api_key_lock_password")
    ) {
      secureStorage.setItem("gemini_api_key_locked_state", "false");
      setIsApiKeyLocked(false);
      setShowLockDialog(false);
      setLockPassword("");
    } else {
      // Show an error message
      console.error("Incorrect password");
    }
  };

  const handleReset = async () => {
    form.reset({
      ...form.getValues(),
      url: "",
      tags: [],
    });
  };

  return (
    <ScrollArea className="h-screen w-80">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
          <h2 className="mb-6 text-2xl font-bold">Scraper Settings</h2>

          <FormField
            control={form.control}
            name="apiKey"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span>API Key</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-3 h-3 ml-1 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Your API key is securely encrypted and stored
                            locally.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showApiKey ? "text" : "password"}
                      placeholder="Enter your API key"
                      {...field}
                      onChange={(e) => handleApiKeyChange(e.target.value)}
                      className="pr-24 transition-all duration-300"
                      disabled={isApiKeyLocked}
                    />
                    <div className="absolute top-0 right-0 flex h-full">
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
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center justify-between">
                    <span>Model</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
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

            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL to Scrape</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="enableScraping"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Enable Scraping</FormLabel>
                    <FormDescription>
                      Extract specific fields from the webpage
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

            {form.watch("enableScraping") && (
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fields to Extract</FormLabel>
                    <FormControl>
                      <div>
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
                        />
                        <div className="flex flex-wrap gap-2 mt-2">
                          {field.value.map((tag, index) => (
                            <Badge key={index} variant="secondary">
                              {tag}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0 ml-1"
                                onClick={() => {
                                  const newTags = [...field.value];
                                  newTags.splice(index, 1);
                                  field.onChange(newTags);
                                }}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="enablePagination"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Enable Pagination
                    </FormLabel>
                    <FormDescription>
                      Scrape multiple pages automatically
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

            {form.watch("enablePagination") && (
              <FormField
                control={form.control}
                name="paginationDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pagination Details</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter pagination details"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Specify how to navigate through pages (e.g., "Next" button
                      selector)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          <div className="flex space-x-2">
            <Button
              type="submit"
              className="flex-1 transition-all duration-300"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
              Reset
            </Button>
          </div>

          {results &&
            results.map((r, i) => (
              <Card key={i}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Scraping Summary</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <SummaryItem
                    label="Input Tokens"
                    value={r.inputTokens.toString()}
                  />
                  <SummaryItem
                    label="Output Tokens"
                    value={r.outputTokens.toString()}
                  />
                  <SummaryItem
                    label="Total Cost"
                    value={`$${r.totalCost.toFixed(4)}`}
                  />
                </CardContent>
              </Card>
            ))}
        </form>
      </Form>

      <Dialog open={showLockDialog} onOpenChange={setShowLockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isApiKeyLocked ? "Unlock API Key" : "Lock API Key"}
            </DialogTitle>
          </DialogHeader>
          <Input
            type="password"
            placeholder={
              isApiKeyLocked
                ? "Enter password to unlock"
                : "Set a password to lock"
            }
            value={lockPassword}
            onChange={(e) => setLockPassword(e.target.value)}
          />
          <DialogFooter>
            <Button onClick={() => setShowLockDialog(false)} variant="outline">
              Cancel
            </Button>
            <Button
              onClick={isApiKeyLocked ? handleUnlockApiKey : handleLockApiKey}
            >
              {isApiKeyLocked ? "Unlock" : "Lock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
          <EyeOff className="w-4 h-4" />
        ) : (
          <Eye className="w-4 h-4" />
        )
      }
      onClick={() => setShowApiKey(!showApiKey)}
      disabled={isApiKeyLocked}
    />
    <IconButton
      icon={
        isCopied ? (
          <Check className="w-4 h-4 text-green-500" />
        ) : (
          <Copy className="w-4 h-4" />
        )
      }
      onClick={copyToClipboard}
      disabled={isApiKeyLocked}
    />
    <IconButton
      icon={
        isApiKeyLocked ? (
          <Lock className="w-4 h-4" />
        ) : (
          <Unlock className="w-4 h-4" />
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

export default Sidebar;
