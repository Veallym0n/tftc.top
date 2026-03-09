
import React from 'react';
import { createPortal } from 'react-dom';
import { IconClose } from '../../components/Icons';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  headerActions?: React.ReactNode;
  className?: string;
  overlayClassName?: string;
  contentClassName?: string;
  headerClassName?: string;
  titleClassName?: string;
  closeButtonClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
}

export const defaultModalClasses = {
  className: "fixed inset-0 z-[2000] flex items-center justify-center p-4",
  overlayClassName: "absolute inset-0 bg-memphis-dark/30 backdrop-blur-sm transition-opacity",
  contentClassName: "relative bg-white w-full max-w-sm rounded-3xl border-2 border-memphis-dark shadow-memphis-lg scale-100 animate-fade-in overflow-hidden",
  headerClassName: "flex justify-between items-center px-6 py-4 border-b-2 border-memphis-dark bg-cream",
  titleClassName: "font-black text-slate-800 text-lg tracking-tight mr-auto",
  closeButtonClassName: "p-1 rounded-lg border-2 border-transparent hover:border-memphis-dark hover:bg-white transition-all text-slate-500 hover:text-slate-900",
  bodyClassName: "p-6",
  footerClassName: "px-6 py-4 bg-cream border-t-2 border-memphis-dark flex justify-end gap-3"
};

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer, 
  headerActions,
  className = "",
  overlayClassName = "",
  contentClassName = "",
  headerClassName = "",
  titleClassName = "",
  closeButtonClassName = "",
  bodyClassName = "",
  footerClassName = ""
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div className={className}>
      {/* Backdrop */}
      <div 
        className={overlayClassName}
        onClick={onClose}
      />
      
      {/* Content */}
      <div className={contentClassName}>
        <div className={headerClassName}>
          <h3 className={titleClassName}>{title}</h3>
          
          <div className="flex items-center gap-2">
            {headerActions}
            {headerActions && <div className="w-px h-5 bg-slate-300 mx-1"></div>}
            <button onClick={onClose} className={closeButtonClassName}>
                <IconClose />
            </button>
          </div>
        </div>
        
        <div className={bodyClassName}>
          {children}
        </div>

        {footer && (
          <div className={footerClassName}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
