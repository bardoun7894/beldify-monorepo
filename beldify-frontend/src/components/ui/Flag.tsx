import Image from 'next/image';

interface FlagProps {
  countryCode: string;
  width?: number;
  height?: number;
  className?: string;
}

export default function Flag({ countryCode, width = 24, height = 24, className = '' }: FlagProps) {
  return (
    <Image
      src={`/images/flags/${countryCode.toLowerCase()}.svg`}
      alt={`${countryCode} flag`}
      width={width}
      height={height}
      className={className}
      style={{ width: `${width}px`, height: 'auto' }}
    />
  );
}