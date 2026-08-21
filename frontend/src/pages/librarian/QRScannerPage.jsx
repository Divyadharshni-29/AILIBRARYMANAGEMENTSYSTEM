import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  Camera,
  CameraOff,
  QrCode,
  Search,
  Upload,
  BookOpen,
  UserCheck,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Clock,
  MapPin,
  Barcode,
  Layers,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Smartphone,
  HelpCircle,
  Check,
  BookMarked,
  Info
} from 'lucide-react';
import { Link } from 'react-router-dom';
import QRCodeModal from '../../components/QRCodeModal';
import BackButton from '../../components/BackButton';
import ActionMotivationBanner from '../../components/ActionMotivationBanner';
import BorrowSuccessModal from '../../components/BorrowSuccessModal';
import ReturnSuccessModal from '../../components/ReturnSuccessModal';

export default function QRScannerPage() {
  const { user } = useAuth();
  const { success, error, info } = useToast();
  const isLibrarian = user?.role === 'librarian' || user?.role === 'admin';

  // Scanner state
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (back) or 'user' (front)
  const [cameraError, setCameraError] = useState(null);
  const [showPermissionGuide, setShowPermissionGuide] = useState(false);
  const scannerRef = useRef(null);

  // Manual input state
  const [manualCode, setManualCode] = useState('');
  const [loadingLookup, setLoadingLookup] = useState(false);

  // Lookup result state
  const [scanResult, setScanResult] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);

  // Success celebration state
  const [borrowSuccessInfo, setBorrowSuccessInfo] = useState(null);
  const [returnSuccessInfo, setReturnSuccessInfo] = useState(null);

  // Circulation action state
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  // Load students for librarian circulation desk
  const loadStudents = async () => {
    if (!isLibrarian) return;
    try {
      const res = await api.get('/admin/users?role_filter=student');
      setStudents(res.data || []);
      if (res.data.length > 0 && !selectedStudentId) {
        setSelectedStudentId(res.data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch students list', err);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  // Fetch available camera devices on mount
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prefer back camera (environment/rear) for scanning physical books
          const backCam = devices.find(
            (d) =>
              d.label.toLowerCase().includes('back') ||
              d.label.toLowerCase().includes('environment') ||
              d.label.toLowerCase().includes('rear')
          );
          if (backCam) {
            setSelectedCameraId(backCam.id);
            setFacingMode('environment');
          } else {
            setSelectedCameraId(devices[0].id);
          }
        }
      })
      .catch((err) => {
        console.warn('Camera enumeration note:', err);
      });

    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async (overrideCameraId = null, overrideFacingMode = null) => {
    setCameraError(null);
    setShowPermissionGuide(false);
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode('qr-reader-viewfinder');
      }

      const activeCameraId = overrideCameraId || selectedCameraId;
      const activeFacingMode = overrideFacingMode || facingMode;

      const config = {
        fps: 15,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      // Try deviceId first if selected, otherwise fallback to facingMode: 'environment'
      const cameraConstraint = activeCameraId
        ? { deviceId: { exact: activeCameraId } }
        : { facingMode: activeFacingMode };

      await scannerRef.current.start(
        cameraConstraint,
        config,
        (decodedText) => {
          handleCodeDetected(decodedText);
          stopScanner();
        },
        () => {
          // Frame scanner loop
        }
      );

      setIsScanning(true);
      info('Camera active. Point at any book QR code or barcode.');
    } catch (err) {
      console.error('Failed to start camera scanner:', err);
      setCameraError(
        'Camera permission was denied or camera is unavailable on this device.'
      );
      setShowPermissionGuide(true);
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        setIsScanning(false);
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
  };

  // Flip Camera between Back (Environment) and Front (User)
  const handleFlipCamera = async () => {
    if (cameras.length > 1) {
      const currentIndex = cameras.findIndex((c) => c.id === selectedCameraId);
      const nextIndex = (currentIndex + 1) % cameras.length;
      const nextCamera = cameras[nextIndex];
      setSelectedCameraId(nextCamera.id);

      const isBack =
        nextCamera.label.toLowerCase().includes('back') ||
        nextCamera.label.toLowerCase().includes('environment') ||
        nextCamera.label.toLowerCase().includes('rear');
      setFacingMode(isBack ? 'environment' : 'user');
      info(`Switched to: ${nextCamera.label || `Camera ${nextIndex + 1}`}`);

      if (isScanning) {
        await stopScanner();
        setTimeout(() => {
          startScanner(nextCamera.id);
        }, 150);
      }
    } else {
      const nextMode = facingMode === 'environment' ? 'user' : 'environment';
      setFacingMode(nextMode);
      info(`Switched to ${nextMode === 'environment' ? '📷 Rear Camera' : '📱 Front Camera'}`);

      if (isScanning) {
        await stopScanner();
        setTimeout(() => {
          startScanner(null, nextMode);
        }, 150);
      }
    }
  };

  // Lookup scanned or typed code in library catalog
  const lookupBookCode = async (rawCode) => {
    if (!rawCode || !rawCode.trim()) {
      error('Please provide a QR code, ISBN, or Book ID.');
      return;
    }

    setLoadingLookup(true);
    try {
      const res = await api.post('/books/scan-qr', { raw_code: rawCode.trim() });
      if (res.data.success && res.data.book) {
        setScanResult(res.data);
        success(`Identified: "${res.data.book.title}"`);
      } else {
        setScanResult(res.data);
        if (res.data.external_data) {
          info(res.data.message);
        } else {
          error(res.data.message || 'Book not found in library catalog.');
        }
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to lookup book details.';
      error(msg);
      setScanResult(null);
    } finally {
      setLoadingLookup(false);
    }
  };

  const handleCodeDetected = (decodedText) => {
    lookupBookCode(decodedText);
  };

  const handleManualSearch = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      lookupBookCode(manualCode);
    }
  };

  // Upload image file containing QR / Barcode
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const html5QrCode = new Html5Qrcode('qr-reader-temp');
      const decodedResult = await html5QrCode.scanFile(file, true);
      handleCodeDetected(decodedResult);
      html5QrCode.clear();
    } catch (err) {
      error('Could not decode QR code from the uploaded image. Please ensure the image is clear.');
    }
  };

  // Action: Borrow / Issue Book via QR
  const handleIssueBook = async () => {
    if (!scanResult?.book) return;
    setProcessingAction(true);
    try {
      const targetUserId = isLibrarian ? parseInt(selectedStudentId) : user.id;
      const res = await api.post('/loans/issue-by-qr', {
        book_id: scanResult.book.id,
        user_id: targetUserId,
      });

      success(`Successfully borrowed "${scanResult.book.title}"! Due in 14 days.`);
      setBorrowSuccessInfo({ book: scanResult.book, loanData: res.data });
      // Refresh scanned book data
      lookupBookCode(scanResult.book.qr_code || scanResult.book.isbn);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to process loan.';
      error(msg);
    } finally {
      setProcessingAction(false);
    }
  };

  // Action: Return Book via QR
  const handleReturnBook = async (transactionId = null) => {
    if (!scanResult?.book) return;
    setProcessingAction(true);
    try {
      const res = await api.post('/loans/return-by-qr', {
        book_id: scanResult.book.id,
        transaction_id: transactionId,
      });

      if (res.data.fine_amount > 0) {
        info(`Book returned! Overdue fine of ₹${res.data.fine_amount} recorded.`);
      } else {
        success(`"${scanResult.book.title}" successfully returned!`);
      }

      setReturnSuccessInfo({ book: scanResult.book, fineAmount: res.data.fine_amount || 0 });
      // Refresh scanned book data
      lookupBookCode(scanResult.book.qr_code || scanResult.book.isbn);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to return book.';
      error(msg);
    } finally {
      setProcessingAction(false);
    }
  };

  const handleResetScan = () => {
    setScanResult(null);
    setManualCode('');
    startScanner();
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.email.toLowerCase().includes(studentSearch.toLowerCase()) ||
      (s.department && s.department.toLowerCase().includes(studentSearch.toLowerCase()))
  );

  const scannedBook = scanResult?.book;
  const isAvailable = scannedBook && scannedBook.available_copies > 0;
  const activeBorrowers = scanResult?.active_borrowers || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Motivating Scan Banner */}
      <ActionMotivationBanner action="scan" />

      {/* Header with Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton label="Back" fallback={isLibrarian ? '/librarian/dashboard' : '/student/dashboard'} />
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-gradient-to-tr from-brand-500/20 to-ai-500/20 text-brand-400 border border-brand-500/30">
                <QrCode className="w-4 h-4" />
              </span>
              <h1 className="font-display font-black text-xl sm:text-2xl text-white">
                Book QR & Barcode Scanner
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Scan any physical book's QR code on library shelves to view details, verify availability, and borrow instantly.
            </p>
          </div>
        </div>

        {scannedBook && (
          <button
            onClick={() => setShowQRModal(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-all flex items-center gap-2 self-start sm:self-auto shadow-sm"
          >
            <Barcode className="w-4 h-4 text-brand-400" />
            <span>View / Print QR Label</span>
          </button>
        )}
      </div>

      {/* Main Grid: Scanner on Left, Scanned Result on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Left Column: Live Camera Scanner */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-brand-400" />
                <h3 className="font-bold text-sm text-white">Camera Viewfinder</h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleFlipCamera}
                  title="Switch between Rear and Front camera"
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-brand-500/40 text-brand-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Flip</span>
                </button>

                {cameras.length > 1 && (
                  <select
                    value={selectedCameraId || ''}
                    onChange={(e) => {
                      setSelectedCameraId(e.target.value);
                      if (isScanning) {
                        stopScanner().then(() => startScanner(e.target.value));
                      }
                    }}
                    className="px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-slate-300 focus:outline-none"
                  >
                    {cameras.map((c, i) => (
                      <option key={c.id} value={c.id}>
                        {c.label || `Camera ${i + 1}`}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Viewfinder Window */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 aspect-square flex items-center justify-center shadow-inner">
              <div id="qr-reader-viewfinder" className="w-full h-full" />
              <div id="qr-reader-temp" className="hidden" />

              {/* High-Tech Animated Viewfinder Overlay when Scanning */}
              {isScanning && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-5">
                  <div className="px-3 py-1 bg-slate-950/80 backdrop-blur-md rounded-full border border-brand-500/40 text-[11px] font-bold text-brand-300 flex items-center gap-1.5 shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>Point at Book QR Code</span>
                  </div>

                  {/* Laser Target Area */}
                  <div className="relative w-52 h-52 rounded-2xl border border-brand-500/20 flex items-center justify-center overflow-hidden">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-brand-400 rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-brand-400 rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-brand-400 rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-brand-400 rounded-br-lg" />

                    {/* Animated Laser Scan Bar */}
                    <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#38bdf8] animate-bounce" />
                  </div>

                  <div className="px-3 py-1 bg-slate-950/80 backdrop-blur-md rounded-full border border-slate-800 text-[10px] text-slate-400 font-medium">
                    {facingMode === 'environment' ? '📷 Rear Camera Active' : '📱 Front Camera'}
                  </div>
                </div>
              )}

              {!isScanning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950/95 backdrop-blur-xs">
                  <div className="p-4 rounded-3xl bg-brand-500/10 text-brand-400 border border-brand-500/20 mb-3 animate-pulse">
                    <QrCode className="w-10 h-10" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-200">Mobile Scanner Ready</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                    Uses rear phone camera for highest scanning precision on library shelves.
                  </p>
                  <div className="flex items-center gap-2 mt-4 flex-wrap justify-center">
                    <button
                      onClick={() => startScanner()}
                      className="px-5 py-2.5 bg-gradient-to-r from-brand-500 to-ai-600 hover:from-brand-400 hover:to-ai-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-brand-500/25 flex items-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Start Camera Scanner</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleFlipCamera}
                      className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-4 h-4 text-brand-400" />
                      <span>Flip</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Active Scanning Controls */}
            {isScanning && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleFlipCamera}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-brand-500/40 text-brand-300 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  <RotateCcw className="w-4 h-4 text-brand-400" />
                  <span>🔄 Flip Camera</span>
                </button>
                <button
                  onClick={stopScanner}
                  className="flex-1 py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <CameraOff className="w-4 h-4" />
                  <span>Stop Scanner</span>
                </button>
              </div>
            )}

            {/* Camera Permission Guide Alert (Android / iPhone) */}
            {cameraError && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-rose-200">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>Camera Access Denied or Unavailable</span>
                </div>
                <p className="text-[11px] leading-relaxed text-rose-300/90">
                  {cameraError}
                </p>

                <div className="pt-2 border-t border-rose-500/20 text-[11px] space-y-1 text-slate-300">
                  <p className="font-semibold text-rose-200">How to Enable Camera Permissions:</p>
                  <p>• <strong>Android (Chrome)</strong>: Tap the 🔒 icon in the address bar $\rightarrow$ Permissions $\rightarrow$ Camera: <strong>Allow</strong> $\rightarrow$ Reload.</p>
                  <p>• <strong>iPhone (Safari)</strong>: Tap <strong>aA</strong> in address bar $\rightarrow$ <strong>Website Settings</strong> $\rightarrow$ Camera: <strong>Allow</strong> $\rightarrow$ Reload.</p>
                </div>
              </div>
            )}

            {/* Upload QR Image Option */}
            <div className="pt-3 border-t border-slate-800/80">
              <label className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer transition-colors">
                <Upload className="w-4 h-4 text-brand-400" />
                <span>Upload QR Image / Photo from Device</span>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          </div>

          {/* Manual Search Fallback */}
          <div className="glass-panel border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-3">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-sm text-white">Manual ISBN / Book ID Lookup</h3>
            </div>
            <p className="text-xs text-slate-400">
              Type or paste an ISBN, Book ID (e.g. 1), or QR code string (e.g. LIB-BOOK-0001).
            </p>

            <form onSubmit={handleManualSearch} className="space-y-3">
              <input
                type="text"
                placeholder="Enter ISBN, QR Code, or Book ID..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />

              <button
                type="submit"
                disabled={loadingLookup}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {loadingLookup ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-brand-400" />
                ) : (
                  <Search className="w-4 h-4 text-brand-400" />
                )}
                <span>Search in Catalog</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Scanned Book Details & Actions */}
        <div className="lg:col-span-7 space-y-6">
          {loadingLookup ? (
            <div className="glass-panel border border-slate-800 rounded-3xl p-16 text-center text-slate-400 space-y-3 shadow-2xl">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-brand-400" />
              <p className="text-sm font-semibold text-white">Looking up book in campus catalog...</p>
              <p className="text-xs text-slate-500">Checking inventory, shelf coordinates, and borrow records</p>
            </div>
          ) : scannedBook ? (
            <div className="glass-panel border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in duration-300">
              {/* Badges Bar */}
              <div className="flex items-center justify-between gap-3 flex-wrap border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/30 flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{scannedBook.category?.name}</span>
                  </span>

                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 font-mono">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{scannedBook.floor || '1st Floor'} • {scannedBook.shelf || 'Shelf A'}</span>
                  </span>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                      isAvailable
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {isAvailable ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    <span>{isAvailable ? `${scannedBook.available_copies} / ${scannedBook.total_copies} Available` : 'All Copies Borrowed'}</span>
                  </span>
                </div>

                <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                  ID: #{scannedBook.id}
                </span>
              </div>

              {/* Book Metadata & Cover */}
              <div className="flex flex-col sm:flex-row items-start gap-5">
                <img
                  src={scannedBook.cover_image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80'}
                  alt={scannedBook.title}
                  className="w-24 h-36 object-cover rounded-xl shadow-md border border-slate-700/80 shrink-0"
                />

                <div className="space-y-2 flex-1">
                  <h2 className="font-display font-bold text-xl sm:text-2xl text-white leading-tight">
                    {scannedBook.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300">
                    by <span className="font-semibold text-brand-400">{scannedBook.author?.name}</span>
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 text-xs">
                    <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">ISBN</span>
                      <span className="font-mono font-semibold text-slate-200">{scannedBook.isbn}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Inventory</span>
                      <span className="font-semibold text-slate-200">
                        {scannedBook.available_copies} / {scannedBook.total_copies} Copies
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 col-span-2 sm:col-span-1">
                      <span className="text-[10px] text-slate-400 block">Location Coordinates</span>
                      <span className="font-semibold text-emerald-400">
                        {scannedBook.shelf || 'Shelf A'}, {scannedBook.rack || 'Rack A-01'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Section */}
              <div className="space-y-4 pt-4 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-brand-400" />
                    <span>Circulation Actions</span>
                  </h3>

                  <button
                    onClick={handleResetScan}
                    className="text-[11px] text-brand-400 hover:text-brand-300 font-bold flex items-center gap-1 hover:underline"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Scan Another Book</span>
                  </button>
                </div>

                {isLibrarian ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Librarian Issue Book Card */}
                    <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white">Issue to Student</span>
                        <span className="text-[10px] text-slate-400">14 Days Loan</span>
                      </div>

                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Filter student by name or email..."
                          value={studentSearch}
                          onChange={(e) => setStudentSearch(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                        />

                        <select
                          value={selectedStudentId}
                          onChange={(e) => setSelectedStudentId(e.target.value)}
                          className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                        >
                          {filteredStudents.length > 0 ? (
                            filteredStudents.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name} ({s.email}) - {s.department || 'Student'}
                              </option>
                            ))
                          ) : (
                            <option value="">No matching student</option>
                          )}
                        </select>
                      </div>

                      <button
                        onClick={handleIssueBook}
                        disabled={!isAvailable || processingAction || !selectedStudentId}
                        className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                          isAvailable && selectedStudentId
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                        }`}
                      >
                        {processingAction ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        <span>Confirm & Issue Book</span>
                      </button>
                    </div>

                    {/* Librarian Return Book Card */}
                    <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-xs text-white">Check In / Return Book</span>
                          <span className="text-[10px] text-slate-400">Inventory Check-In</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Scan the returned book and click Return to restore available copy count.
                        </p>
                      </div>

                      <button
                        onClick={() => handleReturnBook()}
                        disabled={processingAction || activeBorrowers.length === 0}
                        className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                          activeBorrowers.length > 0
                            ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 shadow-lg shadow-amber-500/20'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                        }`}
                      >
                        {processingAction ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <RotateCcw className="w-4 h-4" />
                        )}
                        <span>
                          {activeBorrowers.length > 0
                            ? `Return Book (${activeBorrowers.length} Active Loan${activeBorrowers.length > 1 ? 's' : ''})`
                            : 'No Active Loans for this Book'}
                        </span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Student View Actions */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Borrow Button */}
                    <button
                      onClick={handleIssueBook}
                      disabled={!isAvailable || processingAction}
                      className={`p-4 rounded-2xl font-bold text-xs transition-all flex items-center justify-between ${
                        isAvailable
                          ? 'bg-gradient-to-r from-brand-500 to-ai-600 hover:from-brand-400 text-white shadow-xl shadow-brand-500/25'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      }`}
                    >
                      <div className="text-left">
                        <p className="text-xs font-bold">{isAvailable ? 'Borrow Book' : 'Currently Unavailable'}</p>
                        <p className="text-[10px] text-slate-300/80 font-normal">14-day checkout period</p>
                      </div>
                      <BookOpen className="w-5 h-5 shrink-0" />
                    </button>

                    {/* View Details Link */}
                    <Link
                      to={`/student/books/${scannedBook.id}`}
                      className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 hover:text-white font-bold text-xs transition-all flex items-center justify-between group"
                    >
                      <div className="text-left">
                        <p className="text-xs font-bold">View Full Details</p>
                        <p className="text-[10px] text-slate-400 font-normal">AI description, reviews & map</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-brand-400 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-panel border border-slate-800 rounded-3xl p-12 text-center text-slate-400 space-y-4 shadow-2xl">
              <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 text-slate-500 mx-auto flex items-center justify-center">
                <QrCode className="w-8 h-8" />
              </div>
              <h3 className="font-display font-bold text-base text-white">No Book Scanned Yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Aim your device's camera at any library book's QR code sticker or enter its ISBN manually to load complete catalog details and borrow options.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* QR Code Printable Modal */}
      {scannedBook && (
        <QRCodeModal book={scannedBook} isOpen={showQRModal} onClose={() => setShowQRModal(false)} />
      )}

      {/* Borrow Success Modal */}
      {borrowSuccessInfo && (
        <BorrowSuccessModal
          book={borrowSuccessInfo.book}
          isOpen={!!borrowSuccessInfo}
          onClose={() => setBorrowSuccessInfo(null)}
        />
      )}

      {/* Return Success Modal */}
      {returnSuccessInfo && (
        <ReturnSuccessModal
          book={returnSuccessInfo.book}
          fineAmount={returnSuccessInfo.fineAmount}
          isOpen={!!returnSuccessInfo}
          onClose={() => setReturnSuccessInfo(null)}
        />
      )}
    </div>
  );
}
