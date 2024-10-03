export interface ErrorFallbackProps {
  /** Error object */
  error: Error;
}

export default function ErrorFallback({ error }: ErrorFallbackProps) {
  return (
    <div
      role="alert"
      className="flex flex-col justify-center items-center mx-auto"
    >
      <pre className="text-3xl">(◎_◎;)</pre>
      <p>Oops something has gone wrong: {error.message}</p>
    </div>
  );
}
