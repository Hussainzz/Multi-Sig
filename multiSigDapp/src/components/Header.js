import React from "react";
import ConnectButton from "../ConnectButton";

const Header = () => {
  return (
    <header className="flex justify-between items-center fixed top-0 left-0 w-full lg:static z-[1111111111]  ">
      <div className=" flex justify-between w-full px-4 lg:px-0 bg-black lg:bg-transparent">
        <div className="flex justify-between w-full items-center space-x-4 lg:my-8 my-5 ">
            <div className="col-start-1 col-end-3">
                <h6 className="text-slate-800 font-bold text-3xl md:text-2xl lg:text-xl">
                    MultiSig Factory
                </h6>
            </div>
            <div className="col-end-7 col-span-2">
                <ConnectButton/>
            </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
