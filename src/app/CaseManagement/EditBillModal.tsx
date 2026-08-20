import { useEffect, useMemo } from "react";
import { App, Modal, Form, Input, InputNumber, Select, DatePicker } from "antd";
import dayjs from "dayjs";
import type { IBill } from "../../redux/features/Bills/billApi";
import { useUpdateBillAdminMutation } from "../../redux/features/Bills/billApi";

interface EditBillModalProps {
  bill: IBill | null;
  open: boolean;
  onClose: () => void;
}

const DATE_FORMAT = "YYYY-MM-DD";

export default function EditBillModal({ bill, open, onClose }: EditBillModalProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [updateBill, { isLoading }] = useUpdateBillAdminMutation();

  const isElectricity = bill?.billType === "electricity";

  const initialValues = useMemo(() => {
    if (!bill) return {};
    return {
      billType: bill.billType,
      podNumber: bill.podNumber,
      pdrNumber: bill.pdrNumber,
      totalAmount: bill.totalAmount != null ? Number(bill.totalAmount) : null,
      consumptionKwh: bill.consumptionKwh != null ? Number(bill.consumptionKwh) : null,
      consumptionSmc: bill.consumptionSmc != null ? Number(bill.consumptionSmc) : null,
      costPerUnit: bill.costPerUnit != null ? Number(bill.costPerUnit) : null,
      fixedCharges: bill.fixedCharges != null ? Number(bill.fixedCharges) : null,
      taxes: bill.taxes != null ? Number(bill.taxes) : null,
      billingPeriodStart: bill.billingPeriodStart ? dayjs(bill.billingPeriodStart) : null,
      billingPeriodEnd: bill.billingPeriodEnd ? dayjs(bill.billingPeriodEnd) : null,
      supplyStreet: bill.supplyStreet,
      supplyStreetNumber: bill.supplyStreetNumber,
      supplyCity: bill.supplyCity,
      supplyPostalCode: bill.supplyPostalCode,
      supplyProvince: bill.supplyProvince,
      codiceFiscale: bill.codiceFiscale,
      partitaIva: bill.partitaIva,
      contractNumber: bill.contractNumber,
      meterNumber: bill.meterNumber,
      customerName: bill.customerName,
      supplierName: bill.supplierName,
    };
  }, [bill]);

  useEffect(() => {
    if (open && bill) {
      form.setFieldsValue(initialValues);
    }
  }, [open, bill, form, initialValues]);

  const handleSubmit = async () => {
    if (!bill) return;
    try {
      const values = await form.validateFields();

      // Build diff — only send changed fields
      const changed: Record<string, unknown> = {};

      for (const key of Object.keys(values)) {
        const newVal = values[key];
        const oldVal = (initialValues as Record<string, unknown>)[key];

        if (key === "billingPeriodStart" || key === "billingPeriodEnd") {
          const newDate = newVal ? (newVal as dayjs.Dayjs).format(DATE_FORMAT) : null;
          const oldDate = oldVal ? (oldVal as dayjs.Dayjs).format(DATE_FORMAT) : null;
          if (newDate !== oldDate) changed[key] = newDate;
        } else if (typeof newVal === "number" || typeof oldVal === "number") {
          const nv = newVal != null ? Number(newVal) : null;
          const ov = oldVal != null ? Number(oldVal) : null;
          if (nv !== ov) changed[key] = nv;
        } else {
          const nv = newVal ?? null;
          const ov = oldVal ?? null;
          if (nv !== ov) changed[key] = nv;
        }
      }

      if (Object.keys(changed).length === 0) {
        message.info("No changes detected");
        return;
      }

      await updateBill({ billId: bill.id, data: changed }).unwrap();
      message.success("Bill data updated successfully");
      onClose();
    } catch (err: any) {
      if (err?.data) {
        message.error(err.data?.message?.[0] || err.data?.message || "Failed to update bill");
      }
    }
  };

  return (
    <Modal
      title="Edit Bill Data"
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      okText="Save Changes"
      confirmLoading={isLoading}
      width={720}
      destroyOnClose
    >
      <Form form={form} layout="vertical" className="mt-4 max-h-[65vh] overflow-y-auto pr-2">
        {/* ── Bill Type ── */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Bill Type</h4>
          <Form.Item name="billType" label="Type" rules={[{ required: true }]}>
            <Select
              options={[
                { label: "Electricity", value: "electricity" },
                { label: "Gas", value: "gas" },
              ]}
            />
          </Form.Item>
        </div>

        {/* ── Financial ── */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Financial Breakdown</h4>
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item name="totalAmount" label="Total Amount (€)">
              <InputNumber className="w-full!" min={0} precision={2} />
            </Form.Item>
            <Form.Item name="costPerUnit" label="Cost per Unit (€)">
              <InputNumber className="w-full!" min={0} precision={6} step={0.001} />
            </Form.Item>
            <Form.Item name="fixedCharges" label="Fixed Charges (€)">
              <InputNumber className="w-full!" min={0} precision={2} />
            </Form.Item>
            <Form.Item name="taxes" label="Taxes (€)">
              <InputNumber className="w-full!" min={0} precision={2} />
            </Form.Item>
            <Form.Item
              name="consumptionKwh"
              label="Consumption (kWh)"
              hidden={!isElectricity}
            >
              <InputNumber className="w-full!" min={0} precision={2} />
            </Form.Item>
            <Form.Item
              name="consumptionSmc"
              label="Consumption (Smc)"
              hidden={isElectricity}
            >
              <InputNumber className="w-full!" min={0} precision={2} />
            </Form.Item>
            <Form.Item name="billingPeriodStart" label="Period Start">
              <DatePicker className="w-full!" format={DATE_FORMAT} />
            </Form.Item>
            <Form.Item name="billingPeriodEnd" label="Period End">
              <DatePicker className="w-full!" format={DATE_FORMAT} />
            </Form.Item>
          </div>
        </div>

        {/* ── Customer Info ── */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Customer Information</h4>
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item name="customerName" label="Account Holder">
              <Input maxLength={200} />
            </Form.Item>
            <Form.Item name="codiceFiscale" label="Codice Fiscale">
              <Input maxLength={16} />
            </Form.Item>
            <Form.Item name="partitaIva" label="Partita IVA">
              <Input maxLength={11} />
            </Form.Item>
          </div>
        </div>

        {/* ── Supply Address ── */}
        {/* The five fields the address is stored as. The single line the bill
            shows elsewhere is rendered from these by the server, so it is not
            edited here — editing both would let them disagree. */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Supply Address</h4>
          <div className="grid grid-cols-6 gap-x-4">
            <Form.Item name="supplyStreet" label="Street" className="col-span-4">
              <Input maxLength={255} placeholder="Via Roma" />
            </Form.Item>
            <Form.Item name="supplyStreetNumber" label="No." className="col-span-2">
              <Input maxLength={20} placeholder="42" />
            </Form.Item>
            <Form.Item name="supplyCity" label="City" className="col-span-2">
              <Input maxLength={100} placeholder="Milano" />
            </Form.Item>
            <Form.Item
              name="supplyPostalCode"
              label="Postal Code (CAP)"
              className="col-span-2"
              rules={[
                {
                  pattern: /^\d{5}$/,
                  message: "CAP must be 5 digits",
                },
              ]}
            >
              <Input maxLength={5} placeholder="20121" />
            </Form.Item>
            <Form.Item name="supplyProvince" label="Province" className="col-span-2">
              <Input maxLength={100} placeholder="MI" />
            </Form.Item>
          </div>
        </div>

        {/* ── Supply Details ── */}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Supply Details</h4>
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item name="supplierName" label="Supplier">
              <Input maxLength={200} />
            </Form.Item>
            <Form.Item name="podNumber" label="POD Number">
              <Input maxLength={50} />
            </Form.Item>
            <Form.Item name="pdrNumber" label="PDR Number">
              <Input maxLength={50} />
            </Form.Item>
            <Form.Item name="contractNumber" label="Contract Number">
              <Input maxLength={50} />
            </Form.Item>
            <Form.Item name="meterNumber" label="Meter Number">
              <Input maxLength={50} />
            </Form.Item>
          </div>
        </div>
      </Form>
    </Modal>
  );
}
