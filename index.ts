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
} from "vue";

interface VnodeDyn extends VNode {
  dynamicChildren: Array<VNode>;
}
interface FindNode<T = VNode> {
  referIndex: number;
  originInsetParentVnode: T;
}
export default (app: App<Element>) => {
  function findPath(vnode: VnodeDyn, insetParentVnode: VnodeDyn) {
    if (!insetParentVnode || vnode === insetParentVnode) return [vnode];
    const walk = (
      vnode: VnodeDyn,
      path: Array<VNode> = []
    ): Array<VnodeDyn> => {
      if (!vnode) return [];
      if (Array.isArray(vnode.dynamicChildren)) {
        for (const node of vnode.dynamicChildren) {
          if (node === insetParentVnode) {
            return [...path, node] as any;
          }
          const maybeFind = walk(node as VnodeDyn, [...path, node]);
          if (maybeFind?.length) {
            return maybeFind;
          }
        }
      }
      return [];
    };
    return walk(vnode, [vnode]);
  }
  function clonePath(path: Array<VnodeDyn> = []): Array<VnodeDyn> {
    let lastVnode: Array<VnodeDyn> = [];
    const walk = (originNode: VnodeDyn) => {
      const next = path.shift();
      const cloneNode = cloneVNode(originNode) as VnodeDyn;
      lastVnode.unshift(cloneNode);
      cloneNode.dynamicChildren = originNode.dynamicChildren.map((node) => {
        if (!next || node !== next) return node;
        return walk(node as VnodeDyn);
      }) as Array<VnodeDyn>;
      return cloneNode;
    };
    walk(path.shift()!);
    if (lastVnode.length > 1) {
      return [lastVnode.pop()!, lastVnode.shift()!];
    }
    const cloneSubTree = lastVnode.pop()!;
    return [cloneSubTree, cloneSubTree];
  }

  app.directive("dynamicSlot", {
    mounted(el, dir: DirectiveBinding<(vnode: VNode) => FindNode<VNode>>) {
      const component = el.__vueParentComponent as ComponentInternalInstance;
      const vnode = component.vnode as VnodeDyn;
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
      ) as FindNode<VnodeDyn>;

      const pathNodes = findPath(
        component.subTree as VnodeDyn,
        originInsetParentVnode
      );
      function insert() {
        const [cloneSubTree, cloneInsetParentVnode] = clonePath(
          pathNodes.slice()
        );
        if (Array.isArray(cloneSubTree.children)) {
          const prev = ssrUtils.setCurrentRenderingInstance(component);
          const node = renderSlot(component.slots, modifiers!) as VnodeDyn;
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
          vnode.el!._vnode = prevTree;
          prevNode = node;
          prevTree = cloneSubTree;
          render(cloneSubTree, vnode.el as Element);
          originInsetParentVnode.dynamicChildren.splice(pushDynIndex, 1);
        }
      }
      const stop = watchEffect(insert);
      onUnmounted(stop, component);
    },
  });
};
