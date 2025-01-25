# Extending Browser Extension Toolkit

## Creating Custom Handlers

### Basic Handler

```typescript
import type { MessageHandler, MessageTypes } from "browser-extension-toolkit";

interface CustomInput {
  data: string;
  options?: {
    flag: boolean;
  };
}

interface CustomOutput {
  result: string;
  timestamp: number;
}

// Define your handler type
export const customHandler: MessageHandler<CustomInput, CustomOutput> = async (
  data,
  source,
  sender,
) => {
  return {
    result: `Processed: ${data.data}`,
    timestamp: Date.now(),
  };
};

// Register in background
backgroundProxy.registerProxyHandler("custom:action", customHandler);
```

### Adding New Message Types

```typescript
// lib/messaging/constants.ts
export interface CustomMessages {
  readonly CUSTOM_ACTION: "custom:action";
  readonly OTHER_ACTION: "custom:other";
}

export const MESSAGE_TYPES = {
  // ... existing types
  CUSTOM: {
    CUSTOM_ACTION: "custom:action",
    OTHER_ACTION: "custom:other",
  } satisfies CustomMessages,
} as const;

// Update MessageTypes
export type MessageTypes = {
  // ... existing types
  [K in CustomMessages[keyof CustomMessages]]: CustomInput;
};
```

### Creating Handler Modules

```typescript
// lib/proxy/handlers/custom.ts
export interface CustomHandlerOptions {
  timeout?: number;
  retries?: number;
}

export class CustomProxyHandler {
  constructor(private options: CustomHandlerOptions = {}) {}

  public readonly handleCustomAction: MessageHandler<
    CustomInput,
    CustomOutput
  > = async (data, source, sender) => {
    // Implementation with timeout and retries
    return this.processWithRetries(data);
  };

  private async processWithRetries(data: CustomInput): Promise<CustomOutput> {
    let attempts = 0;
    while (attempts < (this.options.retries ?? 3)) {
      try {
        return await this.process(data);
      } catch (error) {
        attempts++;
        if (attempts === (this.options.retries ?? 3)) {
          throw error;
        }
        await new Promise((resolve) =>
          setTimeout(resolve, this.options.timeout ?? 1000),
        );
      }
    }
    throw new Error("Processing failed");
  }

  private async process(data: CustomInput): Promise<CustomOutput> {
    // Your custom processing logic
  }
}
```

## Creating Middleware

```typescript
// lib/middleware/types.ts
export type Middleware<T = unknown> = (
  data: T,
  next: () => Promise<MessageResponse>,
) => Promise<MessageResponse>;

// lib/messaging/messenger.ts
export class MessagingProxy<TMessageTypes> {
  private middlewares: Middleware[] = [];

  public use(middleware: Middleware): void {
    this.middlewares.push(middleware);
  }

  private async executeMiddlewareChain(
    data: unknown,
    finalHandler: () => Promise<MessageResponse>,
  ): Promise<MessageResponse> {
    let index = 0;

    const next = async (): Promise<MessageResponse> => {
      if (index < this.middlewares.length) {
        const middleware = this.middlewares[index++];
        return middleware(data, next);
      }
      return finalHandler();
    };

    return next();
  }
}

// Example Middleware
export const loggingMiddleware: Middleware = async (data, next) => {
  console.log("Before handler:", data);
  const result = await next();
  console.log("After handler:", result);
  return result;
};
```

## Advanced Type Safety

```typescript
// lib/types/validation.ts
export type Validator<T> = (data: unknown) => data is T;

export const createValidator = <T>(
  schema: Record<string, unknown>,
): Validator<T> => {
  return (data: unknown): data is T => {
    if (!data || typeof data !== "object") return false;
    return Object.entries(schema).every(([key, type]) => {
      const value = (data as Record<string, unknown>)[key];
      return typeof value === type;
    });
  };
};

// Usage
interface UserData {
  id: string;
  age: number;
}

const userValidator = createValidator<UserData>({
  id: "string",
  age: "number",
});

export const userHandler: MessageHandler<UserData, void> = async (
  data,
  source,
  sender,
) => {
  if (!userValidator(data)) {
    throw new Error("Invalid user data");
  }
  // Process valid data
};
```

## Error Handling Extensions

```typescript
// lib/errors/types.ts
export class HandlerError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "HandlerError";
  }
}

// lib/errors/handlers.ts
export const createErrorHandler = <T, R>(
  handler: MessageHandler<T, R>,
): MessageHandler<T, R> => {
  return async (data, source, sender) => {
    try {
      return await handler(data, source, sender);
    } catch (error) {
      if (error instanceof HandlerError) {
        // Handle known errors
        throw error;
      }
      // Convert unknown errors
      throw new HandlerError(
        "Handler execution failed",
        "UNKNOWN_ERROR",
        error,
      );
    }
  };
};
```

## Testing Utilities

```typescript
// lib/testing/mocks.ts
export function createMockProxy<T extends Record<string, unknown>>(
  source: MessageSource,
): MessagingProxy<T> {
  const proxy = new MessagingProxy<T>(source);

  // Mock handler registration
  jest.spyOn(proxy, "registerProxyHandler");

  // Mock message sending
  jest
    .spyOn(proxy, "sendProxyMessage")
    .mockImplementation(async (type, data) => ({
      success: true,
      data: { mock: true },
    }));

  return proxy;
}

// Example test
describe("CustomHandler", () => {
  let proxy: MessagingProxy<MessageTypes>;
  let handler: CustomProxyHandler;

  beforeEach(() => {
    proxy = createMockProxy("background");
    handler = new CustomProxyHandler();
  });

  it("should handle custom action", async () => {
    const input: CustomInput = { data: "test" };
    const result = await handler.handleCustomAction(input, "popup", {} as any);
    expect(result.result).toContain("test");
  });
});
```

## Publishing Custom Extensions

1. Create a new package:

```bash
bun create lib my-extension-toolkit
```

2. Add dependencies:

```json
{
  "peerDependencies": {
    "browser-extension-toolkit": "^1.0.0"
  }
}
```

3. Export your extensions:

```typescript
export * from "./handlers";
export * from "./middleware";
export * from "./types";
```

4. Document usage:

```typescript
import { MessagingProxy } from "browser-extension-toolkit";
import { CustomProxyHandler } from "my-extension-toolkit";

const proxy = new MessagingProxy("background");
const customHandler = new CustomProxyHandler();
proxy.registerProxyHandler("custom:action", customHandler.handleCustomAction);
```
