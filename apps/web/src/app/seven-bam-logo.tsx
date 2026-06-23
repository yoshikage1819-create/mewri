const SEVEN_BAM_LOGO_SRC = "/brand/7bam-logo.svg";

export type SevenBamLogoProps = {
  className?: string;
  decorative?: boolean;
};

export function SevenBamLogo({ className, decorative = false }: SevenBamLogoProps) {
  if (decorative) {
    return (
      <img
        className={className}
        src={SEVEN_BAM_LOGO_SRC}
        alt=""
        aria-hidden="true"
        decoding="async"
        draggable={false}
      />
    );
  }

  return (
    <img
      className={className}
      src={SEVEN_BAM_LOGO_SRC}
      alt="7bam"
      decoding="async"
      draggable={false}
    />
  );
}
