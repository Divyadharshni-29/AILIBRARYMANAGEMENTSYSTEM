import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { X, Download, Printer, QrCode, BookOpen, MapPin, Check } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function QRCodeModal({ book, isOpen, onClose }) {
  const { success, error } = useToast();
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const printRef = useRef(null);

  useEffect(() => {
    if (!book || !isOpen) return;

    // QR Payload contains only the unique non-sensitive Book ID and metadata
    const qrPayload = JSON.stringify({
      type: 'LIB_BOOK',
      book_id: book.id,
      isbn: book.isbn,
      qr_code: book.qr_code || `LIB-BOOK-${book.id.toString().padStart(4, '0')}`,
    });

    // Generate high resolution QR Data URL
    QRCode.toDataURL(
      qrPayload,
      {
        width: 400,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      },
      (err, url) => {
        if (err) {
          error('Failed to generate QR Code.');
        } else {
          setQrDataUrl(url);
        }
      }
    );
  }, [book, isOpen]);

  if (!isOpen || !book) return null;

  const qrCodeText = book.qr_code || `LIB-BOOK-${book.id.toString().padStart(4, '0')}`;
  const shelfLocation = book.shelf_location || 'Rack A-01';

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `QR_${book.title.replace(/[^a-zA-Z0-9]/g, '_')}_${qrCodeText}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('QR Code downloaded successfully!');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(qrCodeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    success('Book QR code copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md glass-panel border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl relative text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-900/60 hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="inline-flex p-3 rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20 mb-3">
          <QrCode className="w-6 h-6" />
        </div>
        <h3 className="font-display font-bold text-xl text-white">Book QR Code & Identifier</h3>
        <p className="text-xs text-slate-400 mt-1">
          Scan to quickly identify, inspect shelf location, and issue or return this book.
        </p>

        {/* Printable Library Label Sticker Container */}
        <div
          ref={printRef}
          id="printable-qr-sticker"
          className="mt-6 p-5 rounded-2xl bg-white text-slate-900 shadow-xl border border-slate-200 flex flex-col items-center select-none"
        >
          <div className="w-full flex items-center justify-between pb-2 border-b border-slate-200 text-[11px] font-bold text-slate-700">
            <span className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-brand-600" />
              <span>CAMPUS LIBRARY</span>
            </span>
            <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-800 font-mono text-[10px]">
              {qrCodeText}
            </span>
          </div>

          {/* QR Image */}
          <div className="my-3 p-2 bg-white rounded-xl border border-slate-200">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt={`QR Code for ${book.title}`} className="w-44 h-44 object-contain" />
            ) : (
              <div className="w-44 h-44 flex items-center justify-center text-xs text-slate-400">
                Generating QR...
              </div>
            )}
          </div>

          {/* Book Details on Sticker */}
          <div className="w-full text-center space-y-1">
            <h4 className="font-bold text-sm text-slate-950 truncate max-w-xs mx-auto" title={book.title}>
              {book.title}
            </h4>
            <p className="text-xs text-slate-600 truncate">by {book.author?.name || 'Unknown Author'}</p>
            <div className="flex items-center justify-center gap-2 pt-1 text-[11px] font-mono text-slate-700">
              <span>ISBN: {book.isbn}</span>
            </div>
            <div className="inline-flex items-center gap-1 px-2.5 py-1 mt-1 rounded-md bg-amber-50 text-amber-900 border border-amber-200 text-[11px] font-semibold">
              <MapPin className="w-3 h-3 text-amber-600" />
              <span>Shelf: {shelfLocation}</span>
            </div>
          </div>
        </div>

        {/* Identifier Badge & Quick Copy */}
        <div className="mt-4 flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
          <div className="text-left pl-1">
            <span className="text-[10px] text-slate-400 block">QR Identifier Code</span>
            <span className="font-mono font-bold text-white text-xs">{qrCodeText}</span>
          </div>
          <button
            onClick={handleCopyCode}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium flex items-center gap-1 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : null}
            <span>{copied ? 'Copied' : 'Copy Code'}</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mt-5">
          <button
            onClick={handleDownload}
            className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4 text-brand-400" />
            <span>Download PNG</span>
          </button>

          <button
            onClick={handlePrint}
            className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print Sticker Label</span>
          </button>
        </div>
      </div>
    </div>
  );
}
