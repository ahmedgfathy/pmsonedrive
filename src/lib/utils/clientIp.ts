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

    // Try other common headers
    const realIp = request.headers.get('x-real-ip');
    if (realIp) return realIp;

    // Try to get it from the remote address
    const remoteAddr = (request as any).socket?.remoteAddress;
    if (remoteAddr) return remoteAddr;

    // If all else fails, use a fallback
    return '0.0.0.0';
}
