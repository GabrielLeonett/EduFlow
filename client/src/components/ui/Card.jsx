import React from "react";

export const Card = ({ children, className = "" }) => {
  return (
    <div
      className={`bg-white shadow-md rounded-2xl border border-gray-200 ${className}`}
    >
      {children}
    </div>
  );
};

export const CardContent = ({ children, className = "" }) => {
  return <div className={`p-5 ${className}`}>{children}</div>;
};
