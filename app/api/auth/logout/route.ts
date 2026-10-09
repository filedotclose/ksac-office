import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getUserFromToken } from "@/lib/auth";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    const user = await getUserFromToken(req);
    if (user && user._id) {
      await connectDB();
      await User.findByIdAndUpdate(user._id, { refreshToken: null });
    }

    const response = NextResponse.json({ message: "Logged out successfully" }, { status: 200 });
    response.cookies.delete("accessToken");
    response.cookies.delete("refreshToken");
    return response;
  } catch (error: any) {
    console.error("Logout error:", error);
    const response = NextResponse.json({ message: "Logged out" }, { status: 200 });
    response.cookies.delete("accessToken");
    response.cookies.delete("refreshToken");
    return response;
  }
}
