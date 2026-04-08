import { ForgeNodeSchema, ForgeGraphSchema } from "./schema";
import { ForgeNode, ForgeGraph } from "./types";

/**
 * Forge Validator - Multi-Layer Reliability Layer
 */

export interface ForgeValidationError {
  path: string;
  message: string;
  code: "SCHEMA_ERROR" | "SEMANTIC_ERROR" | "PREFLIGHT_ERROR";
}

export interface ValidationResult {
  valid: boolean;
  errors: ForgeValidationError[];
  normalized?: ForgeGraph;
}

export class ForgeValidator {
  /**
   * Validates a Forge Graph against all 3 layers.
   */
  public async validate(rawGraph: any): Promise<ValidationResult> {
    const errors: ForgeValidationError[] = [];

    // Layer 1: Schema Validation (Zod)
    const schemaResult = ForgeGraphSchema.safeParse(rawGraph);
    if (!schemaResult.success) {
      schemaResult.error.issues.forEach((issue) => {
        errors.push({
          path: issue.path.join("."),
          message: issue.message,
          code: "SCHEMA_ERROR",
        });
      });
      return { valid: false, errors };
    }

    const graph = schemaResult.data as ForgeGraph;

    // Layer 2: Semantic Validation
    this.validateNodeSemantics(graph.root, "root", errors);

    // Layer 3: Preflight Validation (Compiler Simulation)
    this.validatePreflight(graph.root, "root", errors);

    return {
      valid: errors.length === 0,
      errors,
      normalized: graph,
    };
  }

  /**
   * Layer 2: Semantic Validation
   */
  private validateNodeSemantics(
    node: ForgeNode,
    path: string,
    errors: ForgeValidationError[],
    parent?: ForgeNode
  ) {
    // 1. Layout Paradox: 'fill' child inside 'hug' parent
    if (parent && parent.style) {
      const isParentHugWidth = parent.style.width === "hug";
      const isParentHugHeight = parent.style.height === "hug";
      const isChildFillWidth = node.style?.width === "fill";
      const isChildFillHeight = node.style?.height === "fill";

      if (isParentHugWidth && isChildFillWidth) {
        errors.push({
          path: `${path}.style.width`,
          message: "Layout Paradox: Cannot use 'fill' width inside a parent with 'hug' width. This causes layout collapse.",
          code: "SEMANTIC_ERROR",
        });
      }

      if (isParentHugHeight && isChildFillHeight) {
        errors.push({
          path: `${path}.style.height`,
          message: "Layout Paradox: Cannot use 'fill' height inside a parent with 'hug' height. This causes layout collapse.",
          code: "SEMANTIC_ERROR",
        });
      }
    }

    // 2. Empty Container Check
    if (node.type === "container" && (!node.children || node.children.length === 0)) {
      errors.push({
        path: `${path}.children`,
        message: "Empty Container: Containers should generally have at least one child node.",
        code: "SEMANTIC_ERROR",
      });
    }

    // 3. Recursive check for children
    if (node.type === "container") {
      node.children.forEach((child, index) => {
        this.validateNodeSemantics(child, `${path}.children[${index}]`, errors, node);
      });
    }
  }

  /**
   * Layer 3: Preflight Validation
   */
  private validatePreflight(
    node: ForgeNode,
    path: string,
    errors: ForgeValidationError[]
  ) {
    // 1. SVG Sanity
    if (node.type === "custom") {
      const svg = node.render.svg;
      if (!svg.includes("<svg") || !svg.includes("</svg>")) {
        errors.push({
          path: `${path}.render.svg`,
          message: "Invalid SVG: Must contain <svg> tags",
          code: "PREFLIGHT_ERROR",
        });
      }
      if (svg.includes("<script")) {
        errors.push({
          path: `${path}.render.svg`,
          message: "Security Error: SVG contains <script> tags",
          code: "PREFLIGHT_ERROR",
        });
      }
    }

    // 2. Recursive check for children
    if (node.type === "container") {
      node.children.forEach((child, index) => {
        this.validatePreflight(child, `${path}.children[${index}]`, errors);
      });
    }
  }
}
