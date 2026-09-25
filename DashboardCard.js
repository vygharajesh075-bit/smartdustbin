export default function DashboardCard({ title, value }) {
  return (
    <div className="bg-gray-800 p-5 rounded-xl shadow">
      <h2 className="text-gray-400">{title}</h2>
      <p className="text-3xl text-green-400">{value}</p>
    </div>
  );
}