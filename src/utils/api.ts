const apiUrl = "process.env.NEXT_PUBLIC_SERVER_URL";
interface FetchOptions extends RequestInit {
  next?: {
    revalidate?: number;
  };
}
export async function fetchGetApi(
  endpoint: string,
  options: FetchOptions = {}
) {
  const url = `${apiUrl}${endpoint}`;
  const config: RequestInit & { next?: { revalidate?: number } } = {
    ...options,
    next: options.next || { revalidate: 10 },
  
  };
  const response = await fetch(url, config);
  return response?.json();
}
