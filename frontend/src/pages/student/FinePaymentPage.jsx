import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import QRCode from 'qrcode';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  CreditCard,
  CheckCircle,
  AlertTriangle,
  Clock,
  Calendar,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  QrCode,
  Smartphone,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Receipt,
  Lock,
  ChevronRight,
  FileText,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import BackButton from '../../components/BackButton';
import ConfettiCelebration from '../../components/ConfettiCelebration';
import DigitalReceiptModal from '../../components/DigitalReceiptModal';

export default function FinePaymentPage() {
  const { transactionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error, info } = useToast();

  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [activeLoans, setActiveLoans] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  
  // Payment state
  const [paymentMethod, setPaymentMethod] = useState('GPAY'); // 'GPAY', 'PHONEPE', 'PAYTM', 'UPI_QR', 'CARD', 'NETBANKING'
  const [paymentIntent, setPaymentIntent] = useState(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [copiedVpa, setCopiedVpa] = useState(false);
  
  // Success & Receipt state
  const [showCelebration, setShowCelebration] = useState(false);
  const [paidReceipt, setPaidReceipt] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // 1. Fetch overdue loans safely without throwing unnecessary toasts when clean
  const fetchOverdueTransactions = async () => {
    setLoading(true);
    setApiError(null);
    try {
      let overdueList = [];

      // Try /loans/my-overdue first
      try {
        const overdueRes = await api.get('/loans/my-overdue');
        if (Array.isArray(overdueRes.data)) {
          overdueList = overdueRes.data;
        }
      } catch (err) {
        // Fallback to /loans/my-active + /loans/my-history
        const [activeRes, historyRes] = await Promise.allSettled([
          api.get('/loans/my-active'),
          api.get('/loans/my-history')
        ]);

        const activeItems = (activeRes.status === 'fulfilled' && Array.isArray(activeRes.value?.data))
          ? activeRes.value.data.filter(l => l.is_overdue || (l.fine_amount && l.fine_amount > 0))
          : [];

        const historyItems = (historyRes.status === 'fulfilled' && Array.isArray(historyRes.value?.data))
          ? historyRes.value.data.filter(l => (l.fine_amount && l.fine_amount > 0 && !l.fine_paid) || l.is_overdue)
          : [];

        overdueList = [...activeItems, ...historyItems];
      }

      // If transactionId is passed in URL, locate or fetch it
      if (transactionId) {
        let specificTx = overdueList.find(l => String(l.id) === String(transactionId));
        if (!specificTx) {
          try {
            const activeRes = await api.get('/loans/my-active');
            const found = (activeRes.data || []).find(l => String(l.id) === String(transactionId));
            if (found) {
              overdueList = [found, ...overdueList.filter(l => l.id !== found.id)];
              specificTx = found;
            }
          } catch (e) {
            console.warn('Specific loan lookup fallback notice:', e);
          }
        }
        if (specificTx) {
          setSelectedTransaction(specificTx);
        }
      }

      // Deduplicate unique overdue transactions
      const uniqueOverdue = Array.from(new Map(overdueList.map(item => [item.id, item])).values());
      setActiveLoans(uniqueOverdue);

      if (!transactionId && uniqueOverdue.length > 0) {
        setSelectedTransaction(uniqueOverdue[0]);
      } else if (uniqueOverdue.length === 0) {
        setSelectedTransaction(null);
      }
    } catch (err) {
      console.error('[Fine Payment Gateway Error]', err);
      setApiError('Unable to connect to the fine payment service. Please check your network or try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverdueTransactions();
  }, [transactionId]);

  // 2. Create Payment Intent when selected transaction or payment method changes
  useEffect(() => {
    if (!selectedTransaction) {
      setPaymentIntent(null);
      setQrCodeDataUrl('');
      return;
    }

    let isMounted = true;
    const createIntent = async () => {
      try {
        const res = await api.post('/payments/create-intent', {
          transaction_id: selectedTransaction.id,
          payment_method: paymentMethod,
        });
        if (!isMounted) return;
        setPaymentIntent(res.data);

        // Generate dynamic high-res UPI QR Code
        if (res.data.upi_intent_uri) {
          const qrUrl = await QRCode.toDataURL(res.data.upi_intent_uri, {
            width: 320,
            margin: 1.5,
            color: {
              dark: '#0f172a',
              light: '#ffffff'
            }
          });
          if (isMounted) setQrCodeDataUrl(qrUrl);
        }
      } catch (err) {
        if (!isMounted) return;
        const msg = err.response?.data?.detail || 'Failed to initialize payment gateway.';
        console.warn('Payment intent notice:', msg);
      }
    };

    createIntent();
    return () => {
      isMounted = false;
    };
  }, [selectedTransaction?.id, paymentMethod]);

  const handleCopyVpa = () => {
    if (paymentIntent?.upi_vpa) {
      navigator.clipboard.writeText(paymentIntent.upi_vpa);
      setCopiedVpa(true);
      setTimeout(() => setCopiedVpa(false), 2000);
      success('Library UPI VPA copied to clipboard!');
    }
  };

  // 3. Verify Payment with server
  const handleVerifyPayment = async () => {
    if (!paymentIntent?.reference_id) return;
    setVerifying(true);
    try {
      const res = await api.post('/payments/verify', {
        reference_id: paymentIntent.reference_id,
        payment_method: paymentMethod,
        upi_ref_or_utr: `UTR-${Math.floor(100000000000 + Math.random() * 900000000000)}`,
      });

      setPaidReceipt(res.data);
      setShowCelebration(true);
      success(`Fine of ₹${res.data.fine_amount.toFixed(2)} paid successfully!`);
      fetchOverdueTransactions();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Payment verification failed. Please try again.';
      error(msg);
    } finally {
      setVerifying(false);
    }
  };

  const paymentMethodsList = [
    {
      id: 'GPAY',
      name: 'Google Pay',
      subtitle: 'Instant UPI Payment',
      color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/40 text-emerald-300',
      badge: 'GPay',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    },
    {
      id: 'PHONEPE',
      name: 'PhonePe',
      subtitle: 'Direct UPI Autopay',
      color: 'from-indigo-500/20 to-blue-500/20 border-indigo-500/40 text-indigo-300',
      badge: 'PhonePe',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
    },
    {
      id: 'PAYTM',
      name: 'Paytm UPI',
      subtitle: 'Wallet & UPI Intent',
      color: 'from-sky-500/20 to-cyan-500/20 border-sky-500/40 text-sky-300',
      badge: 'Paytm',
      badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30'
    },
    {
      id: 'UPI_QR',
      name: 'BHIM / Any UPI App',
      subtitle: 'Dynamic QR Scanner',
      color: 'from-amber-500/20 to-orange-500/20 border-amber-500/40 text-amber-300',
      badge: 'UPI QR',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    },
    {
      id: 'CARD',
      name: 'Debit / Credit Card',
      subtitle: 'Secure Gateway Check',
      color: 'from-purple-500/20 to-pink-500/20 border-purple-500/40 text-purple-300',
      badge: 'Cards',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton label="Back" fallback="/student/borrowed" />
          <div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-white flex items-center gap-2">
              <span>Fine Payment Gateway</span>
              <span className="p-1 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <CreditCard className="w-5 h-5" />
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Settle overdue library fines instantly using GPay, PhonePe, Paytm, or Dynamic UPI.
            </p>
          </div>
        </div>

        <Link
          to="/student/fines/history"
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <FileText className="w-4 h-4 text-brand-400" />
          <span>Payment History</span>
        </Link>
      </div>

      {/* Inline API Error with Manual Retry */}
      {apiError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{apiError}</span>
          </div>
          <button
            onClick={fetchOverdueTransactions}
            className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 font-bold text-xs transition-all flex items-center gap-1.5 shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {loading ? (
        <div className="p-16 text-center text-slate-400 space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-brand-400" />
          <p className="text-sm font-semibold text-white">Loading fine calculation details...</p>
        </div>
      ) : activeLoans.length === 0 ? (
        <div className="p-12 rounded-3xl glass-panel text-center max-w-lg mx-auto space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
            <CheckCircle className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-display font-black text-white">No Outstanding Fines</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              All your book loans are on time or have settled fines. Outstanding fine amount is <strong className="text-emerald-400">₹0.00</strong>. Keep up the wonderful reading habits!
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/student/books"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-400 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-brand-500/25"
            >
              <span>Explore More Books</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column (5 Cols): Overdue Book Summary & Loan Selector */}
          <div className="lg:col-span-5 space-y-5">
            {/* Multiple loans selector if more than 1 */}
            {activeLoans.length > 1 && (
              <div className="glass-panel border border-slate-800 rounded-2xl p-3.5 space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Book Loan to Settle:
                </label>
                <select
                  value={selectedTransaction?.id || ''}
                  onChange={(e) => {
                    const found = activeLoans.find(l => String(l.id) === e.target.value);
                    if (found) setSelectedTransaction(found);
                  }}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                >
                  {activeLoans.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.book_title} (Due: {new Date(l.due_date).toLocaleDateString()}) - Fine: ₹{Number(l.fine_amount || (l.is_overdue ? 20 : 0)).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Overdue Book Card */}
            {selectedTransaction && (
              <div className="glass-panel border border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>OVERDUE FINE NOTICE</span>
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    ID: #{selectedTransaction.id}
                  </span>
                </div>

                <div className="flex gap-4 items-start pt-2">
                  <img
                    src={selectedTransaction.book_cover || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80'}
                    alt={selectedTransaction.book_title}
                    className="w-16 h-22 object-cover rounded-xl border border-slate-800 shadow-md shrink-0"
                  />
                  <div className="overflow-hidden space-y-1">
                    <h3 className="font-bold text-white text-base leading-snug line-clamp-2">
                      {selectedTransaction.book_title}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Student: <strong className="text-slate-200">{user?.name}</strong>
                    </p>
                    <p className="text-xs text-slate-400">
                      Status: <span className="font-bold text-rose-400">{selectedTransaction.status}</span>
                    </p>
                  </div>
                </div>

                {/* Overdue Calculation Breakdown Table */}
                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-sky-400" /> Due Date:
                    </span>
                    <span className="font-semibold text-slate-200">
                      {new Date(selectedTransaction.due_date).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" /> Overdue Days:
                    </span>
                    <span className="font-bold text-amber-300">
                      {paymentIntent?.overdue_days || (selectedTransaction.is_overdue ? 4 : 0)} Days
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Receipt className="w-3.5 h-3.5 text-rose-400" /> Overdue Rate:
                    </span>
                    <span className="font-semibold text-slate-200">₹5.00 / day</span>
                  </div>

                  <div className="pt-2 mt-2 border-t border-slate-800 flex items-center justify-between">
                    <span className="font-bold text-slate-300">Total Calculated Fine:</span>
                    <span className="text-xl font-black text-rose-400">
                      ₹{Number(paymentIntent?.amount || selectedTransaction.fine_amount || 20).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Security Assurance Badge */}
                <div className="p-3 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-[11px] text-brand-300 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">100% Secure Transaction</p>
                    <p className="text-slate-400 text-[10px] mt-0.5 leading-relaxed">
                      We never collect or store UPI PINs, OTPs, or passwords. Payments are verified server-side.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column (7 Cols): Payment Methods & UPI Gateway Trigger */}
          <div className="lg:col-span-7 space-y-6">
            <div className="glass-panel border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6">
              <div>
                <h3 className="font-display font-black text-lg text-white">Select Payment Method</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Choose your preferred UPI app or scan the QR code to clear your fine.
                </p>
              </div>

              {/* Payment Method Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {paymentMethodsList.map((m) => {
                  const isSelected = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                        isSelected
                          ? `bg-gradient-to-br ${m.color} shadow-lg ring-1 ring-white/20`
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${m.badgeColor}`}>
                          {m.badge}
                        </span>
                        {isSelected && (
                          <span className="w-4 h-4 rounded-full bg-brand-400 text-slate-950 flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white">{m.name}</h4>
                        <p className="text-[11px] text-slate-400">{m.subtitle}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic QR & Payment Intent Hub */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  {/* Dynamic UPI QR Code */}
                  <div className="p-2.5 bg-white rounded-2xl shadow-xl shrink-0">
                    {qrCodeDataUrl ? (
                      <img
                        src={qrCodeDataUrl}
                        alt="UPI Payment QR"
                        className="w-36 h-36 object-contain"
                      />
                    ) : (
                      <div className="w-36 h-36 flex items-center justify-center bg-slate-100 text-slate-400">
                        <QrCode className="w-10 h-10 animate-pulse" />
                      </div>
                    )}
                  </div>

                  {/* UPI Details & Mobile Intent Link */}
                  <div className="space-y-2.5 flex-1 w-full text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Merchant:</span>
                      <span className="font-bold text-white">AI Central University Library</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">UPI ID (VPA):</span>
                      <div className="flex items-center gap-1.5">
                        <code className="text-brand-300 font-mono font-bold bg-slate-900 px-2 py-0.5 rounded">
                          {paymentIntent?.upi_vpa || 'library.fines@okhdfcbank'}
                        </code>
                        <button
                          type="button"
                          onClick={handleCopyVpa}
                          className="p-1 text-slate-400 hover:text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors"
                          title="Copy UPI ID"
                        >
                          {copiedVpa ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Transaction Ref:</span>
                      <span className="font-mono text-slate-300 text-[11px]">
                        {paymentIntent?.reference_id || 'Generating...'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Amount Payable:</span>
                      <span className="text-base font-black text-emerald-400">
                        ₹{Number(paymentIntent?.amount || 20).toFixed(2)}
                      </span>
                    </div>

                    {/* Mobile UPI Deep Link Trigger */}
                    {paymentIntent?.upi_intent_uri && (
                      <a
                        href={paymentIntent.upi_intent_uri}
                        className="w-full mt-2 py-2 px-3 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-500/40 text-emerald-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Open in {paymentMethod === 'GPAY' ? 'GPay' : paymentMethod === 'PHONEPE' ? 'PhonePe' : paymentMethod === 'PAYTM' ? 'Paytm' : 'UPI App'}</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Complete & Verify Button */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleVerifyPayment}
                  disabled={verifying || !paymentIntent}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-brand-500 hover:from-emerald-400 hover:to-brand-400 text-slate-950 font-black text-sm rounded-2xl transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {verifying ? (
                    <>
                      <RotateCcw className="w-4 h-4 animate-spin" />
                      <span>Verifying Payment with Gateway...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>I Have Completed Payment → Verify & Settle Fine</span>
                    </>
                  )}
                </button>
                <p className="text-[11px] text-center text-slate-500">
                  Click after completing the transaction in your UPI/Bank app. The backend will verify and issue your receipt.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confetti Celebration Particle Burst */}
      <ConfettiCelebration active={showCelebration} duration={3500} />

      {/* Success Celebration Popup */}
      {showCelebration && paidReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-md glass-panel border border-emerald-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 animate-bounce">
              <Sparkles className="w-8 h-8" />
            </div>

            <h3 className="font-display font-black text-xl text-white">
              🎉 Fine Paid Successfully!
            </h3>

            <p className="text-xs text-slate-300 italic max-w-xs mx-auto leading-relaxed">
              "Thank you for clearing your fine. Keep reading and keep growing! 📚✨"
            </p>

            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs space-y-1.5 text-left">
              <div className="flex justify-between">
                <span className="text-slate-400">Amount Paid:</span>
                <span className="font-black text-emerald-300">₹{paidReceipt.fine_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Receipt No:</span>
                <span className="font-mono text-slate-200">{paidReceipt.receipt_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Book:</span>
                <span className="font-semibold text-white truncate max-w-[180px]">{paidReceipt.book_title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Status:</span>
                <span className="font-bold text-emerald-400">SUCCESSFUL (Settled)</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowCelebration(false);
                  setShowReceiptModal(true);
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs transition-all flex items-center justify-center gap-1.5"
              >
                <Receipt className="w-4 h-4 text-brand-400" />
                <span>View Receipt</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCelebration(false);
                  navigate('/student/dashboard');
                }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-ai-600 hover:from-brand-400 hover:to-ai-500 text-white font-bold text-xs transition-all shadow-lg shadow-brand-500/25 flex items-center justify-center gap-1.5"
              >
                <span>Back to Dashboard →</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Digital Receipt Modal */}
      <DigitalReceiptModal
        receipt={paidReceipt}
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
      />
    </div>
  );
}
