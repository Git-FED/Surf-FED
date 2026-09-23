export type AppRoute = 'home'|'courses'|'community'|'dictionary'|'blueprints'|'profile'|'messages'; export type AsyncState<T> = {data:T|null; loading:boolean; error:string|null};
