import Image from "next/image";

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <Image
      src="/logo.png"
      alt="Logo Monege"
      width={size}
      height={size}
      className="rounded-lg"
      priority
    />
  );
}
