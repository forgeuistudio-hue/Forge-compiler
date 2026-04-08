import React from "react";
import { ForgeNode, ForgeGraph } from "./types";

/**
 * Forge Renderer - React Component for Forge DSL v1
 * Deterministic UI Virtual Machine
 */

interface ForgeRendererProps {
  graph: ForgeGraph;
}

export const ForgeRenderer: React.FC<ForgeRendererProps> = ({ graph }) => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-50 p-8">
      {renderNode(graph.root)}
    </div>
  );
};

const renderNode = (node: ForgeNode): React.ReactNode => {
  const classes = resolveStyles(node);

  switch (node.type) {
    case "container":
      return (
        <div className={classes}>
          {node.children.map((child, index) => (
            <React.Fragment key={index}>{renderNode(child)}</React.Fragment>
          ))}
        </div>
      );

    case "text":
      return <span className={classes}>{node.text}</span>;

    case "button":
      const variantClasses = getButtonVariantClasses(node.variant);
      return (
        <button className={`${classes} ${variantClasses}`} onClick={() => console.log("Button Clicked:", node.onClick)}>
          {node.text}
        </button>
      );

    case "image":
      return <img src={node.src} alt={node.alt || ""} className={classes} referrerPolicy="no-referrer" />;

    case "custom":
      return <div className={classes} dangerouslySetInnerHTML={{ __html: node.render.svg }} />;

    default:
      return null;
  }
};

const resolveStyles = (node: ForgeNode): string => {
  const classList: string[] = [];

  // 1. Layout Defaults
  if (node.layout) {
    classList.push("flex");
    classList.push(node.layout.direction === "row" ? "flex-row" : "flex-col");
    if (node.layout.gap) classList.push(`gap-[${node.layout.gap}px]`);
    if (node.layout.justify) {
      const justifyMap: Record<string, string> = {
        start: "justify-start",
        center: "justify-center",
        end: "justify-end",
        between: "justify-between",
      };
      classList.push(justifyMap[node.layout.justify] || "justify-start");
    }
    if (node.layout.align) {
      const alignMap: Record<string, string> = {
        start: "items-start",
        center: "items-center",
        end: "items-end",
        stretch: "items-stretch",
      };
      classList.push(alignMap[node.layout.align] || "items-start");
    }
  }

  // 2. Sizing
  if (node.style) {
    const { width, height } = node.style;
    if (width === "fill") classList.push("flex-1 w-full");
    else if (width === "hug") classList.push("w-fit");
    else if (typeof width === "number") classList.push(`w-[${width}px]`);

    if (height === "fill") classList.push("flex-1 h-full");
    else if (height === "hug") classList.push("h-fit");
    else if (typeof height === "number") classList.push(`h-[${height}px]`);

    // 3. Spacing
    if (node.style.padding) classList.push(`p-[${node.style.padding}px]`);
    if (node.style.paddingX) classList.push(`px-[${node.style.paddingX}px]`);
    if (node.style.paddingY) classList.push(`py-[${node.style.paddingY}px]`);

    // 4. Visuals
    if (node.style.background) classList.push(`bg-[${node.style.background}]`);
    if (node.style.borderRadius) classList.push(`rounded-[${node.style.borderRadius}px]`);
    if (node.style.fontSize) classList.push(`text-[${node.style.fontSize}px]`);
    if (node.style.fontWeight === "bold") classList.push("font-bold");
    if (node.style.color) classList.push(`text-[${node.style.color}]`);
    if (node.style.textAlign) classList.push(`text-${node.style.textAlign}`);
    if (node.style.objectFit) classList.push(`object-${node.style.objectFit}`);
    if (node.style.opacity !== undefined) classList.push(`opacity-[${node.style.opacity}]`);
  }

  // Deterministic sorting
  return classList.sort().join(" ");
};

const getButtonVariantClasses = (variant?: string): string => {
  switch (variant) {
    case "primary":
      return "bg-blue-600 text-white px-[16px] py-[8px] rounded-[4px] hover:bg-blue-700 transition-colors";
    case "secondary":
      return "bg-gray-200 text-gray-800 px-[16px] py-[8px] rounded-[4px] hover:bg-gray-300 transition-colors";
    case "outline":
      return "border border-gray-300 text-gray-700 px-[16px] py-[8px] rounded-[4px] hover:bg-gray-50 transition-colors";
    default:
      return "bg-blue-600 text-white px-[16px] py-[8px] rounded-[4px]";
  }
};
