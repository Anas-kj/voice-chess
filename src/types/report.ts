// types/Report.ts
import type { ClassificationCount } from "./Classification";
import type { EvaluatedPosition } from "./position";

export default interface Report {
    accuracies: {
        white: number;
        black: number;
    };
    classifications: {
        white: ClassificationCount;
        black: ClassificationCount;
    };
    positions: EvaluatedPosition[];
}