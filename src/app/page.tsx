'use client';
import React, { useState, useEffect } from 'react';
import { Database, BrainCircuit, FileSearch, AlertTriangle, PlayCircle, LayoutDashboard, TableProperties, CalendarDays, ShieldCheck, CheckCircle2, ArrowRight, Calculator, TrendingUp, TrendingDown, Sparkles, ChevronRight, X, Banknote, XCircle, Send } from 'lucide-react';

const ITEM_GROUPS = ['Raw Dairy', 'Sweeteners', 'Flavorings', 'Cultures & Enzymes', 'Packaging', 'Sanitation'];

const UOM_MAP: Record<string, string> = {
    'Organic Raw Milk': 'Liters',
    'Standard Cow Milk': 'Liters',
    'Heavy Cream': 'Liters',
    'Goat Milk': 'Liters',
    'Refined Sugar': 'kg',
    'Liquid Honey': 'Liters',
    'Corn Syrup': 'Liters',
    'Whole Strawberries': 'kg',
    'Vanilla Bean Pods': 'kg',
    'Cocoa Powder': 'kg',
    'Mango Puree': 'Liters',
    'Blueberry Extract': 'Liters',
    'Yogurt Bacteria Blend': 'kg',
    'Cheese Rennet': 'Liters',
    '1L Plastic Bottles': 'Pieces',
    '500ml Glass Jars': 'Pieces',
    'Cardboard Cartons': 'Pieces',
    'Bottle Caps': 'Pieces',
    'Bleach Sanitizer': 'Liters',
    'Floor Cleaner': 'Liters'
};

const UNIT_PRICES: Record<string, number> = {
  'Organic Raw Milk': 1.45, 'Standard Cow Milk': 0.95, 'Heavy Cream': 4.20, 'Goat Milk': 2.80,
  'Refined Sugar': 0.75, 'Liquid Honey': 14.50, 'Corn Syrup': 1.10,
  'Whole Strawberries': 5.50, 'Vanilla Bean Pods': 185.00, 'Cocoa Powder': 12.00, 'Mango Puree': 8.50, 'Blueberry Extract': 45.00,
  'Yogurt Bacteria Blend': 150.00, 'Cheese Rennet': 85.00,
  '1L Plastic Bottles': 0.12, '500ml Glass Jars': 0.45, 'Cardboard Cartons': 0.35, 'Bottle Caps': 0.02,
  'Bleach Sanitizer': 2.10, 'Floor Cleaner': 1.85
};

const PENDING_ORDERS = [
    {
        id: 'PR-2026-8942',
        staffName: 'Alex Mercer',
        department: 'Dairy Operations',
        vendor: 'National Dairy Farms',
        date: '2026-04-18',
        remarks: 'Urgent stock requested for upcoming double-shift production cycle next week. Pls approve immediately.',
        lines: [
            { id: 1, itemNo: 'P001', category: 'Raw Dairy', name: 'Organic Raw Milk', qty: 800, uom: 'Liters' },
            { id: 2, itemNo: 'P023', category: 'Flavorings', name: 'Whole Strawberries', qty: 400, uom: 'kg' }
        ]
    },
    {
        id: 'PR-2026-8943',
        staffName: 'Sarah Connor',
        department: 'Produce Quality',
        vendor: 'Sunrise Organics',
        date: '2026-04-17',
        remarks: 'Standard monthly packaging restock. No rush.',
        lines: [
            { id: 1, itemNo: 'P045', category: 'Packaging', name: '1L Plastic Bottles', qty: 2500, uom: 'Pieces' },
            { id: 2, itemNo: 'P046', category: 'Packaging', name: 'Bottle Caps', qty: 2500, uom: 'Pieces' }
        ]
    },
    {
        id: 'PR-2026-8944',
        staffName: 'John Smith',
        department: 'Sanitation Dept',
        vendor: 'Industrial CleanCo',
        date: '2026-04-18',
        remarks: 'Sanitation chemicals running low after deep clean protocol initiated earlier this week.',
        lines: [
            { id: 1, itemNo: 'S112', category: 'Sanitation', name: 'Bleach Sanitizer', qty: 1000, uom: 'Liters' },
            { id: 2, itemNo: 'S114', category: 'Sanitation', name: 'Floor Cleaner', qty: 25, uom: 'Liters' }
        ]
    }
];

export default function ProcurementCopilot() {
  const [activeTab, setActiveTab] = useState<'entry' | 'database' | 'forecast' | 'behavior'>('entry');
  
  // UI Filters
  const [monthsFilter, setMonthsFilter] = useState<number>(3);
  const [stockGroupFilter, setStockGroupFilter] = useState<string>('All Groups');
  const [salesGroupFilter, setSalesGroupFilter] = useState<string>('All Groups');
  const [highlightedStockItem, setHighlightedStockItem] = useState<string>('');
  const [highlightedSalesItem, setHighlightedSalesItem] = useState<string>('');
  const [highlightedTargetValue, setHighlightedTargetValue] = useState<string>('');
  const [forecastGroupFilter, setForecastGroupFilter] = useState<string>('All Groups');
  const [behaviorFilter, setBehaviorFilter] = useState<string>('All Departments');
  const [costGroupFilter, setCostGroupFilter] = useState<string>('All Groups');
  const [costData, setCostData] = useState<string>('');
  const [explainerData, setExplainerData] = useState<{name:string, d:number, s:number, h:number, eoq:number} | null>(null);
  const [isApproved, setIsApproved] = useState(false);
  const [decisionMode, setDecisionMode] = useState<'approve' | 'reject'>('approve');
  const [rejectReason, setRejectReason] = useState<string>('Quantity Mismatch');
  const [feedbackPrompt, setFeedbackPrompt] = useState<string | null>(null);
  const [showQueueList, setShowQueueList] = useState(false);

  // Active Draft PR Select
  const [activePOId, setActivePOId] = useState(PENDING_ORDERS[0].id);
  const activePO = PENDING_ORDERS.find(po => po.id === activePOId) || PENDING_ORDERS[0];

  const [salesData, setSalesData] = useState<string>('');
  const [stockData, setStockData] = useState<string>('');



  useEffect(() => {
    fetch('/data/past_sales.csv')
      .then(r => r.text())
      .then(text => setSalesData(text))
      .catch(() => setSalesData(''));

    fetch('/data/current_stock.csv')
      .then(r => r.text())
      .then(text => setStockData(text))
      .catch(() => setStockData(''));

    fetch('/data/inventory_costs.csv')
      .then(r => r.text())
      .then(text => setCostData(text))
      .catch(() => setCostData(''));
  }, []);



  const parseCSV = (csvText: string) => {
    if (!csvText) return { headers: [], rows: [] };
    const lines = csvText.split('\n').filter(Boolean);
    if(lines.length === 0) return { headers: [], rows: [] };
    const headers = lines[0].split(',');
    const rows = lines.slice(1).map(l => l.split(','));
    return { headers, rows };
  };

  const parsedSales = parseCSV(salesData);
  const parsedStock = parseCSV(stockData);
  
  // Dynamic Dates
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  
  const pastDate = new Date();
  pastDate.setMonth(today.getMonth() - monthsFilter);
  const pastDateStr = pastDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // Data Filtering Engine
  const validStockRows = parsedStock.rows.filter(r => r.length > 1);
  const filteredStockRows = stockGroupFilter === 'All Groups' 
        ? validStockRows 
        : validStockRows.filter(r => r[0].toLowerCase().trim() === stockGroupFilter.toLowerCase().trim());

  const validSalesRows = parsedSales.rows.filter(r => {
      if (r.length <= 1) return false;
      const rowDate = new Date(r[2]);
      return rowDate >= pastDate;
  });
  
  const filteredSalesRows = salesGroupFilter === 'All Groups'
        ? validSalesRows
        : validSalesRows.filter(r => r[0].toLowerCase().trim() === salesGroupFilter.toLowerCase().trim());

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col z-10 shadow-2xl shrink-0">
        <div className="p-8 border-b border-slate-800">
           <div className="flex items-center gap-4">
               <div className="bg-blue-600 p-2.5 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                   <BrainCircuit className="w-8 h-8 text-white" />
               </div>
               <div>
                   <h1 className="font-extrabold text-white leading-tight text-xl tracking-tight">Future Intel<br/>AI</h1>
               </div>
           </div>
        </div>
        
        <nav className="p-6 flex-1 space-y-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-2 mb-2">Manager Menu</p>
            
            <button 
                onClick={() => setActiveTab('entry')} 
                className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl font-bold transition-all duration-200 ${
                    activeTab === 'entry' 
                    ? 'bg-blue-600/10 text-blue-400 border border-blue-500/30 shadow-sm shadow-blue-900/20' 
                    : 'border border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
            >
                <LayoutDashboard className="w-5 h-5" /> 
                Pending Requisitions
            </button>


            
            <button 
                onClick={() => setActiveTab('forecast')} 
                className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl font-bold transition-all duration-200 ${
                    activeTab === 'forecast' 
                    ? 'bg-amber-600/10 text-amber-400 border border-amber-500/30 shadow-sm shadow-amber-900/20' 
                    : 'border border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
            >
                <TrendingUp className="w-5 h-5" /> 
                Future Forecast
            </button>

            <button 
                onClick={() => setActiveTab('behavior')} 
                className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl font-bold transition-all duration-200 ${
                    activeTab === 'behavior' 
                    ? 'bg-fuchsia-600/10 text-fuchsia-400 border border-fuchsia-500/30 shadow-sm shadow-fuchsia-900/20' 
                    : 'border border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
            >
                <BrainCircuit className="w-5 h-5" /> 
                Behavior Analysis
            </button>

            <button 
                onClick={() => setActiveTab('profit')} 
                className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl font-bold transition-all duration-200 ${
                    activeTab === 'profit' 
                    ? 'bg-rose-600/10 text-rose-400 border border-rose-500/30 shadow-sm shadow-rose-900/20' 
                    : 'border border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
            >
                <Banknote className="w-5 h-5" /> 
                Profit Analysis
            </button>

            <button 
                onClick={() => setActiveTab('database')} 
                className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl font-bold transition-all duration-200 ${
                    activeTab === 'database' 
                    ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-900/20' 
                    : 'border border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
            >
                <TableProperties className="w-5 h-5" /> 
                ERP Data Engine
            </button>
        </nav>

        <div className="p-6 border-t border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-400">
                SC
            </div>
            <div>
                <p className="text-sm font-bold text-white">System Admin</p>
                <p className="text-xs font-bold text-slate-500 uppercase">Enterprise v1.0</p>
            </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto custom-scrollbar bg-[url('/bg-pattern.svg')] bg-opacity-5">
        <div className="p-8 lg:p-12 max-w-7xl mx-auto">
            
            {/* TAB 1: PURCHASE ORDER VIEWER SECTION */}
            {activeTab === 'entry' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
                    <header className="mb-8 p-10 bg-slate-900 border border-slate-800 rounded-[45px] shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] -z-10 group-hover:bg-blue-600/10 transition-all"></div>
                        <h2 className="text-5xl font-black text-white tracking-tighter mb-4 italic">Pending Requisitions Queue</h2>
                        <p className="text-slate-400 font-medium max-w-2xl leading-relaxed text-sm">
                            Review draft procurement documents submitted by staff members. 
                            The AI Copilot has pre-verified the quantities against historical behavior and <strong>Economic Order Quantity (EOQ)</strong> benchmarks.
                        </p>
                    </header>

                    {/* DYNAMIC PIPELINE STATUS BAR */}
                    <div className="mb-12 grid grid-cols-5 gap-0 relative animate-in slide-in-from-top duration-700">
                        {/* Step 1: Queue */}
                        <div className="relative group/step">
                            <div 
                                onClick={() => setShowQueueList(!showQueueList)}
                                className={`bg-slate-900/50 border border-slate-800 p-6 rounded-l-[30px] border-r-0 h-full flex flex-col justify-center cursor-pointer hover:bg-white/5 transition-all active:scale-95 ${showQueueList ? 'border-blue-500/50 bg-blue-500/5' : ''}`}
                            >
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Queue Intake</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xl font-black text-white">{PENDING_ORDERS.length}</span>
                                    <span className="text-[9px] text-slate-400 font-bold uppercase">Pending Docs</span>
                                </div>
                            </div>

                            {/* QUEUE QUICKVIEW LIST */}
                            {showQueueList && (
                                <div className="absolute top-full left-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-[60] p-4 animate-in fade-in slide-in-from-top-2 overflow-hidden">
                                     <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                                     <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Pending IDs</h4>
                                     <div className="space-y-2">
                                         {PENDING_ORDERS.map(po => (
                                             <div 
                                                key={po.id} 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActivePOId(po.id);
                                                    setShowQueueList(false);
                                                }}
                                                className={`text-xs font-bold p-2 rounded-lg cursor-pointer transition-all ${activePOId === po.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                                             >
                                                 {po.id}
                                             </div>
                                         ))}
                                     </div>
                                </div>
                            )}

                            <div className="absolute top-1/2 -translate-y-1/2 -right-4 z-10">
                                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                                    <ChevronRight className="w-4 h-4 text-slate-500" />
                                </div>
                            </div>
                        </div>

                        {/* Step 2: Current Review */}
                        <div className="relative">
                            <div className={`bg-slate-900/50 border border-slate-800 p-6 border-r-0 h-full flex flex-col justify-center transition-all ${activePOId ? 'bg-blue-500/5 border-blue-500/30' : ''}`}>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Current Review</span>
                                <div className="flex items-center gap-2">
                                    <span className={`text-sm font-black transition-colors ${activePOId ? 'text-blue-400' : 'text-slate-600'}`}>{activePOId || 'Select a PR'}</span>
                                </div>
                            </div>
                            <div className="absolute top-1/2 -translate-y-1/2 -right-4 z-10">
                                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center animate-pulse">
                                    <ChevronRight className="w-4 h-4 text-slate-500 text-blue-400" />
                                </div>
                            </div>
                        </div>

                        {/* Step 3: Decision Pending */}
                        <div className="relative">
                            <div className={`bg-slate-900/50 border border-slate-800 p-6 border-r-0 h-full flex flex-col justify-center transition-all ${!isApproved && activePOId ? 'bg-amber-500/5 border-amber-500/20' : ''}`}>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Decision Status</span>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-black uppercase tracking-tighter ${isApproved ? 'text-slate-600' : 'text-amber-400 animate-pulse'}`}>
                                        {isApproved ? 'Decision Made' : 'Awaiting Action...'}
                                    </span>
                                </div>
                            </div>
                            <div className="absolute top-1/2 -translate-y-1/2 -right-4 z-10">
                                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                                    <ChevronRight className="w-4 h-4 text-slate-500" />
                                </div>
                            </div>
                        </div>

                        {/* Step 4: Decision Trace */}
                        <div className="relative">
                            <div className={`bg-slate-900/50 border border-slate-800 p-6 border-r-0 h-full flex flex-col justify-center transition-all ${isApproved ? 'bg-emerald-500/10 border-emerald-500/30' : ''}`}>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Audit Trail</span>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-black uppercase ${isApproved ? 'text-emerald-400' : 'text-slate-600'}`}>
                                        {isApproved ? 'Update Logged' : 'Pending Update'}
                                    </span>
                                </div>
                            </div>
                            <div className="absolute top-1/2 -translate-y-1/2 -right-4 z-10">
                                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                                    <ChevronRight className="w-4 h-4 text-slate-500" />
                                </div>
                            </div>
                        </div>

                        {/* Step 5: Success */}
                        <div className="relative">
                            <div className={`bg-slate-900/50 border border-slate-800 p-6 rounded-r-[30px] h-full flex flex-col justify-center transition-all ${isApproved ? 'bg-emerald-600 border-emerald-400' : ''}`}>
                                <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isApproved ? 'text-white' : 'text-slate-600'}`}>Pipeline End</span>
                                <div className="flex items-center gap-2">
                                    {isApproved ? (
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="w-5 h-5 text-white" />
                                            <span className="text-xs font-black text-white uppercase italic">Successfully Updated</span>
                                        </div>
                                    ) : (
                                        <span className="text-[10px] font-black text-slate-700 uppercase italic">Standby</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* TOP QUEUE SELECTION BANNER */}
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex-1 w-full">
                            <label className="block text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2">Select Draft Request to Review</label>
                            <select 
                                value={activePOId} 
                                onChange={(e) => setActivePOId(e.target.value)}
                                className="w-full max-w-md bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500 font-bold shadow-inner cursor-pointer"
                            >
                                {PENDING_ORDERS.map(po => (
                                    <option key={po.id} value={po.id}>{po.id} — {po.department}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col items-center md:items-end gap-3 w-full md:w-auto">
                           <div className="flex items-center gap-2 text-emerald-400 font-bold bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20">
                               <CheckCircle2 className="w-4 h-4" />
                               <span className="text-xs uppercase tracking-widest">Document Parsed</span>
                           </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 relative shadow-lg">
                        <div className="absolute top-0 left-0 w-1 h-full bg-slate-500"></div>
                        
                        {/* HEADER DETAILS (READ-ONLY) */}
                        <div className="bg-slate-950 p-6 rounded-t-2xl border border-slate-800 border-b-0 shadow-inner">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-800 pb-2">Selected Purchase Request Details</h3>
                            <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">PR Number</label>
                                    <input type="text" value={activePO.id} readOnly
                                        className="w-full bg-transparent border-0 p-0 text-white font-bold focus:ring-0 cursor-default" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Document Date</label>
                                    <input type="text" value={activePO.date} readOnly
                                        className="w-full bg-transparent border-0 p-0 text-white font-bold focus:ring-0 cursor-default" />
                                </div>
                                <div className="col-span-2 lg:col-span-1">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Requesting Employee</label>
                                    <input type="text" value={activePO.staffName} readOnly
                                        className="w-full bg-transparent border-0 p-0 text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.1)] font-bold focus:ring-0 cursor-default" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Operating Division</label>
                                    <input type="text" value={activePO.department} readOnly
                                        className="w-full bg-transparent border-0 p-0 text-white font-bold focus:ring-0 cursor-default" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Vendor Name</label>
                                    <input type="text" value={activePO.vendor} readOnly
                                        className="w-full bg-transparent border-0 p-0 text-white font-bold focus:ring-0 cursor-default" />
                                </div>
                            </div>
                        </div>

                        {/* LINE DETAILS - MODERN DARK TABLE (READ-ONLY) */}
                        <div className="bg-slate-950/40 rounded-b-2xl border border-slate-800 border-t-0 overflow-hidden font-sans pb-6">
                            
                            {/* Modern Pills Tabs */}
                            <div className="flex bg-slate-900/50 border-b border-slate-800 p-3 gap-2">
                                <div className="px-5 py-1.5 bg-slate-800 text-blue-400 rounded-lg text-xs font-bold cursor-default shadow-sm border border-slate-700">Contents</div>
                                <div className="px-5 py-1.5 text-slate-500 rounded-lg text-xs font-bold hover:bg-slate-800/80 hover:text-slate-300 cursor-pointer transition-colors">Logistics</div>
                                <div className="px-5 py-1.5 text-slate-500 rounded-lg text-xs font-bold hover:bg-slate-800/80 hover:text-slate-300 cursor-pointer transition-colors">Accounting</div>
                                <div className="px-5 py-1.5 text-slate-500 rounded-lg text-xs font-bold hover:bg-slate-800/80 hover:text-slate-300 cursor-pointer transition-colors">Attachments</div>
                            </div>

                            <div className="overflow-x-auto w-full p-6">
                                <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950/80">
                                    <table className="w-full text-left text-sm text-slate-300">
                                        <thead className="bg-slate-900/90 text-xs uppercase font-extrabold tracking-wider text-slate-500 border-b border-slate-800">
                                            <tr>
                                                <th className="px-4 py-4 w-12 text-center">#</th>
                                                <th className="px-4 py-4 w-28">Item No.</th>
                                                <th className="px-4 py-4 min-w-[120px]">Item Category</th>
                                                <th className="px-4 py-4 min-w-[180px]">Item Description</th>
                                                <th className="px-4 py-4 w-28 text-right">Quantity</th>
                                                <th className="px-4 py-4 w-32 text-center text-indigo-400 bg-indigo-500/5">EOQ (Optimal)</th>
                                                <th className="px-4 py-4 w-28 text-center">UoM Name</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {activePO.lines.map((li, idx) => {
                                                // INLINE EOQ CALCULATION
                                                let itemEOQ = 0;
                                                
                                                const sLines = salesData.split('\n').filter(l => l.includes(li.name));
                                                // 1. Get TRUE Annual Demand (Sum of all 12 months)
                                                let annualTotalDemand = 0;
                                                sLines.forEach(line => {
                                                    const parts = line.split(',');
                                                    if (parts.length < 3) return;
                                                    annualTotalDemand += parseFloat(parts[2]);
                                                });
                                                const annualD = annualTotalDemand || 1200;

                                                // 2. Get Costs
                                                const cLine = costData.split('\n').find(cl => cl.toLowerCase().includes(li.name.toLowerCase()));
                                                if (cLine && UNIT_PRICES[li.name]) {
                                                    const cParts = cLine.split(',');
                                                    const sVal = parseFloat(cParts[1]);
                                                    const iRate = parseFloat(cParts[2]);
                                                    const holdingH = iRate * UNIT_PRICES[li.name];
                                                    if (holdingH > 0) {
                                                        itemEOQ = Math.sqrt((2 * annualD * sVal) / holdingH);
                                                    }
                                                }

                                                return (
                                                    <tr key={li.id} className="border-b border-slate-800/50 hover:bg-slate-800/40 transition-colors cursor-default group">
                                                        <td className="px-4 py-3 text-center font-bold text-slate-600">{idx + 1}</td>
                                                        <td className="px-4 py-3 font-bold text-slate-500 group-hover:text-blue-400 transition-colors">{li.itemNo}</td>
                                                        <td className="px-4 py-3 text-slate-400">{li.category}</td>
                                                        <td className="px-4 py-3 font-bold text-slate-200">{li.name}</td>
                                                        <td className="px-4 py-3 text-right font-black text-white bg-slate-900/40">{li.qty.toLocaleString()}</td>
                                                        <td 
                                                            className="px-4 py-3 text-center font-black text-indigo-300 bg-indigo-500/5 shadow-[inset_0_0_20px_rgba(99,102,241,0.05)] border-x border-indigo-500/10 cursor-help hover:bg-indigo-500/10 hover:text-white transition-all group/cell"
                                                            onClick={() => {
                                                                if (itemEOQ > 0) {
                                                                    const cLine = costData.split('\n').find(cl => cl.toLowerCase().includes(li.name.toLowerCase()));
                                                                    const cParts = (cLine || '').split(',');
                                                                    const sVal = parseFloat(cParts[1]) || 0;
                                                                    const iRate = parseFloat(cParts[2]) || 0;
                                                                    const holdingH = iRate * (UNIT_PRICES[li.name] || 0);
                                                                    
                                                                    // Get TRUE Annual Demand again for the explainer
                                                                    const sLines = salesData.split('\n').filter(l => l.includes(li.name));
                                                                    let annualTotalDemand = 0;
                                                                    sLines.forEach(line => {
                                                                        const parts = line.split(',');
                                                                        if (parts.length < 3) return;
                                                                        annualTotalDemand += parseFloat(parts[2]);
                                                                    });
                                                                    const annD = annualTotalDemand || 1200;

                                                                    setExplainerData({ name: li.name, d: annD, s: sVal, h: holdingH, eoq: itemEOQ });
                                                                }
                                                            }}
                                                        >
                                                            <div className="flex flex-col items-center">
                                                                <span>{itemEOQ > 0 ? Math.round(itemEOQ).toLocaleString() : '—'}</span>
                                                                <span className="text-[7px] text-indigo-500 font-bold uppercase opacity-0 group-hover/cell:opacity-100 transition-opacity">Click for Logic</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-center text-slate-500 font-bold">{li.uom}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                    
                                    {/* AGENTIC AUTO-DETECTION LOGIC */}
                                    {(() => {
                                        // Simple heuristic to auto-select the reason if not set
                                        let hasOver = false;
                                        let hasUnder = false;
                                        
                                        activePO.lines.forEach(li => {
                                            const sLines = salesData.split('\n').filter(l => l.includes(li.name));
                                            let totalD = 0; sLines.forEach(l => { 
                                                const p = l.split(','); 
                                                if(p[2]) totalD += parseFloat(p[2]); 
                                            });
                                            const cLine = costData.split('\n').find(cl => cl.toLowerCase().includes(li.name.toLowerCase()));
                                            const cParts = (cLine || '').split(',');
                                            const sVal = parseFloat(cParts[1]) || 0;
                                            const iRate = parseFloat(cParts[2]) || 0;
                                            const h = iRate * (UNIT_PRICES[li.name] || 0);
                                            const eoq = h > 0 ? Math.sqrt((2 * (totalD || 1200) * sVal) / h) : 0;
                                            
                                            if (eoq > 0) {
                                                if (li.qty > eoq * 1.1) hasOver = true;
                                                if (li.qty < eoq * 0.9) hasUnder = true;
                                            }
                                        });

                                        if (hasOver && rejectReason !== 'QUANTITY EXCEEDS EOQ RECOMMENDATION') {
                                           setTimeout(() => setRejectReason('QUANTITY EXCEEDS EOQ RECOMMENDATION'), 100);
                                        } else if (hasUnder && !hasOver && rejectReason !== 'QUANTITY BELOW OPTIMAL REPLENISHMENT') {
                                           setTimeout(() => setRejectReason('QUANTITY BELOW OPTIMAL REPLENISHMENT'), 100);
                                        }
                                        return null;
                                    })()}
                                </div>
                            </div>
                            
                            {/* REMARKS SECTION */}
                             <div className="px-6 mb-10 pb-10 border-b border-slate-800">
                                 <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 border-b border-slate-800 pb-1 w-fit">Remarks / Justification</label>
                                 <div className="w-full bg-slate-900/60 border border-slate-800 rounded-xl shadow-inner p-4 text-sm font-medium text-slate-400 italic cursor-not-allowed">
                                     "{activePO.remarks}"
                                 </div>
                             </div>

                             {/* DECISION CONTROL PANEL */}
                             <div className="px-10 pb-12 flex flex-col gap-6">
                                 <div className="grid grid-cols-2 gap-6">
                                     <div className="flex flex-col gap-2">
                                         <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Final Review Status</span>
                                         <select 
                                             value={decisionMode}
                                             onChange={(e) => setDecisionMode(e.target.value as 'approve' | 'reject')}
                                             className={`w-full bg-slate-950 border border-slate-800 p-5 rounded-[24px] font-black outline-none cursor-pointer text-sm transition-all shadow-inner ${decisionMode === 'approve' ? 'text-emerald-400' : 'text-rose-400'}`}
                                         >
                                             <option value="approve">✓ APPROVE & PROCESS</option>
                                             <option value="reject">✗ REJECT & REQUEST CHANGES</option>
                                         </select>
                                     </div>

                                     {decisionMode === 'reject' && (
                                         <div className="flex flex-col gap-2 animate-in slide-in-from-right-4">
                                             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Reason for Resubmission</span>
                                             <select 
                                                 className="w-full bg-slate-900 border border-slate-800 text-rose-500 font-bold p-4 rounded-2xl appearance-none cursor-pointer focus:ring-2 focus:ring-rose-500/50 outline-none uppercase text-sm"
                                                 value={rejectReason}
                                                 onChange={(e) => setRejectReason(e.target.value)}
                                             >
                                                 <option>QUANTITY EXCEEDS EOQ RECOMMENDATION</option>
                                                 <option>QUANTITY BELOW OPTIMAL REPLENISHMENT</option>
                                                 <option>ABNORMAL PRICE VARIATION DETECTED</option>
                                                 <option>QUARTERLY BUDGET LIMIT EXCEEDED</option>
                                                 <option>VENDOR COMPLIANCE UNVERIFIED</option>
                                             </select>
                                         </div>
                                     )}
                                 </div>

                                 <button 
                                     onClick={() => {
                                         setIsApproved(true);
                                         setFeedbackPrompt(`Decision saved! Notification sent to ${activePO.staffName} to ${decisionMode === 'approve' ? 'finalize procurement' : 'review and re-submit'}.`);
                                         setTimeout(() => {
                                             setIsApproved(false);
                                             setFeedbackPrompt(null);
                                         }, 6000);
                                     }}
                                     className={`w-full font-black py-6 rounded-[30px] shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-all group overflow-hidden relative ${decisionMode === 'approve' ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-rose-600 hover:bg-rose-500 text-white'}`}
                                 >
                                     <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-[45deg]"></div>
                                     {decisionMode === 'approve' ? <CheckCircle2 className="w-7 h-7" /> : <XCircle className="w-7 h-7" />}
                                     {isApproved ? 'DECISION LOGGED' : (decisionMode === 'approve' ? 'FINALIZE APPROVAL' : 'SAVE REJECTION')}
                                 </button>

                                 {feedbackPrompt && (
                                     <div className="mt-4 bg-blue-600/10 border border-blue-500/30 p-6 rounded-[28px] flex items-center gap-4 animate-in fade-in zoom-in slide-in-from-bottom-6">
                                         <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-900/40"><Send className="w-5 h-5 text-white" /></div>
                                         <p className="text-sm font-bold text-blue-300">{feedbackPrompt}</p>
                                     </div>
                                 )}
                             </div>
                        </div>
                    </div>
                </div>
            )}



            {/* TAB 3: RAW ERP DATABASE */}
            {activeTab === 'database' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto space-y-10 border-slate-800 pb-12">
                    <header className="mb-8">
                        <h2 className="text-3xl font-extrabold text-white mb-2">ERP Data Engine</h2>
                        <p className="text-slate-400 text-lg">Physical ledger tracking extracted natively from server storage.</p>
                    </header>

                    {/* Stock Table */}
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 shadow-lg">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="bg-emerald-500/20 p-3 rounded-lg"><Database className="w-6 h-6 text-emerald-400" /></div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-2xl font-bold text-white leading-tight">Current Inventory</h2>
                                        <span className="text-[10px] text-emerald-400 border border-emerald-500/20 bg-emerald-500/10 px-2 rounded-full uppercase tracking-widest font-bold">Live</span>
                                    </div>
                                    <p className="text-sm text-slate-400 mt-1 flex items-center gap-1"><CalendarDays className="w-4 h-4"/> As of {dateStr}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                                <select 
                                    value={stockGroupFilter}
                                    onChange={(e) => setStockGroupFilter(e.target.value)}
                                    className="bg-slate-950 border border-slate-700 text-slate-300 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg outline-none cursor-pointer"
                                >
                                     {ITEM_GROUPS.map(grp => <option key={grp} value={grp}>{grp}</option>)}
                                </select>
                                <span className="px-4 py-1.5 bg-slate-950 border border-slate-800 text-slate-400 text-xs font-bold uppercase rounded-full tracking-widest">{filteredStockRows.length} records</span>
                            </div>
                        </div>
                        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/50 shadow-inner">
                            <table className="w-full text-left text-sm text-slate-300">
                                <thead className="bg-slate-900/80 text-xs uppercase font-extrabold tracking-wider text-slate-500 border-b border-slate-800">
                                <tr>
                                    {parsedStock.headers.map((h, i) => <th key={i} className="px-6 py-5 whitespace-nowrap">{h}</th>)}
                                </tr>
                                </thead>
                                <tbody>
                                {filteredStockRows.length > 0 ? (
                                    filteredStockRows.map((row, i) => (
                                        <tr key={i} className={`border-b border-slate-800/50 transition-all duration-300 ${row[1]?.trim() === highlightedStockItem?.trim() ? 'bg-cyan-500/30 shadow-[inset_0_0_40px_rgba(6,182,212,0.4)] border-l-[6px] border-l-cyan-400 text-white font-extrabold' : 'hover:bg-slate-800/40'}`}>
                                            {row.map((cell, j) => {
                                                const isTargetValue = cell.toString().trim() === highlightedTargetValue && row[1]?.trim() === highlightedStockItem?.trim();
                                                return (
                                                    <td key={j} className={`px-6 py-4 font-medium transition-all duration-300 ${j===0 ? 'text-emerald-400/80 uppercase text-[10px] tracking-wider' : ''} ${isTargetValue ? 'text-amber-300 scale-150 drop-shadow-[0_0_12px_rgba(253,224,71,0.8)] z-20 relative px-10 border-b-2 border-b-amber-300' : ''}`}>{cell}</td>
                                                )
                                            })}
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500 font-bold">No records found for that group filter.</td></tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Past Sales Table */}
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 shadow-lg">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="bg-blue-500/20 p-3 rounded-lg"><Database className="w-6 h-6 text-blue-400" /></div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-2xl font-bold text-white leading-tight">Past Sales Ledger</h2>
                                        <span className="text-[10px] text-blue-400 border border-blue-500/20 bg-blue-500/10 px-2 rounded-full uppercase tracking-widest font-bold">Historical</span>
                                    </div>
                                    <p className="text-sm text-slate-400 mt-1 flex items-center gap-1"><CalendarDays className="w-4 h-4"/> {pastDateStr} — {dateStr}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                                <select 
                                    value={salesGroupFilter}
                                    onChange={(e) => setSalesGroupFilter(e.target.value)}
                                    className="bg-slate-950 border border-slate-700 text-slate-300 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg outline-none cursor-pointer"
                                >
                                     <option value="All Groups">All Groups</option>
                                     {ITEM_GROUPS.map(grp => <option key={grp} value={grp}>{grp}</option>)}
                                </select>
                                <select 
                                    className="bg-slate-900 border border-slate-700 text-sm font-bold text-slate-300 p-2 rounded-lg outline-none focus:border-blue-500 hover:border-slate-500 transition-colors"
                                    value={monthsFilter}
                                    onChange={(e) => setMonthsFilter(Number(e.target.value))}
                                >
                                    <option value={3}>PAST 90 DAYS</option>
                                    <option value={6}>PAST 180 DAYS</option>
                                    <option value={12}>PAST 360 DAYS</option>
                                </select>
                                <span className="px-4 py-1.5 bg-slate-950 border border-slate-800 text-slate-400 text-xs font-bold uppercase rounded-full tracking-widest">{filteredSalesRows.length} records</span>
                            </div>
                        </div>
                        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/50 shadow-inner">
                            <table className="w-full text-left text-sm text-slate-300">
                                <thead className="bg-slate-900/80 text-xs uppercase font-extrabold tracking-wider text-slate-500 border-b border-slate-800">
                                <tr>
                                    {parsedSales.headers.map((h, i) => <th key={i} className="px-6 py-5 whitespace-nowrap">{h}</th>)}
                                </tr>
                                </thead>
                                <tbody>
                                {filteredSalesRows.length > 0 ? (
                                    filteredSalesRows.map((row, i) => (
                                        <tr key={i} className={`border-b border-slate-800/50 transition-all duration-300 ${row[1]?.trim() === highlightedSalesItem?.trim() ? 'bg-cyan-500/30 shadow-[inset_0_0_40px_rgba(6,182,212,0.4)] border-l-[6px] border-l-cyan-400 text-white font-extrabold' : 'hover:bg-slate-800/40'}`}>
                                            {row.map((cell, j) => {
                                                const isTargetValue = cell.toString().trim() === highlightedTargetValue && row[1]?.trim() === highlightedSalesItem?.trim();
                                                let displayValue = cell;
                                                let cellClass = `px-6 py-4 font-medium transition-all duration-300 ${j===0 ? 'text-blue-400/80 uppercase text-[10px] tracking-wider' : ''} ${isTargetValue ? 'text-amber-300 scale-150 drop-shadow-[0_0_12px_rgba(253,224,71,0.8)] z-20 relative px-10 border-b-2 border-b-amber-300' : ''}`;
                                                
                                                if (j === 3) { // Price
                                                    displayValue = `€${parseFloat(cell || '0').toFixed(2)}`;
                                                    cellClass += " text-emerald-400 font-bold tabular-nums";
                                                } else if (j === 4) { // Cost
                                                    displayValue = `€${parseFloat(cell || '0').toFixed(2)}`;
                                                    cellClass += " text-rose-400/80 font-bold tabular-nums";
                                                }

                                                return (
                                                    <td key={j} className={cellClass}>{displayValue}</td>
                                                )
                                            })}
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500 font-bold">No records found for that group filter.</td></tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Procurement Cost Matrix (EOQ Parameters) */}
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 shadow-lg mt-12 mb-20 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="bg-indigo-500/20 p-3 rounded-lg"><Calculator className="w-6 h-6 text-indigo-400" /></div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-2xl font-bold text-white leading-tight">Procurement Cost Matrix</h2>
                                        <span className="text-[10px] text-indigo-400 border border-indigo-500/20 bg-indigo-500/10 px-2 rounded-full uppercase tracking-widest font-bold">EOQ Core Parameters</span>
                                    </div>
                                    <p className="text-sm text-slate-400 mt-1">Variables used to calculate Optimal Order Quantity (Q*).</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                                <select 
                                    value={costGroupFilter}
                                    onChange={(e) => setCostGroupFilter(e.target.value)}
                                    className="bg-slate-950 border border-slate-700 text-slate-300 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg outline-none cursor-pointer"
                                >
                                     <option value="All Groups">All Groups</option>
                                     {ITEM_GROUPS.map(grp => <option key={grp} value={grp}>{grp}</option>)}
                                </select>
                                <span className="px-4 py-1.5 bg-slate-950 border border-slate-800 text-slate-400 text-xs font-bold uppercase rounded-full tracking-widest">
                                    {costData.split('\n').slice(1).filter(l => {
                                        if(!l.trim()) return false;
                                        const name = l.split(',')[0];
                                        const group = ITEM_GROUPS.find(g => {
                                            if (g === 'Raw Dairy') return name.toLowerCase().includes('milk') || name.toLowerCase().includes('cream');
                                            if (g === 'Sweeteners') return name.toLowerCase().includes('sugar') || name.toLowerCase().includes('honey') || name.toLowerCase().includes('syrup');
                                            if (g === 'Flavorings') return name.toLowerCase().includes('strawberries') || name.toLowerCase().includes('vanilla') || name.toLowerCase().includes('cocoa') || name.toLowerCase().includes('puree') || name.toLowerCase().includes('extract');
                                            if (g === 'Cultures & Enzymes') return name.toLowerCase().includes('bacteria') || name.toLowerCase().includes('rennet');
                                            if (g === 'Packaging') return name.toLowerCase().includes('bottle') || name.toLowerCase().includes('jar') || name.toLowerCase().includes('carton') || name.toLowerCase().includes('cap');
                                            if (g === 'Sanitation') return name.toLowerCase().includes('sanitizer') || name.toLowerCase().includes('cleaner');
                                            return false;
                                        });
                                        return costGroupFilter === 'All Groups' || group === costGroupFilter;
                                    }).length} records
                                </span>
                            </div>
                        </div>
                        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/50 shadow-inner">
                            <table className="w-full text-left text-sm text-slate-300">
                                <thead className="bg-slate-900/80 text-xs uppercase font-extrabold tracking-wider text-slate-500 border-b border-slate-800">
                                <tr>
                                    <th className="px-6 py-5">Item Group</th>
                                    <th className="px-6 py-5">Item Name</th>
                                    <th className="px-6 py-5">Order Cost (S)</th>
                                    <th className="px-6 py-5">Carrying Rate (i)</th>
                                    <th className="px-6 py-5 text-indigo-400">Holding Cost (H)</th>
                                </tr>
                                </thead>
                                <tbody>
                                {costData.split('\n').slice(1).filter(l => l.trim()).map((line, i) => {
                                    const parts = line.split(',');
                                    const name = parts[0];
                                    const s = parseFloat(parts[1]);
                                    const iRate = parseFloat(parts[2]);
                                    const price = UNIT_PRICES[name] || 0;
                                    const h = iRate * price;

                                    const group = ITEM_GROUPS.find(g => {
                                        if (g === 'Raw Dairy') return name.toLowerCase().includes('milk') || name.toLowerCase().includes('cream');
                                        if (g === 'Sweeteners') return name.toLowerCase().includes('sugar') || name.toLowerCase().includes('honey') || name.toLowerCase().includes('syrup');
                                        if (g === 'Flavorings') return name.toLowerCase().includes('strawberries') || name.toLowerCase().includes('vanilla') || name.toLowerCase().includes('cocoa') || name.toLowerCase().includes('puree') || name.toLowerCase().includes('extract');
                                        if (g === 'Cultures & Enzymes') return name.toLowerCase().includes('bacteria') || name.toLowerCase().includes('rennet');
                                        if (g === 'Packaging') return name.toLowerCase().includes('bottle') || name.toLowerCase().includes('jar') || name.toLowerCase().includes('carton') || name.toLowerCase().includes('cap');
                                        if (g === 'Sanitation') return name.toLowerCase().includes('sanitizer') || name.toLowerCase().includes('cleaner');
                                        return false;
                                    }) || 'Raw Dairy';

                                    if (costGroupFilter !== 'All Groups' && group !== costGroupFilter) return null;

                                    return (
                                        <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/40 transition-colors">
                                            <td className="px-6 py-4 text-indigo-400/70 uppercase text-[10px] font-black tracking-widest">{group}</td>
                                            <td className="px-6 py-4 font-bold text-white">{name}</td>
                                            <td className="px-6 py-4 text-slate-400 tabular-nums">€{s.toFixed(2)}</td>
                                            <td className="px-6 py-4 text-slate-400 tabular-nums">{(iRate * 100).toFixed(1)}%</td>
                                            <td className="px-6 py-4 font-black text-indigo-300 tabular-nums bg-indigo-500/5">€{h.toFixed(4)}</td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'forecast' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <header className="mb-10 flex flex-col lg:flex-row items-center justify-between gap-6">
                        <div className="text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-black uppercase tracking-widest mb-4 border-glow">
                                 <Sparkles className="w-4 h-4" /> AI Predictive Intelligence
                            </div>
                            <h2 className="text-4xl font-extrabold text-white mb-2 leading-tight">Master Demand Forecast</h2>
                            <p className="text-slate-400 text-lg max-w-2xl">Projecting 6-month expected consumption based on momentum trends.</p>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col gap-2 min-w-[240px]">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Filter by Department</label>
                            <select 
                                value={forecastGroupFilter}
                                onChange={(e) => setForecastGroupFilter(e.target.value)}
                                className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm font-bold text-white focus:outline-none focus:border-amber-500"
                            >
                                <option>All Groups</option>
                                {ITEM_GROUPS.map(g => <option key={g}>{g}</option>)}
                            </select>
                        </div>
                    </header>

                    <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-950 border-b border-slate-800">
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest sticky left-0 bg-slate-950 z-30 min-w-[240px]">Inventory Item</th>
                                        <th className="px-4 py-5 text-[10px] font-black text-slate-500 uppercase text-center border-l border-white/5">Unit Price</th>
                                        {/* Months Jan-April */}
                                        {['Jan', 'Feb', 'Mar', 'Apr'].map(m => (
                                            <th key={m} className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase text-center border-l border-white/5">{m}</th>
                                        ))}
                                        {/* Predictions May-Oct */}
                                        {['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'].map(m => (
                                            <th key={m} className="px-4 py-5 text-[10px] font-black text-amber-400 uppercase text-center border-l border-amber-500/20 bg-amber-500/5">
                                                <div className="flex flex-col items-center gap-1">
                                                    <Sparkles size={10} className="animate-pulse" />
                                                    {m}
                                                </div>
                                            </th>
                                        ))}
                                        <th className="px-6 py-5 text-[10px] font-black text-emerald-400 uppercase text-center border-l border-emerald-500/30 bg-emerald-500/10">6-Month Budget</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ITEM_GROUPS
                                      .filter(g => forecastGroupFilter === 'All Groups' || g === forecastGroupFilter)
                                      .map((groupName) => {
                                        // Find items in this group
                                        const groupItems = Object.keys(UOM_MAP).filter(name => {
                                            // Simple mapping logic: in a real app this would be in the data
                                            if (groupName === 'Raw Dairy') return name.toLowerCase().includes('milk') || name.toLowerCase().includes('cream');
                                            if (groupName === 'Sweeteners') return name.toLowerCase().includes('sugar') || name.toLowerCase().includes('honey') || name.toLowerCase().includes('syrup');
                                            if (groupName === 'Flavorings') return name.toLowerCase().includes('strawberries') || name.toLowerCase().includes('vanilla') || name.toLowerCase().includes('cocoa') || name.toLowerCase().includes('puree') || name.toLowerCase().includes('extract');
                                            if (groupName === 'Cultures & Enzymes') return name.toLowerCase().includes('bacteria') || name.toLowerCase().includes('rennet');
                                            if (groupName === 'Packaging') return name.toLowerCase().includes('bottle') || name.toLowerCase().includes('jar') || name.toLowerCase().includes('carton') || name.toLowerCase().includes('cap');
                                            if (groupName === 'Sanitation') return name.toLowerCase().includes('sanitizer') || name.toLowerCase().includes('cleaner');
                                            return false;
                                        });

                                        if (groupItems.length === 0) return null;

                                        return (
                                            <React.Fragment key={groupName}>
                                                {/* GROUP HEADER ROW */}
                                                <tr className="bg-slate-800/50 border-y border-slate-700/50">
                                                    <td colSpan={13} className="px-6 py-2.5">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1.5 h-4 bg-indigo-500 rounded-full" />
                                                            <span className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em]">{groupName}</span>
                                                            <div className="h-px flex-1 bg-gradient-to-r from-slate-700 to-transparent ml-4" />
                                                        </div>
                                                    </td>
                                                </tr>
                                                
                                                {groupItems.map((itemName, idx) => {
                                                    // Process historical
                                                    const lines = salesData.split('\n').filter(l => l.includes(itemName));
                                                    const monthlySold: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0 };
                                                    
                                                    lines.forEach(line => {
                                                        const parts = line.split(',');
                                                        if (parts.length < 3) return;
                                                        const qty = parseFloat(parts[2]);
                                                        const date = new Date(parts[0]);
                                                        const month = date.getMonth();
                                                        if (month < 4) monthlySold[month] += qty;
                                                    });

                                                    const lastActualMonth = monthlySold[3] || 100;
                                                    
                                                    // UPGRADED: Time Series Analysis Logic
                                                    // Detects momentum and potential seasonality surges
                                                    const momGrowth = monthlySold[3] / (monthlySold[2] || 1);
                                                    const historicalAvg = (monthlySold[0] + monthlySold[1] + monthlySold[2] + monthlySold[3]) / 4;
                                                    const seasonalityBumper = monthlySold[3] > historicalAvg * 1.5 ? 1.4 : 1.0;
                                                    const timeSeriesTrend = Math.max(0.75, Math.min(momGrowth * seasonalityBumper, 1.6));
                                                    
                                                    const unitPrice = UNIT_PRICES[itemName] || 1.0;
                                                    let sixMonthTotalQty = 0;

                                                    return (
                                                        <tr key={idx} className="border-b border-slate-800/40 hover:bg-slate-800/20 group transition-colors">
                                                            <td className="px-6 py-4 font-bold text-slate-300 text-[13px] whitespace-nowrap sticky left-0 bg-slate-900/95 backdrop-blur group-hover:bg-slate-800/10 z-20">
                                                                <div className="flex items-center gap-3 pl-4">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                                                                    {itemName}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-4 text-center text-slate-500 font-bold tabular-nums text-xs border-l border-white/[0.02]">
                                                                €{unitPrice.toFixed(2)}
                                                            </td>
                                                            {/* Actuals */}
                                                            {[0, 1, 2, 3].map(m => (
                                                                <td key={m} className="px-4 py-4 text-center text-slate-500 font-medium tabular-nums text-xs border-l border-white/[0.02]">
                                                                    <div className="flex flex-col">
                                                                        <span>{Math.round(monthlySold[m])}</span>
                                                                        <span className="text-[10px] opacity-40">€{(monthlySold[m] * unitPrice).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                                                                    </div>
                                                                </td>
                                                            ))}
                                                            {/* Predictions */}
                                                            {[1, 2, 3, 4, 5, 6].map(i => {
                                                                const val = lastActualMonth * Math.pow(timeSeriesTrend, i/2.5);
                                                                sixMonthTotalQty += val;
                                                                return (
                                                                    <td key={i} className="px-4 py-4 text-center text-amber-200/90 font-black tabular-nums bg-amber-500/[0.02] border-l border-amber-500/10 italic text-xs">
                                                                         <div className="flex flex-col">
                                                                            <span>{Math.round(val)}</span>
                                                                            <span className="text-[10px] text-amber-500/50 font-bold">€{(val * unitPrice).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                                                                        </div>
                                                                    </td>
                                                                );
                                                            })}
                                                            {/* TOTAL 6-MONTH BUDGET */}
                                                            <td className="px-6 py-4 text-center text-emerald-400 font-black tabular-nums border-l border-emerald-500/30 bg-emerald-500/5">
                                                                <div className="flex flex-col">
                                                                    <span className="text-[10px] text-emerald-500/50 tracking-tighter uppercase">Projected Sales Budget</span>
                                                                    <span className="text-lg">€{(sixMonthTotalQty * unitPrice).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
            {activeTab === 'behavior' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <header className="mb-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                        <div>
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-500 text-xs font-black uppercase tracking-widest mb-6">
                                <BrainCircuit className="w-4 h-4" /> Categorical ML Intelligence
                            </div>
                            <h2 className="text-4xl font-extrabold text-white mb-2 leading-tight">Product Behavior Matrix</h2>
                            <p className="text-slate-400 text-lg max-w-2xl">Macro and Micro analysis of departmental demand patterns.</p>
                        </div>

                        {/* DEPARTMENT FILTER */}
                        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-6 rounded-[2rem] min-w-[280px]">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Filter by Department</label>
                            <div className="relative group">
                                <select 
                                    value={behaviorFilter}
                                    onChange={(e) => setBehaviorFilter(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 text-white px-5 py-4 rounded-2xl appearance-none focus:outline-none focus:ring-2 focus:ring-fuchsia-500/40 font-bold text-sm cursor-pointer hover:bg-slate-900 transition-all"
                                >
                                    <option>All Departments</option>
                                    {ITEM_GROUPS.map(g => <option key={g}>{g}</option>)}
                                </select>
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-hover:text-fuchsia-400 transition-colors">
                                    <ChevronRight className="w-5 h-5 rotate-90" />
                                </div>
                            </div>
                        </div>
                    </header>

                    <div className="space-y-16">
                        {ITEM_GROUPS
                            .filter(g => behaviorFilter === 'All Departments' || g === behaviorFilter)
                            .map((groupName) => {
                            // Find items in this group
                            const groupItems = Object.keys(UOM_MAP).filter(name => {
                                if (groupName === 'Raw Dairy') return name.toLowerCase().includes('milk') || name.toLowerCase().includes('cream');
                                if (groupName === 'Sweeteners') return name.toLowerCase().includes('sugar') || name.toLowerCase().includes('honey') || name.toLowerCase().includes('syrup');
                                if (groupName === 'Flavorings') return name.toLowerCase().includes('strawberries') || name.toLowerCase().includes('vanilla') || name.toLowerCase().includes('cocoa') || name.toLowerCase().includes('puree') || name.toLowerCase().includes('extract');
                                if (groupName === 'Cultures & Enzymes') return name.toLowerCase().includes('bacteria') || name.toLowerCase().includes('rennet');
                                if (groupName === 'Packaging') return name.toLowerCase().includes('bottle') || name.toLowerCase().includes('jar') || name.toLowerCase().includes('carton') || name.toLowerCase().includes('cap');
                                if (groupName === 'Sanitation') return name.toLowerCase().includes('sanitizer') || name.toLowerCase().includes('cleaner');
                                return false;
                            });

                            if (groupItems.length === 0) return null;

                            // Calculate Macro Group Trends
                            const groupMonthlySales = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                            groupItems.forEach(itemName => {
                                const lines = salesData.split('\n').filter(l => l.includes(itemName));
                                const actuals = [0, 0, 0, 0];
                                lines.forEach(line => {
                                    const parts = line.split(',');
                                    if (parts.length < 3) return;
                                    const date = new Date(parts[0]);
                                    if (date.getMonth() < 4) actuals[date.getMonth()] += parseFloat(parts[2]);
                                });
                                
                                // Add actuals to group totals
                                for(let i=0; i<4; i++) groupMonthlySales[i] += actuals[i];
                                
                                // Calculate and add predictions to group totals
                                const lastActual = actuals[3] || 100;
                                const momGrowth = actuals[3] / (actuals[2] || 1);
                                const hAvg = (actuals[0] + actuals[1] + actuals[2] + actuals[3]) / 4;
                                const seaBumper = actuals[3] > hAvg * 1.5 ? 1.4 : 1.0;
                                const tsTrend = Math.max(0.75, Math.min(momGrowth * seaBumper, 1.6));
                                
                                for(let i=1; i<=6; i++) {
                                    groupMonthlySales[3+i] += lastActual * Math.pow(tsTrend, i/2.5);
                                }
                            });

                            const maxGroupVal = Math.max(...groupMonthlySales, 10);
                            const groupPoints = groupMonthlySales.map((v, i) => `${(i * 40)},${60 - (v / maxGroupVal * 50)}`).join(' ');
                            const isGroupGrowing = groupMonthlySales[3] > groupMonthlySales[0];

                            return (
                                <React.Fragment key={groupName}>
                                    {/* MACRO CATEGORY HEADER */}
                                    <div className="bg-slate-950 border border-slate-800 rounded-[2.5rem] p-8 relative overflow-hidden shadow-2xl">
                                        <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-indigo-500/5 to-transparent pointer-events-none" />
                                        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="w-2 h-8 bg-indigo-500 rounded-full" />
                                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{groupName} Department</h3>
                                                </div>
                                                <p className="text-slate-400 text-sm mb-6 max-w-md">**Category Demand Overview**: This tracks the total buying trends and seasonal spikes for all {groupItems.length} items in this group combined.</p>
                                                <div className="flex gap-4">
                                                    <div className="px-4 py-2 bg-slate-900 rounded-xl border border-slate-800">
                                                        <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Macro Trend</p>
                                                        <p className={`text-sm font-bold ${isGroupGrowing ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                            {isGroupGrowing ? 'BULLISH GROWTH' : 'BEARISH DECLINE'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* LARGE GROUP LINE CHART */}
                                            <div className="w-full lg:w-96 h-28 bg-slate-900/50 rounded-3xl border border-slate-800 p-6 flex flex-col justify-between group/chart overflow-hidden">
                                                <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 uppercase tracking-widest relative z-10">
                                                    <span>Jan</span>
                                                    <div className="flex items-center gap-4">
                                                        <span className="flex items-center gap-1"><div className="w-2 h-0.5 bg-slate-400" /> Actual</span>
                                                        <span className="flex items-center gap-1 text-indigo-400"><div className="w-2 h-0.5 border-b border-dashed border-indigo-400" /> Forecast</span>
                                                    </div>
                                                    <span>Oct</span>
                                                </div>
                                                <svg className="w-full h-16 mt-2 relative z-10" viewBox="0 0 360 60" preserveAspectRatio="none">
                                                    <path 
                                                        d={`M ${groupMonthlySales.slice(0, 4).map((v, i) => `${(i * 40)},${60 - (v / maxGroupVal * 50)}`).join(' L ')}`} 
                                                        fill="none" 
                                                        stroke={isGroupGrowing ? "#10b981" : "#f43f5e"} 
                                                        strokeWidth="4" 
                                                        strokeLinecap="round"
                                                    />
                                                    <path 
                                                        d={`M ${groupMonthlySales.slice(3).map((v, i) => `${((i+3) * 40)},${60 - (v / maxGroupVal * 50)}`).join(' L ')}`} 
                                                        fill="none" 
                                                        stroke={isGroupGrowing ? "#10b981" : "#f43f5e"} 
                                                        strokeWidth="4" 
                                                        strokeDasharray="8,8"
                                                        strokeLinecap="round"
                                                        className="opacity-60"
                                                    />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>

                                    {/* INDIVIDUAL ITEM GRID */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-8">
                                        {groupItems.map((itemName, iIdx) => {
                                            const itemLines = salesData.split('\n').filter(l => l.includes(itemName));
                                            const itemHistory = [0, 0, 0, 0];
                                            itemLines.forEach(line => {
                                                const parts = line.split(',');
                                                if (parts.length < 3) return;
                                                const date = new Date(parts[0]);
                                                if (date.getMonth() < 4) itemHistory[date.getMonth()] += parseFloat(parts[2]);
                                            });

                                            const lastActual = itemHistory[3] || 100;
                                            const momGrowth = itemHistory[3] / (itemHistory[2] || 1);
                                            const hAvg = (itemHistory[0] + itemHistory[1] + itemHistory[2] + itemHistory[3]) / 4;
                                            const seaBumper = itemHistory[3] > hAvg * 1.5 ? 1.4 : 1.0;
                                            const tsTrend = Math.max(0.75, Math.min(momGrowth * seaBumper, 1.6));
                                            
                                            const itemFullSeries = [...itemHistory];
                                            for(let i=1; i<=6; i++) itemFullSeries.push(lastActual * Math.pow(tsTrend, i/2.5));

                                            const growthRate = ((itemHistory[3] - itemHistory[0]) / (itemHistory[0] || 1)) * 100;
                                            const isGrowing = itemHistory[3] > itemHistory[2];
                                            const isDeclining = itemHistory[3] < itemHistory[0];
                                            
                                            let behaviorTag = { label: 'Stable Movement', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' };
                                            let advice = "Continue with standard replenishment cycles.";

                                            if (tsTrend > 1.3) {
                                                behaviorTag = { label: 'Seasonal Surge', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
                                                advice = "Time Series detected a high-momentum seasonal surge. Expand safety stock.";
                                            } else if (isDeclining) {
                                                behaviorTag = { label: 'At Risk', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' };
                                                advice = "Cut orders; high surplus risk.";
                                            } else if (isGrowing) {
                                                behaviorTag = { label: 'In-Trend', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' };
                                                advice = "Gradually scale quantity.";
                                            }

                                            const maxItemVal = Math.max(...itemFullSeries, 10);
                                            const itemPoints = itemFullSeries.map((v, i) => `${(i * 10)},${30 - (v / maxItemVal * 25)}`).join(' ');

                                            return (
                                                <div key={iIdx} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-slate-700 transition-all group">
                                                    <div className="flex items-start justify-between mb-4">
                                                        <h4 className="text-sm font-bold text-slate-200">{itemName}</h4>
                                                        <div className="w-16 h-6">
                                                            <svg className="w-full h-full" viewBox="0 0 90 30" preserveAspectRatio="none">
                                                                {/* ACTUAL PART */}
                                                                <path 
                                                                    d={`M ${itemFullSeries.slice(0, 4).map((v, i) => `${(i * 10)},${30 - (v / maxItemVal * 25)}`).join(' L ')}`} 
                                                                    fill="none" 
                                                                    stroke="currentColor" 
                                                                    strokeWidth="3" 
                                                                    className={behaviorTag.color}
                                                                />
                                                                {/* FORECAST PART */}
                                                                <path 
                                                                    d={`M ${itemFullSeries.slice(3).map((v, i) => `${((i+3) * 10)},${30 - (v / maxItemVal * 25)}`).join(' L ')}`} 
                                                                    fill="none" 
                                                                    stroke="currentColor" 
                                                                    strokeWidth="3" 
                                                                    strokeDasharray="4,4"
                                                                    className={`${behaviorTag.color} opacity-40`}
                                                                />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${behaviorTag.bg} ${behaviorTag.color} border ${behaviorTag.border}`}>
                                                            {behaviorTag.label}
                                                        </div>
                                                        <span className={`text-xs font-black ${growthRate > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                            {growthRate > 0 ? '+' : ''}{Math.round(growthRate)}%
                                                        </span>
                                                    </div>
                                                    <div className="flex items-start gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                                                        <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                                                        <p className="text-[10px] text-slate-400 leading-tight">{advice}</p>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </React.Fragment>
                            )
                        })}
                    </div>
                </div>
            )}
            {/* TAB 6: FUTURE PROFIT ANALYSIS */}
            {activeTab === 'profit' && (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <header className="mb-12 flex items-center justify-between">
                        <div>
                            <h2 className="text-5xl font-black text-white tracking-tighter mb-2 italic">Future Profit Analysis</h2>
                            <p className="text-slate-400 font-medium tracking-[0.1em] uppercase text-xs flex items-center gap-2">
                                <Banknote className="w-4 h-4 text-fuchsia-400" />
                                6-Month Projected Revenue vs Expenditure
                            </p>
                        </div>
                        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-[32px] backdrop-blur-xl flex gap-8">
                             <div className="text-center">
                                <span className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Currency</span>
                                <span className="text-white font-black">EUR (€)</span>
                             </div>
                             <div className="text-center">
                                <span className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Forecast Window</span>
                                <span className="text-white font-black">Next 6 Months</span>
                             </div>
                        </div>
                    </header>

                    <div className="grid grid-cols-1 gap-12">
                        {ITEM_GROUPS.map((groupName) => {
                            const groupItems = Object.keys(UOM_MAP).filter(name => {
                                if (groupName === 'Raw Dairy') return name.toLowerCase().includes('milk') || name.toLowerCase().includes('cream');
                                if (groupName === 'Sweeteners') return name.toLowerCase().includes('sugar') || name.toLowerCase().includes('honey') || name.toLowerCase().includes('syrup');
                                if (groupName === 'Flavorings') return name.toLowerCase().includes('strawberries') || name.toLowerCase().includes('vanilla') || name.toLowerCase().includes('cocoa') || name.toLowerCase().includes('puree') || name.toLowerCase().includes('extract');
                                if (groupName === 'Cultures & Enzymes') return name.toLowerCase().includes('bacteria') || name.toLowerCase().includes('rennet');
                                if (groupName === 'Packaging') return name.toLowerCase().includes('bottle') || name.toLowerCase().includes('jar') || name.toLowerCase().includes('carton') || name.toLowerCase().includes('cap');
                                if (groupName === 'Sanitation') return name.toLowerCase().includes('sanitizer') || name.toLowerCase().includes('cleaner');
                                return false;
                            });

                            let totalGroupSales = 0;
                            let totalGroupCost = 0;
                            let totalGroupProfit = 0;

                            groupItems.forEach(itemName => {
                                const lines = salesData.split('\n').filter(l => l.trim() && l.includes(itemName));
                                if (lines.length === 0) return;
                                
                                const lastLine = lines[lines.length - 1].split(',');
                                const uPrice = parseFloat(lastLine[3]) || 0;
                                const uCost = parseFloat(lastLine[4]) || 0;
                                
                                // Simple 6-month prediction for profit scale
                                let lastActualQty = 0;
                                lines.forEach(l => {
                                    const p = l.split(',');
                                    if (new Date(p[0]).getMonth() === 3) lastActualQty = parseFloat(p[2]);
                                });
                                
                                const predicted6MoQty = (lastActualQty || 100) * 6;
                                totalGroupSales += predicted6MoQty * uPrice;
                                totalGroupCost += predicted6MoQty * uCost;
                                totalGroupProfit += (predicted6MoQty * uPrice) - (predicted6MoQty * uCost);
                            });

                            const maxVal = Math.max(totalGroupSales, totalGroupCost, totalGroupProfit);
                            const getWidth = (val: number) => (val / maxVal) * 100;

                            return (
                                <div key={groupName} className="bg-slate-900/40 border border-slate-800 rounded-[40px] p-10 hover:border-slate-700 transition-all group overflow-hidden relative">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-500/5 blur-[100px] -z-10 group-hover:bg-fuchsia-500/10 transition-all"></div>
                                    <h3 className="text-3xl font-black text-white mb-8 tracking-tighter">{groupName}</h3>

                                    <div className="space-y-6">
                                        {/* SALES BAR */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500 px-2">
                                                <span>PROJECTED SALES</span>
                                                <span className="text-white">€{totalGroupSales.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                            </div>
                                            <div className="h-6 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800/50 p-1">
                                                <div 
                                                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-1000 shadow-[0_0_20px_rgba(79,70,229,0.3)]"
                                                    style={{ width: `${getWidth(totalGroupSales)}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        {/* COST BAR */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500 px-2">
                                                <span>PROJECTED COST</span>
                                                <span className="text-white">€{totalGroupCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                            </div>
                                            <div className="h-6 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800/50 p-1">
                                                <div 
                                                    className="h-full bg-gradient-to-r from-rose-600 to-orange-500 rounded-full transition-all duration-1000 shadow-[0_0_20px_rgba(225,29,72,0.3)]"
                                                    style={{ width: `${getWidth(totalGroupCost)}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        {/* PROFIT BAR */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500 px-2">
                                                <span>NET PROFIT</span>
                                                <span className="text-fuchsia-400">€{totalGroupProfit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                            </div>
                                            <div className="h-8 w-full bg-fuchsia-950/20 rounded-full overflow-hidden border border-fuchsia-500/20 p-1">
                                                <div 
                                                    className="h-full bg-gradient-to-r from-fuchsia-600 via-purple-500 to-indigo-500 rounded-full transition-all duration-1000 shadow-[0_0_30px_rgba(192,38,211,0.5)]"
                                                    style={{ width: `${getWidth(totalGroupProfit)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* LOGIC EXPLORER MODAL (Transparency Feature) */}
            {explainerData && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
                    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={() => setExplainerData(null)}></div>
                    <div className="relative bg-slate-900 border-2 border-indigo-500/30 rounded-[45px] p-12 max-w-2xl w-full shadow-[0_0_120px_rgba(99,102,241,0.25)] max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <button onClick={() => setExplainerData(null)} className="absolute top-10 right-10 text-slate-500 hover:text-white transition-colors"><X className="w-8 h-8" /></button>
                        
                        <div className="flex items-center gap-5 mb-10 pt-4">
                            <div className="bg-indigo-600 shadow-[0_0_30px_rgba(79,70,229,0.4)] p-4 rounded-[24px]"><BrainCircuit className="w-10 h-10 text-white" /></div>
                            <div>
                                <h3 className="text-3xl font-black text-white tracking-tight">AI Logic Explorer</h3>
                                <p className="text-indigo-400 uppercase text-[10px] tracking-[0.3em] font-black opacity-80">Mathematical Transparency Protocol</p>
                            </div>
                        </div>

                        <div className="bg-slate-950/80 border border-slate-800 rounded-[35px] p-12 mb-10 text-center relative shadow-inner">
                             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-indigo-500 rounded-full opacity-50"></div>
                             <span className="block text-slate-500 text-[10px] uppercase font-black mb-8 tracking-[0.2em]">Active Economic Order Quantity Formula</span>
                             
                             <div className="flex items-center justify-center gap-3 text-white">
                                <span className="text-5xl font-light italic tracking-tighter">Q* =</span>
                                <div className="flex items-center">
                                    <span className="text-6xl font-extralight text-indigo-400 mb-2">√</span>
                                    <div className="flex flex-col items-center">
                                        <div className="px-6 border-b-2 border-white pb-1 font-bold text-3xl tracking-widest leading-none">
                                            <span className="text-indigo-400">2</span>DS
                                        </div>
                                        <div className="pt-2 font-bold text-3xl tracking-widest leading-none">
                                            H
                                        </div>
                                    </div>
                                </div>
                             </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6 mb-10">
                            <div className="bg-white/5 p-6 rounded-[30px] border border-white/5 hover:border-indigo-500/30 transition-all">
                                <span className="block text-slate-500 text-[10px] uppercase font-black mb-2 tracking-wider">Annual Demand (D)</span>
                                <span className="block text-white font-black text-2xl tracking-tighter">{explainerData.d.toLocaleString()}</span>
                            </div>
                            <div className="bg-white/5 p-6 rounded-[30px] border border-white/5 hover:border-indigo-500/30 transition-all">
                                <span className="block text-slate-500 text-[10px] uppercase font-black mb-2 tracking-wider">Order Cost (S)</span>
                                <span className="block text-white font-black text-2xl tracking-tighter">€{explainerData.s.toFixed(0)}</span>
                            </div>
                            <div className="bg-white/5 p-6 rounded-[30px] border border-white/5 hover:border-indigo-500/30 transition-all">
                                <span className="block text-slate-500 text-[10px] uppercase font-black mb-2 tracking-wider">Holding Cost (H)</span>
                                <span className="block text-indigo-400 font-black text-lg tracking-tighter">€{explainerData.h.toFixed(4)}</span>
                            </div>
                        </div>

                        <div className="bg-indigo-600/10 border border-indigo-500/20 p-8 rounded-[35px] relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Sparkles className="w-16 h-16 text-indigo-400" />
                            </div>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></span>
                                <span className="text-[11px] text-indigo-300 font-black uppercase tracking-[0.2em]">AI Intelligence Unit Verdict</span>
                            </div>
                            <p className="text-slate-200 text-base leading-relaxed font-medium">
                                Buying <strong>{Math.round(explainerData.eoq).toLocaleString()} units</strong> at once is your cheapest option. 
                                <br/><br/>
                                <strong>Why?</strong> Because the cost of paperwork and shipping (€{explainerData.s.toFixed(0)}) 
                                is much higher than the cost of storing this item. <strong>Ordering in bulk saves you the most money.</strong>
                            </p>
                        </div>

                        <button 
                            onClick={() => setExplainerData(null)}
                            className="w-full mt-10 bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-[24px] transition-all shadow-[0_15px_30px_-5px_rgba(79,70,229,0.4)] active:scale-95"
                        >
                            Got it, thanks!
                        </button>
                    </div>
                </div>
            )}
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #334155;
            border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
