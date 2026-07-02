import { useState } from "react";
import { AutoComplete, Button, Empty, Input, Spin, Tag } from "antd";
import { FiTrendingDown, FiPlus } from "react-icons/fi";
import { LuZap, LuCalculator } from "react-icons/lu";
import { useGetOffersAdminQuery, type IOffer } from "../../redux/features/Offers/offerApi";
import { useSearchUsersQuery } from "../../redux/features/Users/clientApi";

const Comparator = () => {
  const [isCalculated, setIsCalculated] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [consumption, setConsumption] = useState("2400");
  const [currentRate, setCurrentRate] = useState("0.145");

  const { data: usersData } = useSearchUsersQuery(clientSearch, {
    skip: clientSearch.length < 2,
  });

  const { data: offersData, isLoading: offersLoading } = useGetOffersAdminQuery(
    { limit: 10, offerStatus: "active", energyType: "electricity" },
    { skip: !isCalculated }
  );

  const offers = offersData?.data || [];
  const annualConsumption = parseFloat(consumption) || 0;
  const currentCostPerUnit = parseFloat(currentRate) || 0;
  const currentAnnualCost = annualConsumption * currentCostPerUnit;

  const rankedOffers = offers
    .filter((o) => o.pricePerKwh != null)
    .map((offer) => {
      const offerAnnualCost = annualConsumption * (Number(offer.pricePerKwh) || 0) + (Number(offer.fixedMonthlyFee) || 0) * 12;
      const savings = currentAnnualCost - offerAnnualCost;
      return { ...offer, offerAnnualCost, savings };
    })
    .sort((a, b) => b.savings - a.savings)
    .slice(0, 3);

  const userOptions = (usersData || []).map((u) => ({
    value: `${u.firstName} ${u.lastName}`,
    label: `${u.firstName} ${u.lastName} (${u.email})`,
  }));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-cborder/45 pb-4">
        <div>
          <h1 className="text-xl font-semibold text-brand">Utilities & Services</h1>
          <p className="text-sm text-owngray">Manage all active utilities and services</p>
        </div>
        <Button type="primary" icon={<FiPlus />} className="bg-[#6366f1] hover:bg-[#4f46e5] rounded-lg h-10 px-5 font-semibold border-0">
          Add Utility
        </Button>
      </div>

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
            <AutoComplete
              options={userOptions}
              onSearch={setClientSearch}
              className="w-full [&_.ant-select-selector]:h-10! [&_.ant-select-selector]:rounded-lg! [&_.ant-select-selector]:border-0!"
              placeholder="Search client..."
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-white/80 mb-1.5">Meter</label>
            <Input className="h-10 rounded-lg border-0 shadow-sm text-slate-700" placeholder="POD / PDR" />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-white/80 mb-1.5">Annual Consumption</label>
            <Input className="h-10 rounded-lg border-0 shadow-sm text-slate-700 font-medium" value={consumption} onChange={(e) => setConsumption(e.target.value)} />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-white/80 mb-1.5">Current Rate</label>
            <Input className="h-10 rounded-lg border-0 shadow-sm text-slate-700 font-medium" value={currentRate} onChange={(e) => setCurrentRate(e.target.value)} />
          </div>
          <div>
            <Button
              className={`w-full h-10 rounded-lg border-0 font-bold shadow-sm transition-all duration-300 ${
                isCalculated ? "bg-white text-[#8b85f6] hover:bg-slate-50" : "bg-[#4338ca] text-white hover:bg-[#3730a3]"
              }`}
              onClick={() => setIsCalculated(!isCalculated)}
            >
              {isCalculated ? "Clear" : "Calculate"}
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
      ) : offersLoading ? (
        <div className="flex items-center justify-center py-24"><Spin size="large" /></div>
      ) : rankedOffers.length === 0 ? (
        <div className="py-24"><Empty description="No matching offers found" /></div>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div>
            <h2 className="text-[15px] font-bold text-slate-800 mb-5">Top {rankedOffers.length} recommended (based on savings)</h2>
            <div className="space-y-3">
              {rankedOffers.map((offer, idx) => (
                <div key={offer.id} className="bg-white border border-slate-200/60 rounded-2xl p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="flex items-center gap-5">
                    <div className={`h-12 w-12 shrink-0 rounded-xl flex items-center justify-center font-bold text-xl text-white ${
                      idx === 0 ? "bg-[#8b85f6] shadow-inner" : idx === 1 ? "bg-slate-300" : "bg-slate-200"
                    }`}>
                      {idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-800 text-[16px] tracking-tight">{offer.supplier?.name || "—"}</h3>
                        {idx === 0 && (
                          <Tag className="bg-emerald-100 text-emerald-600 border-0 rounded-full px-3 py-0.5 font-bold text-[10px] m-0">
                            Recommended
                          </Tag>
                        )}
                      </div>
                      <p className="text-sm text-slate-400 font-medium mt-0.5">{offer.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 lg:gap-12">
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Price</p>
                      <p className="font-bold text-slate-700">{Number(offer.pricePerKwh).toFixed(3)} €/kWh</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Annual Cost</p>
                      <p className="font-bold text-slate-700">€ {Math.round(offer.offerAnnualCost)}</p>
                    </div>
                    <div className="text-right min-w-[90px]">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Savings</p>
                      <p className="font-bold text-[#8b85f6] flex items-center justify-end gap-1.5">
                        <FiTrendingDown className="text-[#8b85f6]" /> € {Math.round(offer.savings)}
                      </p>
                    </div>
                    <Button type="primary" className="bg-[#8b85f6] hover:bg-[#7a74e5] border-0 rounded-xl px-8 h-10 font-bold shadow-sm">
                      Request
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200/60 rounded-3xl p-8 shadow-sm min-h-[180px]">
            <h3 className="text-base font-bold text-slate-800 mb-3 tracking-tight">All compatible offers (manual operator selection)</h3>
            <p className="text-sm text-slate-400 font-medium leading-relaxed">
              {offers.length} active offers available for comparison
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Comparator;
