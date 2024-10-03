import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function WelcomeCard() {
  return (
    <Card className="bg-white/10 text-white">
      <CardHeader>
        <CardTitle>Welcome to Universal Web Scraper</CardTitle>
      </CardHeader>
      <CardContent>
        <p>
          To get started, configure your scraping parameters in the sidebar and
          click "Scrape".
        </p>
      </CardContent>
    </Card>
  );
}
