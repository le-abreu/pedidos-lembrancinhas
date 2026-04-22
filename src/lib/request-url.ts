function getForwardedOrigin(headers: Headers) {
  const forwardedProto = headers.get("x-forwarded-proto");
  const forwardedHost = headers.get("x-forwarded-host");

  if (!forwardedProto || !forwardedHost) {
    return null;
  }

  return `${forwardedProto}://${forwardedHost}`;
}

export function getRequestOrigin(request: Request) {
  const forwardedOrigin = getForwardedOrigin(request.headers);

  if (forwardedOrigin) {
    return forwardedOrigin;
  }

  const appUrl = process.env.APP_URL?.trim();
  if (appUrl) {
    return appUrl;
  }

  return new URL(request.url).origin;
}

export function createRequestUrl(request: Request, pathname: string) {
  return new URL(pathname, getRequestOrigin(request));
}
