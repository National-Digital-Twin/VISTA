import { signout } from '@/api/auth';

export const handleAuthError = async (error: unknown): Promise<void> => {
    let status: number | undefined;

    if (error instanceof Response) {
        status = error.status;
    } else if (error && typeof error === 'object') {
        if ('status' in error && typeof (error as { status: unknown }).status === 'number') {
            status = (error as { status: number }).status;
        } else {
            status = (error as { status?: number; statusCode?: number }).status || (error as { statusCode?: number }).statusCode;
        }
    }

    if (status === 401 || status === 403) {
        await signout();
    }
};
