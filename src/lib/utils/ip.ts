import { NextRequest } from 'next/server';

export function getClientIp(request: NextRequest): string {
  // First try to get the IP from the Cloudflare headers
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp;

  // Then try the x-forwarded-for header
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Get the first IP in the list (client IP)
    return forwardedFor.split(',')[0].trim();
  }

  // Finally try the real IP header
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;

  // If all else fails, use the remote address
  const remoteAddr = request.headers.get('remote-addr') || 'Unknown';
  return remoteAddr;
}
