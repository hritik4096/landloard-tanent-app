import React from "react";
import Header from "../components/dashboard/Header";

const Schedule = () => {
  return (
    <div>
      <Header />
      <main className="p-4 sm:p-6">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-center">Schedule Page</h1>
          <p className="text-gray-600 text-center mt-2">
            This is a placeholder for the Schedule component.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Schedule;
