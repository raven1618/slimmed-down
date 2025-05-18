
import React from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import ContactsTable from '@/components/contacts/ContactsTable';
import { sampleContacts } from '@/data/sampleData';

const Contacts = () => {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl font-bold text-gray-800">Contacts</h1>
            </div>
            
            <div className="animate-fade-in">
              <ContactsTable contacts={sampleContacts} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Contacts;
