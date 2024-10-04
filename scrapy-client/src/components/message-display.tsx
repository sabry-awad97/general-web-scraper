import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { WebSocketMessage } from "@/types";
import React from "react";

interface MessageDisplayProps {
  messages: WebSocketMessage[];
}

export const MessageDisplay: React.FC<MessageDisplayProps> = ({ messages }) => {
  return (
    <div className="space-y-4">
      {messages.map((message, index) => (
        <MessageItem key={index} message={message} />
      ))}
    </div>
  );
};

const MessageItem: React.FC<{ message: WebSocketMessage }> = ({ message }) => {
  switch (message.type) {
    case "success":
      return (
        <Alert>
          <AlertTitle>Information</AlertTitle>
          <AlertDescription>
            <pre>{JSON.stringify(message.payload, null, 2)}</pre>
          </AlertDescription>
        </Alert>
      );
    case "progress":
      return (
        <Alert>
          <AlertTitle>Progress</AlertTitle>
          <AlertDescription>
            <Progress value={50} className="mt-2" />
            <p className="mt-2">{message.payload}</p>
          </AlertDescription>
        </Alert>
      );
    case "error":
      return (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{message.payload}</AlertDescription>
        </Alert>
      );
    case "warning":
      return (
        <Alert>
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>{message.payload}</AlertDescription>
        </Alert>
      );
    default:
      return null;
  }
};
