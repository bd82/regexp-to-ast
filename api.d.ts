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
    value: Term[]
}

export type Term = Atom | Assertion

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

export type Atom = Character | Set | Group | GroupBackReference

export interface Character {
    type: "Character"
    value: number
    quantifier?: Quantifier
}

export interface Set {
    type: "Set"
    value: number[]
    quantifier?: Quantifier
}

export interface Group {
    type: "Group"
    value: Disjunction
    idx: number
    quantifier?: Quantifier
}

export interface GroupBackReference {
    type: "GroupBackReference"
    value: number
    quantifier?: Quantifier
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
