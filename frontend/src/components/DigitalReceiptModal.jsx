import React, { useRef } from 'react';
import {
  CheckCircle2,
  Download,
  Printer,
  X,
  Building2,
  Calendar,
  CreditCard,
  Hash,
  BookOpen,
  User,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

export default function DigitalReceiptModal({ receipt, isOpen, onClose }) {
  const receiptRef = useRef(null);

  if (!isOpen || !receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = receipt.paid_at 
    ? new Date(receipt.paid_at).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      })
    : new Date().toLocaleString();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl glass-panel border border-brand-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors print:hidden"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Printable Receipt Paper Container */}
        <div ref={receiptRef} className="space-y-6">
          {/* Header Banner */}
          <div className="text-center pb-5 border-b border-slate-800 relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-500/20 to-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-2 shadow-lg shadow-emerald-500/10">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-black text-white uppercase tracking-wider">
              {receipt.library_name || "AI Central University Library"}
            </h2>
            <p className="text-xs text-slate-400 font-medium">Digital Library Fine Settlement Voucher</p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 rounded-full text-emerald-300 text-xs font-bold mt-2.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>OFFICIAL PAID RECEIPT</span>
            </div>
          </div>

          {/* Receipt Numbers Grid */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800 text-xs">
            <div>
              <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Receipt Number</span>
              <p className="font-mono font-bold text-slate-200 mt-0.5 text-xs truncate">{receipt.receipt_number}</p>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Transaction Ref</span>
              <p className="font-mono font-bold text-brand-300 mt-0.5 text-xs truncate">{receipt.reference_id}</p>
            </div>
          </div>

          {/* Student & Book Details */}
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-sky-400" /> Student Member:
              </span>
              <span className="font-bold text-white text-right">
                {receipt.student_name}
                {receipt.student_department && (
                  <span className="text-slate-400 font-normal ml-1">({receipt.student_department})</span>
                )}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-brand-400" /> Book Title:
              </span>
              <span className="font-bold text-white text-right max-w-[220px] truncate">
                {receipt.book_title}
              </span>
            </div>

            {receipt.book_isbn && receipt.book_isbn !== 'N/A' && (
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-slate-400" /> Book ISBN:
                </span>
                <span className="font-mono text-slate-300">{receipt.book_isbn}</span>
              </div>
            )}

            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" /> Overdue Period:
              </span>
              <span className="font-semibold text-amber-300">
                {receipt.overdue_days || 0} day{receipt.overdue_days === 1 ? '' : 's'} overdue
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-purple-400" /> Payment Mode:
              </span>
              <span className="font-bold text-purple-300 uppercase">
                {receipt.payment_method || 'UPI'}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Date & Time:
              </span>
              <span className="text-slate-300 font-medium">{formattedDate}</span>
            </div>
          </div>

          {/* Total Amount Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-brand-950/40 border border-emerald-500/30 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Total Fine Paid</span>
              <p className="text-xs text-slate-400">Status: <strong className="text-emerald-300">SETTLED & CLEARED</strong></p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-white">₹{Number(receipt.fine_amount || 0).toFixed(2)}</span>
            </div>
          </div>

          {/* Official Verification Seal Footer */}
          <div className="pt-2 text-center text-[11px] text-slate-500 space-y-1">
            <p>🔒 Digitally signed and recorded in Campus Library Ledger.</p>
            <p className="italic">"Keep reading and keep growing! 📚✨"</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 pt-6 mt-6 border-t border-slate-800 print:hidden">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white font-bold text-xs transition-all flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4 text-brand-400" />
            <span>Print / Download Receipt</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-ai-600 hover:from-brand-400 hover:to-ai-500 text-white font-bold text-xs transition-all shadow-lg shadow-brand-500/25 flex items-center justify-center gap-1.5"
          >
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  );
}
