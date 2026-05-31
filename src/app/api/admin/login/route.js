import { NextResponse } from 'next/server';
import crypto from 'crypto';

// In-memory rate limiter (per-deployment instance)
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 menit lockout

function getRateLimitKey(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  return ip;
}

function checkRateLimit(key) {
  const now = Date.now();
  const record = loginAttempts.get(key);
  
  if (!record) return { allowed: true, remaining: MAX_ATTEMPTS };
  
  // Reset if lockout has expired
  if (record.lockedUntil && now > record.lockedUntil) {
    loginAttempts.delete(key);
    return { allowed: true, remaining: MAX_ATTEMPTS };
  }
  
  // Currently locked out
  if (record.lockedUntil && now <= record.lockedUntil) {
    const minutesLeft = Math.ceil((record.lockedUntil - now) / 60000);
    return { allowed: false, remaining: 0, minutesLeft };
  }
  
  return { allowed: true, remaining: MAX_ATTEMPTS - record.attempts };
}

function recordFailedAttempt(key) {
  const now = Date.now();
  const record = loginAttempts.get(key) || { attempts: 0 };
  record.attempts += 1;
  
  if (record.attempts >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
  }
  
  loginAttempts.set(key, record);
}

function clearAttempts(key) {
  loginAttempts.delete(key);
}

// Generate a secure session token
function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Store active sessions (in-memory, resets on redeploy — acceptable for this use case)
const activeSessions = new Map();
const SESSION_DURATION_MS = 2 * 60 * 60 * 1000; // 2 jam

export async function POST(request) {
  try {
    const rateLimitKey = getRateLimitKey(request);
    const rateCheck = checkRateLimit(rateLimitKey);
    
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Terlalu banyak percobaan login gagal. Akun dikunci selama ${rateCheck.minutesLeft} menit. Silakan coba lagi nanti.` 
        }, 
        { status: 429 }
      );
    }

    const body = await request.json();
    const { password, action, token } = body;

    // === Verify Session Token ===
    if (action === 'verify') {
      if (!token) {
        return NextResponse.json({ success: false, message: 'Token tidak ditemukan.' }, { status: 401 });
      }
      const session = activeSessions.get(token);
      if (session && Date.now() < session.expiresAt) {
        return NextResponse.json({ success: true });
      } else {
        // Clean up expired token
        if (session) activeSessions.delete(token);
        return NextResponse.json({ success: false, message: 'Sesi telah berakhir. Silakan login kembali.' }, { status: 401 });
      }
    }

    // === Logout ===
    if (action === 'logout') {
      if (token) activeSessions.delete(token);
      return NextResponse.json({ success: true });
    }

    // === Login ===
    const secureAdminPassword = process.env.ADMIN_PASSWORD;
    
    if (!secureAdminPassword) {
      return NextResponse.json(
        { success: false, message: 'ADMIN_PASSWORD belum dikonfigurasi di environment server.' }, 
        { status: 500 }
      );
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Password tidak valid.' }, 
        { status: 400 }
      );
    }

    // Constant-time comparison to prevent timing attacks
    const inputBuffer = Buffer.from(password);
    const correctBuffer = Buffer.from(secureAdminPassword);
    
    const isMatch = inputBuffer.length === correctBuffer.length && 
                    crypto.timingSafeEqual(inputBuffer, correctBuffer);

    if (isMatch) {
      clearAttempts(rateLimitKey);
      
      // Generate session token
      const sessionToken = generateSessionToken();
      activeSessions.set(sessionToken, {
        createdAt: Date.now(),
        expiresAt: Date.now() + SESSION_DURATION_MS,
        ip: rateLimitKey
      });
      
      // Clean up old expired sessions periodically
      for (const [tok, sess] of activeSessions.entries()) {
        if (Date.now() > sess.expiresAt) {
          activeSessions.delete(tok);
        }
      }

      return NextResponse.json({ 
        success: true, 
        token: sessionToken,
        message: 'Login berhasil!'
      });
    } else {
      recordFailedAttempt(rateLimitKey);
      const remaining = MAX_ATTEMPTS - (loginAttempts.get(rateLimitKey)?.attempts || 0);
      
      return NextResponse.json(
        { 
          success: false, 
          message: remaining > 0 
            ? `Password salah! Sisa percobaan: ${remaining}` 
            : 'Password salah! Akun dikunci selama 15 menit.'
        }, 
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('[Admin Login Error]:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server.' }, 
      { status: 500 }
    );
  }
}
