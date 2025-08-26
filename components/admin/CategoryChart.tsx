'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip } from 'recharts';

interface CategoryChartProps {
  data: Array<{
    name: string;
    value: number;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function CategoryChart({ data }: CategoryChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Medicine Categories Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full h-[300px] flex justify-center">
          {data.length > 0 ? (
            <PieChart width={400} height={300}>
              <Pie
                data={data}
                cx={200}
                cy={150}
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          ) : (
            <div>No data available for medicine categories</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}