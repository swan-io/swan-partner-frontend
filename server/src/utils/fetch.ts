export const fetchWithTimeout: typeof fetch = async (input, init) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 30_000);
  const response = await fetch(input, { ...init, signal: controller.signal });

  clearTimeout(id);
  return response;
};
