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
    lower.includes("unable to verify the first certificate") ||
    lower.includes("certificate") && lower.includes("tls")
  ) {
    const devHint =
      process.env.NODE_ENV !== "production"
        ? " Local dev: if you trust this network, set MONGODB_TLS_INSECURE_DEV=1 in .env.local (never in production)."
        : "";
    return {
      status: 503,
      message: `MongoDB TLS failed (${message}).${devHint}`,
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

  if (lower.includes("e11000 duplicate key error")) {
    const fieldMatch = message.match(/index:\s+(?:.*?\.)?([a-zA-Z0-9_]+)_1\s+dup key/);
    const fieldName = fieldMatch ? fieldMatch[1] : "field";
    
    return {
      status: 409,
      message: `An entry with this ${fieldName} already exists.`,
    };
  }

  return {
    status: 503,
    message,
  };
}

let warnedTlsInsecure = false;

export default async function connectDB(): Promise<typeof mongoose> {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not set in environment variables.");
  }
  if (cache.conn) return cache.conn;
  if (!cache.promise) {
    const uri = validateMongoUri(MONGODB_URI);
    const tlsInsecureDev =
      process.env.NODE_ENV !== "production" &&
      process.env.MONGODB_TLS_INSECURE_DEV === "1";
    if (tlsInsecureDev && !warnedTlsInsecure) {
      warnedTlsInsecure = true;
      console.warn(
        "[mongodb] MONGODB_TLS_INSECURE_DEV=1: TLS certificate verification is disabled. Use only on trusted dev machines.",
      );
    }
    cache.promise = mongoose.connect(uri, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 15000,
      ...(tlsInsecureDev ? { tlsAllowInvalidCertificates: true } : {}),
    });
  }
  try {
    cache.conn = await cache.promise;
    return cache.conn;
  } catch (err) {
    cache.promise = null;
    cache.conn = null;
    throw err;
  }
}
