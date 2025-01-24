import type {
  BookmarkOptions,
  ExtensionPageOptions,
  TabOptions,
} from "./interfaces";

/**
 * Type definitions for different message categories
 */
export interface TabMessages {
  readonly OPEN: "proxy:tab:open";
  readonly CLOSE: "proxy:tab:close";
  readonly UPDATE: "proxy:tab:update";
  readonly QUERY: "proxy:tab:query";
}

/**
 * Type definitions for different bookmark message categories
 */
export interface BookmarkMessages {
  readonly CREATE: "proxy:bookmark:create";
  readonly DELETE: "proxy:bookmark:delete";
  readonly UPDATE: "proxy:bookmark:update";
}

/**
 * Type definitions for different extension message categories
 */
export interface ExtensionMessages {
  readonly OPEN_PAGE: "proxy:extension:openPage";
}

/**
 * Constant definitions for all message types
 */
export const MESSAGE_TYPES = {
  TAB: {
    OPEN: "proxy:tab:open",
    CLOSE: "proxy:tab:close",
    UPDATE: "proxy:tab:update",
    QUERY: "proxy:tab:query",
  } satisfies TabMessages,

  BOOKMARK: {
    CREATE: "proxy:bookmark:create",
    DELETE: "proxy:bookmark:delete",
    UPDATE: "proxy:bookmark:update",
  } satisfies BookmarkMessages,

  EXTENSION: {
    OPEN_PAGE: "proxy:extension:openPage",
  } satisfies ExtensionMessages,
} as const;

/**
 * Maps message types to their corresponding data types
 */
export type MessageTypes = {
  [K in TabMessages[keyof TabMessages]]: TabOptions;
} & {
  [K in BookmarkMessages[keyof BookmarkMessages]]: BookmarkOptions;
} & {
  [K in ExtensionMessages[keyof ExtensionMessages]]: ExtensionPageOptions;
};
