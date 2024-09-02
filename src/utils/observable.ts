import { Observable } from "rxjs"
export type EmittedType<T> = T extends Observable<infer U> ? U : never
