import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Code, Globe, Search } from "lucide-react";

export default function WelcomeCard() {
  return (
    <Card className="border-none shadow-lg bg-gradient-to-br from-primary/5 to-secondary/5">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-transparent bg-gradient-to-r from-primary to-secondary bg-clip-text">
          Welcome to Universal Web Scraper
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-lg text-muted-foreground">
          To get started, configure your scraping parameters in the sidebar and
          click "Scrape".
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <FeatureCard
            icon={<Globe className="w-8 h-8 text-primary" />}
            title="Any Website"
            description="Scrape data from any website with ease"
          />
          <FeatureCard
            icon={<Code className="w-8 h-8 text-secondary" />}
            title="Customizable"
            description="Define custom fields to extract specific data"
          />
          <FeatureCard
            icon={<Search className="w-8 h-8 text-primary" />}
            title="Intelligent"
            description="Powered by advanced AI models for accurate scraping"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="transition-colors duration-300 bg-card/50 hover:bg-card/80">
      <CardContent className="flex flex-col items-center p-6 space-y-2 text-center">
        {icon}
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
