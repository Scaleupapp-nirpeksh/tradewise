import { Card, CardContent } from "@/components/ui/card";

const colorMap = {
  blue: "bg-blue-50 text-blue-700",
  violet: "bg-violet-50 text-violet-700",
  amber: "bg-amber-50 text-amber-700",
  emerald: "bg-emerald-50 text-emerald-700",
};

export function QuickStats({
  label,
  value,
  subtitle,
  color = "blue",
}: {
  label: string;
  value: string;
  subtitle: string;
  color?: keyof typeof colorMap;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className={`text-2xl font-bold mt-1`}>{value}</p>
        <p className="text-xs text-muted-foreground mt-1">
          <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium ${colorMap[color]}`}>
            {subtitle}
          </span>
        </p>
      </CardContent>
    </Card>
  );
}
