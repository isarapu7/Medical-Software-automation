'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DivideIcon as LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number;
  icon: typeof LucideIcon;
  onClick: () => void;
}

export function StatsCard({ title, value, icon: Icon, onClick }: StatsCardProps) {
  return (
    <Card 
      className="cursor-pointer transition-all hover:shadow-lg"
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}