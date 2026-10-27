import { SmsForm } from "./SmsForm";

export default function SmsPage() {
  return (
    <div className="w-full overflow-y-auto p-6">
      <h1 className="mb-6 text-2xl font-semibold">СМС рассылка</h1>
      <SmsForm />
    </div>
  );
}
