declare global {
  interface Window {
    axe: {
      run(
        root: Document,
        options: unknown,
      ): Promise<{
        violations: Array<{
          impact: string | null;
          id: string;
          help: string;
        }>;
      }>;
    };
  }
}

export {};
