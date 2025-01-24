/**
 * Options for tab operations
 */
export interface TabOptions {
  url?: string;
  active?: boolean;
  pinned?: boolean;
  index?: number;
}

/**
 * Response from tab operations
 */
export interface TabResponse {
  tabId: number;
}

/**
 * Options for bookmark operations
 */
export interface BookmarkOptions {
  title: string;
  url: string;
  parentId?: string;
}

/**
 * Options for opening extension pages
 */
export interface ExtensionPageOptions {
  path: string;
  options?: Omit<TabOptions, "url">;
}
