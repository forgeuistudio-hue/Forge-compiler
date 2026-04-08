import { ForgeOrchestrator } from "../orchestrator";
import { ForgeCompiler } from "../compiler";
import { ForgeValidator } from "../validator";
import { GoldenTest } from "./golden";
import { ForgeGraph } from "../types";

export interface TestResult {
  name: string;
  status: "pass" | "fail" | "error";
  message?: string;
  dsl?: ForgeGraph;
  jsx?: string;
  diffs?: {
    expected?: string;
    actual?: string;
  };
}

export class ForgeTestRunner {
  private orchestrator: ForgeOrchestrator;
  private compiler: ForgeCompiler;
  private validator: ForgeValidator;

  constructor(apiKey: string) {
    this.orchestrator = new ForgeOrchestrator(apiKey);
    this.compiler = new ForgeCompiler();
    this.validator = new ForgeValidator();
  }

  /**
   * Runs a single golden test.
   */
  public async runTest(test: GoldenTest): Promise<TestResult> {
    try {
      // 1. Generation
      const result = await this.orchestrator.generate(test.prompt);
      const graph = result.graph;

      // 2. Validation
      const validation = await this.validator.validate(graph);
      if (!validation.valid) {
        return {
          name: test.name,
          status: "fail",
          message: `Validation failed: ${validation.errors.map(e => e.message).join(", ")}`,
          dsl: graph
        };
      }

      // 3. Compilation
      const jsx = this.compiler.compile(graph);

      // 4. Verification - Level 2: JSX Determinism
      if (test.expectedJSX && jsx !== test.expectedJSX) {
        return {
          name: test.name,
          status: "fail",
          message: "JSX Mismatch: Output differs from snapshot.",
          jsx,
          dsl: graph,
          diffs: {
            expected: test.expectedJSX,
            actual: jsx
          }
        };
      }

      // 5. Verification - Level 3: Structural Assertions
      if (test.assertions) {
        const { containsClasses, containsNodes } = test.assertions;
        
        if (containsClasses) {
          for (const cls of containsClasses) {
            if (!jsx.includes(cls)) {
              return {
                name: test.name,
                status: "fail",
                message: `Assertion Failed: Missing required class "${cls}"`,
                jsx,
                dsl: graph
              };
            }
          }
        }

        if (containsNodes) {
          // Simple string check for node types in JSX tags
          for (const nodeType of containsNodes) {
            const tag = nodeType === "container" ? "<div" : 
                        nodeType === "text" ? "<span" : 
                        nodeType === "button" ? "<button" : 
                        nodeType === "image" ? "<img" : 
                        nodeType === "input" ? "<input" : 
                        nodeType === "custom" ? "dangerouslySetInnerHTML" : "";
            
            if (tag && !jsx.includes(tag)) {
              return {
                name: test.name,
                status: "fail",
                message: `Assertion Failed: Missing required node type "${nodeType}"`,
                jsx,
                dsl: graph
              };
            }
          }
        }
      }

      return {
        name: test.name,
        status: "pass",
        jsx,
        dsl: graph
      };

    } catch (err) {
      return {
        name: test.name,
        status: "error",
        message: err instanceof Error ? err.message : String(err)
      };
    }
  }

  /**
   * Runs all tests in the suite.
   */
  public async runSuite(suite: GoldenTest[]): Promise<TestResult[]> {
    const results: TestResult[] = [];
    for (const test of suite) {
      const result = await this.runTest(test);
      results.push(result);
    }
    return results;
  }
}
