import  Header  from '../MajorComponents/layout/Header';
import  Sidebar  from '../MajorComponents/layout/Sidebar';

export default function AppLayout({ auth, header, children }) {
    return (
        <div className="min-h-screen bg-gray-50">
            <Header user={auth.user} />
            
            <div className="flex">
                <Sidebar />
                
                <main className="flex-1 pl-64 pt-16">
                    {header && (
                        <div className="px-6 py-4 border-b border-gray-200">
                            {header}
                        </div>
                    )}
                    
                    <div className="p-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}