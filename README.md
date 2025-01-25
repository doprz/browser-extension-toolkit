# Browser Extension Toolkit

A comprehensive toolkit for building type-safe browser extensions with robust messaging patterns.

## Features

- 🔒 Type-safe messaging system
- 💾 Storage management system
- 🔄 Background script proxy pattern
- 🎯 Runtime validation
- 📦 Modular handler system
- 🚀 Built with Bun + Vite + TypeScript

## Installation

```bash
bun add browser-extension-toolkit webextension-polyfill
# or
npm install browser-extension-toolkit webextension-polyfill
```

## Project Structure

```
src/
├── lib/
│   ├── messaging/
│   │   ├── types.ts           # Core type definitions
│   │   ├── interfaces.ts      # Operation interfaces
│   │   ├── constants.ts       # Message type constants
│   │   └── messenger.ts       # MessagingProxy class
│   ├── storage/               # Storage system
│   │   ├── types.ts           # Storage type definitions
│   │   ├── storage.ts         # ExtensionStorage class
│   │   └── decorators.ts      # Storage decorators
│   ├── proxy/
│   │   ├── handlers/
│   │   │   ├── index.ts       # Handler exports
│   │   │   └── tabs.ts        # Tab operations
│   └── utils/
│       └── testing.ts         # Test utilities
├── tests/
│   ├── setup.ts               # Test configuration
│   ├── messenger.test.ts      # Core tests
│   └── handlers.test.ts       # Handler tests
└── examples/
    ├── popup/
    │   └── messaging.ts       # Popup usage example
    └── background/
        └── setup.ts           # Background setup example
```

## Quick Start

### Messaging

### In your popup script:

```typescript
import type { MessageTypes } from "browser-extension-toolkit";
import { MESSAGE_TYPES, MessagingProxy } from "browser-extension-toolkit";

const backgroundProxy = new MessagingProxy<MessageTypes>("popup");

// Open a new tab
const response = await proxy.sendProxyMessage(MESSAGE_TYPES.TAB.OPEN, {
  url: "https://example.com",
});
```

### In your background script:

```typescript
import type { MessageTypes } from "browser-extension-toolkit";
import {
  MESSAGE_TYPES,
  MessagingProxy,
  tabProxyHandlers,
} from "browser-extension-toolkit";

const backgroundProxy = new MessagingProxy<MessageTypes>("background");

// Register handlers
backgroundProxy.registerProxyHandler(
  MESSAGE_TYPES.TAB.OPEN,
  tabProxyHandlers.openTab,
);
```

## Handlers

The toolkit includes pre-built handlers for common operations:

```typescript
// Tab operations
tabProxyHandlers.openTab;
tabProxyHandlers.closeTab;
tabProxyHandlers.updateTab;

// Extension page operations
extensionProxyHandlers.openOptionsPage;
extensionProxyHandlers.openPopup;
```

## Custom Handlers

Create your own handlers with full type safety:

```typescript
import type { MessageHandler } from "browser-extension-toolkit";

const customHandler: MessageHandler<InputType, OutputType> = async (
  data,
  source,
  sender,
) => {
  // Implementation
  return result;
};
```

## Storage

```typescript
// Define your storage schema
interface UserPreferences {
  theme: "light" | "dark";
  fontSize: number;
  notifications: boolean;
}

// Using ExtensionStorage class
const storage = new ExtensionStorage<UserPreferences>({
  area: "sync",
  prefix: "prefs",
});

await storage.set("theme", "dark");
const theme = await storage.get("theme");

// Listen for changes
storage.addChangeListener((changes) => {
  if ("theme" in changes) {
    console.log("Theme changed:", changes.theme.newValue);
  }
});

// Using decorators
class Settings {
  @persist({ area: "sync", prefix: "settings" })
  public theme!: "light" | "dark";

  @persist({ area: "local", prefix: "settings" })
  public fontSize!: number;
}
```

## Advanced Storage Usage

```typescript
// Namespace isolation
const userStorage = new ExtensionStorage<UserData>({ prefix: "user" });
const settingsStorage = new ExtensionStorage<Settings>({ prefix: "settings" });

// Batch operations
const allSettings = await settingsStorage.getAll();

// Area-specific storage
const syncStorage = new ExtensionStorage<SyncData>({ area: "sync" });
const localStorage = new ExtensionStorage<LocalData>({ area: "local" });

// With serialization control
const rawStorage = new ExtensionStorage<RawData>({
  serialize: false,
});

// Change detection
storage.addChangeListener(async (changes, area) => {
  for (const [key, { oldValue, newValue }] of Object.entries(changes)) {
    console.log(`${key} changed in ${area}:`, { oldValue, newValue });
  }
});
```

## Documentation

- [API Reference](./docs/api.md)
- [Best Practices](./docs/best-practices.md)
- [Migration Guide](./docs/migration.md)
- [Examples](./examples)

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup and guidelines.

## License

MIT License. See [LICENSE](./LICENSE) for details.
