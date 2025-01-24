import {
  ExtensionPageOptions,
  TabOptions,
  TabResponse,
} from "@/lib/messaging/interfaces";
import { MessageHandler } from "@/lib/messaging/types";

export const tabProxyHandlers = {
  /**
   * Opens a new tab with the specified options
   */
  openTab: (async (options: TabOptions): Promise<TabResponse> => {
    const tab = await browser.tabs.create(options);
    return { tabId: tab.id! };
  }) satisfies MessageHandler<TabOptions, TabResponse>,

  /**
   * Opens an extension page in a new tab
   */
  openExtensionPage: (async ({
    path,
    options = {},
  }: ExtensionPageOptions): Promise<TabResponse> => {
    const url = browser.runtime.getURL(path);
    const tab = await browser.tabs.create({ ...options, url });
    return { tabId: tab.id! };
  }) satisfies MessageHandler<ExtensionPageOptions, TabResponse>,
};
