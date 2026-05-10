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

  const backdropClickHandler = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
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
      <div ref={backdropRef} className="modal-backdrop in fixed inset-0 bg-black/50 z-40" />
      <div className='modal-container fixed inset-0 flex items-center justify-center m-4 z-40' onClick={(e) => backdropClickHandler(e)}>
        <div ref={contentRef} className="modal-content in w-full max-w-md bg-light-navy border-4 border-black rounded-2xl p-4 z-40">
          {dismissible && <button onClick={handleClose} className="absolute top-2 right-2 cursor-pointer">
            <CircleX className="w-5 h-5" />
          </button>}
          {children}
        </div>
      </div>
    </>,
    document.body as HTMLElement
  )
}