
import React from 'react';
import { Bell, Search, User } from 'lucide-react';
import { Input } from "@/components/ui/input";

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 p-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center w-1/3">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              type="text" 
              placeholder="Search..." 
              className="pl-10 w-full bg-gray-50"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="p-2 rounded-full hover:bg-gray-100 relative">
            <Bell className="h-5 w-5 text-gray-500" />
            <span className="absolute top-1 right-1 bg-red-500 rounded-full h-2 w-2"></span>
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-crm-blue text-white rounded-full flex items-center justify-center">
              <User className="h-5 w-5" />
            </div>
            <span className="font-medium text-sm hidden md:inline-block">Admin User</span>
          </div>
        </div>
      </div>
    </header>
  );
}
