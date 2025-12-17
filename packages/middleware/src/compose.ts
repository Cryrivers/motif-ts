import { type StepCreatorAny, type WorkflowAPI } from '@motif-ts/core';

/**
 * Type for a middleware function that wraps a workflow API.
 * Middlewares can optionally extend the API with additional methods.
 */
export type MiddlewareFn<Extension = {}> = <const Creators extends readonly StepCreatorAny[]>(
  workflow: WorkflowAPI<Creators>,
) => WorkflowAPI<Creators> & Extension;

/**
 * Composes multiple middleware functions into a single function.
 * Middlewares are applied left-to-right (first middleware wraps innermost).
 *
 * @example
 * ```ts
 * const enhancedWorkflow = composeMiddleware(
 *   (w) => logger(w),
 *   (w) => devtools(w),
 * )(workflow([Step1, Step2]));
 * ```
 */
export function composeMiddleware<E1>(m1: MiddlewareFn<E1>): MiddlewareFn<E1>;
export function composeMiddleware<E1, E2>(m1: MiddlewareFn<E1>, m2: MiddlewareFn<E2>): MiddlewareFn<E1 & E2>;
export function composeMiddleware<E1, E2, E3>(
  m1: MiddlewareFn<E1>,
  m2: MiddlewareFn<E2>,
  m3: MiddlewareFn<E3>,
): MiddlewareFn<E1 & E2 & E3>;
export function composeMiddleware<E1, E2, E3, E4>(
  m1: MiddlewareFn<E1>,
  m2: MiddlewareFn<E2>,
  m3: MiddlewareFn<E3>,
  m4: MiddlewareFn<E4>,
): MiddlewareFn<E1 & E2 & E3 & E4>;
export function composeMiddleware(...middlewares: MiddlewareFn<any>[]): MiddlewareFn<any> {
  return <const Creators extends readonly StepCreatorAny[]>(workflow: WorkflowAPI<Creators>) => {
    return middlewares.reduce((acc, middleware) => middleware(acc), workflow) as WorkflowAPI<Creators>;
  };
}

/**
 * Applies middleware to a workflow inline.
 * Convenience wrapper for applying a single middleware.
 *
 * @example
 * ```ts
 * const wf = applyMiddleware(workflow([Step1, Step2]), logger);
 * ```
 */
export function applyMiddleware<const Creators extends readonly StepCreatorAny[], E>(
  workflow: WorkflowAPI<Creators>,
  middleware: MiddlewareFn<E>,
): WorkflowAPI<Creators> & E {
  return middleware(workflow) as WorkflowAPI<Creators> & E;
}
