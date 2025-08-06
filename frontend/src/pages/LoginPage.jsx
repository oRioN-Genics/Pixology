import React from "react";
import NavBar from "../components/NavBar";
import LoginFormCard from "../components/LoginFormCard.jsx";

const LoginPage = () => {
  return (
    <div className="relative min-h-screen">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/form_bg.png')", opacity: 0.8 }}
      ></div>
      <div className="relative z-10">
        <NavBar showOnlySignUp />
        <div className="flex justify-center items-center min-h-[80vh] pt-28">
          <LoginFormCard />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
