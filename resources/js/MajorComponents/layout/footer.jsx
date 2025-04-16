import { Link } from "@inertiajs/react";

const Footer = () => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 py-4 px-4 sm:px-6 lg:px-8 z-30">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-around items-center text-sm text-gray-500">
        <p>© {new Date().getFullYear()} Soroti University. All rights reserved.</p>
        <div className="mt-2 sm:mt-0 space-x-4">
          <Link href="/privacy" className="hover:text-primary">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-primary">
            Terms of Service
          </Link>
          <Link href="/contact" className="hover:text-primary">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;