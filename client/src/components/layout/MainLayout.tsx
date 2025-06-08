import React, { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import PageNavigation from "@/components/PageNavigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePagination } from "@/contexts/PaginationContext";
import { useSidebarContext } from "@/contexts/SidebarContext";
import { ChevronLeft, ChevronRight, Settings, User, LogOut, Moon, Sun, Bell } from "lucide-react";
import EnhancedNotifications from "@/components/EnhancedNotifications";
import LanguageSelector from "@/components/LanguageSelector";
import { ProfileDialog } from "@/components/dialogs/ProfileDialog";
import { SettingsDialog } from "@/components/dialogs/SettingsDialog";
import { LogoutDialog } from "@/components/dialogs/LogoutDialog";
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
import { Link } from "wouter";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { language, isRTL, t } = useLanguage();
  const { currentPage, setCurrentPage, getTotalPages } = usePagination();
  const { isCollapsed } = useSidebarContext();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  // Handle resize events
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

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

  const totalPages = getTotalPages(totalItems);

  return (
    <div className="flex h-screen bg-slate-100">
      {/* Desktop Sidebar */}
      <div className={`hidden md:flex md:flex-col md:fixed md:inset-y-0 transition-all duration-300 ${isCollapsed ? 'md:w-16' : 'md:w-64'}`}>
        <Sidebar />
      </div>
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
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isCollapsed ? 'md:pl-16' : 'md:pl-64'}`}>
        {/* Desktop Header */}
        <div className="hidden md:flex border-b border-slate-200 bg-white px-6 py-4 sticky top-0 z-30">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-3">
              <img 
                src="/attached_assets/Untitled design-7_1749347391766.png" 
                alt="Morgan ERP Logo" 
                className="w-12 h-12 object-contain"
              />
              <h1 className="font-semibold text-gray-900 text-[20px]">Morgan Chemical ERP</h1>
            </div>
            <div className="flex items-center space-x-3">
              {/* Enhanced Notifications */}
              <EnhancedNotifications />

              {/* Enhanced Profile Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="relative h-12 w-12 rounded-full p-0 border-2 border-transparent hover:border-blue-200 hover:shadow-lg transition-all duration-200 hover:scale-105 group"
                  >
                    <div className="relative">
                      <img
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-md group-hover:ring-blue-300 transition-all duration-200"
                        src="https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80"
                        alt="Ahmed Hassan"
                      />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full animate-pulse"></div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80 p-0 shadow-xl border-0 bg-white/95 backdrop-blur-md rounded-xl" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal p-6 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-t-xl">
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="relative">
                        <img
                          className="w-16 h-16 rounded-full object-cover ring-4 ring-white shadow-lg"
                          src="https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80"
                          alt="Ahmed Hassan"
                        />
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-3 border-white rounded-full"></div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-lg font-semibold text-gray-900">Ahmed Hassan</p>
                        <p className="text-sm text-gray-600">
                          ahmed.hassan@morgan-erp.com
                        </p>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200 text-xs px-3 py-1">
                          Administrator
                        </Badge>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  
                  <div className="p-3 space-y-1">
                    <DropdownMenuItem 
                      onClick={() => setProfileDialogOpen(true)}
                      className="flex items-center px-4 py-3 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 cursor-pointer group"
                    >
                      <div className="flex items-center justify-center w-10 h-10 bg-blue-100 group-hover:bg-blue-200 rounded-full mr-3 transition-colors duration-200">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">My Profile</span>
                        <span className="text-xs text-gray-500">View and edit profile</span>
                      </div>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                      onClick={() => setSettingsDialogOpen(true)}
                      className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-50 hover:text-gray-700 transition-all duration-200 cursor-pointer group"
                    >
                      <div className="flex items-center justify-center w-10 h-10 bg-gray-100 group-hover:bg-gray-200 rounded-full mr-3 transition-colors duration-200">
                        <Settings className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">Settings</span>
                        <span className="text-xs text-gray-500">Preferences & privacy</span>
                      </div>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem asChild>
                      <Link href="/notifications" className="flex items-center px-4 py-3 rounded-lg hover:bg-amber-50 hover:text-amber-700 transition-all duration-200 cursor-pointer group">
                        <div className="flex items-center justify-center w-10 h-10 bg-amber-100 group-hover:bg-amber-200 rounded-full mr-3 transition-colors duration-200">
                          <Bell className="h-5 w-5 text-amber-600" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">Notifications</span>
                          <span className="text-xs text-gray-500">Alerts & updates</span>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  </div>
                  
                  <DropdownMenuSeparator className="mx-3" />
                  
                  <div className="p-3">
                    <DropdownMenuItem 
                      onClick={() => setLogoutDialogOpen(true)} 
                      className="flex items-center px-4 py-3 rounded-lg hover:bg-red-50 hover:text-red-700 transition-all duration-200 cursor-pointer text-red-600 group"
                    >
                      <div className="flex items-center justify-center w-10 h-10 bg-red-100 group-hover:bg-red-200 rounded-full mr-3 transition-colors duration-200">
                        <LogOut className="h-5 w-5 text-red-600" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">Sign Out</span>
                        <span className="text-xs text-red-400">End your session</span>
                      </div>
                    </DropdownMenuItem>
                  </div>
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
              {/* Mobile Enhanced Notifications */}
              <EnhancedNotifications />

              {/* Mobile Profile Menu */}
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
                  <DropdownMenuItem onClick={() => setProfileDialogOpen(true)}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSettingsDialogOpen(true)}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/notifications" className="flex items-center">
                      <Bell className="mr-2 h-4 w-4" />
                      <span>Notifications</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setLogoutDialogOpen(true)}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/20">
          <div className="p-4 md:p-6 lg:p-8">
            <PageNavigation />
            {children}
          </div>
        </main>

        {/* Bottom Navigation (Mobile) */}
        <MobileNav />
      </div>
      {/* Dialog Components */}
      <ProfileDialog 
        open={profileDialogOpen} 
        onOpenChange={setProfileDialogOpen} 
      />
      <SettingsDialog 
        open={settingsDialogOpen} 
        onOpenChange={setSettingsDialogOpen} 
      />
      <LogoutDialog 
        open={logoutDialogOpen} 
        onOpenChange={setLogoutDialogOpen} 
      />
    </div>
  );
};

export default MainLayout;