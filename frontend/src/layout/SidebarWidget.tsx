export default function SidebarWidget() {
  return (
    <div
      className="
        mx-auto mb-10 w-full max-w-60 rounded-2xl
        bg-gray-50 px-4 py-5 dark:bg-white/[0.03]
      "
    >
      <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">Club Finance Overview</h3>

      <div className="space-y-3 text-left">
        <div className="rounded-lg bg-white p-3 dark:bg-white/[0.05]">
          <p className="text-xs text-gray-500">Current Balance</p>
          <p className="text-lg font-semibold text-green-600">$12,450.00</p>
        </div>

        <div className="rounded-lg bg-white p-3 dark:bg-white/[0.05]">
          <p className="text-xs text-gray-500">Pending Payments</p>
          <p className="text-lg font-semibold text-amber-600">$1,250.00</p>
        </div>

        <div className="rounded-lg bg-white p-3 dark:bg-white/[0.05]">
          <p className="text-xs text-gray-500">Members Paid This Month</p>
          <p className="text-lg font-semibold text-blue-600">21 / 25</p>
        </div>
      </div>

      <button
        className="
          mt-4 flex w-full items-center justify-center rounded-lg
          bg-brand-500 p-3 font-medium text-white
          hover:bg-brand-600
        "
      >
        View Financial Report
      </button>
    </div>
  );
}
