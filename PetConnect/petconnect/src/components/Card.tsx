type Props = {
  title: string;
  calories: number;
  image: string;
  time: string;
};

export const Card = ({ title, calories, image, time }: Props) => {
  return (
    <div className="flex p-4 bg-white shadow-lg rounded-lg">
      <img src={image} alt={title} className="w-16 h-16 rounded-lg" />
      <div className="ml-4">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-gray-500">{calories} kcal</p>
        <p className="text-gray-400 text-sm">{time}</p>
      </div>
    </div>
  );
};
