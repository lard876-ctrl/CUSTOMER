import React, { useState, useEffect } from "react";
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  useParams, 
  useNavigate 
} from "react-router-dom";
import { 
  format, 
  isBefore, 
  isAfter, 
  addDays, 
  startOfDay, 
  parseISO,
  differenceInDays
} from "date-fns";
import { 
  QrCode, 
  ShoppingBag, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  ArrowLeft,
  Loader2,
  Camera,
  X,
  Eye
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "./lib/utils";
import { Html5Qrcode } from "html5-qrcode";
import { QRCodeSVG } from "qrcode.react";

// --- Types ---
interface BillItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
  expiryDate: string;
}

interface BillData {
  id: string;
  customer: string;
  date: string;
  items: BillItem[];
}

// --- Components ---

const ExpiryBadge = ({ date }: { date: string }) => {
  const expiryDate = startOfDay(parseISO(date));
  const today = startOfDay(new Date());
  const threeDaysFromNow = addDays(today, 3);

  let status: "safe" | "near" | "expired" = "safe";
  let label = "Safe";
  let colorClass = "bg-emerald-100 text-emerald-700 border-emerald-200";
  let Icon = CheckCircle2;

  if (isBefore(expiryDate, today)) {
    status = "expired";
    label = "Expired";
    colorClass = "bg-rose-100 text-rose-700 border-rose-200";
    Icon = AlertCircle;
  } else if (isBefore(expiryDate, threeDaysFromNow) || expiryDate.getTime() === threeDaysFromNow.getTime()) {
    status = "near";
    const daysLeft = differenceInDays(expiryDate, today);
    label = daysLeft === 0 ? "Expires Today" : `Expires in ${daysLeft}d`;
    colorClass = "bg-amber-100 text-amber-700 border-amber-200";
    Icon = Clock;
  }

  return (
    <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border", colorClass)}>
      <Icon size={14} />
      {label}
    </div>
  );
};

const BillView = () => {
  const { billId } = useParams();
  const navigate = useNavigate();
  const [bill, setBill] = useState<BillData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBill = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/bills/${billId}`);
        if (!response.ok) {
          throw new Error(response.status === 404 ? "Bill not found" : "Failed to fetch bill");
        }
        const data = await response.json();
        setBill(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (billId) fetchBill();
  }, [billId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Fetching your bill details...</p>
      </div>
    );
  }

  if (error || !bill) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Oops!</h2>
        <p className="text-slate-600 mb-6">{error || "We couldn't find that bill."}</p>
        <button 
          onClick={() => navigate("/")}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  const total = bill.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-4 py-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button onClick={() => navigate("/")} className="p-2 -ml-2 text-slate-500 hover:text-slate-900">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-slate-900">Bill Details</h1>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6"
        >
          <div className="p-6 border-b border-slate-100 bg-indigo-50/30">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">Customer</p>
                <h2 className="text-xl font-bold text-slate-900">{bill.customer}</h2>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Bill ID</p>
                <p className="text-sm font-mono font-medium text-slate-700">#{bill.id}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Calendar size={14} />
              <span>{format(parseISO(bill.date), "MMMM dd, yyyy")}</span>
            </div>
          </div>

          <div className="p-0">
            {bill.items.map((item, index) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-slate-900">{item.name}</h3>
                    <p className="text-sm text-slate-500">
                      Qty: {item.quantity} × ${item.price.toFixed(2)}
                    </p>
                  </div>
                  <p className="font-bold text-slate-900">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Calendar size={12} />
                    <span>Exp: {format(parseISO(item.expiryDate), "MMM dd, yyyy")}</span>
                  </div>
                  <ExpiryBadge date={item.expiryDate} />
                </div>
              </motion.div>
            ))}
          </div>

          <div className="p-6 bg-slate-50/50">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-medium">Total Amount</span>
              <span className="text-2xl font-black text-indigo-600">${total.toFixed(2)}</span>
            </div>
          </div>
        </motion.div>

        <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <ShoppingBag size={24} />
            </div>
            <div>
              <h4 className="font-bold">Thank you for shopping!</h4>
              <p className="text-indigo-100 text-sm">Please check expiry dates before use.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const Home = () => {
  const [billId, setBillId] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [showQRFor, setShowQRFor] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (billId.trim()) {
      navigate(`/bill/${billId.trim()}`);
    }
  };

  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;
    let isMounted = true;

    if (isScanning) {
      const initScanner = async () => {
        const element = document.getElementById("qr-reader");
        if (!element) {
          if (isMounted) setTimeout(initScanner, 100);
          return;
        }

        try {
          html5QrCode = new Html5Qrcode("qr-reader");
          await html5QrCode.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
            },
            (decodedText) => {
              const billIdMatch = decodedText.match(/\/bill\/([^/]+)/);
              const extractedId = billIdMatch ? billIdMatch[1] : decodedText;
              
              if (extractedId && isMounted) {
                html5QrCode?.stop().then(() => {
                  setIsScanning(false);
                  navigate(`/bill/${extractedId}`);
                }).catch(console.error);
              }
            },
            () => {} // Ignore frame errors
          );
        } catch (err) {
          console.error("Scanner start error:", err);
          if (isMounted) setScanError("Could not start camera. Please check permissions.");
        }
      };

      initScanner();

      return () => {
        isMounted = false;
        if (html5QrCode && html5QrCode.isScanning) {
          html5QrCode.stop().catch(console.error);
        }
      };
    }
  }, [isScanning, navigate]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md text-center"
      >
        <div className="w-20 h-20 bg-indigo-600 text-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-indigo-100 rotate-3">
          <QrCode size={40} />
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Bill Scanner</h1>
        <p className="text-slate-500 mb-10 text-lg">Scan a QR code or enter your Bill ID manually to view details.</p>

        <AnimatePresence mode="wait">
          {isScanning ? (
            <motion.div 
              key="scanner"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 overflow-hidden rounded-2xl border-2 border-indigo-600 bg-black relative aspect-square"
            >
              <div id="qr-reader" className="w-full h-full overflow-hidden" />
              
              {/* Pronounced Overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                <div className="w-full h-full border-[40px] border-black/40">
                  <div className="w-full h-full relative border-2 border-white/30 rounded-lg">
                    {/* Corner Indicators */}
                    <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-indigo-500 -mt-1 -ml-1 rounded-tl-sm" />
                    <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-indigo-500 -mt-1 -mr-1 rounded-tr-sm" />
                    <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-indigo-500 -mb-1 -ml-1 rounded-bl-sm" />
                    <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-indigo-500 -mb-1 -mr-1 rounded-br-sm" />
                    
                    {/* Scanning Animation Line */}
                    <motion.div 
                      animate={{ top: ["10%", "90%", "10%"] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute left-0 right-0 h-1 bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,1)]"
                    />
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setIsScanning(false)}
                className="absolute top-4 right-4 z-20 p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-md transition-colors"
              >
                <X size={20} />
              </button>

              {scanError && (
                <div className="absolute inset-0 z-30 bg-rose-600/90 flex flex-col items-center justify-center p-6 text-white text-center">
                  <AlertCircle size={32} className="mb-2" />
                  <p className="font-medium">{scanError}</p>
                  <button 
                    onClick={() => { setScanError(null); setIsScanning(false); }}
                    className="mt-4 px-4 py-2 bg-white text-rose-600 rounded-lg text-sm font-bold"
                  >
                    Close
                  </button>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <button 
                onClick={() => setIsScanning(true)}
                className="w-full py-6 bg-indigo-50 border-2 border-dashed border-indigo-200 text-indigo-600 rounded-2xl font-bold text-lg flex flex-col items-center justify-center gap-2 hover:bg-indigo-100 hover:border-indigo-300 transition-all group"
              >
                <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Camera size={24} />
                </div>
                Open Camera Scanner
              </button>

              <div className="relative flex items-center py-4">
                <div className="flex-grow border-t border-slate-100"></div>
                <span className="flex-shrink mx-4 text-slate-400 text-xs font-bold uppercase tracking-widest">or enter manually</span>
                <div className="flex-grow border-t border-slate-100"></div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Enter Bill ID (e.g., bill-123)" 
                    value={billId}
                    onChange={(e) => setBillId(e.target.value)}
                    className="w-full px-6 py-4 bg-slate-100 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none transition-all text-lg font-medium"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98] transition-all"
                >
                  View Bill
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-12 pt-12 border-t border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Try these samples</p>
          <div className="flex flex-wrap justify-center gap-3">
            {["bill-123", "bill-456"].map((id) => (
              <div key={id} className="flex flex-col items-center gap-2">
                <button 
                  onClick={() => navigate(`/bill/${id}`)}
                  className="px-4 py-2 bg-slate-50 text-slate-600 rounded-full text-sm font-semibold hover:bg-indigo-50 hover:text-indigo-600 transition-colors border border-slate-200"
                >
                  {id}
                </button>
                <button 
                  onClick={() => setShowQRFor(showQRFor === id ? null : id)}
                  className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider flex items-center gap-1 hover:text-indigo-700 transition-colors"
                >
                  <Eye size={10} />
                  {showQRFor === id ? "Hide QR" : "Show QR"}
                </button>
                <AnimatePresence>
                  {showQRFor === id && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.8, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8, y: -10 }}
                      className="p-3 bg-white border border-slate-200 rounded-xl shadow-lg mt-2"
                    >
                      <QRCodeSVG 
                        value={`${window.location.origin}/bill/${id}`} 
                        size={120}
                        level="H"
                        includeMargin={true}
                      />
                      <p className="text-[10px] text-slate-400 mt-2">Scan this with your phone</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/bill/:billId" element={<BillView />} />
      </Routes>
    </Router>
  );
}
