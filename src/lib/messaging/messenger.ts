import type { MessageTypes } from "./constants";
import type {
  Message,
  MessageHandler,
  MessageResponse,
  MessageSource,
} from "./types";

/**
 * Core messaging class that handles communication between different parts
 * of the extension through the background script proxy.
 */
export class MessagingProxy<
  TMessageTypes extends Record<string, unknown> = MessageTypes,
> {
  private handlers: Map<
    keyof TMessageTypes,
    MessageHandler<TMessageTypes[keyof TMessageTypes]>
  >;
  private source: MessageSource;

  constructor(source: MessageSource) {
    this.handlers = new Map();
    this.source = source;

    if (source === "background") {
      this.initializeBackgroundProxy();
    }
  }

  /**
   * Type guard to validate the structure of incoming messages.
   * This provides runtime type checking to complement TypeScript's static checking.
   */
  private isValidMessage(message: unknown): message is Message<unknown> {
    if (!message || typeof message !== "object") {
      return false;
    }

    const msg = message as Record<string, unknown>;

    return (
      typeof msg.type === "string" &&
      typeof msg.source === "string" &&
      typeof msg.id === "string" &&
      "data" in msg &&
      ["background", "popup", "content", "options"].includes(msg.source)
    );
  }

  /**
   * Sets up message listeners for the background script to act as a proxy.
   * Includes runtime type checking to ensure messages match our expected format.
   */
  private initializeBackgroundProxy(): void {
    browser.runtime.onMessage.addListener(
      (
        rawMessage: unknown,
        sender: browser.runtime.MessageSender,
        sendResponse: (response: MessageResponse) => void,
      ) => {
        // First validate the message structure
        if (!this.isValidMessage(rawMessage)) {
          sendResponse({
            success: false,
            error: "Invalid message format",
          });
          return true;
        }

        // Now we can safely cast the message to our expected type
        const message = rawMessage as Message<
          TMessageTypes[keyof TMessageTypes]
        >;

        this.proxyMessage(message, sender)
          .then(sendResponse)
          .catch((error) =>
            sendResponse({
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
            }),
          );

        return true; // Required for async response
      },
    );
  }

  /**
   * Routes incoming messages to their registered handlers
   */
  private async proxyMessage(
    message: Message<TMessageTypes[keyof TMessageTypes]>,
    sender: browser.runtime.MessageSender,
  ): Promise<MessageResponse<unknown>> {
    try {
      const handler = this.handlers.get(message.type as keyof TMessageTypes);

      if (!handler) {
        throw new Error(
          `No proxy handler registered for message type: ${message.type}`,
        );
      }

      const result = await handler(
        message.data as TMessageTypes[keyof TMessageTypes],
        message.source,
        sender,
      );

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Registers a handler function for a specific message type
   */
  public registerProxyHandler<K extends keyof TMessageTypes, R = unknown>(
    type: K,
    handler: MessageHandler<TMessageTypes[K], R>,
  ): void {
    this.handlers.set(type, handler as MessageHandler);
  }

  /**
   * Sends a message through the background script proxy
   */
  public async sendProxyMessage<K extends keyof TMessageTypes, R = unknown>(
    type: K,
    data: TMessageTypes[K],
  ): Promise<MessageResponse<R>> {
    const message: Message<TMessageTypes[K]> = {
      type: type as string,
      data,
      source: this.source,
      id: crypto.randomUUID(),
    };

    try {
      return await browser.runtime.sendMessage(message);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
