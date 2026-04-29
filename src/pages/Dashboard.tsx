import TodaySchedule from "../features/dashboard/components/TodaysSchedule";

export default function Dashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-primary">
        Dashboard
      </h1>

      <p className="text-gray-500 mt-2">
        Welcome to Booka
      </p>

      <div className="mt-6">
        <TodaySchedule />
      </div>
    </div>
  );
}