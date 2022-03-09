export type Tail<T extends any[]> = T extends [h: infer H, ...t: infer TAIL] ? TAIL : never;
export type Head<T extends any[]> = T extends [h: infer H, ...t: infer TAIL] ? H : never;
