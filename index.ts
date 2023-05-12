import {
  //@ts-ignore
  ssrUtils,
  cloneVNode,
  VNode,
  App,
  DirectiveBinding,
  ComponentInternalInstance,
  renderSlot,
  createCommentVNode,
  render,
  watchEffect,
  onUnmounted,
  nextTick,
} from "vue";

export interface VNodeDyn extends VNode {
  dynamicChildren: Array<VNode>;
}
interface FindNode<T = VNode> {
  referIndex: number;
  originInsetParentVnode: T;
}
function findPath(vnode: VNodeDyn, insetParentVnode: VNodeDyn) {
  const stack: Array<VNodeDyn> = [vnode];
  const path: Array<VNodeDyn> = [vnode];
  let currentNode: VNodeDyn;
  while (stack.length) {
    currentNode = stack.pop()!;
    if (currentNode === insetParentVnode) {
      return path;
    }
    if (Array.isArray(currentNode.dynamicChildren)) {
      for (let i = currentNode.dynamicChildren.length - 1; i >= 0; i--) {
        const child = currentNode.dynamicChildren[i] as VNodeDyn;
        stack.push(child);
        path.push(child);
      }
    }
  }
  return [];
}
function clonePath(path: Array<VNodeDyn> = []): Array<VNodeDyn> {
  let lastVnode: Array<VNodeDyn> = [];
  const walk = (originNode: VNodeDyn) => {
    const next = path.shift();
    const cloneNode = cloneVNode(originNode) as VNodeDyn;
    lastVnode.unshift(cloneNode);
    cloneNode.dynamicChildren = originNode.dynamicChildren.map((node) => {
      if (!next || node !== next) return node;
      return walk(node as VNodeDyn);
    }) as Array<VNodeDyn>;
    return cloneNode;
  };
  walk(path.shift()!);
  if (lastVnode.length > 1) {
    return [lastVnode.pop()!, lastVnode.shift()!];
  }
  const cloneSubTree = lastVnode.pop()!;
  return [cloneSubTree, cloneSubTree];
}

export const DynamicSlot = (
  el: any,
  dir: DirectiveBinding<(vnode: VNode) => FindNode<VNode>>
) => {
  const component = el.__vueParentComponent as ComponentInternalInstance;
  let isMount = true;
  let prevNode: VNode | null = null;
  let prevTree: VNode = component.subTree;
  let pushDynIndex = 0;

  const modifiers = Object.keys(dir.modifiers).at(0);
  if (!modifiers) {
    console.error(
      `[v-dynamicSlot] Missing modifiers reference v-dynamicSlot. default="0"`
    );
    return;
  }
  const { referIndex, originInsetParentVnode } = dir.value(
    component.subTree
  ) as FindNode<VNodeDyn>;

  const pathNodes = findPath(
    component.subTree as VNodeDyn,
    originInsetParentVnode
  );
  async function insert() {
    const [cloneSubTree, cloneInsetParentVnode] = clonePath(pathNodes.slice());
    console.log(cloneSubTree, cloneInsetParentVnode);
    if (Array.isArray(cloneSubTree.children)) {
      const prev = ssrUtils.setCurrentRenderingInstance(component);
      const node = renderSlot(component.slots, modifiers!) as VNodeDyn;
      if (isMount) {
        //@ts-ignore todo 没做类型保护
        const insertVnode = cloneInsetParentVnode.children![
          referIndex
        ] as VNode<Element>;
        const comment = createCommentVNode("v-if", true) as VNode<Text>;
        comment.el = document.createTextNode("");
        insertVnode.el!.after(comment.el);
        pushDynIndex = cloneInsetParentVnode.dynamicChildren.push(node) - 1;
        originInsetParentVnode.dynamicChildren.push(comment);
        isMount = false;
      } else {
        cloneInsetParentVnode.dynamicChildren.splice(pushDynIndex, 0, node);
        originInsetParentVnode.dynamicChildren.splice(
          pushDynIndex,
          0,
          prevNode!
        );
      }
      ssrUtils.setCurrentRenderingInstance(prev);
      await nextTick();
      const vnode = component.vnode as VNodeDyn;
      vnode.el!._vnode = prevTree;
      render(cloneSubTree, vnode.el as Element);
      prevNode = node;
      prevTree = cloneSubTree;
      originInsetParentVnode.dynamicChildren.splice(pushDynIndex, 1);
    }
  }
  const stop = watchEffect(insert);
  onUnmounted(stop, component);
};

export default (app: App<Element>) => {
  app.directive("dynamicSlot", {
    beforeMount: DynamicSlot,
  });
};
