import { DefineComponent } from "vue";

interface QRCodeProps {
  value?: string;
  size?: number;
  margin?: number;
  level?: "L" | "M" | "Q" | "H";
  background?: string;
  backgroundAlpha?: number;
  foreground?: string;
  foregroundAlpha?: number;
  type?: string;
  download?: boolean;
  downloadOptions?: {
    name?: string;
    extension?: string;
  };
  myImage?: string;
  imageOptions?: {
    hideBackgroundDots?: boolean;
    imageSize?: number;
    margin?: number;
    crossOrigin?: string;
  };
  dotsOptions?: {
    type?: "dots" | "rounded" | "classy" | "classy-rounded" | "square" | "extra-rounded";
    color?: string;
    gradient?: {
      type?: "linear" | "radial";
      rotation?: number;
      colorStops?: { offset: number; color: string }[];
    };
  };
  cornersSquareOptions?: {
    type?: "dot" | "square" | "extra-rounded";
    color?: string;
    gradient?: {
      type?: "linear" | "radial";
      rotation?: number;
      colorStops?: { offset: number; color: string }[];
    };
  };
  cornersDotOptions?: {
    type?: "dot" | "square";
    color?: string;
    gradient?: {
      type?: "linear" | "radial";
      rotation?: number;
      colorStops?: { offset: number; color: string }[];
    };
  };
}

declare const QRCodeVue3: DefineComponent<QRCodeProps>;
export default QRCodeVue3;
export { QRCodeVue3 };