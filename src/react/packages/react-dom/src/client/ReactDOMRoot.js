/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Container} from './ReactDOMHostConfig';
import type {RootTag} from 'react-reconciler/src/ReactRootTags';
import type {ReactNodeList} from 'shared/ReactTypes';
import type {FiberRoot} from 'react-reconciler/src/ReactInternalTypes';
import {findHostInstanceWithNoPortals} from 'react-reconciler/src/ReactFiberReconciler';

export type RootType = {
  render(children: ReactNodeList): void,
  unmount(): void,
  _internalRoot: FiberRoot,
  ...
};

export type RootOptions = {
  hydrate?: boolean,
  hydrationOptions?: {
    onHydrated?: (suspenseNode: Comment) => void,
    onDeleted?: (suspenseNode: Comment) => void,
    ...
  },
  ...
};

import {
  isContainerMarkedAsRoot,
  markContainerAsRoot,
  unmarkContainerAsRoot,
} from './ReactDOMComponentTree';
import {eagerlyTrapReplayableEvents} from '../events/ReactDOMEventReplaying';
import {
  ELEMENT_NODE,
  COMMENT_NODE,
  DOCUMENT_NODE,
  DOCUMENT_FRAGMENT_NODE,
} from '../shared/HTMLNodeType';
import {ensureListeningTo} from './ReactDOMComponent';

import {
  createContainer,
  updateContainer,
} from 'react-reconciler/src/ReactFiberReconciler';
import invariant from 'shared/invariant';
import {
  BlockingRoot,
  ConcurrentRoot,
  LegacyRoot,
} from 'react-reconciler/src/ReactRootTags';

import {enableModernEventSystem} from 'shared/ReactFeatureFlags';

function ReactDOMRoot(container: Container, options: void | RootOptions) {
  this._internalRoot = createRootImpl(container, ConcurrentRoot, options);
}

function ReactDOMBlockingRoot(
  container: Container,
  tag: RootTag,
  options: void | RootOptions,
) {
  this._internalRoot = createRootImpl(container, tag, options);
}

ReactDOMRoot.prototype.render = ReactDOMBlockingRoot.prototype.render = function(
  children: ReactNodeList,
): void {
  const root = this._internalRoot;
  if (__DEV__) {
    if (typeof arguments[1] === 'function') {
      console.error(
        'render(...): does not support the second callback argument. ' +
          'To execute a side effect after rendering, declare it in a component body with useEffect().',
      );
    }
    const container = root.containerInfo;

    if (container.nodeType !== COMMENT_NODE) {
      const hostInstance = findHostInstanceWithNoPortals(root.current);
      if (hostInstance) {
        if (hostInstance.parentNode !== container) {
          console.error(
            'render(...): It looks like the React-rendered content of the ' +
              'root container was removed without using React. This is not ' +
              'supported and will cause errors. Instead, call ' +
              "root.unmount() to empty a root's container.",
          );
        }
      }
    }
  }
  updateContainer(children, root, null, null);
};

ReactDOMRoot.prototype.unmount = ReactDOMBlockingRoot.prototype.unmount = function(): void {
  if (__DEV__) {
    if (typeof arguments[0] === 'function') {
      console.error(
        'unmount(...): does not support a callback argument. ' +
          'To execute a side effect after rendering, declare it in a component body with useEffect().',
      );
    }
  }
  const root = this._internalRoot;
  const container = root.containerInfo;
  updateContainer(null, root, null, () => {
    unmarkContainerAsRoot(container);
  });
};

function createRootImpl(
  container: Container,
  tag: RootTag,
  options: void | RootOptions,
) {
  // Tag is either LegacyRoot or Concurrent Root
  const hydrate = options != null && options.hydrate === true;
  const hydrationCallbacks =
    (options != null && options.hydrationOptions) || null;
  debugger
  // 5. 创建 FiberRoot， tag 是 0 ， 里面 current 的 tag 是3 ，原因是 根节点要作为原生节点创建 ，
  //  直接 F10 跳过 或者 F8 进入下一个断点
  const root = createContainer(container, tag, hydrate, hydrationCallbacks);
  markContainerAsRoot(root.current, container);
  const containerNodeType = container.nodeType;

  if (hydrate && tag !== LegacyRoot) {
    const doc =
      containerNodeType === DOCUMENT_NODE ? container : container.ownerDocument;
    // We need to cast this because Flow doesn't work
    // with the hoisted containerNodeType. If we inline
    // it, then Flow doesn't complain. We intentionally
    // hoist it to reduce code-size.
    eagerlyTrapReplayableEvents(container, ((doc: any): Document));
  } else if (
    enableModernEventSystem &&
    containerNodeType !== DOCUMENT_FRAGMENT_NODE &&
    containerNodeType !== DOCUMENT_NODE
  ) {
    ensureListeningTo(container, 'onMouseEnter');
  }
  return root;
}

export function createRoot(
  container: Container,
  options?: RootOptions,
): RootType {
  invariant(
    isValidContainer(container),
    'createRoot(...): Target container is not a DOM element.',
  );
  warnIfReactDOMContainerInDEV(container);
  return new ReactDOMRoot(container, options);
}

export function createBlockingRoot(
  container: Container,
  options?: RootOptions,
): RootType {
  invariant(
    isValidContainer(container),
    'createRoot(...): Target container is not a DOM element.',
  );
  warnIfReactDOMContainerInDEV(container);
  return new ReactDOMBlockingRoot(container, BlockingRoot, options);
}

export function createLegacyRoot(
  container: Container,
  options?: RootOptions,
): RootType {
  debugger
  // 4. 注意这里的LegacyRoot就是将来的tag = 0
  return new ReactDOMBlockingRoot(container, LegacyRoot, options);
}

export function isValidContainer(node: mixed): boolean {
  return !!(
    node &&
    (node.nodeType === ELEMENT_NODE ||
      node.nodeType === DOCUMENT_NODE ||
      node.nodeType === DOCUMENT_FRAGMENT_NODE ||
      (node.nodeType === COMMENT_NODE &&
        (node: any).nodeValue === ' react-mount-point-unstable '))
  );
}

function warnIfReactDOMContainerInDEV(container) {
  if (__DEV__) {
    if (
      container.nodeType === ELEMENT_NODE &&
      ((container: any): Element).tagName &&
      ((container: any): Element).tagName.toUpperCase() === 'BODY'
    ) {
      console.error(
        'createRoot(): Creating roots directly with document.body is ' +
          'discouraged, since its children are often manipulated by third-party ' +
          'scripts and browser extensions. This may lead to subtle ' +
          'reconciliation issues. Try using a container element created ' +
          'for your app.',
      );
    }
    if (isContainerMarkedAsRoot(container)) {
      if (container._reactRootContainer) {
        console.error(
          'You are calling ReactDOM.createRoot() on a container that was previously ' +
            'passed to ReactDOM.render(). This is not supported.',
        );
      } else {
        console.error(
          'You are calling ReactDOM.createRoot() on a container that ' +
            'has already been passed to createRoot() before. Instead, call ' +
            'root.render() on the existing root instead if you want to update it.',
        );
      }
    }
  }
}
