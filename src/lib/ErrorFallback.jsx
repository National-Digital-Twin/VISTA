import React from "react";

const ErrorFallback = ({ error }) => {
  return (
    <div role="alert" className="flex flex-col justify-center items-center mx-auto">
      <pre className="text-3xl">(◎_◎;)</pre>
      <p>Oops something has gone wrong: {error.message}</p>
    </div>
  );
};

export default ErrorFallback;
