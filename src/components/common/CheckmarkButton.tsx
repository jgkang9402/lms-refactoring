const CheckmarkButton = () => {
  return (
    <>
      <style>
        {`
          @keyframes checkmark {
            0% {
              width: 0;
              height: 0;
            }
            50% {
              width: 20px;
            }
            100% {
              width: 20px;
              height: 40px;
            }
          }
          .animate-checkmark {
            animation: checkmark 0.5s forwards;
          }
        `}
      </style>
      <div className="relative">
        <svg
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-checkmark"
          width="100"
          height="100"
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="48"
            fill="none"
            strokeWidth="8"
            className="stroke-white"
          />
          <path
            className="fill-none stroke-white"
            strokeWidth="12"
            d="M20 50 L40 70 L80 30"
          ></path>
        </svg>
      </div>
    </>
  );
};

export default CheckmarkButton;
