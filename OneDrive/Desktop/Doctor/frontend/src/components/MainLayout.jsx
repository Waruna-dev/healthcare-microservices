import React from 'react';
import { Outlet } from 'react-router-dom'; // Outlet acts as a placeholder for your pages
import Navbar from './Navbar'; // Adjust path if needed
import Footer from './Footer'; // Adjust path if needed

const MainLayout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-background selection:bg-primary-fixed selection:text-primary">
      <Navbar />
      
      {/* <Outlet /> is where AboutUs, PrivacyPolicy, etc. will actually render! */}
      <main className="flex-1 flex flex-col">
        <Outlet /> 
      </main>
      
      <Footer />
    </div>
  );
};

export default MainLayout;