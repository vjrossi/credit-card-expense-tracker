import React from 'react';
import { Link } from 'react-router-dom'; // Import Link from react-router-dom

const SettingsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-blue-600 text-white shadow-md">
        <div className="container mx-auto py-4 px-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold">Settings</h1>
          <Link to="/" className="text-white underline">Home</Link>
        </div>
      </header>
      <main className="flex-grow container mx-auto px-6 py-8">
        <div className="bg-white shadow-md rounded-lg p-6 mb-8 transition-all duration-300 hover:shadow-lg">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Settings Page</h2>
          <p className="text-gray-600 mb-4">
            Here you can configure your application settings.
          </p>
        </div>
      </main>
      <footer className="bg-gray-800 text-white py-4">
        <div className="container mx-auto px-6 text-center">
          <p>&copy; 2024 Credit Card Expense Tracker. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default SettingsPage;