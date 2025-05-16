import { cookies } from "next/headers";

export type Cookies = {
  set: (
    key: string,
    value: string,
    options: {
      secure?: boolean;
      httpOnly?: boolean;
      sameSite?: "strict" | "lax";
      expires?: Date;
    }
  ) => void;
  get: (key: string) => { name: string; value: string } | undefined;
  delete: (key: string) => void;
};

export async function getCookieAdapter(): Promise<Cookies> {
  const cookieStore = await cookies();

  return {
    set: (key, value, options) => {
      cookieStore.set(key, value, options);
    },
    get: (key) => {
      const cookie = cookieStore.get(key);
      return cookie ? { name: cookie.name, value: cookie.value } : undefined;
    },
    delete: (key) => {
      cookieStore.delete(key);
    },
  };
}
