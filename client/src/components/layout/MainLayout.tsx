import React, { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import PageNavigation from "@/components/PageNavigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePagination } from "@/contexts/PaginationContext";
import { ChevronLeft, ChevronRight, Settings, User, LogOut, Moon, Sun, Bell } from "lucide-react";
import EnhancedNotifications from "@/components/EnhancedNotifications";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { language } = useLanguage();
  const { currentPage, setCurrentPage, getTotalPages } = usePagination();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [totalItems, setTotalItems] = useState(0); // Will be set by actual data

  // Handle resize events
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Set initial value
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Clean up
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // We'll keep language-switching functionality simple without layout changes

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar className="hidden md:flex md:w-64 flex-col fixed inset-y-0 z-50 left-0" />

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="fixed inset-0 bg-slate-600 bg-opacity-75"
            onClick={closeMobileMenu}
          />
          <div className="relative flex flex-col w-72 max-w-xs bg-white h-full">
            <Sidebar isMobile onClose={closeMobileMenu} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-auto md:pl-64">
        {/* Desktop Header */}
        <div className="hidden md:flex border-b border-slate-200 bg-white px-6 py-4 sticky top-0 z-30">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Morgan ERP</h1>
            </div>
            <div className="flex items-center space-x-3">
              {/* Notifications */}
              <EnhancedNotifications />

              {/* Profile Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <img
                      className="w-10 h-10 rounded-full object-cover"
                      src="https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80"
                      alt="Profile"
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">Ahmed Hassan</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        ahmed.hassan@morgan-erp.com
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Bell className="mr-2 h-4 w-4" />
                    <span>Notifications</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Top Nav (Mobile) */}
        <div className="md:hidden border-b border-slate-200 bg-white p-4 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                type="button"
                className="text-slate-600 hover:text-slate-900"
                onClick={toggleMobileMenu}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-menu"
                >
                  <line x1="4" x2="20" y1="12" y2="12"></line>
                  <line x1="4" x2="20" y1="6" y2="6"></line>
                  <line x1="4" x2="20" y1="18" y2="18"></line>
                </svg>
              </button>
              <div className="ml-3 flex items-center">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-primary"
                >
                  <path
                    d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                    stroke="#3BCEAC"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z"
                    stroke="#3BCEAC"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M21.1667 8H16"
                    stroke="#3BCEAC"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8 8H2.83337"
                    stroke="#3BCEAC"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M19.07 19.0697L15.18 15.1797"
                    stroke="#3BCEAC"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8.82 8.82L4.93 4.93"
                    stroke="#3BCEAC"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M19.07 4.93L15.18 8.82"
                    stroke="#3BCEAC"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8.82 15.1797L4.93 19.0697"
                    stroke="#3BCEAC"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="font-bold text-lg ml-1">Morgan ERP</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative p-2">
                    <Bell className="h-5 w-5" />
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs bg-red-500 text-white">
                      3
                    </Badge>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="flex flex-col items-start space-y-1 p-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="font-medium text-sm">Low Stock Alert</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Panadol Advance is running low (5 units left)</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex flex-col items-start space-y-1 p-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="font-medium text-sm">Expiry Warning</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Antibiotics expire in 15 days</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex flex-col items-start space-y-1 p-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="font-medium text-sm">New Invoice</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Invoice #INV-2025-001 created successfully</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Profile Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <img
                      className="w-10 h-10 rounded-full object-cover"
                      src="https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80"
                      alt="Profile"
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">Ahmed Hassan</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        ahmed.hassan@morgan-erp.com
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Bell className="mr-2 h-4 w-4" />
                    <span>Notifications</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/20 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 hover:scrollbar-thumb-gray-500">
          <div className="min-h-full">
            {/* Enhanced Content Container */}
            <div className="max-w-full mx-auto p-4 md:p-6 lg:p-8">
              <div className="relative">
                {/* Subtle Background Pattern */}
                <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] pointer-events-none"></div>
                
                {/* Content Wrapper with Glass Effect */}
                <div className="relative backdrop-blur-sm">
                  {/* Page Navigation */}
                  <PageNavigation />
                  
                  {children}
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Bottom Navigation (Mobile) */}
        <MobileNav />
      </div>
    </div>
  );
};

export default MainLayout;
