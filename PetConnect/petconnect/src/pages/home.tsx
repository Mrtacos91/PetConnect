import { Navbar } from "../components/Navbar";
import { CircularProgress } from "../components/CircularProgress";
import { Card } from "../components/Card";

export const Home = () => {
  return (
    <div className="p-4">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">🍏 PetConnect</h1>
        <button className="bg-gray-200 p-2 rounded-full">🔔</button>
      </header>

      <div className="flex justify-center my-6">
        <CircularProgress value={1250} />
      </div>

      <h2 className="text-xl font-semibold">Recently uploaded</h2>
      <div className="space-y-4 mt-4">
        <Card
          title="Caesar Salad"
          calories={133}
          image="/salad.jpg"
          time="9:00 AM"
        />
        <Card
          title="Sweet Corn Paneer"
          calories={455}
          image="/corn.jpg"
          time="9:00 AM"
        />
      </div>

      <Navbar />
    </div>
  );
};
