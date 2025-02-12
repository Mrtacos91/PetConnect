type Props = {
  value: number;
};

export const CircularProgress = ({ value }: Props) => {
  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg className="absolute" width="100" height="100">
        <circle
          cx="50"
          cy="50"
          r="40"
          stroke="gray"
          strokeWidth="6"
          fill="transparent"
        />
        <circle
          cx="50"
          cy="50"
          r="40"
          stroke="black"
          strokeWidth="6"
          strokeDasharray="251"
          strokeDashoffset={251 - (value / 100) * 251}
          fill="transparent"
        />
      </svg>
      <span className="text-xl font-bold">{value} kcal</span>
    </div>
  );
};
