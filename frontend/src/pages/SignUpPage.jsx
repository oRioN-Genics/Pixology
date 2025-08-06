import React from "react";
import NavBar from "../components/NavBar";
import SignUpFormCard from "../components/SignUpFormCard.jsx";

const SignUpPage = () => {
  return (
    <div className="relative min-h-screen">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/form_bg.png')", opacity: 0.8 }}
      ></div>
      <div className="relative z-10">
        <NavBar showOnlyLogin />
        <div className="flex justify-center items-center min-h-[80vh] pt-28">
          <SignUpFormCard />
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
