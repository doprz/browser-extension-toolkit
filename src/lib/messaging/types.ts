/**
 * Represents the different contexts where messages can originate from
 * in the extension.
 */
export type MessageSource = "background" | "popup" | "content" | "options";

/**
 * Base message handler function type.
 * All handlers must return a promise and accept the standard parameters.
 */
export type MessageHandler<TData = unknown, TResponse = unknown> = (
  data: TData,
  source: MessageSource,
  sender: browser.runtime.MessageSender,
) => Promise<TResponse>;

/**
 * Core message structure that wraps all communication.
 */
export interface Message<T = unknown> {
  type: string;
  data: T;
  source: MessageSource;
  id: string;
}

/**
 * Standard response wrapper for all message operations.
 */
export interface MessageResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
