import { avatarColor, initials } from '../lib/customers';
import { cn } from '../lib/cn';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  sm: 'w-7 h-7 text-[10px]',
  md: 'w-9 h-9 text-xs',
  lg: 'w-11 h-11 text-sm',
  xl: 'w-16 h-16 text-lg',
};

export default function Avatar({ name, size = 'md', className }: AvatarProps) {
  const color = avatarColor(name);
  return (
    <div
      className={cn(
        'shrink-0 rounded-full grid place-items-center font-semibold shadow-card',
        color.bg,
        color.fg,
        sizeMap[size],
        className,
      )}
    >
      {initials(name)}
    </div>
  );
}
