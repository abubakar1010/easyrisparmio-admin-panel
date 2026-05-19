import { useState } from "react";
import { Button, Input, Tag } from "antd";
import { FiTrendingDown, FiPlus } from "react-icons/fi";
import { LuZap, LuCalculator } from "react-icons/lu";

const Comparator = () => {
  const [isCalculated, setIsCalculated] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Section header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-cborder/45 pb-4">
        <div>
          <h1 className="text-xl font-semibold text-brand">Utilities &amp; Services</h1>
          <p className="text-sm text-owngray">Manage all active utilities and services</p>
        </div>
        <Button
          type="primary"
          icon={<FiPlus />}
          className="bg-[#6366f1] hover:bg-[#4f46e5] rounded-lg h-10 px-5 font-semibold border-0"
        >
          Add Utility
        </Button>
      </div>

      {/* Sub-header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Comparator</h2>
        <p className="text-sm text-slate-500 mt-1">Automatic top 3 + manual operator selection</p>
      </div>

      {/* Parameters Card */}
      <div className="bg-[#8b85f6] rounded-2xl p-6 text-white shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <LuZap className="h-5 w-5" /> 
          <span className="font-semibold text-lg tracking-tight">Client parameters</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-white/80 mb-1.5">Client</label>
            <Input className="h-10 rounded-lg border-0 shadow-sm text-slate-700" />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-white/80 mb-1.5">Meter</label>
            <Input className="h-10 rounded-lg border-0 shadow-sm text-slate-700" />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-white/80 mb-1.5">Annual Consumption</label>
            <Input className="h-10 rounded-lg border-0 shadow-sm text-slate-700 font-medium" defaultValue="2,400" />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-white/80 mb-1.5">Current Rate</label>
            <Input className="h-10 rounded-lg border-0 shadow-sm text-slate-700 font-medium" defaultValue="0.145" />
          </div>
          <div>
            <Button 
              className={`w-full h-10 rounded-lg border-0 font-bold shadow-sm transition-all duration-300 ${
                isCalculated ? 'bg-white text-[#8b85f6] hover:bg-slate-50' : 'bg-[#4338ca] text-white hover:bg-[#3730a3]'
              }`}
              onClick={() => setIsCalculated(!isCalculated)}
            >
              {isCalculated ? 'Clear' : 'Calculate'}
            </Button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {!isCalculated ? (
        <div className="bg-white border border-slate-200/60 rounded-3xl h-72 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center mb-5 border border-slate-100">
            <LuCalculator className="h-8 w-8 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2 tracking-tight">Enter client parameters above</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Select a client and meter, then click Calculate to see personalized offers
          </p>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div>
            <h2 className="text-[15px] font-bold text-slate-800 mb-5">Top 3 recommended (based on Admin priority + savings)</h2>
            <div className="space-y-3">
              
              {/* Offer 1 */}
              <div className="bg-white border border-slate-200/60 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex items-center gap-5">
                  <div className="h-12 w-12 shrink-0 rounded-xl bg-[#8b85f6] text-white flex items-center justify-center font-bold text-xl shadow-inner">1</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-800 text-[16px] tracking-tight">Eni Plenitude</h3>
                      <Tag className="bg-emerald-100 text-emerald-600 border-0 rounded-full px-3 py-0.5 font-bold text-[10px] m-0 flex items-center gap-1">
                        <span className="text-[12px]">✓</span> Recommended
                      </Tag>
                    </div>
                    <p className="text-sm text-slate-400 font-medium mt-0.5">Family Country</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-12 mr-2">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Price</p>
                    <p className="font-bold text-slate-700">0.089 €/kWh</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Annual Cost</p>
                    <p className="font-bold text-slate-700">€ 156</p>
                  </div>
                  <div className="text-right min-w-[90px]">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Savings</p>
                    <p className="font-bold text-[#8b85f6] flex items-center justify-end gap-1.5">
                      <FiTrendingDown className="text-[#8b85f6]" /> € 284
                    </p>
                  </div>
                  <Button type="primary" className="bg-[#8b85f6] hover:bg-[#7a74e5] border-0 rounded-xl px-8 h-10 font-bold shadow-sm ml-2">
                    Request
                  </Button>
                </div>
              </div>
              
              {/* Offer 2 */}
              <div className="bg-white border border-slate-200/60 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex items-center gap-5">
                  <div className="h-12 w-12 shrink-0 rounded-xl bg-slate-300 text-white flex items-center justify-center font-bold text-xl">2</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-800 text-[16px] tracking-tight">A2A Energia</h3>
                      <Tag className="bg-amber-100 text-amber-600 border-0 rounded-full px-3 py-0.5 font-bold text-[10px] m-0 flex items-center gap-1">
                        <span className="text-[12px]">💡</span> No commitment
                      </Tag>
                    </div>
                    <p className="text-sm text-slate-400 font-medium mt-0.5">Click-Click Electricity</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-12 mr-2">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Price</p>
                    <p className="font-bold text-slate-700">0.092 €/kWh</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Annual Cost</p>
                    <p className="font-bold text-slate-700">€ 178</p>
                  </div>
                  <div className="text-right min-w-[90px]">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Savings</p>
                    <p className="font-bold text-[#8b85f6] flex items-center justify-end gap-1.5">
                      <FiTrendingDown className="text-[#8b85f6]" /> € 262
                    </p>
                  </div>
                  <Button type="primary" className="bg-[#8b85f6] hover:bg-[#7a74e5] border-0 rounded-xl px-8 h-10 font-bold shadow-sm ml-2">
                    Request
                  </Button>
                </div>
              </div>

              {/* Offer 3 */}
              <div className="bg-white border border-slate-200/60 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex items-center gap-5">
                  <div className="h-12 w-12 shrink-0 rounded-xl bg-slate-200 text-white flex items-center justify-center font-bold text-xl">3</div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-[16px] tracking-tight">Edison Energia</h3>
                    <p className="text-sm text-slate-400 font-medium mt-0.5">Edison World</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-12 mr-2">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Price</p>
                    <p className="font-bold text-slate-700">0.094 €/kWh</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Annual Cost</p>
                    <p className="font-bold text-slate-700">€ 195</p>
                  </div>
                  <div className="text-right min-w-[90px]">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Savings</p>
                    <p className="font-bold text-[#8b85f6] flex items-center justify-end gap-1.5">
                      <FiTrendingDown className="text-[#8b85f6]" /> € 245
                    </p>
                  </div>
                  <Button type="primary" className="bg-[#8b85f6] hover:bg-[#7a74e5] border-0 rounded-xl px-8 h-10 font-bold shadow-sm ml-2">
                    Request
                  </Button>
                </div>
              </div>

            </div>
          </div>

          {/* All compatible offers placeholder */}
          <div className="bg-white border border-slate-200/60 rounded-3xl p-8 shadow-sm min-h-[180px]">
             <h3 className="text-base font-bold text-slate-800 mb-3 tracking-tight">All compatible offers (manual operator selection)</h3>
             <p className="text-sm text-slate-400 font-medium leading-relaxed">
               Find by supplier, carrier, contract details... Put tabs with ordering option!
             </p>
          </div>

        </div>
      )}
    </div>
  );
};

export default Comparator;