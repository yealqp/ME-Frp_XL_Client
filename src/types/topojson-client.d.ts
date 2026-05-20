declare module "topojson-client" {
  export function feature(
    topology: any,
    obj: any,
  ): { type: "Feature"; properties: any; geometry: any };
  export function merge(
    topology: any,
    objects: any[],
  ): { type: "GeometryCollection"; geometries: any[] };
}
