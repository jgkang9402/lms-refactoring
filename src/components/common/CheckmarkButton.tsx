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
          width="50"
          height="50"
          viewBox="0 0 50 50"
        >
          <path
            className="text-green-500 fill-none stroke-current stroke-2"
            d="M5 25 L20 40 L45 5"
          ></path>
        </svg>
      </div>
    </>
  );
};

export default CheckmarkButton;
