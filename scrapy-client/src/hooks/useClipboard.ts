import { useCallback, useState } from "react";

export const useClipboard = (duration = 2000) => {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = useCallback(
    (text: string) => {
      if (typeof navigator === "undefined" || !navigator.clipboard) {
        console.warn("Clipboard API not available");
        return;
      }

      if (typeof text !== "string" || !text) {
        console.warn("Invalid text provided to copyToClipboard");
        return;
      }

      navigator.clipboard
        .writeText(text)
        .then(() => {
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), duration);
        })
        .catch((error) => {
          console.error("Failed to copy text: ", error);
        });
    },
    [duration],
  );

  return { isCopied, copyToClipboard };
};
