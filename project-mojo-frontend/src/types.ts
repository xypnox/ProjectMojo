export type ImgObj = { filename: string; base64: string; file: File } | null;

export interface ImgData {
  [initial: string]: ImgObj;
}

export interface CustomizationData {
  colors: { [initial: string]: string };
  fonts: { [initial: string]: string };
  images: ImgData;
}

export interface CustomizationDataReq {
  colors: { [initial: string]: string };
  fonts: { [initial: string]: string };
  images: { [initial: string]: string };
}
