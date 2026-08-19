import * as React from "react";

interface SchedooshLogoProps extends React.SVGProps<SVGSVGElement> {}

const SchedooshLogo = (props: SchedooshLogoProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    id="Layer_2"
    data-name="Layer 2"
    viewBox="0 0 47.54 57.22"
    {...props}
  >
    <defs>
      <style>{".cls-2{stroke-width:0}"}</style>
    </defs>
    <g id="Layer_1-2" data-name="Layer 1">
      <path
        fill="currentColor"
        d="M1.15 56.74 47.1 29.46c.6-.41.6-1.3 0-1.71L1.65.48a.728.728 0 0 0-1.15.63C.74 6.1 8.86 22.67 22.44 27.36l.06-7.98c0-.54.62-.85 1.06-.52l14.23 9.76-14.23 9.76a.66.66 0 0 1-1.06-.52l-.06-8C8.75 34.51.33 51.03 0 56.1c-.04.61.64.99 1.14.64Z"
        style={{
          strokeWidth: 0,
        }}
      />
      <path
        fill="currentColor"
        d="M9.09 56.07c-.85.22-.65 1.15.25 1.15h23.2c4.63 0 8.39-3.29 8.39-7.36V38.53c0-.69-1.21-.97-1.72-.39-3.76 4.19-13.71 13.62-30.13 17.93ZM9.09 1.15C8.24.93 8.44 0 9.34 0h23.2c4.63 0 8.39 3.29 8.39 7.36v11.33c0 .69-1.21.97-1.72.39C35.45 14.89 25.5 5.46 9.08 1.15Z"
        className="cls-2"
      />
    </g>
  </svg>
);
export default SchedooshLogo;
