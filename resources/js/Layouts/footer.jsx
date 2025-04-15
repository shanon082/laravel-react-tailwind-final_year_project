const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto py-6 px-4 overflow-hidden sm:px-6 lg:px-8">
        <div className="mt-4 flex justify-center space-x-6">
          <p className="text-center text-base text-gray-500">
            &copy; {currentYear} Soroti University. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;