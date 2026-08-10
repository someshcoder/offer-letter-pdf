import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Upload from "@/models/Upload";

export async function GET(
  req: Request,
  context: RouteContext<"/api/files/[id]">
) {
  try {
    await connectDB();
    
    // Compatibility with Next.js 15+ where params is a Promise
    const resolvedParams = await context.params;
    const id = resolvedParams.id;

    if (!id || id === "undefined") {
      return new NextResponse("Not Found", { status: 404 });
    }

    const file = await Upload.findById(id);

    if (!file || !file.data) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const headers = new Headers();
    headers.set("Content-Type", file.mimeType || "application/octet-stream");
    headers.set("Content-Disposition", `inline; filename="${file.originalName}"`);
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    return new NextResponse(file.data, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Error fetching file:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
