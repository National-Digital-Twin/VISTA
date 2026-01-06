export class ApiError extends Error {
    public readonly status: number;
    public readonly statusText: string;

    constructor(message: string, status: number, statusText: string) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.statusText = statusText;
    }
}

export async function checkResponse(response: Response): Promise<Response> {
    if (!response.ok) {
        throw new ApiError(`Request failed: ${response.statusText}`, response.status, response.statusText);
    }
    return response;
}
