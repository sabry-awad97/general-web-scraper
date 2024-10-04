import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWebSocketContext } from "@/hooks/useWebSocketContext";
import { cn } from "@/lib/utils";
import { MessageType, WebSocketMessage } from "@/types";
import React from "react";

const MessagePreview = () => {
  const { sortedMessages: messages } = useWebSocketContext();
  return (
    <Card className="h-[400px] w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Message Preview</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] w-full pr-4">
          {messages.map((message, index) => (
            <MessageItem key={index} message={message} />
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

const MessageItem: React.FC<{ message: WebSocketMessage }> = ({ message }) => {
  const getBadgeColor = (type: MessageType) => {
    switch (type) {
      case "success":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      case "warning":
        return "bg-yellow-500";
      case "progress":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="mb-4 last:mb-0">
      <div className="flex items-center mb-1">
        <Badge className={cn("mr-2", getBadgeColor(message.type))}>
          {message.type}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {new Date().toLocaleTimeString()}
        </span>
      </div>
      <div className="pl-2 border-l-2 border-muted">
        <pre className="text-sm break-words whitespace-pre-wrap">
          {typeof message.payload === "string"
            ? message.payload
            : JSON.stringify(message.payload, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default MessagePreview;
