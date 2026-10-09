import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { generateAccessToken, generateRefreshToken } from "@/lib/jwt";
import { getClientIp, checkAuthRateLimit, setRateLimitHeaders } from "@/lib/rateLimit";
import { parseAndValidateBody, sanitizeEmail, sanitizeString } from "@/lib/sanitize";

export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req);

    const bodyResult = await parseAndValidateBody<{
      email?: unknown;
      password?: unknown;
    }>(req);
    if (!bodyResult.ok) {
      return bodyResult.response;
    }

    const { email, password } = bodyResult.data;

    const emailCheck = sanitizeEmail(email);
    if (!emailCheck.valid) {
      return NextResponse.json({ message: emailCheck.error }, { status: 400 });
    }
    const cleanEmail = emailCheck.email;

    const passwordCheck = sanitizeString(password, 128, "Password");
    if (!passwordCheck.valid || !passwordCheck.value) {
      return NextResponse.json({ message: "Password is required." }, { status: 400 });
    }
    const cleanPassword = passwordCheck.value;

    const rateLimitKey = `${clientIp}:${cleanEmail}`;
    const rateLimitResult = await checkAuthRateLimit(rateLimitKey);

    if (!rateLimitResult.allowed) {
      const response = NextResponse.json(
        {
          message: `Too many login attempts. Please try again in ${rateLimitResult.retryAfterSeconds} seconds.`,
          retryAfter: rateLimitResult.retryAfterSeconds,
        },
        { status: 429 }
      );
      setRateLimitHeaders(response.headers, rateLimitResult);
      return response;
    }

    await connectDB();

    const user = await User.findOne({ email: cleanEmail }).select("+passwordHash");
    if (!user) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(cleanPassword, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    const tokenVersion = typeof user.tokenVersion === "number" ? user.tokenVersion : 0;
    const accessToken = generateAccessToken(user._id.toString(), user.role, tokenVersion);
    const refreshToken = generateRefreshToken(user._id.toString(), user.role, tokenVersion);

    user.refreshToken = refreshToken;
    await user.save();

    const userObj = user.toObject();
    delete userObj.passwordHash;
    delete userObj.refreshToken;

    const response = NextResponse.json(
      {
        message: "Login successful",
        user: userObj,
      },
      { status: 200 }
    );

    const isProd = process.env.NODE_ENV === "production";

    response.cookies.set("accessToken", accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: 15 * 60,
      path: "/",
    });

    response.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    setRateLimitHeaders(response.headers, rateLimitResult);
    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
