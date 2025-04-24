import React from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import ExpenseForm from '@/components/expenses/ExpenseForm';

const MobileNav: React.FC = () => {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = React.useState(false);

  const handleNewExpense = () => {
    setIsOpen(true);
  };

  return (
    <>
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 z-30">
        <div className="grid grid-cols-5 h-16">
          <div 
            className={cn(
              "flex flex-col items-center justify-center cursor-pointer",
              location === "/" ? "text-primary" : "text-slate-500"
            )}
            onClick={() => window.location.href = "/"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-layout-dashboard">
              <rect width="7" height="9" x="3" y="3" rx="1"></rect>
              <rect width="7" height="5" x="14" y="3" rx="1"></rect>
              <rect width="7" height="9" x="14" y="12" rx="1"></rect>
              <rect width="7" height="5" x="3" y="16" rx="1"></rect>
            </svg>
            <span className="text-xs mt-1">Dashboard</span>
          </div>
          <div 
            className={cn(
              "flex flex-col items-center justify-center cursor-pointer",
              location === "/expenses" ? "text-primary" : "text-slate-500"
            )}
            onClick={() => window.location.href = "/expenses"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-dollar-sign">
              <line x1="12" y1="2" x2="12" y2="22"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
            <span className="text-xs mt-1">Expenses</span>
          </div>
          <div className="flex flex-col items-center justify-center">
            <button 
              onClick={handleNewExpense}
              className="bg-primary text-white p-3 rounded-full shadow-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus">
                <path d="M5 12h14"></path>
                <path d="M12 5v14"></path>
              </svg>
            </button>
          </div>
          <div 
            className={cn(
              "flex flex-col items-center justify-center cursor-pointer",
              location === "/reports" ? "text-primary" : "text-slate-500"
            )}
            onClick={() => window.location.href = "/reports"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <line x1="10" y1="9" x2="8" y2="9"></line>
            </svg>
            <span className="text-xs mt-1">Reports</span>
          </div>
          <div 
            className={cn(
              "flex flex-col items-center justify-center cursor-pointer",
              location === "/backup" ? "text-primary" : "text-slate-500"
            )}
            onClick={() => window.location.href = "/backup"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-database">
              <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
            </svg>
            <span className="text-xs mt-1">Backup</span>
          </div>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>New Expense Entry</DialogTitle>
          </DialogHeader>
          <ExpenseForm onSuccess={() => setIsOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MobileNav;
