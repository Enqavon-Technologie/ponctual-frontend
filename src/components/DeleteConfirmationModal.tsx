import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, AlertTriangle, XCircle } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  isDeleting?: boolean;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Deletion",
  message = "Are you sure you want to delete this item? This action cannot be undone.",
  confirmText = "Delete",
  cancelText = "Cancel",
  isDeleting = false
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden border border-slate-100"
          >
            {/* Header / Icon */}
            <div className="p-8 pt-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-red-100/50">
                <div className="relative">
                  <Trash2 size={40} strokeWidth={1.5} />
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="absolute -top-1 -right-1"
                  >
                    <AlertTriangle size={20} className="fill-red-500 text-white" />
                  </motion.div>
                </div>
              </div>

              <h2 className="text-2xl font-black text-slate-900 mb-3">{title}</h2>
              <p className="text-slate-500 font-medium leading-relaxed px-4">
                {message}
              </p>
            </div>

            {/* Footer / Actions */}
            <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={onClose}
                disabled={isDeleting}
                className="w-full sm:flex-1 py-4 text-sm font-bold text-slate-500 hover:text-slate-900 hover:bg-white rounded-2xl transition-all active:scale-95 disabled:opacity-50"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                disabled={isDeleting}
                className="w-full sm:flex-1 py-4 bg-red-600 text-white text-sm font-black rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-200 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={18} />
                    {confirmText}
                  </>
                )}
              </button>
            </div>

            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
            >
              <XCircle size={20} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
