import { ForgeNode, ForgeGraph, Style, Layout } from "./types";

/**
 * Forge Compiler - DSL v1 -> React/Tailwind
 * Deterministic UI Virtual Machine
 */

export class ForgeCompiler {
  /**
   * Compiles a Forge Graph into a React component string.
   */
  public compile(graph: ForgeGraph): string {
    const rootJsx = this.renderNode(graph.root);

    return `
import React from 'react';

export default function GeneratedUI() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-50">
      ${rootJsx}
    </div>
  );
}
    `.trim();
  }

  /**
   * Recursively renders a Forge Node into a JSX string.
   */
  private renderNode(node: ForgeNode): string {
    const classes = this.resolveStyles(node);

    // Deterministic attribute generation
    const attributes: string[] = [];
    if (classes) attributes.push(`className="${classes}"`);

    const getAttributes = () => attributes.sort().join(" ");

    switch (node.type) {
      case "container":
        const children = node.children.map((child) => this.renderNode(child)).join("\n");
        return `<div ${getAttributes()}>${children}</div>`;

      case "text":
        return `<span ${getAttributes()}>${node.text}</span>`;

      case "button":
        const variantClasses = this.getButtonVariantClasses(node.variant);
        // Add variant classes to the list before sorting
        if (variantClasses) {
          const combinedClasses = `${classes} ${variantClasses}`.split(" ").filter(Boolean).sort().join(" ");
          return `<button className="${combinedClasses}">${node.text}</button>`;
        }
        return `<button ${getAttributes()}>${node.text}</button>`;

      case "image":
        return `<img src="${node.src}" alt="${node.alt || ""}" ${getAttributes()} referrerPolicy="no-referrer" />`;

      case "custom":
        return `<div ${getAttributes()} dangerouslySetInnerHTML={{ __html: \`${node.render.svg}\` }} />`;

      default:
        return "";
    }
  }

  /**
   * Resolves DSL style and layout into Tailwind classes with structured sorting.
   */
  private resolveStyles(node: ForgeNode): string {
    const layoutClasses: string[] = [];
    const sizingClasses: string[] = [];
    const spacingClasses: string[] = [];
    const visualClasses: string[] = [];
    const interactionClasses: string[] = [];

    // 1. Layout
    if (node.layout) {
      layoutClasses.push("flex");
      layoutClasses.push(node.layout.direction === "row" ? "flex-row" : "flex-col");
      if (node.layout.gap) layoutClasses.push(`gap-[${node.layout.gap}px]`);
      if (node.layout.justify) layoutClasses.push(`justify-${node.layout.justify}`);
      if (node.layout.align) layoutClasses.push(`items-${node.layout.align}`);
    }

    // 2. Sizing & Spacing & Visuals
    if (node.style) {
      const { width, height } = node.style;
      if (width === "fill") sizingClasses.push("flex-1 w-full");
      else if (width === "hug") sizingClasses.push("w-fit");
      else if (typeof width === "number") sizingClasses.push(`w-[${width}px]`);

      if (height === "fill") sizingClasses.push("flex-1 h-full");
      else if (height === "hug") sizingClasses.push("h-fit");
      else if (typeof height === "number") sizingClasses.push(`h-[${height}px]`);

      if (node.style.padding) spacingClasses.push(`p-[${node.style.padding}px]`);
      if (node.style.paddingX) spacingClasses.push(`px-[${node.style.paddingX}px]`);
      if (node.style.paddingY) spacingClasses.push(`py-[${node.style.paddingY}px]`);

      if (node.style.background) visualClasses.push(`bg-[${node.style.background}]`);
      if (node.style.borderRadius) visualClasses.push(`rounded-[${node.style.borderRadius}px]`);
      if (node.style.fontSize) visualClasses.push(`text-[${node.style.fontSize}px]`);
      if (node.style.fontWeight === "bold") visualClasses.push("font-bold");
      if (node.style.color) visualClasses.push(`text-[${node.style.color}]`);
      if (node.style.textAlign) visualClasses.push(`text-${node.style.textAlign}`);
      if (node.style.objectFit) visualClasses.push(`object-${node.style.objectFit}`);
      if (node.style.opacity !== undefined) visualClasses.push(`opacity-[${node.style.opacity}]`);
    }

    // 3. Interaction (Button defaults)
    if (node.type === "button") {
      interactionClasses.push("transition-colors");
    }

    // Deterministic Layered Sorting
    return [
      ...layoutClasses.sort(),
      ...sizingClasses.sort(),
      ...spacingClasses.sort(),
      ...visualClasses.sort(),
      ...interactionClasses.sort(),
    ].join(" ");
  }

  /**
   * Returns base classes for button variants.
   */
  private getButtonVariantClasses(variant?: string): string {
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
  }
}
