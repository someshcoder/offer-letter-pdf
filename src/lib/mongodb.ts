import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

type MongoIssue = {
  message: string;
  status: number;
};

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var _mongooseCache: MongooseCache | undefined;
}

const cache: MongooseCache = global._mongooseCache ?? {
  conn: null,
  promise: null,
};
if (process.env.NODE_ENV !== "production") {
  global._mongooseCache = cache;
}

function validateMongoUri(uri: string): string {
  const trimmed = uri.trim();

  if (!/^mongodb(\+srv)?:\/\//.test(trimmed)) {
    throw new Error(
      "Invalid MONGODB_URI. It must start with mongodb:// or mongodb+srv://.",
    );
  }

  const queryStart = trimmed.indexOf("?");
  const beforeQuery = queryStart >= 0 ? trimmed.slice(0, queryStart) : trimmed;
  const pathStart = beforeQuery.indexOf("/", beforeQuery.indexOf("//") + 2);
  const databasePath = pathStart >= 0 ? beforeQuery.slice(pathStart + 1) : "";

  if (!databasePath) {
    throw new Error(
      "Invalid MONGODB_URI. The database name must come before query options. Example: mongodb+srv://user:pass@cluster.mongodb.net/pdfeditor?appName=offer-letter",
    );
  }

  return trimmed;
}

export function getMongoIssue(error: unknown): MongoIssue {
  const message = error instanceof Error ? error.message : "Database unavailable";
  const lower = message.toLowerCase();

  if (
    lower.includes("whitelist") ||
    lower.includes("not allowed to access this mongodb atlas cluster") ||
    lower.includes("could not connect to any servers")
  ) {
    return {
      status: 503,
      message:
        "MongoDB Atlas rejected the connection. Allow network access for your deployment, or add Vercel egress IPs in Atlas Network Access.",
    };
  }

  if (
    lower.includes("invalid mongodb_uri") ||
    lower.includes("invalid scheme") ||
    lower.includes("uri") ||
    lower.includes("option")
  ) {
    return {
      status: 503,
      message,
    };
  }

  return {
    status: 503,
    message,
  };
}

export default async function connectDB(): Promise<typeof mongoose> {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not set in environment variables.");
  }
  if (cache.conn) return cache.conn;
  if (!cache.promise) {
    cache.promise = mongoose.connect(validateMongoUri(MONGODB_URI), {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    });
  }
  cache.conn = await cache.promise;
  return cache.conn;
}
