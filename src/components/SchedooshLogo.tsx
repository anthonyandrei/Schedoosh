import * as React from "react";

type SchedooshLogoProps = Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  "src"
>;

const SchedooshLogo = ({ alt = "", ...props }: SchedooshLogoProps) => (
  // biome-ignore lint/performance/noImgElement: The export renderer needs a plain local image element.
  <img src="/schedoosh-new-logo.png" alt={alt} {...props} />
);

export default SchedooshLogo;
