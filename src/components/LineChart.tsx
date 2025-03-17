
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps
} from 'recharts';

export interface DataPoint {
  name: string;
  value: number;
}

interface LineChartProps {
  data: DataPoint[];
  color?: string;
  title?: string;
  showGrid?: boolean;
  height?: number;
  className?: string;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="glassmorphism p-3">
        <p className="text-white text-sm font-medium">{label}</p>
        <p className="text-sm text-radium">{`Score: ${payload[0].value}%`}</p>
      </div>
    );
  }
  return null;
};

const LineChart = ({
  data,
  color = '#00FF66',
  title,
  showGrid = true,
  height = 300,
  className = ''
}: LineChartProps) => {
  return (
    <div className={`glass-panel p-4 ${className}`}>
      {title && <h3 className="text-white font-medium mb-4">{title}</h3>}
      <div style={{ height: `${height}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsLineChart
            data={data}
            margin={{ top: 5, right: 20, left: 5, bottom: 5 }}
          >
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />}
            <XAxis 
              dataKey="name" 
              stroke="#ffffff50"
              tick={{ fill: '#ffffff80', fontSize: 12 }}
            />
            <YAxis 
              domain={[0, 100]}
              stroke="#ffffff50"
              tick={{ fill: '#ffffff80', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={{ stroke: color, strokeWidth: 2, r: 4, fill: '#000' }}
              activeDot={{ r: 8 }}
            />
          </RechartsLineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default LineChart;
