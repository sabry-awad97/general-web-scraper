import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { secureStorage } from "@/lib/secure-storage";
import { scrapeSchema } from "@/schemas";
import { ScrapeSchema, ScrapingResult } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, Lock, Unlock, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
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
    <ScrollArea className="h-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
          <Card className="border-none shadow-lg">
            <CardHeader className="rounded-t-xl bg-gradient-to-r from-primary/10 to-secondary/10">
              <CardTitle className="text-2xl font-bold">
                Scraping Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a model" />
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
                name="apiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Key</FormLabel>
                    <div className="flex items-center space-x-2">
                      <FormControl>
                        <Input
                          type={showApiKey ? "text" : "password"}
                          placeholder="Enter your API key"
                          {...field}
                          onChange={(e) => handleApiKeyChange(e.target.value)}
                          disabled={isApiKeyLocked}
                          className="pr-10"
                        />
                      </FormControl>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => setShowApiKey(!showApiKey)}
                              className="absolute right-12"
                            >
                              {showApiKey ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {showApiKey ? "Hide API Key" : "Show API Key"}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => setShowLockDialog(true)}
                            >
                              {isApiKeyLocked ? (
                                <Lock className="w-4 h-4" />
                              ) : (
                                <Unlock className="w-4 h-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {isApiKeyLocked ? "Unlock API Key" : "Lock API Key"}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
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
                  <FormItem className="flex flex-row items-center justify-between p-4 border rounded-lg bg-background/50">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Enable Scraping
                      </FormLabel>
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
                  <FormItem className="flex flex-row items-center justify-between p-4 border rounded-lg bg-background/50">
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
                        Specify how to navigate through pages (e.g., "Next"
                        button selector)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="flex space-x-2">
                <Button
                  type="submit"
                  className="flex-1 transition-all duration-300 bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80"
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
            </CardContent>
          </Card>

          {results &&
            results.map((r, i) => (
              <Card key={i} className="border-none shadow-lg">
                <CardHeader className="rounded-t-xl bg-gradient-to-r from-primary/10 to-secondary/10">
                  <CardTitle className="flex items-center justify-between">
                    <span>Scraping Summary</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-2">
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

interface SummaryItemProps {
  label: string;
  value: string;
}

const SummaryItem = ({ label, value }: SummaryItemProps) => (
  <div className="flex justify-between">
    <span className="text-muted-foreground">{label}:</span>
    <span className="font-semibold">{value}</span>
  </div>
);

export default Sidebar;
