import { Head, Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function Welcome({ auth }) {
    const [activeTab, setActiveTab] = useState('overview');

    const slideImages = [
        {
            url: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
            alt: 'University campus with students walking',
            credit: 'Photo by Annie Spratt on Unsplash'
        },
        {
            url: 'https://images.unsplash.com/photo-1606761568499-6d2451b23c66?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1374&q=80',
            alt: 'Students in lecture hall',
            credit: 'Photo by Kenny Eliason on Unsplash'
        },
        {
            url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
            alt: 'University library with students studying',
            credit: 'Photo by Max Felner on Unsplash'
        },
        {
            url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
            alt: 'Students collaborating on project',
            credit: 'Photo by Brooke Cagle on Unsplash'
        }
    ];
    const features = [
        {
            title: "Smart Scheduling",
            description: "Automatically generates conflict-free timetables based on room availability and lecturer preferences.",
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
            )
        },
        {
            title: "Real-time Updates",
            description: "Instant notifications when schedule changes occur, keeping everyone informed.",
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
        {
            title: "Role-based Access",
            description: "Custom dashboards for admins, lecturers, and students with appropriate permissions.",
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            )
        }
    ];
    const [currentSlide, setCurrentSlide] = useState(0);

    // Auto-advance slideshow
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slideImages.length);
        }, 5000);

        return () => clearInterval(interval);
    }, []);


    return (
        <>
            <Head title="Welcome" />
            <div className="relative min-h-screen bg-gray-900 text-white overflow-hidden">
                <div className="absolute inset-0 overflow-hidden">
                    {slideImages.map((slide, index) => (
                        <div
                            key={index}
                            className={`absolute inset-0 transition-opacity duration-1000 
              ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
                        >
                            <div className="absolute inset-0 bg-black/50 z-10" />
                            <img
                                src={slide.url}
                                alt={slide.alt}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    ))}
                </div>
                {/* Hero Section */}
                <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-16">
                    <div className="max-w-4xl text-center">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-blue-600 text-transparent bg-clip-text">
                            Soroti University Timetable System
                        </h1>

                        <p className="text-xl md:text-2xl mb-8 text-blue-200 max-w-2xl mx-auto">
                            Streamlining academic scheduling with our intelligent timetable management system.
                        </p>

                        <div className="space-y-6 mb-12">
                            <p className="text-lg text-gray-200">
                                Simplify scheduling, eliminate conflicts, and optimize resource utilization
                                with our advanced timetable solution designed specifically for Soroti University.
                            </p>

                            <div className="flex flex-wrap gap-6 justify-center">
                                <div className="flex items-center bg-white/10 backdrop-blur-sm p-4 rounded-lg max-w-xs">
                                    <div className="mr-3 bg-blue-600 p-2 rounded-full">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">Real-time Updates</h3>
                                        <p className="text-sm text-gray-300">Instant notifications for schedule changes</p>
                                    </div>
                                </div>

                                <div className="flex items-center bg-white/10 backdrop-blur-sm p-4 rounded-lg max-w-xs">
                                    <div className="mr-3 bg-blue-600 p-2 rounded-full">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">Conflict Detection</h3>
                                        <p className="text-sm text-gray-300">Automated detection of scheduling conflicts</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 justify-center mt-10">
                            {auth.user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-300 transform hover:scale-105"
                                >
                                    Go to Dashboard
                                </Link>
                            ) : (
                                <Link
                                    href={route('login')}
                                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-300 transform hover:scale-105"
                                >
                                    Get Started
                                </Link>
                            )}
                            <button
                                onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                                className="px-8 py-3 bg-transparent border-2 border-blue-400 text-blue-100 hover:bg-blue-900/30 font-medium rounded-lg transition duration-300"
                            >
                                Learn More
                            </button>
                        </div>
                    </div>
                </div>

                {/* Features Section */}
                <div id="features" className="relative z-10 py-20 bg-transparent">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                                About The System
                            </h2>
                            <p className="mt-4 max-w-2xl text-xl text-gray-300 mx-auto">
                                A comprehensive solution designed to streamline academic scheduling
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
                            {features.map((feature, index) => (
                                <div key={index} className="bg-gray-700/50 p-8 rounded-lg backdrop-blur-sm border border-gray-600 hover:border-blue-400 transition duration-300">
                                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white mb-5">
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-lg font-medium text-white mb-2">{feature.title}</h3>
                                    <p className="text-gray-300">{feature.description}</p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-16 text-center">
                            <h3 className="text-2xl font-bold text-white mb-6">How It Works</h3>
                            <div className="max-w-4xl mx-auto bg-gray-700/50 p-8 rounded-lg border border-gray-600">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                                    <div className="flex flex-col items-center">
                                        <div className="bg-blue-500 rounded-full h-12 w-12 flex items-center justify-center text-white mb-4">1</div>
                                        <p className="text-gray-300 text-center">Admins input courses, lecturers, and rooms</p>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <div className="bg-blue-500 rounded-full h-12 w-12 flex items-center justify-center text-white mb-4">2</div>
                                        <p className="text-gray-300 text-center">System generates optimal timetable automatically</p>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <div className="bg-blue-500 rounded-full h-12 w-12 flex items-center justify-center text-white mb-4">3</div>
                                        <p className="text-gray-300 text-center">Lecturers and students access their schedules</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <footer className="relative z-10 py-8 text-center text-gray-400 text-sm">
                    <p>© {new Date().getFullYear()} Soroti University Timetable System. All rights reserved.</p>
                </footer>
            </div>
        </>
    );
}