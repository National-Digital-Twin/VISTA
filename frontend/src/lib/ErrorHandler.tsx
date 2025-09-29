export interface ErrorHandlerProps {
    /** Message to be displayed */
    readonly message: string;
}

export default function ErrorHandler({ message }: ErrorHandlerProps) {
    return (
        <div className="grid auto-rows-min col-span-12 justify-center self-center gap-y-12 text-center">
            <pre className="text-9xl">(◎_◎;)</pre>
            <p>Oops an error has occurred: {message}</p>
        </div>
    );
}
