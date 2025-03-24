// Cookie utility functions for client-side cookie management

export function setCookie(name: string, value: string, days: number = 7) {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + days);

    const cookie = `${name}=${encodeURIComponent(value)}; expires=${expirationDate.toUTCString()}; path=/; SameSite=Lax`;
    document.cookie = cookie;
}

export function getCookie(name: string): string | undefined {
    const cookies = document.cookie.split('; ');
    const cookie = cookies.find(c => c.startsWith(`${name}=`));

    if (!cookie) return undefined;

    return decodeURIComponent(cookie.split('=')[1]);
}

export function deleteCookie(name: string) {
    document.cookie = `${name}=; Max-Age=-99999999; path=/`;
}