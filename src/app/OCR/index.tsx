import { Button, Upload } from "antd";
import { FiCheckCircle, FiUpload, FiAlertCircle, FiCheck, FiAlertTriangle } from "react-icons/fi";
import { HiOutlineDocumentText } from "react-icons/hi2";

const { Dragger } = Upload;

const OCRBills = () => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">OCR Bills</h1>
        <p className="text-sm text-slate-500 mt-1">Drag & drop, works on PDF/JPG/smartphone photos</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-3 shadow-sm">
          <div className="h-10 w-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
            <HiOutlineDocumentText className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-3xl font-bold text-slate-800">23</h3>
            <p className="text-sm text-slate-500 font-medium">In queue</p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-3 shadow-sm">
          <div className="h-10 w-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <FiCheckCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-3xl font-bold text-slate-800">87</h3>
            <p className="text-sm text-slate-500 font-medium">Processed today</p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-3 shadow-sm">
          <div className="h-10 w-10 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
            <FiAlertCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-3xl font-bold text-slate-800">12</h3>
            <p className="text-sm text-slate-500 font-medium">With missing fields</p>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-3 shadow-sm">
          <div className="h-10 w-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
            <FiCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-3xl font-bold text-slate-800">94%</h3>
            <p className="text-sm text-slate-500 font-medium">Average accuracy</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Drag & Drop */}
        <div className=" bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col h-fit">
          <Dragger 
            multiple={false} 
            showUploadList={false}
            className="flex-1 bg-white! border-2! border-dashed! border-slate-300! hover:border-[#34d399]! transition-colors rounded-xl"
          >
            <div className="flex flex-col items-center justify-center h-full py-12">
              <div className="h-16 w-16 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center mb-6">
                <FiUpload className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Drag bills here</h3>
              <p className="text-sm text-slate-500 mb-8">PDF, JPG, PNG — including smartphone photos</p>
              <Button type="primary" className="bg-[#34d399] hover:bg-[#10b981] border-0 rounded-lg px-8 h-10 font-medium shadow-sm">
                Or select file
              </Button>
            </div>
          </Dragger>
        </div>

        {/* Right Column: Review Fields */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-6">Review extracted fields</h2>
          
          {/* Error Alert */}
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 mb-6 flex items-start gap-3 text-rose-700">
            <FiAlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
            <p className="text-sm font-medium">
              <span className="font-bold">2 fields 'to complete'</span> — saved anyway, alert active
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-5">
            {/* Field 1 */}
            <div className="border-b border-slate-100 pb-4">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Supplier</p>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">Enel Energia</span>
                <FiCheckCircle className="text-emerald-500 h-4 w-4" />
              </div>
            </div>

            {/* Field 2 */}
            <div className="border-b border-slate-100 pb-4">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">POD</p>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">IT001E12345678</span>
                <FiCheckCircle className="text-emerald-500 h-4 w-4" />
              </div>
            </div>

            {/* Field 3 */}
            <div className="border-b border-slate-100 pb-4">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Consumption KWH</p>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">2,800</span>
                <FiCheckCircle className="text-emerald-500 h-4 w-4" />
              </div>
            </div>

            {/* Field 4 */}
            <div className="border-b border-slate-100 pb-4">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Rate €/KWH</p>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">0.145</span>
                <FiCheckCircle className="text-emerald-500 h-4 w-4" />
              </div>
            </div>

            {/* Field 5 (Missing) */}
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Fixed Charge</p>
                <span className="text-sm text-rose-500 font-medium">To complete</span>
              </div>
              <Button type="primary" className="bg-[#ef4444] hover:bg-[#dc2626] border-0 rounded-lg px-5 shadow-sm">
                Complete
              </Button>
            </div>

            {/* Field 6 (Missing) */}
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Expiry Date</p>
                <span className="text-sm text-rose-500 font-medium">To complete</span>
              </div>
              <Button type="primary" className="bg-[#ef4444] hover:bg-[#dc2626] border-0 rounded-lg px-5 shadow-sm">
                Complete
              </Button>
            </div>
          </div>

          {/* Warning Box */}
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3 text-amber-700">
            <FiAlertTriangle className="h-5 w-5 mt-0.5 shrink-0 text-amber-500" />
            <p className="text-sm">
              Duplicate bill? System blocks and flags if same POD+period already exists.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default OCRBills;
