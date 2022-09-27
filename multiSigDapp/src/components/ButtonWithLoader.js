import React from "react";

const ButtonWithLoader = ({
  btnTxt,
  btnLoadingTxt="Loading...",
  isLoading,
  onClickHandler,
  disabledVal=false,
  btnColor="bg-black"
}) => {

  const cursorProgress = isLoading ? "cursor-progress" : "";

  return (
    <div>
      {isLoading ? (
        <button
          className={`flex items-center px-5 py-2 ${btnColor} text-white rounded-md hover:bg-slate-500 text-xs transition-all ${cursorProgress}`}
          disabled
        >
          <svg
            className="mr-3 h-5 w-5 animate-spin"
            fill="none"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M10 3.5A6.5 6.5 0 0 0 3.5 10 .75.75 0 0 1 2 10a8 8 0 1 1 8 8 .75.75 0 0 1 0-1.5 6.5 6.5 0 1 0 0-13Z"
              fill="#ffffff"
              className="fill-212121"
            ></path>
          </svg>
          {btnLoadingTxt}
        </button>
      ) : (
        <button
          className={`px-5 py-2 ${btnColor} text-white rounded-md hover:bg-slate-500 text-xs transition-all `}
          onClick={onClickHandler}
          disabled={disabledVal}
        >
          {btnTxt}
        </button>
      )}
    </div>
  );
};

export default ButtonWithLoader;
