export as namespace regexpToAst

export class RegExpParser {
    pattern: (input: string) => RegExpAst
}

export interface RegExpAst {
    type: "Pattern"
    flags: RegExpFlags
    value: Disjunction
}

export interface RegExpFlags {
    global: boolean
    ignoreCase: boolean
    multiLine: boolean
    unicode: boolean
    sticky: boolean
}

export interface Disjunction {
    type: "Disjunction"
    value: Alternative[]
}

export interface Alternative {
    type: "Alternative"
    value: Term
}

export interface Term {
    type: "Term"
    value: Assertion | Atom
    quantifier: Quantifier
}

export interface Assertion {
    type:
        | "StartAnchor"
        | "EndAnchor"
        | "WordBoundary"
        | "NonWordBoundary"
        | "Lookahead"
        | "NegativeLookahead"

    value?: Disjunction
}

// TODO: split into 4 separate interfaces
export interface Atom {
    type: "GroupBackReference" | "Character" | "Set" | "Group"

    value: number[] | number | Disjunction
}

export interface Quantifier {
    type:
        | "ZeroOrMore"
        | "OneOrMore"
        | "ZeroOrOne"
        | "ExactReps"
        | "ClosedRangeReps"
        | "AtLeastReps"
}
