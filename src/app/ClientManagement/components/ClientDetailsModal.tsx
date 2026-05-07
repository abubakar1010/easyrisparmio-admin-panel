import { Avatar, Button, Divider, Modal, Tabs, Tag } from "antd";
import { FiEdit3, FiFileText, FiLock, FiMail, FiMapPin, FiPhone, FiUser } from "react-icons/fi";
import type { ClientRow } from "../types";
import { statusClass } from "../types";

type ClientDetailsModalProps = {
  open: boolean;
  onClose: () => void;
  client: ClientRow | null;
};

export function ClientDetailsModal({ open, onClose, client }: ClientDetailsModalProps) {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={680}
      centered
      destroyOnClose
      title={null}
    >
      {client ? (
        <div className="pt-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <Avatar size={50} className="bg-indigo-500">
                {client.name.charAt(0)}
              </Avatar>
              <div>
                <h3 className="text-[30px] font-semibold leading-tight text-brand">{client.name}</h3>
                <p className="text-owngray">{client.email}</p>
                <Tag color={statusClass[client.status]} className="mt-1 rounded-full">
                  {client.status}
                </Tag>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-2 text-[15px] text-gray-700">
            <p className="flex items-center gap-2">
              <FiPhone /> {client.phone}
            </p>
            <p className="flex items-center gap-2">
              <FiMail /> {client.email}
            </p>
            <p className="flex items-center gap-2">
              <FiFileText /> Codice fiscale: FRRLRA85M50H501Y
            </p>
            <p className="flex items-center gap-2">
              <FiMapPin /> Corso Italia 78, Torino
            </p>
          </div>

          <Divider />

          <div className="flex items-center gap-3">
            <Avatar className="bg-indigo-100 text-indigo-600" icon={<FiUser />} />
            <div>
              <p className="text-sm text-owngray">Operatore incaricato</p>
              <p className="text-xl font-semibold leading-tight text-brand">{client.operator}</p>
            </div>
          </div>

          <Divider />

          <Tabs
            defaultActiveKey="anagrafica"
            items={[
              { key: "anagrafica", label: "Anagrafica" },
              { key: "forniture", label: "Forniture (1)" },
              { key: "bollette", label: "Bollette (2)" },
              { key: "case", label: "Case (1)" },
              { key: "gdpr", label: "Connessi GDPR" },
            ]}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-base font-semibold text-brand">Dati anagrafici</p>
              <p className="text-sm text-owngray">Email</p>
              <p className="break-all text-[28px] font-semibold leading-tight text-brand">{client.email}</p>
            </div>
            <div>
              <p className="mb-2 text-base font-semibold text-brand">Altre informazioni</p>
              <p className="text-sm text-owngray">Metodo di pagamento</p>
              <p className="mb-1 text-[26px] font-semibold leading-tight text-brand">RID Bancario</p>
              <p className="text-sm text-owngray">Tipo fattura</p>
              <p className="mb-1 text-[26px] font-semibold leading-tight text-brand">Digitale</p>
              <p className="text-sm text-owngray">Lingua</p>
              <p className="text-[26px] font-semibold leading-tight text-brand">Italiano</p>
            </div>
          </div>

          <Divider />

          <div className="flex flex-col gap-2">
            <Button type="primary" icon={<FiEdit3 />} className="w-full pb-0.5!" size="large">
              Reset password
            </Button>
            <Button danger icon={<FiLock />} className="w-full pb-0.5!" size="large">
              Blocca utente
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
