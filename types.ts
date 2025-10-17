export interface BBox {
    x: number;
    y: number;
    width: number;
    height: number;
  }
  
  export interface Prop {
    id: string;
    src: string; // data URL
    originalFile: File;
    width: number;
    height: number;
    bbox: BBox;
    paddedBBox: BBox;
    backgroundRemoved: boolean;
  }
  
  export interface PlacedProp extends Prop {
    x: number;
    y: number;
    scale: number;
    rotation: number;
  }
  