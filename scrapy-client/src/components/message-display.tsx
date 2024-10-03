import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { MessageType, WebSocketMessage } from "@/types";
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
    case MessageType.Text:
    case MessageType.Json:
      return (
        <Alert>
          <AlertTitle>Information</AlertTitle>
          <AlertDescription>
            {message.type === MessageType.Json ? (
              <pre>{JSON.stringify(JSON.parse(message.payload), null, 2)}</pre>
            ) : (
              message.payload
            )}
          </AlertDescription>
        </Alert>
      );
    case MessageType.Progress:
      return (
        <Alert>
          <AlertTitle>Progress</AlertTitle>
          <AlertDescription>
            <Progress value={message.metadata?.percentage} className="mt-2" />
            <p className="mt-2">{message.payload}</p>
          </AlertDescription>
        </Alert>
      );
    case MessageType.Error:
      return (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{message.payload}</AlertDescription>
        </Alert>
      );
    case MessageType.Success:
      return (
        <Alert variant="default">
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{message.payload}</AlertDescription>
        </Alert>
      );
    case MessageType.Warning:
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
