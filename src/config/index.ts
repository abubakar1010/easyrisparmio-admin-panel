const config = {
  server_url: import.meta.env.VITE_SERVER_URL as string,
  // imageUrl: process.env.NEXT_PUBLIC_IMAGE_URL as string,
  // jwtSecret: process.env.JWT_SECRET_KEY as string,
  // apiKey: process.env.API_KEY,
  //   isProduction: process.env.NODE_ENV === 'production',
};

export const { server_url } = config;
// Base server origin without API path prefix (for static files like /uploads/)
export const server_origin = server_url.replace(/\/api\/v1\/?$/, '');
