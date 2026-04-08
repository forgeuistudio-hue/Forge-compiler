/**
 * Forge DSL v1 - TypeScript Types
 * These types define the authoritative structure of the Forge Intermediate Representation (IR).
 */

export type LayoutMode = "flex";
export type FlexDirection = "row" | "column";
export type JustifyContent = "start" | "center" | "end" | "between";
export type AlignItems = "start" | "center" | "end" | "stretch";

export type Layout = {
  mode: LayoutMode;
  direction: FlexDirection;
  gap?: number;
  justify?: JustifyContent;
  align?: AlignItems;
};

export type Style = {
  padding?: number;
  paddingX?: number;
  paddingY?: number;
  background?: string;
  borderRadius?: number;
  width?: number | "fill" | "hug";
  height?: number | "fill" | "hug";
  fontSize?: number;
  fontWeight?: "normal" | "bold";
  color?: string;
  textAlign?: "left" | "center" | "right";
  objectFit?: "cover" | "contain";
  opacity?: number;
};

export type BaseNode = {
  id?: string;
  style?: Style;
  layout?: Layout;
};

export type ContainerNode = BaseNode & {
  type: "container";
  children: ForgeNode[];
};

export type TextNode = BaseNode & {
  type: "text";
  text: string;
};

export type ButtonNode = BaseNode & {
  type: "button";
  text: string;
  variant?: "primary" | "secondary" | "outline";
  onClick?: string;
};

export type ImageNode = BaseNode & {
  type: "image";
  src: string;
  alt?: string;
};

export type CustomNode = BaseNode & {
  type: "custom";
  render: {
    svg: string;
  };
};

export type ForgeNode =
  | ContainerNode
  | TextNode
  | ButtonNode
  | ImageNode
  | CustomNode;

export type ForgeGraph = {
  root: ForgeNode;
};
