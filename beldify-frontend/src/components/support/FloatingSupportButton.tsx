'use client';

import { useState } from 'react';
import { 
  ChatBubbleLeftRightIcon, 
  XMarkIcon, 
  PhoneIcon, 
  EnvelopeIcon 
} from '@heroicons/react/24/outline';

export default function FloatingSupportButton() {
  const [isOpen, setIsOpen] = useState(false);

  const supportOptions = [
    {
      icon: ChatBubbleLeftRightIcon,
      label: 'Live Chat',
      action: () => alert('Live chat will be implemented soon!')
    },
    {
      icon: PhoneIcon,
      label: 'Call Us',
      action: () => window.open('tel:+212XXXXXXXX')
    },
    {
      icon: EnvelopeIcon,
      label: 'Email',
      action: () => window.open('mailto:support@beldify.com')
    }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Support Options */}
      {isOpen && (
        <div className="mb-4">
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
            <div className="bg-indigo-600 px-4 py-2">
              <h3 className="text-white font-medium text-sm">Need Help?</h3>
            </div>
            <div className="p-2">
              {supportOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={option.action}
                  className="w-full flex items-center space-x-2 p-2 rounded hover:bg-gray-50 transition-colors"
                >
                  <option.icon className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center ${
          isOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'
        }`}
      >
        {isOpen ? (
          <XMarkIcon className="w-6 h-6 text-white" />
        ) : (
          <ChatBubbleLeftRightIcon className="w-6 h-6 text-white" />
        )}
      </button>
    </div>
  );
} 