import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface IconSelectProps {
  icons: string[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const IconSelect = ({ icons, value, onValueChange, placeholder = "Выберите иконку", className }: IconSelectProps) => {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder}>
          {value ? <span className="flex items-center gap-2"><span className="text-lg">{value}</span><span>{value}</span></span> : null}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {icons.map((icon) => (
          <SelectItem key={icon} value={icon}>
            <span className="flex items-center gap-2">
              <span className="text-lg">{icon}</span>
              <span>{icon}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default IconSelect;