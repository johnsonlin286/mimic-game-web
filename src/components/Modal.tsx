"use client";

import { useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom'
import { CircleX } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  dismissible?: boolean;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, dismissible = true, children }: ModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  const handleClose = useCallback(() => {
    backdropRef.current?.classList.remove('in');
    contentRef.current?.classList.remove('in');
    backdropRef.current?.classList.add('out');
    contentRef.current?.classList.add('out');
    backdropRef.current?.addEventListener('animationend', () => {
      setIsVisible(false);
      onClose();
    });
  }, [onClose]);

  const backdropClickHandler = () => {
    if (!dismissible) return;
    handleClose();
  }
  
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      handleClose();
    }
  }, [isOpen, handleClose]);

  if (!isVisible) return null;

  return createPortal(
    <>
      <div ref={backdropRef} className="modal-backdrop in fixed inset-0 bg-black/50 z-40" onClick={backdropClickHandler} />
      <div ref={contentRef} className="modal-content in absolute w-full max-w-md bg-white rounded-lg p-4 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40">
        {dismissible && <button onClick={handleClose} className="absolute top-2 right-2 cursor-pointer">
          <CircleX className="w-5 h-5" />
        </button>}
        {children}
      </div>
    </>,
    document.body as HTMLElement
  )
}