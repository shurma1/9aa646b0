declare module "react-fancy-qrcode" {
  import * as React from "react";

  export type QRCodeProps = {
    value?: string;
    size?: number;
    margin?: number;
    logo?: any;
    logoSize?: number;
    backgroundColor?: string;
    color?: string | string[];
    colorGradientDirection?: [string, string, string, string];
    positionColor?: string | string[];
    positionGradientDirection?: [string, string, string, string];
    positionRadius?: number | string | any;
    dotScale?: number;
    dotRadius?: number | string;
    errorCorrection?: "L" | "M" | "Q" | "H";
    [key: string]: any;
  };

  export type QRCodeRef = SVGSVGElement & {
    toDataURL?: (cb: (data: string) => void) => void;
  };

  const QRCode: React.ForwardRefExoticComponent<QRCodeProps & React.RefAttributes<QRCodeRef>>;
  export default QRCode;
}
